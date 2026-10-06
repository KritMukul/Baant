"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { scanBill } from "./actions";
import { Camera, Check, Gear, Lockup, Warn } from "@/ui/icons";
import { prepareImage } from "@/ui/image";
import { loadProfile, saveProfile } from "@/ui/profile";
import { firstName } from "@/lib/names";
import { isValidVpa } from "@/lib/upi";
import { useToast } from "@/ui/hooks";

interface Photo {
  blob: Blob;
  thumb: string | null;
  name: string;
  bytes: number;
  when: string;
}
type Phase = "idle" | "scanning" | "error";

const when = (ms: number) => {
  const d = new Date(ms);
  const same = d.toDateString() === new Date().toDateString();
  return same ? d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }).replace(" ", " ") : d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};
const size = (b: number) => (b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

export default function HomeScreen() {
  const router = useRouter();
  const [toast, say] = useToast();
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [name, setName] = useState("");
  const [vpa, setVpa] = useState("");
  const [touched, setTouched] = useState({ name: false, vpa: false });
  const [returning, setReturning] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const cancelled = useRef(false);
  const camera = useRef<HTMLInputElement>(null);
  const gallery = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const p = loadProfile();
    if (p) {
      setName(p.name);
      setVpa(p.upi);
      setReturning(firstName(p.name) || null);
    }
  }, []);

  const nameOk = name.trim().length > 0;
  const vpaOk = isValidVpa(vpa.trim());
  const can = !!photo && nameOk && vpaOk;
  const nErr = touched.name && !nameOk;
  const vErr = touched.vpa && !vpaOk;
  const why = can ? "" : !photo ? "Add a photo of the bill to continue" : !nameOk ? "Enter your name to continue" : "Check your UPI ID to continue";

  async function picked(f: File | undefined) {
    if (!f) return;
    const p = await prepareImage(f);
    setPhoto({ blob: p.blob, thumb: p.thumb, name: f.name || "bill.jpg", bytes: p.blob.size, when: when(f.lastModified || Date.now()) });
    setError("");
    setPhase("idle");
  }

  async function start() {
    if (!photo || !can) return;
    cancelled.current = false;
    setPhase("scanning");
    setStep(1);
    const t = setTimeout(() => setStep(2), 1600);
    const fd = new FormData();
    fd.set("bill", new File([photo.blob], "bill.jpg", { type: photo.blob.type || "image/jpeg" }));
    fd.set("name", name.trim());
    fd.set("vpa", vpa.trim());
    if (photo.thumb) fd.set("thumb", photo.thumb);
    try {
      const r = await scanBill(fd);
      clearTimeout(t);
      if (cancelled.current) return;
      if (r.ok) {
        saveProfile({ name: name.trim(), upi: vpa.trim() });
        setStep(3);
        router.push(`/b/${r.code}/check`);
      } else {
        setError(r.error);
        setPhase("error");
      }
    } catch {
      clearTimeout(t);
      if (cancelled.current) return;
      setError("We couldn't reach the server. Check your connection and try again.");
      setPhase("error");
    }
  }

  const appbar = (
    <div className="appbar">
      <span className="lockup">
        <Lockup />
      </span>
      <Link className="icon-btn" href="/settings" aria-label="Settings">
        <Gear />
      </Link>
    </div>
  );

  const files = (
    <>
      <input ref={camera} type="file" accept="image/*" capture="environment" hidden onChange={(e) => void picked(e.target.files?.[0])} />
      <input ref={gallery} type="file" accept="image/*" hidden onChange={(e) => void picked(e.target.files?.[0])} />
    </>
  );

  return (
    <div className="page s-home">
      <div className="scr">
        {files}
        {phase === "scanning" ? (
          <>
            {appbar}
            <div className="hero">
              <div className="eyebrow">Reading</div>
              <h1>Reading your bill…</h1>
              <p>Usually 5 to 15 seconds. Keep this open.</p>
            </div>
            <div className="scan">
              <div className="thumb">{photo?.thumb ? <img src={photo.thumb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}</div>
              <span className="line" />
            </div>
            <div className="steps" aria-live="polite">
              {["Photo uploaded", "Reading items", "Checking the total"].map((t, i) => (
                <div key={t} className={`step ${i < step ? "done" : i === step ? "on" : ""}`}>
                  <span className="dot">
                    <Check />
                  </span>
                  <span>{t}</span>
                </div>
              ))}
            </div>
            <div className="sk" aria-hidden="true">
              {[[54, 16], [38, 14], [62, 16]].map((r, i) => (
                <div key={i} className="skr">
                  <i style={{ width: `${r[0]}%` }} />
                  <i style={{ width: `${r[1]}%` }} />
                </div>
              ))}
            </div>
            <div className="spacer" />
            <div className="cta">
              <button
                className="btn sec"
                type="button"
                onClick={() => {
                  cancelled.current = true;
                  setPhase("idle");
                }}
              >
                Cancel
              </button>
            </div>
          </>
        ) : phase === "error" ? (
          <>
            {appbar}
            <div className="hero">
              <div className="eyebrow">Couldn&rsquo;t read it</div>
              <h1>Couldn&rsquo;t read this bill.</h1>
              <p>Try again with the whole bill in frame and good light.</p>
            </div>
            <div className="errb" role="alert">
              <Warn />
              <div>
                <b>That didn&rsquo;t work</b>
                <span>{error} Nothing was saved.</span>
              </div>
            </div>
            <div className="tips">
              <div className="tip"><i>▭</i>Lay the bill flat on the table</div>
              <div className="tip"><i>⛶</i>Fit all four corners in the frame</div>
              <div className="tip"><i>☀</i>Use daylight or turn the flash on</div>
            </div>
            <div className="spacer" />
            <div className="cta">
              <div className="btns">
                <button className="btn" type="button" onClick={() => { setPhoto(null); setPhase("idle"); camera.current?.click(); }}>
                  Retake photo
                </button>
                <button className="btn sec" type="button" style={{ minHeight: 48 }} onClick={() => { setPhase("idle"); gallery.current?.click(); }}>
                  Choose from gallery
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {appbar}
            <div className="hero">
              <div className="eyebrow">{returning ? `Welcome back, ${returning}` : "New bill"}</div>
              <h1>Call dibs on what you ate.</h1>
              <p>Photograph the bill. Share the link. Everyone taps their items and pays you by UPI.</p>
            </div>
            {photo ? (
              <div className="capture has">
                <div className="thumb">{photo.thumb ? <img src={photo.thumb} alt="Your bill" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}</div>
                <div className="fi">
                  <span className="n">{photo.name.length > 22 ? photo.name.slice(0, 19) + "…" : photo.name} · {size(photo.bytes)}</span>
                  <span className="d">Photographed {photo.when}</span>
                  <button className="link" type="button" onClick={() => setPhoto(null)}>Retake</button>
                </div>
              </div>
            ) : (
              <div className="capture">
                <svg className="ico" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                  <path d="M12 6h24v36l-4-3.5-4 3.5-4-3.5-4 3.5-4-3.5-4 3.5z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
                  <path d="M18 16h12M18 23h12M18 30h7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                </svg>
                <div className="t">Add the bill</div>
                <button className="btn cam" type="button" onClick={() => camera.current?.click()}>
                  <Camera />
                  Photograph the bill
                </button>
                <button className="link" type="button" onClick={() => gallery.current?.click()}>or choose from gallery</button>
              </div>
            )}
            <div className="fields">
              <div className={`f${nErr ? " err" : ""}`}>
                <label htmlFor="home-name">Your name</label>
                <div className="w">
                  <input id="home-name" name="name" autoComplete="name" placeholder="Aarav Mehta" value={name} aria-invalid={nErr || undefined} aria-describedby="home-name-h" onChange={(e) => setName(e.target.value)} onBlur={() => setTouched((t) => ({ ...t, name: true }))} />
                  <span className={`ok${nameOk ? " on" : ""}`}><Check /></span>
                </div>
                <div className="h" id="home-name-h">{nErr ? "Enter your name" : ""}</div>
              </div>
              <div className={`f${vErr ? " err" : ""}`}>
                <label htmlFor="home-upi">Your UPI ID</label>
                <div className="w">
                  <input id="home-upi" name="upi" inputMode="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} autoComplete="off" placeholder="name@okaxis" value={vpa} aria-invalid={vErr || undefined} aria-describedby="home-upi-h" onChange={(e) => setVpa(e.target.value)} onBlur={() => setTouched((t) => ({ ...t, vpa: true }))} />
                  <span className={`ok${vpaOk ? " on" : ""}`}><Check /></span>
                </div>
                <div className="h" id="home-upi-h">{vErr ? (vpa.trim() ? "That UPI ID doesn't look right (for example name@okaxis)" : "Enter your UPI ID") : "Friends pay this ID. Dibs never touches the money."}</div>
              </div>
            </div>
            <div className="spacer" />
            <div className="cta">
              <p className={`why${can ? " hid" : ""}`}>{why}</p>
              <button className="btn" type="button" disabled={!can} onClick={() => void start()}>Scan the bill</button>
              <p className={`fine${can ? "" : " hid"}`}>No signup. Friends join with a link.</p>
            </div>
          </>
        )}
      </div>
      {toast}
    </div>
  );
}
