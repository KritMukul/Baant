"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { browser } from "@/lib/supabase";
import { addItem, deleteItem, joinBill, setClaim, updateItem } from "@/app/actions";
import { formatINR } from "@/lib/money";
import { validateBill } from "@/lib/bill";
import { splitBill } from "@/lib/split";
import { upiLink } from "@/lib/upi";

type Item = { id: string; name: string; qty: number; price: number };
type Person = { id: string; name: string };
type Claim = { item_id: string; participant_id: string };
type Props = {
  code: string;
  billId: string;
  bill: { merchant: string; total: number; tax: number; service: number; discount: number; payerName: string; payerVpa: string };
  items: Item[];
  participants: Person[];
  claims: Claim[];
  isHost: boolean;
};

type Me = { participantId: string; token: string };

export default function ClaimBoard({ code, billId, bill, items, participants, claims, isHost }: Props) {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState(false);
  const [optimistic, setOptimistic] = useState<Record<string, boolean>>({}); // itemId -> my claim state
  const [, startTransition] = useTransition();
  const key = `baant:${code}`;

  useEffect(() => {
    try {
      const s = localStorage.getItem(key);
      if (s) setMe(JSON.parse(s));
    } catch {}
  }, [key]);

  // Realtime: any change on this bill -> refetch server data. Optimistic state covers my own taps.
  useEffect(() => {
    const sb = browser();
    const refresh = () => router.refresh();
    const ch = sb
      .channel(`bill:${billId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "claims", filter: `bill_id=eq.${billId}` }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "participants", filter: `bill_id=eq.${billId}` }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "items", filter: `bill_id=eq.${billId}` }, refresh)
      .subscribe();
    return () => void sb.removeChannel(ch);
  }, [billId, router]);

  // Server data caught up -> drop optimistic overrides.
  useEffect(() => setOptimistic({}), [claims]);

  const claimedBy = useMemo(() => {
    const m: Record<string, string[]> = {};
    for (const c of claims) (m[c.item_id] ??= []).push(c.participant_id);
    return m;
  }, [claims]);

  const effective = (itemId: string): string[] => {
    const base = claimedBy[itemId] ?? [];
    if (!me || !(itemId in optimistic)) return base;
    const without = base.filter((p) => p !== me.participantId);
    return optimistic[itemId] ? [...without, me.participantId] : without;
  };

  const charges = { tax: bill.tax, service: bill.service, discount: bill.discount };
  const validation = validateBill(items, charges, bill.total);
  const allClaims = Object.fromEntries(items.map((i) => [i.id, effective(i.id)]));
  const { shares, unclaimed } = splitBill(items, charges, allClaims, participants.map((p) => p.id));
  const myShare = me ? shares[me.participantId] : undefined;
  const nameOf = (id: string) => participants.find((p) => p.id === id)?.name ?? "?";

  async function join() {
    if (!name.trim()) return;
    const r = await joinBill(code, name);
    localStorage.setItem(key, JSON.stringify(r));
    setMe(r);
    router.refresh();
  }

  function toggle(item: Item) {
    if (!me) return;
    const on = !effective(item.id).includes(me.participantId);
    setOptimistic((o) => ({ ...o, [item.id]: on }));
    startTransition(() => void setClaim(me.participantId, me.token, item.id, on));
  }

  return (
    <>
      <h1>{bill.merchant || "Bill"}</h1>
      <p className="muted">
        Total {formatINR(bill.total)} · {bill.payerName} ne pay kiya · Link share karo: <b>/b/{code}</b>
      </p>

      {!validation.ok && (
        <div className="card warn">
          Items ka sum bill total se match nahi karta ({formatINR(validation.actual)} vs {formatINR(validation.expected)}).
          {isHost ? " Neeche items edit karke theek karo." : " Host se items check karne ko bolo."}
        </div>
      )}

      {!me && (
        <div className="card">
          <b>Join karo (signup nahi chahiye)</b>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tumhara naam" />
          <button onClick={join}>Join</button>
        </div>
      )}

      {isHost && (
        <button className="ghost" onClick={() => setEditing((e) => !e)}>
          {editing ? "Edit band karo" : "Items edit karo"}
        </button>
      )}

      {editing
        ? items.map((i) => <EditRow key={i.id} code={code} item={i} onDone={() => router.refresh()} />)
        : items.map((i) => {
            const who = effective(i.id);
            const mine = !!me && who.includes(me.participantId);
            return (
              <div key={i.id} className={`card item ${mine ? "mine" : ""}`} onClick={() => toggle(i)}>
                <div className="row">
                  <span>
                    {i.qty > 1 ? `${i.qty}× ` : ""}
                    {i.name}
                  </span>
                  <b>{formatINR(i.price)}</b>
                </div>
                <div className="chips">
                  {who.length ? who.map(nameOf).join(", ") + (who.length > 1 ? ` (har ek ${formatINR(Math.ceil(i.price / who.length))})` : "") : "Koi nahi"}
                </div>
              </div>
            );
          })}

      {editing && <button className="ghost" onClick={async () => { await addItem(code); router.refresh(); }}>+ Item add karo</button>}

      {unclaimed.length > 0 && !editing && (
        <p className="muted">{unclaimed.length} item abhi kisi ne claim nahi kiya.</p>
      )}

      {myShare && (
        <div className="card">
          <div className="row"><span>Items</span><span>{formatINR(myShare.subtotal)}</span></div>
          <div className="row"><span>Tax + service</span><span>{formatINR(myShare.tax + myShare.service)}</span></div>
          {myShare.discount > 0 && <div className="row"><span>Discount</span><span>−{formatINR(myShare.discount)}</span></div>}
          <div className="row"><b>Tumhara hissa</b><b>{formatINR(myShare.total)}</b></div>
          {myShare.total > 0 && me!.participantId && (
            <a
              className="pay"
              href={upiLink({ vpa: bill.payerVpa, name: bill.payerName, amount: myShare.total, note: `Baant ${bill.merchant}`.trim() })}
            >
              {bill.payerName} ko {formatINR(myShare.total)} pay karo (UPI)
            </a>
          )}
        </div>
      )}
    </>
  );
}

function EditRow({ code, item, onDone }: { code: string; item: Item; onDone: () => void }) {
  const [name, setName] = useState(item.name);
  const [price, setPrice] = useState(String(item.price / 100));
  const save = async () => {
    const n = Number(price);
    if (Number.isFinite(n) && n >= 0) await updateItem(code, item.id, name, n);
    onDone();
  };
  return (
    <div className="card edit-row">
      <input value={name} onChange={(e) => setName(e.target.value)} onBlur={save} />
      <input value={price} inputMode="decimal" onChange={(e) => setPrice(e.target.value)} onBlur={save} />
      <button onClick={async () => { await deleteItem(code, item.id); onDone(); }}>✕</button>
    </div>
  );
}
