"use client";

import Link from "next/link";
import { useState } from "react";
import { decideAction, recordCashAction } from "@/app/actions";
import { formatINR, formatNum } from "@/lib/money";
import type { Payment } from "@/lib/model";
import { Back, Check, Gear } from "@/ui/icons";
import { useLive, useToast } from "@/ui/hooks";
import { Sheet } from "@/ui/overlays";
import { paymentNote, type BillView } from "@/server/service";

type Row = NonNullable<BillView["ledger"]>["rows"][number];
const COL = ["f2", "f3", "f1"];
const time = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }) : "");
const wa = (text: string) => `https://wa.me/?text=${encodeURIComponent(text)}`;

export default function SettleScreen({ code, initial, origin }: { code: string; initial: BillView; origin: string }) {
  const { view, refresh } = useLive(code, initial);
  const [toast, say] = useToast();
  const [open, setOpen] = useState<string | null>(null);
  const [cash, setCash] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);

  const L = view.ledger!;
  const host = view.me!;
  const link = `${origin}/b/${code}`;
  const hostShare = view.shares[host.id]?.total ?? 0;
  const owing = L.rows.filter((r) => r.pay.state !== "none");
  const says = L.rows.reduce((n, r) => n + r.pay.says, 0);
  const done = L.rows.reduce((n, r) => n + r.pay.confirmed, 0);
  const waived = L.rows.reduce((n, r) => n + r.pay.waived, 0);
  const unpaid = Math.max(0, L.owedTotal - done - waived - says);
  const pct = (x: number) => (L.owedTotal ? Math.min(1, x / L.owedTotal) : 0);

  const pending = (r: Row): Payment[] => r.payments.filter((p) => p.status === "says");
  const lastPending = (r: Row) => pending(r).at(-1);

  async function run(label: string, fn: () => Promise<{ ok: boolean; error?: string }>) {
    setBusy(true);
    const r = await fn();
    setBusy(false);
    if (!r.ok) return say(r.error ?? "That didn't work");
    await refresh();
    setOpen(null);
    say(label);
  }
  const confirm = (r: Row) =>
    run(`${r.name} confirmed`, async () => {
      for (const p of pending(r)) {
        const x = await decideAction(code, p.id, { action: "confirm" });
        if (!x.ok) return x;
      }
      return { ok: true };
    });
  const confirmAnyway = (r: Row) =>
    run(`Accepted ${formatINR(r.pay.says)} from ${r.name}`, async () => {
      const ps = pending(r);
      for (const [i, p] of ps.entries()) {
        const x = await decideAction(code, p.id, { action: i === ps.length - 1 ? "confirm_anyway" : "confirm" });
        if (!x.ok) return x;
      }
      return { ok: true };
    });
  const reject = (r: Row) =>
    run(`${r.name} will see that it is not received`, async () => {
      for (const p of pending(r)) {
        const x = await decideAction(code, p.id, { action: "reject" });
        if (!x.ok) return x;
      }
      return { ok: true };
    });
  const undo = (r: Row) =>
    run("Moved back to Says paid", async () => {
      const last = r.payments.filter((p) => p.status === "confirmed").at(-1);
      if (!last) return { ok: false, error: "Nothing to undo" };
      const x = await decideAction(code, last.id, { action: "undo" });
      if (x.ok) setOpen(r.id);
      return x;
    });
  const markCash = async (r: Row) => {
    setCash(null);
    await run(`${r.name} marked paid`, () => recordCashAction(code, r.id));
  };

  const remindText = (r: Row, amount = r.pay.remaining) =>
    `Hi ${r.name}, your share for ${view.merchant} is ${formatINR(amount)}. Pay ${host.name} here: ${link}`;

  const status = (r: Row) => {
    const p = r.pay;
    if (p.state === "none") return "Nothing to pay";
    if (p.state === "confirmed") {
      const last = r.payments.filter((x) => x.status === "confirmed").at(-1);
      if (last?.kind === "cash") return `Marked paid by you · cash · ${time(last.decidedAt)}`;
      return `Confirmed ${time(last?.decidedAt)}${p.waived > 0 ? " · accepted short" : ""}`;
    }
    if (p.state === "says") return `Said paid ${time(lastPending(r)?.createdAt)}${p.short ? ` · ${formatINR(p.says + p.confirmed)} of ${formatINR(p.owed)}` : ""}`;
    const rej = r.payments.filter((x) => x.status === "rejected").at(-1);
    return p.rejected ? `Not received · you checked ${time(rej?.decidedAt)}` : "Not paid yet";
  };
  const chip = (r: Row) =>
    r.pay.state === "confirmed" ? <span className="chip co"><Check />Confirmed</span>
    : r.pay.state === "says" ? <span className={`chip ${r.pay.short ? "sh" : "sa"}`}>{r.pay.short ? "Says paid · short" : "Says paid"}</span>
    : r.pay.state === "unpaid" ? <span className="chip un">Unpaid</span> : null;

  const pendingRows = L.rows.filter((r) => r.pay.state === "says");
  const unpaidRows = L.rows.filter((r) => r.pay.state === "unpaid");

  return (
    <div className="page s-b">
      <div className="scr">
        <div className="appbar">
          <Link className="icon-btn" href={`/b/${code}`} aria-label="Back to the claim board"><Back /></Link>
          <span className="ttl">Settle up</span>
          <Link className="icon-btn" href="/settings" aria-label="Settings"><Gear /></Link>
        </div>
        <div className="body">
          {view.settled ? (
            <div className="settled" data-k="sumB">
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--color-success)", color: "var(--color-bg)", display: "grid", placeItems: "center" }}><Check style={{ width: 30, height: 30 }} /></div>
              <h1>Everyone&rsquo;s settled. 🎉</h1>
              <p>
                {waived > 0
                  ? `All ${owing.length} ${owing.length === 1 ? "friend" : "friends"} confirmed. You received ${formatINR(done)}, which is ${formatINR(waived)} less than owed.`
                  : `All ${owing.length} ${owing.length === 1 ? "friend" : "friends"} confirmed ${formatINR(L.owedTotal)} for ${view.merchant}.`}
              </p>
            </div>
          ) : (
            <div className="sum" data-k="sumA">
              <div className="eyebrow">{view.merchant} · you paid</div>
              <div className="big"><span className="c">₹</span>{formatNum(view.total)}</div>
              <div className="owed"><span>Friends owe you</span><b>{formatINR(L.owedTotal)}</b></div>
              <div className="pbar">
                <i className="a" style={{ transform: `scaleX(${pct(done + waived + says)})` }} />
                <i className="c" style={{ transform: `scaleX(${pct(done + waived)})` }} />
              </div>
              <div className="pleg" data-k="leg">
                <span><i className="d c" />{formatINR(done + waived)} confirmed</span>
                <span><i className="d a" />{formatINR(says)} says paid</span>
                <span><i className="d u" />{formatINR(unpaid)} unpaid</span>
              </div>
            </div>
          )}

          {!view.allClaimed ? (
            <div className="note2">
              <div>
                <b>Friends can pay once everything is claimed.</b> {view.unclaimedCount} item{view.unclaimedCount > 1 ? "s are" : " is"} still up for grabs.{" "}
                <Link className="link" href={`/b/${code}`} style={{ margin: 0 }}>Open the board</Link>
              </div>
            </div>
          ) : null}

          <div className="sect">Friends · {L.rows.length}</div>
          {L.rows.length === 0 ? (
            <div className="note2"><div><b>Nobody has joined yet.</b> <Link className="link" href={`/b/${code}/share`} style={{ margin: 0 }}>Share the link</Link></div></div>
          ) : null}
          <div className="stack" style={{ display: "grid", gap: 10 }}>
            {L.rows.map((r, idx) => {
              const p = r.pay;
              const cls = p.state === "confirmed" ? "conf" : p.state === "says" ? (p.short ? "short" : "says") : "";
              const ref = paymentNote(view.ref, r.name);
              const lp = lastPending(r);
              return (
                <div key={r.id} className={`fr ${cls}`} data-i={r.id}>
                  <button className="frh" type="button" aria-expanded={open === r.id} onClick={() => setOpen(open === r.id ? null : r.id)}>
                    <i className={`av ${COL[idx % 3]}`}>{r.name.charAt(0).toUpperCase()}</i>
                    <span><span className="nm">{r.name}</span><span className="st">{status(r)}</span></span>
                    <span className="rt"><span className="amt">{formatINR(r.share.total)}</span>{chip(r)}</span>
                  </button>
                  {open === r.id ? (
                    <div className="det">
                      {p.state === "unpaid" ? (
                        <div className="two">
                          <a className="btn sm" href={wa(remindText(r))} target="_blank" rel="noopener">Remind {r.name}</a>
                          <button className="btn sec sm" type="button" onClick={() => setCash(r)}>Mark paid</button>
                        </div>
                      ) : p.state === "says" ? (
                        <>
                          <div className="ln"><span>UTR</span><b>{lp?.utr ?? "not added"}</b></div>
                          <div className="ln">
                            <span>Screenshot</span>
                            <b className={lp?.shot ? (lp.shot.amount === lp.said && (lp.said >= p.owed - p.confirmed - p.waived || !p.short) ? "ok" : p.short ? "bad" : "ok") : ""}>
                              {lp?.shot ? (p.short ? `shows ${formatINR(lp.shot.amount ?? 0)}, expects ${formatINR(p.owed)}` : "amount matches") : "not added"}
                            </b>
                          </div>
                          <div className="hint">Look for <b>{formatINR(p.says)}</b> with the note <b>{ref}</b> in your bank app.</div>
                          {p.short ? (
                            <div className="two">
                              <a className="btn sm" href={wa(`Hi ${r.name}, I got ${formatINR(p.says)} but your share is ${formatINR(p.owed)}. Can you send the other ${formatINR(p.remaining)}? ${link}`)} target="_blank" rel="noopener">Ask for {formatINR(p.remaining)} more</a>
                              <div className="two c2">
                                <button className="btn sec sm" type="button" disabled={busy} onClick={() => void confirmAnyway(r)}>Confirm anyway</button>
                                <button className="btn sec sm" type="button" disabled={busy} onClick={() => void reject(r)}>Not received</button>
                              </div>
                            </div>
                          ) : (
                            <div className="two">
                              <button className="btn sm" type="button" disabled={busy} onClick={() => void confirm(r)}>Confirm {formatINR(p.says)}</button>
                              <button className="btn sec sm" type="button" disabled={busy} onClick={() => void reject(r)}>Not received</button>
                            </div>
                          )}
                        </>
                      ) : p.state === "confirmed" ? (
                        <>
                          <div className="ln"><span>Reference</span><b>{ref}</b></div>
                          <div className="ln"><span>Amount</span><b>{formatINR(p.confirmed)}</b></div>
                          <button className="link" type="button" style={{ justifySelf: "start", padding: 0 }} disabled={busy} onClick={() => void undo(r)}>Undo confirm</button>
                        </>
                      ) : (
                        <div className="hint">{r.name} did not claim anything, so there is nothing to pay.</div>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
            <div className="fr host">
              <div className="frh" style={{ cursor: "default" }}>
                <i className="av me">{host.name.charAt(0).toUpperCase()}</i>
                <span><span className="nm">You · {host.name}</span><span className="st">Your share · nothing to pay</span></span>
                <span className="rt"><span className="amt">{formatINR(hostShare)}</span></span>
              </div>
            </div>
          </div>
        </div>

        <div className="dock">
          {view.settled ? (
            <a className="btn" href={wa(`Dibs · ${view.merchant} · settled. Thanks, everyone. ${L.rows.filter((r) => r.pay.owed > 0).map((r) => `${r.name} ${formatINR(r.pay.owed)}`).join(", ")}.`)} target="_blank" rel="noopener">Share summary</a>
          ) : unpaidRows.length ? (
            <>
              <a className="btn sec" href={wa(`Reminder: please pay ${host.name} for ${view.merchant}. Your share is on the link: ${link}`)} target="_blank" rel="noopener" style={{ minHeight: 52 }}>
                Remind {unpaidRows.length === 1 ? unpaidRows[0].name : `${unpaidRows.length} friends`}
              </a>
              {pendingRows.length ? <p className="fine">{pendingRows.length} payment{pendingRows.length > 1 ? "s" : ""} waiting for you to confirm.</p> : null}
            </>
          ) : pendingRows.length ? (
            <p className="fine" style={{ padding: "6px 0 10px" }}>{pendingRows.length} payment{pendingRows.length > 1 ? "s" : ""} waiting for you to confirm. Open a row to check it.</p>
          ) : null}
        </div>
      </div>

      <Sheet open={!!cash} onClose={() => setCash(null)} label="Mark as paid">
        {cash ? (
          <>
            <h2>Mark {cash.name} as paid?</h2>
            <p>Use this if {cash.name} paid you in cash or another way. It records that you did it, not {cash.name}.</p>
            <div className="stack" style={{ marginTop: 6 }}>
              <button className="btn" type="button" onClick={() => void markCash(cash)}>Mark paid</button>
              <button className="btn sec" type="button" style={{ minHeight: 48 }} onClick={() => setCash(null)}>Cancel</button>
            </div>
          </>
        ) : null}
      </Sheet>
      {toast}
    </div>
  );
}
