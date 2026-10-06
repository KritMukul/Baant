import { z } from "zod";
import type { ShotRead } from "./model";
import { toPaise, type Paise } from "./money";
import { visionJson, type VisionTask } from "./vision";

const PROMPT = `This is a screenshot from an Indian UPI app (Google Pay, PhonePe, Paytm, BHIM, a bank app) taken after a payment.
Read it and answer:
- "amount": the amount paid, in rupees (decimals allowed), or null if you cannot read it.
- "payee": who was paid, exactly as shown (a name or a UPI ID), or null.
- "status": "success" if it clearly says the payment succeeded / completed / paid, "failed" if it failed or was declined, "pending" if it is processing, otherwise "unknown". If this is not a payment screenshot at all, use "unknown".
- "paidAt": the date and time as printed, or null.
- "utr": the 12-digit UPI reference / transaction ID / UTR, digits only, or null.
Do not guess. Use null when something is not visible.`;

const SHOT_JSON_SCHEMA = {
  type: "object",
  properties: {
    amount: { type: ["number", "null"] },
    payee: { type: ["string", "null"] },
    status: { type: "string", enum: ["success", "failed", "pending", "unknown"] },
    paidAt: { type: ["string", "null"] },
    utr: { type: ["string", "null"] },
  },
  required: ["amount", "payee", "status", "paidAt", "utr"],
  additionalProperties: false,
};

const shotSchema = z.object({
  amount: z.number().nonnegative().nullish().transform((v) => (v == null ? null : toPaise(v))),
  payee: z.string().nullish().transform((v) => v?.trim() || null),
  status: z.enum(["success", "failed", "pending", "unknown"]).nullish().transform((v) => v ?? "unknown"),
  paidAt: z.string().nullish().transform((v) => v?.trim() || null),
  utr: z
    .string()
    .nullish()
    .transform((v) => {
      const d = (v ?? "").replace(/\D/g, "");
      return d.length === 12 ? d : null;
    }),
});

/** `hint` is only used by BILL_PARSER=stub, so the development build can show a believable result. */
export function readPaymentScreenshot(base64: string, mediaType: string, hint?: { amount: Paise; vpa: string }): Promise<ShotRead> {
  const task: VisionTask<ShotRead> = {
    prompt: PROMPT,
    schema: SHOT_JSON_SCHEMA,
    parse: (j) => shotSchema.parse(j),
    // DIBS_STUB_SHOT_AMOUNT (paise) lets the end-to-end test pretend a friend paid only part of it
    stub: () => ({ amount: process.env.DIBS_STUB_SHOT_AMOUNT ? Number(process.env.DIBS_STUB_SHOT_AMOUNT) : (hint?.amount ?? null), payee: hint?.vpa ?? null, status: "success", paidAt: "8:57 pm", utr: "408129375518" }),
  };
  return visionJson(task, { base64, mediaType });
}

export interface ShotJudgement {
  amount: "match" | "short" | "over" | "unreadable";
  /** read amount minus expected, paise (negative = short). 0 when unreadable. */
  diff: Paise;
  payee: "match" | "differs" | "unreadable";
  status: ShotRead["status"];
  /** A UTR was read from the picture. */
  utr: "match" | "differs" | "read" | "none";
  /** Everything we can check agrees. The host still confirms in the bank app. */
  ok: boolean;
}

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

export function judgeShot(
  shot: ShotRead,
  expected: { amount: Paise; vpa: string; hostName: string },
  typedUtr?: string | null,
): ShotJudgement {
  const diff = shot.amount == null ? 0 : shot.amount - expected.amount;
  const amount: ShotJudgement["amount"] = shot.amount == null ? "unreadable" : diff === 0 ? "match" : diff < 0 ? "short" : "over";

  let payee: ShotJudgement["payee"] = "unreadable";
  if (shot.payee) {
    const p = norm(shot.payee);
    const words = norm(expected.hostName).split(" ").filter((w) => w.length >= 3);
    payee = p.includes(norm(expected.vpa)) || (words.length > 0 && words.every((w) => p.includes(w))) ? "match" : "differs";
  }

  const typed = (typedUtr ?? "").replace(/\D/g, "");
  const utr: ShotJudgement["utr"] = !shot.utr ? "none" : typed.length === 12 ? (typed === shot.utr ? "match" : "differs") : "read";

  return { amount, diff, payee, status: shot.status, utr, ok: amount === "match" && payee !== "differs" && shot.status === "success" && utr !== "differs" };
}
