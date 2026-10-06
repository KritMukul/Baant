"use client";

import { useActionState } from "react";
import { createBill } from "./actions";

export default function NewBillForm() {
  const [state, action, pending] = useActionState(createBill, { error: "" });
  return (
    <form action={action} className="card">
      <input name="name" placeholder="Tumhara naam" required />
      <input name="vpa" placeholder="Tumhari UPI ID (name@okaxis)" required />
      <input name="bill" type="file" accept="image/*" capture="environment" required />
      <button disabled={pending}>{pending ? "Bill padh rahe hain…" : "Bill scan karo"}</button>
      {state.error && <p className="error">{state.error}</p>}
    </form>
  );
}
