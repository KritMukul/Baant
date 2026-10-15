"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { claimAction, claimLeftoversAction, lockClaimsAction } from "@/app/actions";
import { formatINR, formatNum } from "@/lib/money";
import { splitFromParts } from "@/lib/view";
import { categoryOf, type Category } from "@/ui/category";
import { copyText } from "@/ui/clipboard";
import { Check, Gear, Info, List, Lock, Lockup, Offline, Share, Unlock } from "@/ui/icons";
import { useLive, useToast } from "@/ui/hooks";
import type { BillView } from "@/server/service";

const IC: Record<Category, string> = {
  drink: "M6 4h12l-1.5 15a2 2 0 0 1-2 1.8h-5a2 2 0 0 1-2-1.8z M7 9h10",
  salad: "M4 12h16a8 8 0 0 1-16 0z M9 12c0-3 2-5 5-5 0 3-2 5-5 5z",
  starter: "M5 19L19 5 M9 15m-1.6 0a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0-3.2 0 M12.5 11.5m-1.6 0a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0-3.2 0 M16 8m-1.6 0a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0-3.2 0",
  main: "M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10 M16 3c-2 2-3 5-3 8h3v10",
};
const TILE: Record<Category, string> = { drink: "t1", salad: "t2", starter: "t3", main: "t4" };
const AVC = ["f1", "f2", "f3"];

export default function BoardScreen({ code, initial, origin }: { code: string; initial: BillView; origin: string }) {
  const { view, refresh, offline } = useLive(code, initial);
  const [toast, say] = useToast();
  const me = view.me!;
  const isHost = me.isHost;
  const myPaid = !!view.myPay && view.myPay.pay.state !== "unpaid" && view.myPay.pay.state !== "none";

  /** itemId -> what I just tapped (true = claimed). Stays until the server has confirmed it. */
  const [pend, setPend] = useState<Record<string, boolean>>({});
  const [showLeft, setShowLeft] = useState(false);
  /** Taps that could not reach the server yet. */
  const [stuck, setStuck] = useState<Record<string, boolean>>({});
  const flushing = useRef(false);
  const pendRef = useRef(pend);
  pendRef.current = pend;

  const order = useMemo(() => view.participants.map((p) => p.id), [view.participants]);
  const color = useCallback((id: string) => (id === me.id ? "me" : AVC[Math.max(0, order.indexOf(id)) % 3]), [order, me.id]);
  const nameOf = useCallback((id: string) => (id === me.id ? "you" : view.participants.find((p) => p.id === id)?.name ?? "someone"), [view.participants, me.id]);

  // claims as I see them: the server's, with my own pending taps laid over
  const claims = useMemo(() => {
    const others = view.claims.filter((c) => c.participantId !== me.id);
    const mine = view.claims.filter((c) => c.participantId === me.id && !(c.itemId in pend));
    const added = Object.entries(pend).filter(([, on]) => on).map(([itemId]) => ({ itemId, participantId: me.id }));
    return [...others, ...mine, ...added];
  }, [view.claims, pend, me.id]);

  const split = useMemo(() => splitFromParts(view.items, view.charges, order, claims), [view.items, view.charges, order, claims]);
  const mine = split.shares[me.id] ?? { subtotal: 0, tax: 0, service: 0, discount: 0, total: 0 };
  const unclaimed = split.unclaimed;
  const allClaimed = unclaimed.length === 0 && view.items.length > 0;
  const claimedCount = view.items.length - unclaimed.length;
  const locked = view.claimsLocked;

  const holders = (itemId: string) => claims.filter((c) => c.itemId === itemId).map((c) => c.participantId);

  /* ---- sending taps, one at a time, remembering the ones that could not be sent ---- */
  const flush = useCallback(async () => {
    if (flushing.current) return;
    flushing.current = true;
    try {
      for (const [itemId, on] of Object.entries(pendRef.current)) {
        let r;
        try {
          r = await claimAction(code, itemId, on);
        } catch {
          setStuck((s) => ({ ...s, [itemId]: true }));
          break; // offline: keep the rest, try again later
        }
        setStuck((s) => {
          const { [itemId]: _gone, ...rest } = s;
          void _gone;
          return rest;
        });
        if (!r.ok) say(r.error);
        await refresh();
        setPend((p) => {
          if (p[itemId] !== on) return p; // tapped again meanwhile
          const { [itemId]: _done, ...rest } = p;
          void _done;
          return rest;
        });
      }
    } finally {
      flushing.current = false;
    }
  }, [code, refresh, say]);

  useEffect(() => {
    const on = () => void flush();
    window.addEventListener("online", on);
    return () => window.removeEventListener("online", on);
  }, [flush]);
  useEffect(() => {
    if (!offline && Object.keys(stuck).length) void flush();
  }, [offline, stuck, flush]);

  function tap(itemId: string) {
    if (locked) return say(`${view.hostName} has locked the claims.`);
    if (myPaid) return say("You've already paid, so your items are locked.");
    const now = claims.some((c) => c.itemId === itemId && c.participantId === me.id);
    setPend((p) => ({ ...p, [itemId]: !now }));
    setTimeout(() => void flush(), 0);
  }

  /* ---- other people's picks arriving: a quick pop on their avatar, and a line if it touches an item I have ---- */
  const seen = useRef<Set<string> | null>(null);
  const [arrived, setArrived] = useState<Record<string, number>>({});
  useEffect(() => {
    const now = new Set(view.claims.map((c) => `${c.itemId}:${c.participantId}`));
    const before = seen.current;
    seen.current = now;
    if (!before) return;
    const fresh = view.claims.filter((c) => !before.has(`${c.itemId}:${c.participantId}`) && c.participantId !== me.id);
    if (!fresh.length) return;
    setArrived((a) => ({ ...a, ...Object.fromEntries(fresh.map((c) => [`${c.itemId}:${c.participantId}`, Date.now()])) }));
    const mineHit = fresh.find((c) => view.claims.some((x) => x.itemId === c.itemId && x.participantId === me.id));
    if (mineHit) {
      const it = view.items.find((i) => i.id === mineHit.itemId)!;
      const n = view.claims.filter((x) => x.itemId === it.id).length;
      say(`${view.participants.find((p) => p.id === mineHit.participantId)?.name} also called dibs on ${it.name}. Split ${n} ways.`);
    }
    const t = setTimeout(() => setArrived({}), 600);
    return () => clearTimeout(t);
  }, [view.claims, view.items, view.participants, me.id, say]);

  /* ---- actions ---- */
  const link = `${origin}/b/${code}`;
  async function nudge(msg: string) {
    const ok = await copyText(link);
    say(ok ? msg : "Could not copy the link");
  }
  async function leftovers(mode: "take" | "split") {
    const r = await claimLeftoversAction(code, mode);
    if (!r.ok) return say(r.error);
    await refresh();
    say(mode === "take" ? "You took the leftovers" : "Leftovers split equally");
  }
  async function lock(on: boolean) {
    const r = await lockClaimsAction(code, on);
    if (!r.ok) return say(r.error);
    await refresh();
    say(on ? "Claims locked. Friends can pay now." : "Claims are open again");
  }

  const waiting = Object.keys(stuck).length > 0;
  const hasPayments = !!view.ledger?.rows.some((r) => r.payments.some((p) => p.status !== "rejected"));
  const sub = (id: string, qty: number, price: number) => {
    const w = holders(id);
    const q = qty > 1 ? `${qty} × ${formatINR(Math.round(price / qty))} · ` : "";
    if (!w.length) return q + "Up for grabs";
    const mineHere = w.includes(me.id);
    if (w.length === 1) return q + (mineHere ? "You have dibs" : `${nameOf(w[0])} has it`);
    return `${q}Split ${w.length} ways · ${w.map(nameOf).join(", ")}`;
  };

  const final = isHost ? locked : allClaimed;
  const chip =
    !isHost && mine.total <= 0 && !waiting ? null : waiting ? (
      <span className="chip prov">Waiting to sync</span>
    ) : final ? (
      <span className="chip fin"><Check />Final · everything is claimed</span>
    ) : (
      <span className="chip prov"><Info />Provisional · your share can drop</span>
    );
  const tax = mine.total - mine.subtotal;
  const canPay = !isHost && allClaimed && mine.total > 0 && !waiting && !offline;
  const why = isHost
    ? locked
      ? ""
      : unclaimed.length
        ? `${unclaimed.length} item${unclaimed.length > 1 ? "s are" : " is"} still up for grabs`
        : ""
    : waiting || offline
      ? "Reconnect to pay"
      : mine.total <= 0
        ? "Tap what you ate first"
        : !allClaimed
          ? `${unclaimed.length} item${unclaimed.length > 1 ? "s are" : " is"} still up for grabs.`
          : "";

  return (
    <div className="page s-claim">
      <div className="scr">
        <div className="appbar">
          <span className="lockup"><Lockup /></span>
          <span style={{ display: "flex" }}>
            {isHost ? (
              <>
                <Link className="icon-btn" href={`/b/${code}/share`} aria-label="Share the link"><Share /></Link>
                <Link className="icon-btn" href={`/b/${code}/settle`} aria-label="Who has paid"><List /></Link>
                <Link className="icon-btn" href="/settings" aria-label="Settings"><Gear /></Link>
              </>
            ) : (
              <>
                <button className="icon-btn" type="button" aria-label="Invite friends" onClick={() => void nudge("Invite link copied")}><Share /></button>
                <Link className="icon-btn" href={`/settings?as=guest`} aria-label="Settings"><Gear /></Link>
              </>
            )}
          </span>
        </div>
        <div className="mh">
          <div className="row1">
            <div>
              <div className="name">{view.merchant}</div>
              <div className="sub">Paid by {view.hostName}{view.sharedAt ? ` · ${new Date(view.sharedAt).toLocaleString("en-IN", { weekday: undefined, hour: "numeric", minute: "2-digit", hour12: true })}` : ""}</div>
            </div>
            <div className="tot"><span className="c">₹</span>{formatNum(view.total)}</div>
          </div>
          <div className="who-row">
            <div className="avs">
              {view.participants.map((p) => <i key={p.id} className={`av ${color(p.id)}`}>{p.name.charAt(0).toUpperCase()}</i>)}
            </div>
            <span className="sub" style={{ font: "500 11px var(--font-mono)", color: "var(--color-text-muted)" }}>{view.participants.length} here · {isHost ? "you are the host" : `host: ${view.hostName}`}</span>
          </div>
        </div>
        <div className="prog">
          <div className="t"><span>{claimedCount} of {view.items.length} items claimed</span><span>{view.items.length ? Math.round((claimedCount / view.items.length) * 100) : 0}%</span></div>
          <div className="b"><i style={{ transform: `scaleX(${view.items.length ? claimedCount / view.items.length : 0})`, transition: "transform var(--dur-toast) var(--ease-out)" }} /></div>
        </div>
        <div data-k="notes">
          {offline || waiting ? (
            <div className="note2 warn" role="status">
              <Offline />
              <div>
                <b>You&rsquo;re offline.</b> Taps are saved and sync when you reconnect.
                <div style={{ marginTop: 6 }}>
                  <button className="link" type="button" style={{ color: "var(--color-warn)", minHeight: 36, margin: 0 }} onClick={() => { void refresh(); void flush(); }}>Retry now</button>
                </div>
              </div>
            </div>
          ) : claims.every((c) => c.participantId !== me.id) && !isHost ? (
            <div className="note2"><span className="dot" /><div><b>Tap what you ate.</b> Shared items split on their own.</div></div>
          ) : null}
        </div>
        {isHost ? (
          <div data-k="host">
            {locked ? (
              <div className="hostbox">
                <div className="t"><b>Claims are locked.</b> Everyone&rsquo;s share is final and friends can pay.</div>
              </div>
            ) : unclaimed.length ? (
              <div className="hostbox">
                <div className="lo">
                  <span className="t"><b>{unclaimed.length} unclaimed</b></span>
                  <button className="link ico" type="button" aria-expanded={showLeft} aria-label={showLeft ? "Hide unclaimed items" : "Show unclaimed items"} title="Which items?" onClick={() => setShowLeft((v) => !v)}>
                    <Info />
                  </button>
                </div>
                {showLeft ? <div className="t">{unclaimed.map((i) => i.name).join(", ")}</div> : null}
                {showLeft ? (
                  <div className="two">
                    <button className="btn sec" type="button" style={{ minHeight: 44, padding: "0 10px" }} onClick={() => void leftovers("take")}>Take them</button>
                    <button className="btn sec" type="button" style={{ minHeight: 44, padding: "0 10px" }} onClick={() => void leftovers("split")}>Split equally</button>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="hostbox"><div className="t"><b>Everything is claimed.</b> Lock claims to make shares final.</div></div>
            )}
            {!locked && !view.locked ? (
              <Link className="link" href={`/b/${code}/check`} style={{ margin: "0 20px 6px", justifySelf: "start", display: "inline-flex" }}>Fix a mistake on the bill</Link>
            ) : null}
          </div>
        ) : null}
        <div className="items">
          {view.items.map((it) => {
            const w = holders(it.id);
            const mineHere = w.includes(me.id);
            const cat = categoryOf(it.name);
            const isPend = !!stuck[it.id];
            return (
              <button key={it.id} className={`it${w.length ? "" : " open"}${isPend ? " pend" : ""}`} type="button" aria-pressed={mineHere} onClick={() => tap(it.id)}>
                <span className="sync" />
                <span className="flash" />
                <span className={`tile ${TILE[cat]}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={IC[cat]} /></svg>
                </span>
                <span className="tx">
                  <span className="nm">{it.name}{it.qty > 1 ? ` ×${it.qty}` : ""}</span>
                  <span className="sub">{sub(it.id, it.qty, it.price)}</span>
                </span>
                <span className="rt">
                  <span className="p">{formatINR(it.price)}</span>
                  <span className="who">
                    {order.filter((id) => w.includes(id)).map((id) => (
                      <i key={id} className={`av ${color(id)}${arrived[`${it.id}:${id}`] ? " pop" : ""}`}>
                        {nameOf(id) === "you" ? me.name.charAt(0).toUpperCase() : nameOf(id).charAt(0).toUpperCase()}
                      </i>
                    ))}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        <div className="dock">
          {chip}
          <div className="amtrow">
            <div>
              <span className="l">Your share</span>
              <small>items {formatINR(mine.subtotal)} + tax &amp; service {formatINR(tax)}</small>
            </div>
            <span className="amt"><span className="c">₹</span><span key={mine.total} className="swap" data-k="amtv">{formatNum(mine.total)}</span></span>
          </div>
          {isHost ? (
            locked ? (
              <button className="btn sec cam" type="button" disabled={hasPayments || offline} onClick={() => void lock(false)}>
                {hasPayments ? <Lock /> : <Unlock />}
                {hasPayments ? "Claims locked · payments started" : "Reopen claims"}
              </button>
            ) : (
              <button className="btn" type="button" disabled={!allClaimed || offline} onClick={() => void lock(true)}>
                Lock claims
              </button>
            )
          ) : myPaid ? (
            <Link className="btn" href={`/b/${code}/pay`}>Payment status</Link>
          ) : canPay ? (
            <Link className="btn" href={`/b/${code}/pay`}>Pay {view.hostName} · {formatINR(mine.total)}</Link>
          ) : (
            <button className="btn" type="button" disabled>Pay {view.hostName}</button>
          )}
          {why ? (
            <p className="why">
              {why}
              {!isHost && !allClaimed && mine.total > 0 && !offline && !waiting ? (
                <button className="link" type="button" style={{ minHeight: 36, margin: "0 0 0 4px" }} onClick={() => void nudge("Link copied. Send it to the group.")}>Nudge the group</button>
              ) : null}
            </p>
          ) : null}
        </div>
      </div>
      {toast}
    </div>
  );
}
