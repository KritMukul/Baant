"use client";

import { useActionState } from "react";
import { createBill } from "./actions";

export default function NewBillForm() {
  const [state, action, pending] = useActionState(createBill, { error: "" });
  return (
    <form action={action} className="card">
      <input name="name" placeholder="Your name" required />
      <input name="vpa" placeholder="Your UPI ID (name@okaxis)" required />
      <input name="bill" type="file" accept="image/*" capture="environment" required />
      <button disabled={pending}>{pending ? "Reading the bill…" : "Scan the bill"}</button>
      {state.error && <p className="error">{state.error}</p>}
    </form>
  );
}
