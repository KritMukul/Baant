"use server";

import { headers } from "next/headers";
import { parseBillImage } from "@/lib/parseBill";
import { judgeShot, readPaymentScreenshot, type ShotJudgement } from "@/lib/readPayment";
import type { ShotRead } from "@/lib/model";
import { parseRupees } from "@/lib/rupees";
import type { Paise } from "@/lib/money";
import { allow } from "@/server/ratelimit";
import * as svc from "@/server/service";
import { credsFor, setHostCookie, setParticipantCookie } from "@/server/session";
import { store } from "@/server/store";

type Fail = svc.Fail;
const SERVER_ERROR: Fail = { ok: false, code: "server", error: "Something went wrong. Try again." };

async function guarded<T>(fn: () => Promise<T>): Promise<T | Fail> {
  try {
    return await fn();
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e && String((e as { digest: unknown }).digest).startsWith("NEXT_REDIRECT")) throw e;
    console.error("action failed:", e);
    return SERVER_ERROR;
  }
}

async function ip(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "local";
}

const MAX_IMAGE = 6 * 1024 * 1024;

async function imageOf(file: FormDataEntryValue | null): Promise<{ base64: string; mediaType: string } | string> {
  if (!(file instanceof File) || file.size === 0) return "Add a photo of the bill";
  if (file.size > MAX_IMAGE) return "That photo is too large. Try a smaller one.";
  if (file.type && !file.type.startsWith("image/")) return "That file is not a photo";
  return { base64: Buffer.from(await file.arrayBuffer()).toString("base64"), mediaType: file.type || "image/jpeg" };
}

/* ---------------------------------------------------------------- scan */

/** Photo in, draft bill out. The browser then opens the check screen (it can cancel before that). */
export async function scanBill(form: FormData): Promise<{ ok: true; code: string } | { ok: false; error: string }> {
  const name = String(form.get("name") ?? "");
  const vpa = String(form.get("vpa") ?? "");
  const thumb = String(form.get("thumb") ?? "") || null;
  const img = await imageOf(form.get("bill"));
  if (typeof img === "string") return { ok: false, error: img };
  const limit = Number(process.env.SCAN_LIMIT_PER_HOUR ?? 20);
  if (!allow(`scan:${await ip()}`, limit, 60 * 60 * 1000)) return { ok: false, error: "That's a lot of scans. Try again in a little while." };

  let parsed;
  try {
    parsed = await parseBillImage(img.base64, img.mediaType);
  } catch (e) {
    console.error("bill parse failed:", e);
    const msg = e instanceof Error ? e.message : "";
    if (msg.startsWith("No vision provider")) return { ok: false, error: "The bill reader isn't set up on this server yet." };
    return { ok: false, error: "Couldn't read the bill. Try again with a clearer photo." };
  }
  const r = await guarded(() => svc.createDraft(store(), { payerName: name, payerVpa: vpa, thumb }, parsed));
  if (!r.ok) return { ok: false, error: r.error };
  await setHostCookie(r.code, r.hostToken);
  return { ok: true, code: r.code };
}

/* ---------------------------------------------------------------- host: check the scan */

export async function saveItemAction(code: string, input: { id?: string; name: string; qty: number; price: string }) {
  return guarded(async () => svc.saveItem(store(), code, await credsFor(code), input));
}
export async function removeItemAction(code: string, id: string) {
  return guarded(async () => svc.removeItem(store(), code, await credsFor(code), id));
}
export async function saveChargeAction(code: string, input: { kind: string; label: string; amount: string }) {
  return guarded(async () => svc.saveCharge(store(), code, await credsFor(code), input));
}
export async function removeChargeAction(code: string, id: string) {
  return guarded(async () => svc.removeCharge(store(), code, await credsFor(code), id));
}
export async function publishAction(code: string, anyway: boolean) {
  return guarded(async () => svc.publish(store(), code, await credsFor(code), { anyway }));
}

/* ---------------------------------------------------------------- guests */

/** The token never reaches the browser's JavaScript: it goes straight into an httpOnly cookie. */
export async function joinAction(code: string, name: string, takeover: boolean) {
  return guarded(async () => {
    if (!allow(`join:${await ip()}`, 60, 60 * 60 * 1000)) return { ok: false as const, code: "rate", error: "Too many tries. Wait a little and try again." };
    const r = await svc.join(store(), code, name, { takeover });
    if (!r.ok) return r;
    await setParticipantCookie(code, r.participantId, r.token);
    return { ok: true as const, name: r.name, back: r.back };
  });
}

export async function claimAction(code: string, itemId: string, on: boolean) {
  return guarded(async () => svc.claim(store(), code, await credsFor(code), itemId, on));
}

export async function lockClaimsAction(code: string, on: boolean) {
  return guarded(async () => svc.setClaimsLocked(store(), code, await credsFor(code), on));
}
export async function claimLeftoversAction(code: string, mode: "take" | "split") {
  return guarded(async () => svc.claimLeftovers(store(), code, await credsFor(code), mode));
}

/* ---------------------------------------------------------------- paying */

export interface ShotResult {
  shot: ShotRead;
  judgement: ShotJudgement;
  expected: Paise;
}

export async function readShotAction(code: string, form: FormData): Promise<svc.Fail | { ok: true; result: ShotResult }> {
  return guarded(async () => {
    const s = store();
    const creds = await credsFor(code);
    const d = await s.getBillData(code);
    if (!d || d.bill.status !== "open") return { ok: false as const, code: "not_found", error: "This link doesn't work" };
    const viewer = await svc.resolveViewer(s, d, creds);
    if (viewer.role !== "guest") return { ok: false as const, code: "forbidden", error: "Join this bill first" };
    const view = svc.buildView(d, viewer)!;
    const expected = view.myPay!.pay.remaining;
    if (expected <= 0) return { ok: false as const, code: "already_paid", error: "There is nothing left to pay" };
    const img = await imageOf(form.get("shot"));
    if (typeof img === "string") return { ok: false as const, code: "bad_input", error: img.replace("photo of the bill", "screenshot") };
    if (!allow(`shot:${await ip()}`, Number(process.env.SHOT_LIMIT_PER_HOUR ?? 30), 60 * 60 * 1000))
      return { ok: false as const, code: "rate", error: "That's a lot of screenshots. Try again in a little while." };
    let shot: ShotRead;
    try {
      shot = await readPaymentScreenshot(img.base64, img.mediaType, { amount: expected, vpa: view.payerVpa ?? "" });
    } catch (e) {
      console.error("screenshot read failed:", e);
      return { ok: false as const, code: "unreadable", error: "Couldn't read that screenshot. You can still send without it." };
    }
    const judgement = judgeShot(shot, { amount: expected, vpa: view.payerVpa ?? "", hostName: view.hostFullName }, String(form.get("utr") ?? ""));
    return { ok: true as const, result: { shot, judgement, expected } };
  });
}

export async function markPaidAction(code: string, input: { utr?: string; shot?: ShotRead | null; amount?: Paise }) {
  return guarded(async () => svc.markPaid(store(), code, await credsFor(code), input));
}
export async function undoPaidAction(code: string) {
  return guarded(async () => svc.undoPaid(store(), code, await credsFor(code)));
}

/* ---------------------------------------------------------------- host: ledger */

export async function decideAction(code: string, paymentId: string, dec: svc.Decision) {
  return guarded(async () => svc.decide(store(), code, await credsFor(code), paymentId, dec));
}
export async function recordCashAction(code: string, participantId: string, amountText?: string) {
  return guarded(async () => {
    const amount = amountText ? parseRupees(amountText) : undefined;
    if (amountText && amount === null) return { ok: false as const, code: "bad_input", error: "Use numbers, like 250.00" };
    return svc.recordCash(store(), code, await credsFor(code), participantId, amount ?? undefined);
  });
}
