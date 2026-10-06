"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { markPaidAction, readShotAction, undoPaidAction, type ShotResult } from "@/app/actions";
import { allocate, formatINR, formatNum } from "@/lib/money";
import type { ShotRead } from "@/lib/model";
import { upiLink } from "@/lib/upi";
import { Back, Camera, Check, Clock, Warn, X } from "@/ui/icons";
import { copyText } from "@/ui/clipboard";
import { useLive, useToast } from "@/ui/hooks";
import { prepareImage } from "@/ui/image";
import { Sheet } from "@/ui/overlays";
import type { BillView } from "@/server/service";

type Phase = "base" | "sheet" | "proof" | "checking" | "result" | "fallback";
const FRAC = ["", "", "½", "⅓", "¼", "⅕", "⅙"];
const time = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }) : "");

export default function PayScreen({ code, initial }: { code: string; initial: BillView }) {
  const { view, refresh } = useLive(code, initial);
  const [toast, say] = useToast();
  const id = useId();
  const [phase, setPhase] = useState<Phase>("base");
  const [utr, setUtr] = useState("");
  const [touched, setTouched] = useState(false);
  const [shot, setShot] = useState<{ read: ShotRead; result: ShotResult; thumb: string | null } | null>(null);
  const [pickedThumb, setPickedThumb] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const picker = useRef<HTMLInputElement>(null);
  const left = useRef(false);

  const me = view.me!;
  const mp = view.myPay!;
  const pay = mp.pay;
  const host = view.hostName;
  const vpa = view.payerVpa ?? "";
  const amount = pay.remaining > 0 ? pay.remaining : pay.owed;
  const base = pay.state === "confirmed" ? "done" : pay.state === "says" ? "waiting" : "ready";
  const href = useMemo(() => upiLink({ vpa, name: view.hostFullName, amount, note: mp.note }), [vpa, view.hostFullName, amount, mp.note]);

  /* what I owe, item by item */
  const lines = useMemo(() => {
    return view.items
      .map((it) => {
        const who = [...new Set(view.claims.filter((c) => c.itemId === it.id).map((c) => c.participantId))].sort();
        if (!who.includes(me.id)) return null;
        const parts = allocate(it.price, who.map(() => 1));
        return { name: `${it.name}${it.qty > 1 ? ` ×${it.qty}` : ""}${who.length > 1 ? ` (${FRAC[who.length] ?? `1/${who.length}`})` : ""}`, amount: parts[who.indexOf(me.id)] };
      })
      .filter((x): x is { name: string; amount: number } => !!x);
  }, [view.items, view.claims, view.participants, me.id]);
  const mine = view.shares[me.id];
  const extras = mine ? mine.total - mine.subtotal : 0;

  /* ---- the hand-off to the UPI app ---- */
  const launch = useCallback(
    (url: string) => {
      left.current = false;
      window.location.href = url;
      setTimeout(() => {
        if (!left.current) setPhase("fallback"); // nothing opened: the page never lost focus
      }, 2000);
    },
    [],
  );
  const goUpi = useCallback(() => launch(href), [launch, href]);

  useEffect(() => {
    const hide = () => {
      left.current = true;
    };
    const show = () => {
      if (document.visibilityState === "visible" && left.current) {
        left.current = false;
        setPhase((p) => (p === "base" || p === "fallback" ? "sheet" : p));
      }
    };
    const vis = () => (document.visibilityState === "hidden" ? hide() : show());
    document.addEventListener("visibilitychange", vis);
    window.addEventListener("pagehide", hide);
    return () => {
      document.removeEventListener("visibilitychange", vis);
      window.removeEventListener("pagehide", hide);
    };
  }, []);

  const copy = async (what: string, text: string) => say((await copyText(text)) ? `${what} copied` : `Could not copy ${what.toLowerCase()}`);
  const utrDigits = utr.replace(/\D/g, "");
  const utrOk = utrDigits.length === 12;
  const utrErr = touched && !!utr && !utrOk;

  async function send(opts: { amount?: number; keepShot?: boolean } = {}) {
    setBusy(true);
    const r = await markPaidAction(code, { utr: utrOk ? utrDigits : undefined, shot: shot?.read ?? null, amount: opts.amount });
    setBusy(false);
    if (!r.ok) return say(r.error);
    await refresh();
    setPhase("base");
    setShot(null);
    setUtr("");
    setTouched(false);
  }

  async function choose(f: File | undefined) {
    if (!f) return;
    setPhase("checking");
    const p = await prepareImage(f);
    setPickedThumb(p.thumb);
    const fd = new FormData();
    fd.set("shot", new File([p.blob], "payment.jpg", { type: p.blob.type || "image/jpeg" }));
    if (utrOk) fd.set("utr", utrDigits);
    const r = await readShotAction(code, fd);
    if (!r.ok) {
      say(r.error);
      setPhase("proof");
      return;
    }
    setShot({ read: r.result.shot, result: r.result, thumb: p.thumb });
    setPhase("result");
  }

  const appbar = (title: string, back?: () => void) => (
    <div className="appbar">
      {back ? (
        <button className="icon-btn" type="button" aria-label="Back" onClick={back}><Back /></button>
      ) : (
        <Link className="icon-btn" href={`/b/${code}`} aria-label="Back to the claim board"><Back /></Link>
      )}
      <span className="ttl">{title}</span>
      <span style={{ width: 44 }} />
    </div>
  );

  /* ---------------------------------------------------------------- views */
  let body: React.ReactNode;

  if (phase === "proof") {
    body = (
      <>
        {appbar(`Tell ${host}`, () => setPhase("base"))}
        <div className="body">
          <div className="hd"><h1>Tell {host} you&rsquo;ve paid</h1><p>Add proof so {host} can confirm faster. Optional, but it helps.</p></div>
          <div className={`f${utrErr ? " err" : ""}`}>
            <label htmlFor={`${id}u`}>UPI reference (UTR)</label>
            <div className="w">
              <input id={`${id}u`} inputMode="numeric" autoComplete="off" placeholder="12-digit number" value={utr} aria-invalid={utrErr || undefined} onChange={(e) => setUtr(e.target.value)} onBlur={() => setTouched(true)} />
              <span className={`ok${utrOk ? " on" : ""}`}><Check /></span>
            </div>
            <div className="h">{utrErr ? "A UTR has 12 digits" : "Find it in your UPI app, under payment details."}</div>
          </div>
          <div className="shotz">
            <div className="t">Add a screenshot of the payment</div>
            <div className="s">Dibs reads the amount, payee and time for you.</div>
            <button className="btn sec" type="button" style={{ minHeight: 44, padding: "0 18px", gap: 8 }} onClick={() => picker.current?.click()}>
              <Camera style={{ width: 18, height: 18 }} />Choose screenshot
            </button>
          </div>
          <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-muted)" }}>Proof helps, it does not decide. {host} confirms in his bank app.</p>
        </div>
        <div className="dock">
          <button className="btn" type="button" disabled={busy || (!!utr && !utrOk)} onClick={() => void send()}>Tell {host} I&rsquo;ve paid</button>
          <button className="link c" type="button" disabled={busy} onClick={() => void send()}>{utr ? "Send without more proof" : "Skip proof"}</button>
        </div>
      </>
    );
  } else if (phase === "checking") {
    body = (
      <>
        {appbar("Checking", () => setPhase("proof"))}
        <div className="body">
          <div className="hd"><h1>Reading your screenshot…</h1><p>Usually a few seconds.</p></div>
          <div className="shotrow">
            <div className="thumb scan">{pickedThumb ? <img src={pickedThumb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}<span className="line" /></div>
            <div className="chk" style={{ width: "100%" }}>
              {["Amount", "Paid to", "Status and time"].map((t) => <div key={t} className="r"><span className="i wt" /><span>{t}</span><span /></div>)}
            </div>
          </div>
        </div>
        <div className="dock"><button className="btn sec" type="button" onClick={() => setPhase("proof")}>Cancel</button></div>
      </>
    );
  } else if (phase === "result" && shot) {
    const j = shot.result.judgement;
    const owedNow = shot.result.expected;
    const missing = j.amount === "short" ? -j.diff : 0;
    const a = shot.read.amount;
    const row = (state: "ok" | "no" | "wt", label: string, value: string, small?: string) => (
      <div className={`r${state === "no" ? " bad" : ""}`}>
        <span className={`i ${state}`}>{state === "ok" ? <Check /> : state === "no" ? <X /> : null}</span>
        <span>{label}</span>
        <span className="v">{value}{small ? <small>{small}</small> : null}</span>
      </div>
    );
    body = (
      <>
        {appbar("Screenshot", () => setPhase("proof"))}
        <div className="body">
          <div className="hd"><h1>{j.ok ? "Looks right" : j.amount === "short" ? "That’s not the full amount" : "Check this screenshot"}</h1></div>
          {j.ok ? (
            <div className="note2 good"><Check /><div><b>Everything we can check matches.</b>{host} still confirms in his bank app.</div></div>
          ) : (
            <div className="note2 warn" role="alert">
              <Warn />
              <div>
                {j.amount === "short" ? (
                  <><b>The screenshot shows {formatINR(a ?? 0)}, not {formatINR(owedNow)}.</b>You may have paid part of it. The missing {formatINR(owedNow - (a ?? 0))} is still owed.</>
                ) : j.amount === "over" ? (
                  <><b>The screenshot shows {formatINR(a ?? 0)}, more than the {formatINR(owedNow)} you owe.</b>{host} will check.</>
                ) : j.status === "failed" || j.status === "pending" ? (
                  <><b>This doesn’t show a successful payment.</b>If you did pay, send it anyway and {host} will check.</>
                ) : j.payee === "differs" ? (
                  <><b>The screenshot shows a different payee.</b>Make sure you paid {view.hostFullName}.</>
                ) : (
                  <><b>We couldn’t read all of it.</b>{host} will check.</>
                )}
              </div>
            </div>
          )}
          <div className="card" style={{ padding: "4px 14px" }}>
            <div className="chk">
              {row(j.amount === "match" ? "ok" : j.amount === "unreadable" ? "wt" : "no", "Amount", a == null ? "not readable" : formatINR(a), j.amount === "match" ? "matches" : j.amount === "unreadable" ? undefined : `expected ${formatINR(owedNow)}`)}
              {row(j.payee === "match" ? "ok" : j.payee === "unreadable" ? "wt" : "no", "Paid to", shot.read.payee ?? "not readable", j.payee === "match" ? `matches ${host}` : j.payee === "differs" ? `expected ${vpa}` : undefined)}
              {row(shot.read.status === "success" ? "ok" : shot.read.status === "unknown" ? "wt" : "no", "Status", shot.read.status === "success" ? "Success" : shot.read.status === "failed" ? "Failed" : shot.read.status === "pending" ? "Pending" : "not readable")}
              {row(shot.read.paidAt ? "ok" : "wt", "Time", shot.read.paidAt ?? "not readable")}
              {row(shot.read.utr ? (j.utr === "differs" ? "no" : "ok") : "wt", "UTR", shot.read.utr ?? "not readable", shot.read.utr ? (j.utr === "match" ? "matches what you typed" : j.utr === "differs" ? "differs from what you typed" : "read from screenshot") : undefined)}
            </div>
          </div>
        </div>
        <div className="dock">
          {j.ok ? (
            <button className="btn" type="button" disabled={busy} onClick={() => void send()}>Tell {host} I&rsquo;ve paid</button>
          ) : (
            <>
              {j.amount === "short" && missing ? (
                <button className="btn" type="button" disabled={busy} onClick={async () => { await send(); launch(upiLink({ vpa, name: view.hostFullName, amount: missing, note: mp.note })); }}>Pay the missing {formatINR(missing)}</button>
              ) : null}
              <button className="btn sec" type="button" style={{ minHeight: 48 }} onClick={() => { setShot(null); picker.current?.click(); }}>Try another screenshot</button>
              <button className="link c" type="button" disabled={busy} onClick={() => void send()}>Send anyway. {host} will check.</button>
            </>
          )}
        </div>
      </>
    );
  } else if (phase === "fallback") {
    body = (
      <>
        {appbar(`Pay ${host}`, () => setPhase("base"))}
        <div className="body">
          <div className="amtblock"><div className="eyebrow">You owe {host}</div><div className="big"><span className="c">₹</span>{formatNum(amount)}</div></div>
          <div className="note2 warn" role="alert"><Warn /><div><b>No UPI app opened.</b>On some phones the link needs an app that is not installed. Copy the details and pay from your UPI app.</div></div>
          <div className="card" style={{ padding: "4px 14px" }}>
            <div className="copyrow"><div><span className="l">Pay to</span><b>{vpa}</b></div><button className="link" type="button" onClick={() => void copy("UPI ID", vpa)}>Copy</button></div>
            <div className="copyrow"><div><span className="l">Amount</span><b>{(amount / 100).toFixed(2)}</b></div><button className="link" type="button" onClick={() => void copy("Amount", (amount / 100).toFixed(2))}>Copy</button></div>
            <div className="copyrow"><div><span className="l">Note</span><b>{mp.note}</b></div><button className="link" type="button" onClick={() => void copy("Note", mp.note)}>Copy</button></div>
          </div>
        </div>
        <div className="dock">
          <button className="btn" type="button" onClick={() => setPhase("proof")}>I&rsquo;ve paid</button>
          <button className="link c" type="button" onClick={goUpi}>Try the UPI button again</button>
        </div>
      </>
    );
  } else if (base === "done") {
    const last = mp.payments.filter((p) => p.status === "confirmed").at(-1);
    body = (
      <>
        {appbar("Paid")}
        <div className="body">
          <div className="big2">
            <div className="badge"><Check /><span className="ring" /></div>
            <span className="chip fin"><Check />Confirmed by {host}</span>
            <h1>Paid and confirmed</h1>
            <p>{host} confirmed {formatINR(pay.confirmed)}{last?.decidedAt ? ` at ${time(last.decidedAt)}` : ""}.</p>
          </div>
          <div className="card brk">
            <div className="r"><span>Bill</span><span>{view.merchant}</span></div>
            <div className="r"><span>Amount</span><span>{formatNum(pay.confirmed)}</span></div>
            <div className="r"><span>Reference</span><span>{mp.note}</span></div>
          </div>
        </div>
        <div className="dock"><Link className="btn" href={`/b/${code}`}>Back to the bill</Link></div>
      </>
    );
  } else if (base === "waiting") {
    const first = mp.payments.filter((p) => p.status === "says").at(-1);
    const wa = `https://wa.me/?text=${encodeURIComponent(`Hi ${host}, I paid ${formatINR(pay.says)} for ${view.merchant} (${mp.note}). Can you check?`)}`;
    body = (
      <>
        {appbar("Sent")}
        <div className="body">
          <div className="big2">
            <div className="badge wait"><Clock style={{ width: 34, height: 34 }} /></div>
            <span className="chip wait">Says paid</span>
            <h1>Sent to {host}</h1>
            <p>{host} will confirm when he sees {formatINR(pay.says)} in his bank app.</p>
          </div>
          {pay.short ? (
            <div className="note2 warn" role="status"><Warn /><div><b>{formatINR(pay.remaining)} is still owed.</b>You sent {formatINR(pay.says + pay.confirmed)} of {formatINR(pay.owed)}.</div></div>
          ) : null}
          <div className="card">
            <div className="tl">
              <div className="s done"><span className="d"><Check /></span><div><b>You paid {formatINR(pay.says)}</b><span className="t">{time(first?.createdAt)} · {mp.note}</span></div></div>
              <div className="s now"><span className="d" /><div><b>{host} confirms</b><span className="t">Waiting · usually within a few minutes</span></div></div>
            </div>
          </div>
          <div className="card brk">
            <div className="r"><span>UTR</span><span>{first?.utr ?? "not added"}</span></div>
            <div className="r"><span>Screenshot</span><span>{first?.shot ? (first.shot.amount === first.said ? "amount matched" : "amount mismatch") : "not added"}</span></div>
          </div>
        </div>
        <div className="dock">
          {pay.short ? <button className="btn" type="button" onClick={goUpi}>Pay the missing {formatINR(pay.remaining)}</button> : null}
          <a className="btn sec" href={wa} target="_blank" rel="noopener" style={{ minHeight: 48 }}>Nudge {host}</a>
          <button className="link c warn" type="button" onClick={async () => { await undoPaidAction(code); await refresh(); say("Okay, that's undone"); }}>I didn&rsquo;t pay</button>
        </div>
      </>
    );
  } else {
    body = (
      <>
        {appbar(`Pay ${host}`)}
        <div className="body">
          <div className="amtblock">
            <div className="eyebrow">You owe {host}</div>
            <div className="big"><span className="c">₹</span>{formatNum(amount)}</div>
            <span className="chip fin"><Check />Final · everything is claimed</span>
          </div>
          {pay.rejected ? (
            <div className="note2 warn" role="alert"><Warn /><div><b>{host} didn’t see your payment.</b>If you did pay, check the details with {host}, then tell him again.</div></div>
          ) : null}
          <div className="card brk">
            {lines.map((l, i) => <div key={i} className="r"><span>{l.name}</span><span>{formatNum(l.amount)}</span></div>)}
            <div className="r"><span>Tax &amp; service</span><span>{formatNum(extras)}</span></div>
            <div className="r t"><span>Total</span><span>{formatNum(pay.owed)}</span></div>
          </div>
          <div className="card payee">
            <i className="av f1">{host.charAt(0).toUpperCase()}</i>
            <div><b>{view.hostFullName}</b><span className="m">{vpa}</span></div>
            <button className="link" type="button" onClick={() => void copy("UPI ID", vpa)}>Copy</button>
          </div>
          <div className="card ref">
            <div><span className="l">Reference code</span><b>{mp.note}</b></div>
            <button className="link" type="button" onClick={() => void copy("Reference code", mp.note)}>Copy</button>
            <p>Sent as the payment note, so {host} can match it in his bank app.</p>
          </div>
        </div>
        <div className="dock">
          <button className="btn" type="button" onClick={goUpi}>Pay {formatINR(amount)} with UPI</button>
          <button className="link c" type="button" onClick={() => setPhase("proof")}>I already paid</button>
          <p className="fine">Opens GPay, PhonePe, Paytm or any UPI app. No fees.</p>
        </div>
      </>
    );
  }

  return (
    <div className="page s-b">
      <div className="scr">
        <input ref={picker} type="file" accept="image/*" hidden onChange={(e) => { void choose(e.target.files?.[0]); e.target.value = ""; }} />
        {body}
      </div>
      <Sheet open={phase === "sheet"} onClose={() => setPhase("base")} label="Did the payment go through">
        <h2>Did the payment go through?</h2>
        <p>You were sending {formatINR(amount)} to {host}.</p>
        <div className="stack" style={{ marginTop: 6 }}>
          <button className="btn" type="button" onClick={() => setPhase("proof")}>Yes, I&rsquo;ve paid</button>
          <button className="btn sec" type="button" style={{ minHeight: 48 }} onClick={goUpi}>No, try again</button>
          <button className="link c" type="button" onClick={() => setPhase("base")}>Not yet</button>
        </div>
      </Sheet>
      {toast}
    </div>
  );
}
