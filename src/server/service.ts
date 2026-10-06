import type { Bill, BillData, ItemFlag, Payment, ShotRead } from "@/lib/model";
import { checkBill, findDuplicate, ROUND_OFF, roundOffOf, withRoundOff, type BillCheck } from "@/lib/charges";
import { checkJoinName, cleanName, firstName } from "@/lib/names";
import { formatINR, toPaise, type Paise } from "@/lib/money";
import { parseRupees } from "@/lib/rupees";
import { payView, type PayView } from "@/lib/payments";
import type { PersonShare } from "@/lib/split";
import { isValidVpa } from "@/lib/upi";
import { ledgerOf, sharesOf } from "@/lib/view";
import type { ParsedBill } from "@/lib/bill";
import type { Store } from "./store/types";

/* ------------------------------------------------------------------ results */

export interface Fail {
  ok: false;
  /** machine-readable: bad_input, forbidden, not_found, closed, locked, not_balanced, not_final, ... */
  code: string;
  /** a sentence a person can read */
  error: string;
}
export type Done<T = unknown> = { ok: true } & T;
export type Result<T = unknown> = Done<T> | Fail;

const fail = (code: string, error: string): Fail => ({ ok: false, code, error });
const MAX_PARTICIPANTS = 30;

/* ------------------------------------------------------------------ viewer + view */

export type Viewer = { role: "host"; participantId: string } | { role: "guest"; participantId: string } | { role: "anon"; participantId: null };

export interface Creds {
  host?: string | null;
  /** "participantId.token" */
  participant?: string | null;
}

export async function resolveViewer(store: Store, data: BillData, creds: Creds): Promise<Viewer> {
  const code = data.bill.code;
  const hostP = data.participants.find((p) => p.isHost)!;
  if (creds.host && (await store.checkHost(code, creds.host))) return { role: "host", participantId: hostP.id };
  if (creds.participant) {
    const dot = creds.participant.indexOf(".");
    const id = creds.participant.slice(0, dot);
    const token = creds.participant.slice(dot + 1);
    if (dot > 0 && (await store.checkParticipant(code, id, token))) return { role: "guest", participantId: id };
  }
  return { role: "anon", participantId: null };
}

export interface BillView {
  code: string;
  ref: string;
  status: Bill["status"];
  merchant: string;
  total: Paise;
  thumb: string | null;
  hostName: string;
  hostFullName: string;
  /** Only for the host and people who have joined (they need it to pay). */
  payerVpa: string | null;
  shortAtShare: Paise;
  settled: boolean;
  me: { id: string; name: string; isHost: boolean } | null;
  items: { id: string; name: string; qty: number; price: Paise; flag: ItemFlag | null }[];
  charges: { id: string; label: string; kind: string; amount: Paise }[];
  participants: { id: string; name: string; isHost: boolean }[];
  claims: { itemId: string; participantId: string }[];
  shares: Record<string, PersonShare>;
  allClaimed: boolean;
  unclaimedCount: number;
  /** Host only. */
  check: (BillCheck & { roundOff: Paise; duplicateId: string | null }) | null;
  ledger: {
    rows: { id: string; name: string; share: PersonShare; pay: PayView; payments: Payment[] }[];
    counts: { unpaid: number; says: number; confirmed: number; none: number };
    received: Paise;
    owedTotal: Paise;
  } | null;
  /** The signed-in friend's own money state. */
  myPay: { owed: Paise; pay: PayView; payments: Payment[]; note: string } | null;
  /** The bill is locked for edits once any payment has been made or claimed. */
  locked: boolean;
}

/** Draft bills do not exist for anyone but the host. */
export function buildView(d: BillData, v: Viewer): BillView | null {
  if (d.bill.status === "draft" && v.role !== "host") return null;
  const hostP = d.participants.find((p) => p.isHost)!;
  const { shares, unclaimed, allClaimed } = sharesOf(d);
  const ledger = ledgerOf(d);
  const me = v.participantId ? d.participants.find((p) => p.id === v.participantId) ?? null : null;
  const member = v.role !== "anon";
  const locked = d.payments.some((p) => p.status !== "rejected");
  const view: BillView = {
    code: d.bill.code,
    ref: d.bill.ref,
    status: d.bill.status,
    merchant: d.bill.merchant,
    total: d.bill.total,
    thumb: d.bill.thumb,
    hostName: hostP.name,
    hostFullName: d.bill.payerName,
    payerVpa: member ? d.bill.payerVpa : null,
    shortAtShare: d.bill.shortAtShare,
    settled: ledger.settled,
    me: me ? { id: me.id, name: me.name, isHost: me.isHost } : null,
    items: d.items.map((i) => ({ id: i.id, name: i.name, qty: i.qty, price: i.price, flag: i.flag })),
    charges: d.charges.map((c) => ({ id: c.id, label: c.label, kind: c.kind, amount: c.amount })),
    participants: d.participants.map((p) => ({ id: p.id, name: p.name, isHost: p.isHost })),
    claims: member ? d.claims : [],
    shares: member ? shares : {},
    allClaimed,
    unclaimedCount: unclaimed.length,
    check: null,
    ledger: null,
    myPay: null,
    locked,
  };
  if (v.role === "host") {
    const c = checkBill(d.items, d.charges, d.bill.total);
    view.check = { ...c, roundOff: roundOffOf(d.charges), duplicateId: findDuplicate(d.items)?.id ?? null };
    view.ledger = {
      rows: ledger.rows.map((r) => ({ id: r.participant.id, name: r.participant.name, share: r.share, pay: r.pay, payments: r.payments })),
      counts: ledger.counts,
      received: ledger.received,
      owedTotal: ledger.owedTotal,
    };
  }
  if (v.role === "guest" && me) {
    const mine = d.payments.filter((p) => p.participantId === me.id);
    view.myPay = { owed: shares[me.id].total, pay: payView(shares[me.id].total, mine), payments: mine, note: paymentNote(d.bill.ref, me.name) };
  }
  return view;
}

/** The UPI note: "Dibs 7K2 Mukul". Short, no punctuation some UPI apps reject. */
export function paymentNote(ref: string, name: string): string {
  const n = cleanName(name).replace(/[^A-Za-z0-9 ]/g, "").slice(0, 16).trim();
  return `Dibs ${ref}${n ? " " + n : ""}`;
}

/* ------------------------------------------------------------------ draft from a scan */

export interface ScanInput {
  payerName: string;
  payerVpa: string;
  thumb?: string | null;
}

const flagFor = (it: ParsedBill["items"][number]): ItemFlag | null => {
  if (!it.doubt) return null;
  const read = it.doubt.field === "qty" ? `×${it.qty}` : it.doubt.field === "price" ? formatINR(toPaise(it.price)) : it.name;
  return { read, why: it.doubt.note.trim().slice(0, 60) || "Not sure about this" };
};

export async function createDraft(store: Store, input: ScanInput, parsed: ParsedBill): Promise<Result<{ code: string; hostToken: string }>> {
  const payerName = cleanName(input.payerName).slice(0, 40);
  const payerVpa = input.payerVpa.trim();
  if (!payerName) return fail("bad_input", "Enter your name");
  if (!isValidVpa(payerVpa)) return fail("bad_input", "That UPI ID doesn't look right (for example name@okaxis)");
  const items = parsed.items.map((i) => ({ name: i.name.trim().slice(0, 60) || "Item", qty: Math.max(1, Math.min(99, i.qty)), price: toPaise(i.price), flag: flagFor(i) }));
  const charges = [
    ...parsed.taxes.filter((t) => t.amount > 0).map((t) => ({ label: t.label.trim().slice(0, 40) || "Tax", kind: "tax" as const, amount: toPaise(t.amount) })),
    ...(parsed.serviceCharge > 0 ? [{ label: "Service charge", kind: "service" as const, amount: toPaise(parsed.serviceCharge) }] : []),
    ...(parsed.discount > 0 ? [{ label: "Discount", kind: "discount" as const, amount: toPaise(parsed.discount) }] : []),
  ];
  const r = await store.createBill({
    merchant: parsed.merchant.trim().slice(0, 60) || "Bill",
    total: toPaise(parsed.total),
    payerName,
    payerVpa,
    hostName: firstName(payerName),
    thumb: input.thumb && input.thumb.length < 60_000 && input.thumb.startsWith("data:image/") ? input.thumb : null,
    items,
    charges,
  });
  return { ok: true, code: r.code, hostToken: r.hostToken };
}

/* ------------------------------------------------------------------ host edits */

async function loadHost(store: Store, code: string, creds: Creds): Promise<{ d: BillData } | Fail> {
  const d = await store.getBillData(code);
  if (!d) return fail("not_found", "This bill does not exist");
  const v = await resolveViewer(store, d, creds);
  if (v.role !== "host") return fail("forbidden", "Only the host can do that");
  return { d };
}
const isFail = (x: unknown): x is Fail => !!x && typeof x === "object" && (x as Fail).ok === false;

const lockedMsg = "Someone has started paying, so the bill can't be changed any more";

export async function saveItem(
  store: Store,
  code: string,
  creds: Creds,
  input: { id?: string; name: string; qty: number; price: string },
): Promise<Result<{ id: string }>> {
  const h = await loadHost(store, code, creds);
  if (isFail(h)) return h;
  if (h.d.payments.some((p) => p.status !== "rejected")) return fail("locked", lockedMsg);
  const name = cleanName(input.name).slice(0, 60);
  const price = parseRupees(input.price);
  const qty = Math.trunc(Number(input.qty));
  if (!name) return fail("bad_input", "Give the item a name");
  if (price === null) return fail("bad_input", "Use numbers, like 295.00");
  if (!Number.isFinite(qty) || qty < 1 || qty > 99) return fail("bad_input", "Quantity must be 1 to 99");
  if (input.id && !h.d.items.some((i) => i.id === input.id)) return fail("not_found", "That item is gone");
  const it = await store.saveItem(code, { id: input.id, name, qty, price, flag: null });
  return { ok: true, id: it.id };
}

export async function removeItem(store: Store, code: string, creds: Creds, id: string): Promise<Result> {
  const h = await loadHost(store, code, creds);
  if (isFail(h)) return h;
  if (h.d.payments.some((p) => p.status !== "rejected")) return fail("locked", lockedMsg);
  await store.removeItem(code, id);
  return { ok: true };
}

export async function saveCharge(
  store: Store,
  code: string,
  creds: Creds,
  input: { kind: string; label: string; amount: string },
): Promise<Result<{ id: string }>> {
  const h = await loadHost(store, code, creds);
  if (isFail(h)) return h;
  if (h.d.payments.some((p) => p.status !== "rejected")) return fail("locked", lockedMsg);
  const label = cleanName(input.label).slice(0, 40);
  const amount = parseRupees(input.amount);
  if (input.kind !== "tax" && input.kind !== "service" && input.kind !== "discount") return fail("bad_input", "Pick tax, service or discount");
  if (!label) return fail("bad_input", "Give the charge a name");
  if (label === ROUND_OFF) return fail("bad_input", "Round-off is added for you");
  if (amount === null) return fail("bad_input", "Use numbers, like 51.75");
  const c = await store.saveCharge(code, { label, kind: input.kind, amount });
  return { ok: true, id: c.id };
}

export async function removeCharge(store: Store, code: string, creds: Creds, id: string): Promise<Result> {
  const h = await loadHost(store, code, creds);
  if (isFail(h)) return h;
  if (h.d.payments.some((p) => p.status !== "rejected")) return fail("locked", lockedMsg);
  await store.removeCharge(code, id);
  return { ok: true };
}

/** Make the link live. A bill that does not add up can only be shared on purpose (`anyway`). */
export async function publish(store: Store, code: string, creds: Creds, opts: { anyway?: boolean } = {}): Promise<Result<{ short: Paise }>> {
  const h = await loadHost(store, code, creds);
  if (isFail(h)) return h;
  const { d } = h;
  if (d.bill.status === "open") return { ok: true, short: d.bill.shortAtShare };
  if (d.items.length === 0) return fail("bad_input", "Add at least one item");
  const c = checkBill(d.items, d.charges, d.bill.total);
  if (!c.ok && !opts.anyway) return fail("not_balanced", `The bill is ${formatINR(Math.abs(c.diff))} ${c.diff < 0 ? "short" : "over"}`);
  const wanted = withRoundOff(d.items, d.charges, d.bill.total);
  // replace any earlier round-off with the current one
  for (const ch of d.charges) if (ch.kind === "discount" && ch.label === ROUND_OFF) await store.removeCharge(code, ch.id);
  const ro = wanted.find((x) => x.label === ROUND_OFF && x.kind === "discount");
  if (ro) await store.saveCharge(code, ro);
  const short = c.ok ? 0 : c.diff;
  await store.patchBill(code, { status: "open", sharedAt: new Date().toISOString(), shortAtShare: short });
  return { ok: true, short };
}

/* ------------------------------------------------------------------ joining and claiming */

export type JoinResult =
  | Done<{ participantId: string; token: string; name: string; back: boolean }>
  | Fail
  | { ok: false; code: "taken"; error: string; takenName: string }
  | { ok: false; code: "host"; error: string; hostName: string };

export async function join(store: Store, code: string, name: string, opts: { takeover?: boolean } = {}): Promise<JoinResult> {
  const d = await store.getBillData(code);
  if (!d || d.bill.status !== "open") return fail("not_found", "This link doesn't work");
  if (ledgerOf(d).settled) return fail("closed", "This bill is settled");
  const hostP = d.participants.find((p) => p.isHost)!;
  const others = d.participants.filter((p) => !p.isHost);
  const chk = checkJoinName(name, { name: hostP.name, fullName: d.bill.payerName }, others);
  if (!chk.ok) {
    if (chk.reason === "empty") return fail("empty", "Add your name so friends can see your picks.");
    if (chk.reason === "host") return { ok: false, code: "host", error: `${chk.hostName} is hosting this bill. Use a different name.`, hostName: chk.hostName };
    if (!opts.takeover) return { ok: false, code: "taken", error: `${chk.takenName} is already in. Is that you?`, takenName: chk.takenName };
    const token = await store.rotateParticipantToken(code, chk.participantId);
    return { ok: true, participantId: chk.participantId, token, name: chk.takenName, back: true };
  }
  if (d.participants.length >= MAX_PARTICIPANTS) return fail("full", "This bill already has the most people it can hold");
  const { participant, token } = await store.addParticipant(code, chk.name);
  return { ok: true, participantId: participant.id, token, name: participant.name, back: false };
}

async function loadMember(store: Store, code: string, creds: Creds): Promise<{ d: BillData; v: Viewer & { participantId: string } } | Fail> {
  const d = await store.getBillData(code);
  if (!d || d.bill.status !== "open") return fail("not_found", "This link doesn't work");
  const v = await resolveViewer(store, d, creds);
  if (v.role === "anon") return fail("forbidden", "Join this bill first");
  return { d, v: v as Viewer & { participantId: string } };
}

export async function claim(store: Store, code: string, creds: Creds, itemId: string, on: boolean): Promise<Result> {
  const m = await loadMember(store, code, creds);
  if (isFail(m)) return m;
  if (m.d.payments.some((p) => p.participantId === m.v.participantId && p.status !== "rejected"))
    return fail("locked", "You've already paid, so your items are locked. Ask the host if something is wrong.");
  if (!m.d.items.some((i) => i.id === itemId)) return fail("not_found", "That item is gone");
  await store.setClaim(code, m.v.participantId, itemId, on);
  return { ok: true };
}

/* ------------------------------------------------------------------ paying */

export interface PaidInput {
  utr?: string | null;
  shot?: ShotRead | null;
  /** Only for "pay the missing amount"; otherwise what is still owed. */
  amount?: Paise;
}

export async function markPaid(store: Store, code: string, creds: Creds, input: PaidInput = {}): Promise<Result<{ paymentId: string; said: Paise }>> {
  const m = await loadMember(store, code, creds);
  if (isFail(m)) return m;
  if (m.v.role === "host") return fail("forbidden", "You are the host. Nobody pays themselves.");
  const { d } = m;
  const { allClaimed, shares } = sharesOf(d);
  if (!allClaimed) return fail("not_final", "Everything has to be claimed before anyone pays");
  const mine = d.payments.filter((p) => p.participantId === m.v.participantId);
  const pv = payView(shares[m.v.participantId].total, mine);
  if (pv.state === "none") return fail("nothing_owed", "You have nothing to pay");
  if (pv.state === "confirmed") return fail("already_paid", "This is already confirmed");
  if (pv.remaining <= 0) return fail("already_paid", "You've already told the host you paid");
  const utr = (input.utr ?? "").replace(/\D/g, "");
  if (utr && utr.length !== 12) return fail("bad_input", "A UTR has 12 digits");
  let said = input.amount ?? input.shot?.amount ?? pv.remaining;
  if (input.amount !== undefined && (input.amount <= 0 || input.amount > pv.remaining)) return fail("bad_input", "That amount does not match what is left");
  if (said <= 0) said = pv.remaining;
  const p = await store.addPayment(code, { participantId: m.v.participantId, kind: "upi", said, utr: utr || input.shot?.utr || null, shot: input.shot ?? null });
  return { ok: true, paymentId: p.id, said };
}

/** "I didn't pay": removes the friend's own unconfirmed notices. */
export async function undoPaid(store: Store, code: string, creds: Creds): Promise<Result> {
  const m = await loadMember(store, code, creds);
  if (isFail(m)) return m;
  for (const p of m.d.payments) if (p.participantId === m.v.participantId && p.status === "says") await store.removePayment(code, p.id);
  return { ok: true };
}

/** Host: what they did with a friend's "says paid". */
export type Decision = { action: "confirm"; amount?: Paise } | { action: "confirm_anyway"; amount?: Paise } | { action: "reject" } | { action: "undo" };

export async function decide(store: Store, code: string, creds: Creds, paymentId: string, dec: Decision): Promise<Result> {
  const h = await loadHost(store, code, creds);
  if (isFail(h)) return h;
  const { d } = h;
  const p = d.payments.find((x) => x.id === paymentId);
  if (!p) return fail("not_found", "That payment is gone");
  const now = new Date().toISOString();
  if (dec.action === "reject") {
    await store.updatePayment(code, paymentId, { status: "rejected", confirmed: 0, waived: 0, decidedAt: now });
    return { ok: true };
  }
  if (dec.action === "undo") {
    await store.updatePayment(code, paymentId, { status: "says", confirmed: 0, waived: 0, decidedAt: null });
    return { ok: true };
  }
  const amount = dec.amount ?? p.said;
  if (amount <= 0) return fail("bad_input", "Enter what you saw in your bank app");
  const owed = sharesOf(d).shares[p.participantId].total;
  const others = d.payments.filter((x) => x.participantId === p.participantId && x.id !== paymentId && x.status === "confirmed");
  const doneBefore = others.reduce((n, x) => n + x.confirmed + x.waived, 0);
  const waived = dec.action === "confirm_anyway" ? Math.max(0, owed - doneBefore - amount) : 0;
  await store.updatePayment(code, paymentId, { status: "confirmed", confirmed: amount, waived, decidedAt: now });
  return { ok: true };
}

/** Host: a friend paid cash (or by other means). Confirmed straight away. */
export async function recordCash(store: Store, code: string, creds: Creds, participantId: string, amount?: Paise): Promise<Result> {
  const h = await loadHost(store, code, creds);
  if (isFail(h)) return h;
  const { d } = h;
  const person = d.participants.find((p) => p.id === participantId);
  if (!person || person.isHost) return fail("not_found", "That person is not on this bill");
  const { shares } = sharesOf(d);
  const pv = payView(shares[participantId].total, d.payments.filter((p) => p.participantId === participantId));
  const paid = amount ?? pv.remaining;
  if (paid <= 0) return fail("already_paid", "Nothing is left to pay");
  await store.addPayment(code, { participantId, kind: "cash", said: paid, status: "confirmed", confirmed: paid });
  return { ok: true };
}
