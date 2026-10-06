"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { joinAction } from "@/app/actions";
import { formatINR } from "@/lib/money";
import { whoText, MAX_NAME } from "@/lib/names";
import { Mark } from "@/ui/icons";
import { useToast } from "@/ui/hooks";
import type { BillView } from "@/server/service";

const AV = ["f1", "f2", "f3"];
const HELP = "Friends see this next to your picks.";

export default function JoinScreen({ code, view }: { code: string; view: BillView }) {
  const router = useRouter();
  const [toast, say] = useToast();
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [taken, setTaken] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  const friends = view.participants.filter((p) => !p.isHost);
  const bad = !!err || !!taken;

  async function go(takeover: boolean) {
    setJoining(true);
    const r = await joinAction(code, name, takeover);
    if (r.ok) {
      say(`${r.back ? "Welcome back" : "You’re in"}, ${r.name}`);
      router.refresh();
      return;
    }
    setJoining(false);
    if (r.code === "taken" && "takenName" in r) setTaken(r.takenName as string);
    else if (r.code === "not_found" || r.code === "closed") router.refresh();
    else {
      setErr(r.error);
      input.current?.focus();
    }
  }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (joining || taken) return;
    setErr(null);
    setTaken(null);
    void go(false);
  }

  return (
    <div className="page s-b">
      <div className="scr">
        <div className="appbar">
          <span className="brand"><Mark />Dibs</span>
        </div>
        <div className="body">
          <div className="jh">
            <span className="eyebrow">{view.hostName} invited you</span>
            <h1 className="sh1">Pick what you had.</h1>
            <p className="ssub">Tell us your name, tap your items, then pay {view.hostName} on UPI.</p>
          </div>
          <div className="bcard">
            <div className="bt">
              <div className="pthumb">{view.thumb ? <img src={view.thumb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}</div>
              <div>
                <div className="name" style={{ font: "700 17px/1.15 var(--font-ui)", letterSpacing: "-.02em" }}>{view.merchant}</div>
              </div>
              <div className="tot">{formatINR(view.total)}<small>{view.items.length} items · {view.chargeCount} charges</small></div>
            </div>
            <div className="rw">
              <i className="av host" style={{ width: 28, height: 28, fontSize: 11 }}>{view.hostName.charAt(0).toUpperCase()}</i>
              <span>Hosted by <b>{view.hostFullName}</b></span>
            </div>
            <div className="rw">
              <span className="avs" aria-hidden="true">
                {friends.slice(0, 3).map((f, i) => <i key={f.id} className={`av ${AV[i % 3]}`}>{f.name.charAt(0).toUpperCase()}</i>)}
              </span>
              <span data-k="who">{whoText(friends.map((f) => f.name))}</span>
            </div>
          </div>
          <form className="jf" id={`${id}f`} noValidate onSubmit={submit}>
            <div className={`fld${bad ? " err" : ""}`}>
              <label htmlFor={`${id}n`}>Your name</label>
              <input
                ref={input}
                className="t"
                id={`${id}n`}
                name="name"
                type="text"
                autoComplete="given-name"
                autoCapitalize="words"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="go"
                maxLength={MAX_NAME}
                placeholder="For example Neha"
                value={name}
                disabled={joining}
                aria-invalid={bad || undefined}
                aria-describedby={`${id}h`}
                onChange={(e) => {
                  setName(e.target.value);
                  setErr(null);
                  setTaken(null);
                }}
              />
              <div className="h" id={`${id}h`} aria-live="polite">{err ?? (taken ? "Already on this bill." : HELP)}</div>
            </div>
            <div aria-live="assertive">
              {taken ? (
                <div className="dupc" role="alert">
                  <div>
                    <b>{taken} is already in. Is that you?</b>
                    <span className="t">If you joined from another browser, tap “That’s me” to pick up where you left off.</span>
                  </div>
                  <div className="two">
                    <button className="btn sm" type="button" disabled={joining} onClick={() => void go(true)}>That&rsquo;s me</button>
                    <button className="btn sec sm" type="button" onClick={() => { setTaken(null); input.current?.focus(); input.current?.select(); }}>Use another name</button>
                  </div>
                </div>
              ) : null}
            </div>
          </form>
        </div>
        <div className="dock">
          {joining ? (
            <button className="btn" type="button" disabled>Joining…</button>
          ) : (
            <button className="btn" type="submit" form={`${id}f`} disabled={!!taken}>Join and pick items</button>
          )}
          <p className="fine">No sign-up. Your name is only used on this bill.</p>
        </div>
      </div>
      {toast}
    </div>
  );
}

export function DeadEnd({ kind, view }: { kind: "notfound" | "settled"; view?: BillView }) {
  const nf = kind === "notfound";
  return (
    <div className="page s-b">
      <div className="scr">
        <div className="appbar">
          <span className="brand"><Mark />Dibs</span>
        </div>
        <div className="body">
          <div className="state">
            <div className="gl" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 3.5h10v17l-2.5-1.7L12 20.5l-2.5-1.7L7 20.5z" />
                {nf ? <path d="M10.2 9.2a2 2 0 1 1 2.6 1.9c-.6.3-.8.7-.8 1.3M12 14.6v.1" /> : <path d="M9.3 11.6l1.9 1.9 3.5-3.7" />}
              </svg>
            </div>
            <h1>{nf ? "This link doesn’t work." : "This bill is settled."}</h1>
            <p>{nf ? "We couldn’t find a bill for it. Ask the host to send it again." : `${view?.merchant} · ${formatINR(view?.total ?? 0)}. Everyone has paid ${view?.hostName}, so nothing is left to pick.`}</p>
            <p className="small">{nf ? "Links are case-sensitive, so make sure the whole link was copied, including the last letters." : "If you were at the table, there is nothing left for you to do."}</p>
          </div>
        </div>
        <div className="dock">
          <Link className="btn" href="/">Split your own bill</Link>
          <p className="fine">Photograph a bill, share a link, and everyone pays their own share.</p>
        </div>
      </div>
    </div>
  );
}
