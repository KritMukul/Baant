"use server";

import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { admin } from "@/lib/supabase";
import { parseBillImage } from "@/lib/parseBill";
import { toPaise } from "@/lib/money";
import { isValidVpa } from "@/lib/upi";

const token = (n = 16) => randomBytes(n).toString("base64url");

export async function createBill(_: unknown, form: FormData): Promise<{ error: string }> {
  const file = form.get("bill") as File | null;
  const payerName = String(form.get("name") ?? "").trim();
  const vpa = String(form.get("vpa") ?? "").trim();
  if (!file || file.size === 0) return { error: "Bill ki photo chahiye" };
  if (!payerName) return { error: "Apna naam daalo" };
  if (!isValidVpa(vpa)) return { error: "UPI ID sahi nahi lag rahi (e.g. name@okaxis)" };

  let parsed;
  try {
    const b64 = Buffer.from(await file.arrayBuffer()).toString("base64");
    parsed = await parseBillImage(b64, file.type || "image/jpeg");
  } catch {
    return { error: "Bill padh nahi paaye. Clear photo ke saath dobara try karo." };
  }

  const db = admin();
  const code = token(5);
  const { data: bill, error } = await db
    .from("bills")
    .insert({
      code,
      merchant: parsed.merchant,
      total: toPaise(parsed.total),
      tax: toPaise(parsed.taxes.reduce((s, t) => s + t.amount, 0)),
      service: toPaise(parsed.serviceCharge),
      discount: toPaise(parsed.discount),
      payer_name: payerName,
      payer_vpa: vpa,
    })
    .select("id")
    .single();
  if (error || !bill) return { error: "Bill save nahi hua" };

  const hostToken = token();
  await db.from("bill_secrets").insert({ bill_id: bill.id, host_token: hostToken });
  await db.from("items").insert(
    parsed.items.map((i, position) => ({
      bill_id: bill.id,
      name: i.name,
      qty: i.qty,
      price: toPaise(i.price),
      position,
    })),
  );

  (await cookies()).set(`host_${code}`, hostToken, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  redirect(`/b/${code}`);
}

async function billByCode(code: string) {
  const { data } = await admin().from("bills").select("id").eq("code", code).single();
  return data;
}

export async function isHost(code: string): Promise<boolean> {
  const bill = await billByCode(code);
  const t = (await cookies()).get(`host_${code}`)?.value;
  if (!bill || !t) return false;
  const { data } = await admin().from("bill_secrets").select("host_token").eq("bill_id", bill.id).single();
  return data?.host_token === t;
}

export async function joinBill(code: string, name: string) {
  const bill = await billByCode(code);
  const clean = name.trim().slice(0, 40);
  if (!bill || !clean) throw new Error("Invalid join");
  const db = admin();
  const { data: p } = await db
    .from("participants")
    .insert({ bill_id: bill.id, name: clean })
    .select("id")
    .single();
  const t = token();
  await db.from("participant_secrets").insert({ participant_id: p!.id, token: t });
  return { participantId: p!.id as string, token: t };
}

async function authParticipant(participantId: string, t: string) {
  const { data } = await admin()
    .from("participant_secrets")
    .select("token, participants(bill_id)")
    .eq("participant_id", participantId)
    .single();
  if (!data || data.token !== t) throw new Error("Unauthorized");
  return (data.participants as unknown as { bill_id: string }).bill_id;
}

/** Idempotent set/unset: concurrent taps by different people just add rows; same person can't duplicate. */
export async function setClaim(participantId: string, t: string, itemId: string, on: boolean) {
  const billId = await authParticipant(participantId, t);
  const db = admin();
  const { data: item } = await db.from("items").select("id").eq("id", itemId).eq("bill_id", billId).single();
  if (!item) throw new Error("Bad item");
  if (on) {
    await db
      .from("claims")
      .upsert({ bill_id: billId, item_id: itemId, participant_id: participantId }, { ignoreDuplicates: true });
  } else {
    await db.from("claims").delete().eq("item_id", itemId).eq("participant_id", participantId);
  }
}

export async function updateItem(code: string, itemId: string, name: string, priceRupees: number) {
  if (!(await isHost(code))) throw new Error("Unauthorized");
  const bill = await billByCode(code);
  await admin()
    .from("items")
    .update({ name: name.trim() || "Item", price: toPaise(priceRupees) })
    .eq("id", itemId)
    .eq("bill_id", bill!.id);
}

export async function addItem(code: string) {
  if (!(await isHost(code))) throw new Error("Unauthorized");
  const bill = await billByCode(code);
  await admin().from("items").insert({ bill_id: bill!.id, name: "New item", price: 0, position: 999 });
}

export async function deleteItem(code: string, itemId: string) {
  if (!(await isHost(code))) throw new Error("Unauthorized");
  const bill = await billByCode(code);
  await admin().from("items").delete().eq("id", itemId).eq("bill_id", bill!.id);
}
