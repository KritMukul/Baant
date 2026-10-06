import type { Paise } from "./money";

/** Standard UPI intent link; opens GPay/PhonePe/Paytm chooser on Android. */
export function upiLink(opts: { vpa: string; name: string; amount: Paise; note?: string }): string {
  const p = new URLSearchParams({
    pa: opts.vpa,
    pn: opts.name,
    am: (opts.amount / 100).toFixed(2),
    cu: "INR",
  });
  if (opts.note) p.set("tn", opts.note);
  // URLSearchParams encodes spaces as '+', which some UPI apps don't decode.
  return `upi://pay?${p.toString().replace(/\+/g, "%20")}`;
}

export const isValidVpa = (v: string) => /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(v);
