"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Back, Check, Copy, Qr, Upload, Warn } from "@/ui/icons";
import { copyText } from "@/ui/clipboard";
import { useLive, useToast } from "@/ui/hooks";
import { Sheet } from "@/ui/overlays";
import { QrCode } from "@/ui/qr";
import { formatINR } from "@/lib/money";
import type { BillView } from "@/server/service";

const AV = ["f1", "f2", "f3"];

export default function ShareScreen({ code, initial, origin }: { code: string; initial: BillView; origin: string }) {
  const { view } = useLive(code, initial);
  const [toast, say] = useToast();
  const [copied, setCopied] = useState(false);
  const [qr, setQr] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function"), []);
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  const url = `${origin}/b/${code}`;
  const shown = url.replace(/^https?:\/\//, "");
  const prefix = shown.slice(0, shown.length - code.length);
  const message = `Dibs · ${view.merchant} · ${formatINR(view.total)}\nTap what you had and pay your share:\n${url}`;
  const wa = `https://wa.me/?text=${encodeURIComponent(message)}`;

  const friends = view.participants.filter((p) => !p.isHost);
  const picks = (id: string) => view.claims.filter((c) => c.participantId === id).length;
  const picked = new Set(view.claims.map((c) => c.itemId)).size;
  const n = friends.length;
  const canEdit = n === 0 && !view.locked;

  async function copy() {
    const ok = await copyText(url);
    if (!ok) return say("Could not copy. Press and hold the link to copy it.");
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2000);
  }
  async function more() {
    try {
      await navigator.share({ title: `Dibs · ${view.merchant}`, text: `Tap what you had and pay your share:`, url });
    } catch {
      /* closed the sheet: nothing to do */
    }
  }

  return (
    <div className="page s-b">
      <div className="scr">
        <div className="appbar">
          <Link className="icon-btn" href={canEdit ? `/b/${code}/check` : `/b/${code}`} aria-label="Back">
            <Back />
          </Link>
          <span className="ttl">Share</span>
          <span style={{ width: 44 }} />
        </div>
        <div className="body">
          <div data-k="hd">
            <h1 className="sh1">{n ? `${n} ${n > 1 ? "friends are" : "friend is"} in.` : "Send it to the table."}</h1>
            <p className="ssub">{n ? "Picks show up here as they happen." : "Friends open the link, tap what they had and pay you on UPI. No sign-up."}</p>
          </div>

          {view.shortAtShare !== 0 ? (
            <div className="note2 warn">
              <Warn />
              <div>
                <b>{formatINR(Math.abs(view.shortAtShare))} {view.shortAtShare < 0 ? "short of" : "over"} the printed total</b>
                Friends will {view.shortAtShare < 0 ? "pay a little less" : "pay a little more"} than the bill. You can fix it from the board.
              </div>
            </div>
          ) : null}

          <div className={`mh2${canEdit ? " has-ed" : ""}`}>
            <div className="pthumb">{view.thumb ? <img src={view.thumb} alt="Your bill" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}</div>
            <div>
              <div className="name">{view.merchant}</div>
              <div className="sub">{formatINR(view.total)} · {view.items.length} items</div>
            </div>
            {canEdit ? <Link className="ed2" href={`/b/${code}/check`} style={{ display: "grid", alignItems: "center", textDecoration: "none" }}>Edit</Link> : null}
          </div>

          <div className="lk">
            <span className="lab">Link</span>
            <div className="url" data-k="url"><span className="d">{prefix}</span>{code}</div>
            <div className="acts" style={{ gridTemplateColumns: `repeat(${canShare ? 3 : 2},1fr)` }}>
              <button className={`act${copied ? " done" : ""}`} type="button" onClick={() => void copy()}>
                <span>{copied ? <><Check />Copied</> : <><Copy />Copy link</>}</span>
              </button>
              <button className="act" type="button" onClick={() => setQr(true)}>
                <span><Qr />Show QR</span>
              </button>
              {canShare ? (
                <button className="act" type="button" onClick={() => void more()}>
                  <span><Upload />More</span>
                </button>
              ) : null}
            </div>
            <p className="priv">Anyone with the link can see the bill and pick items. Only you can edit it or confirm payments.</p>
          </div>

          <div className="who" data-k="whobox">
            <div className="wh">
              <span className="sect">Who&rsquo;s here · <span>{n}</span></span>
              <span className="lv"><i className="ld" />Live</span>
            </div>
            {n ? (
              <>
                <div aria-live="polite">
                  {friends.map((f, i) => {
                    const c = picks(f.id);
                    return (
                      <div key={f.id} className="wr">
                        <i className={`av ${AV[i % 3]}`}>{f.name.charAt(0).toUpperCase()}</i>
                        <span>
                          <span className="nm">{f.name}</span>
                          <span className="st">{c ? `Picked ${c} item${c > 1 ? "s" : ""}` : "Opened the link"}</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="wp">
                  <div className="pk"><i style={{ transform: `scaleX(${view.items.length ? picked / view.items.length : 0})`, transition: "transform var(--dur-sheet) var(--ease-out)" }} /></div>
                  <span>{picked} of {view.items.length} items picked</span>
                </div>
              </>
            ) : (
              <div className="empty">
                <b>No one yet</b>
                <span>Friends show up here the moment they open the link.</span>
              </div>
            )}
          </div>
        </div>

        <div className="dock">
          {n ? (
            <>
              <Link className="btn" href={`/b/${code}`}>Open the board</Link>
              <a className="link c" href={wa} target="_blank" rel="noopener">Share again</a>
            </>
          ) : (
            <>
              <a className="btn" href={wa} target="_blank" rel="noopener">Send on WhatsApp</a>
              <Link className="link c" href={`/b/${code}`}>Pick your own items first</Link>
            </>
          )}
        </div>
      </div>

      <Sheet open={qr} onClose={() => setQr(false)} label="QR code">
        <h2>Scan to join</h2>
        <p>Hold your screen up. Friends point their camera at it.</p>
        <div className="qrt" data-k="qrt"><QrCode text={url} /></div>
        <p className="qrl">{shown}</p>
        <p className="priv hint">Raise your brightness if it will not scan.</p>
        <button className="btn sec" type="button" onClick={() => setQr(false)}>Done</button>
      </Sheet>
      {toast}
    </div>
  );
}
