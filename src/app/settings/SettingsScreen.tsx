"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Back, Check, Chevron } from "@/ui/icons";
import { applyTheme, readTheme, systemIsDark, type ThemePref } from "@/ui/theme";
import { clearProfile, loadProfile, saveProfile, type Profile } from "@/ui/profile";
import { Dialog } from "@/ui/overlays";
import { useToast } from "@/ui/hooks";
import { isValidVpa } from "@/lib/upi";

const PREFS: [ThemePref, string, string][] = [["light", "Light", "l"], ["dark", "Dark", "d"], ["system", "System", "s"]];
const VPA_HELP = "Friends pay this ID. Dibs never touches the money.";
const VPA_BAD = "That UPI ID doesn't look right (for example name@okaxis)";
const PAY_TXT = "Friends pay you directly in their UPI app. Dibs never holds money. UPI does not tell a website when a payment worked, so friends tap “I’ve paid” and you confirm each one in your bank app.";
const VERSION = "0.1.0";

export default function SettingsScreen({ guest }: { guest: boolean }) {
  const router = useRouter();
  const id = useId();
  const [toast, say] = useToast();
  const [pref, setPref] = useState<ThemePref>("system");
  const [sysDark, setSysDark] = useState(false);
  const [saved, setSaved] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [upi, setUpi] = useState("");
  const [tName, setTName] = useState(false);
  const [tUpi, setTUpi] = useState(false);
  const [dlg, setDlg] = useState(false);
  const [disc, setDisc] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const upiRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPref(readTheme());
    setSysDark(systemIsDark());
    const p = loadProfile();
    if (p) {
      setSaved(p);
      setName(p.name);
      setUpi(p.upi);
    }
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const on = () => setSysDark(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  function choose(p: ThemePref, focus = false) {
    setPref(p);
    applyTheme(p);
    if (focus) setTimeout(() => document.querySelector<HTMLElement>(`[data-pref="${p}"]`)?.focus(), 0);
  }
  function onKey(e: React.KeyboardEvent) {
    if (!/^Arrow(Left|Right|Up|Down)$/.test(e.key)) return;
    e.preventDefault();
    const ids = PREFS.map((x) => x[0]);
    const i = ids.indexOf(pref);
    choose(ids[(i + (e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1) + ids.length) % ids.length], true);
  }

  const nameOk = name.trim().length > 0;
  const upiOk = isValidVpa(upi.trim());
  const dirty = saved ? name.trim() !== saved.name || upi.trim().toLowerCase() !== saved.upi : name.trim() !== "" || upi.trim() !== "";
  const eN = tName && !nameOk;
  const eU = tUpi && !upiOk;

  function save(e: React.FormEvent) {
    e.preventDefault();
    setTName(true);
    setTUpi(true);
    if (!nameOk) return nameRef.current?.focus();
    if (!upiOk) return upiRef.current?.focus();
    const p = { name: name.trim(), upi: upi.trim().toLowerCase() };
    saveProfile(p);
    setSaved(p);
    setName(p.name);
    setUpi(p.upi);
    say("Saved on this phone");
  }
  function forget() {
    clearProfile();
    setSaved(null);
    setName("");
    setUpi("");
    setTName(false);
    setTUpi(false);
    setDlg(false);
    say("Forgotten on this phone");
    setTimeout(() => nameRef.current?.focus(), 0);
  }

  const help = pref === "system" ? `System follows your phone. It is ${sysDark ? "Dark" : "Light"} right now.` : pref === "light" ? "Always light." : "Always dark.";

  return (
    <div className="page s-b">
      <div className="scr">
        <div className="appbar">
          <button className="icon-btn" type="button" aria-label="Back" onClick={() => (history.length > 1 ? router.back() : router.push("/"))}><Back /></button>
          <span className="ttl">Settings</span>
          <span style={{ width: 44 }} />
        </div>
        <div className="body">
          <div className="sect2">Appearance</div>
          <div className="rad" role="radiogroup" aria-label="Appearance" onKeyDown={onKey}>
            {PREFS.map(([k, label, cls]) => (
              <button key={k} className="rc" type="button" role="radio" aria-checked={pref === k} tabIndex={pref === k ? 0 : -1} data-pref={k} onClick={() => choose(k)}>
                <span className={`sw ${cls}`}><i className="b1" /><i className="b2" /><i className="pl" /><span className="tk"><Check /></span></span>
                {label}
              </button>
            ))}
          </div>
          <p className="priv" aria-live="polite">{help}</p>

          {!guest ? (
            <>
              <div className="sect2">You as host</div>
              <form className="cardp" noValidate onSubmit={save}>
                {!saved ? <p className="first">Add your UPI ID so Dibs can fill it in for every bill.</p> : null}
                <div className={`fld${eN ? " err" : ""}`}>
                  <label htmlFor={`${id}n`}>Your name</label>
                  <input ref={nameRef} className="t" id={`${id}n`} name="name" autoComplete="name" placeholder="Aarav Mehta" value={name} aria-invalid={eN || undefined} aria-describedby={`${id}nh`} onChange={(e) => setName(e.target.value)} onBlur={() => setTName(true)} />
                  <div className="h" id={`${id}nh`}>{eN ? "Enter your name" : ""}</div>
                </div>
                <div className={`fld${eU ? " err" : ""}`}>
                  <label htmlFor={`${id}u`}>Your UPI ID</label>
                  <input ref={upiRef} id={`${id}u`} name="upi" inputMode="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} autoComplete="off" placeholder="name@okaxis" value={upi} aria-invalid={eU || undefined} aria-describedby={`${id}uh`} onChange={(e) => setUpi(e.target.value)} onBlur={() => setTUpi(true)} />
                  <div className="h" id={`${id}uh`}>{eU ? (upi.trim() ? VPA_BAD : "Enter your UPI ID") : VPA_HELP}</div>
                </div>
                <button className="btn" type="submit" disabled={!dirty}>{!dirty && saved ? "Saved" : saved ? "Save changes" : "Save details"}</button>
                <p className="priv">Saved on this phone only. Your UPI ID is shown to friends who join your bills so they can pay you. Dibs checks the format, not that the account exists, so check it twice.</p>
              </form>
              {saved ? <button className="link c warn fgt" type="button" onClick={() => setDlg(true)}>Forget me on this phone</button> : null}
            </>
          ) : null}

          <div className="sect2">About</div>
          <div className="rows">
            <button className="rw2" type="button" aria-expanded={disc} aria-controls={`${id}pay`} onClick={() => setDisc((d) => !d)}><span>How payments work</span><Chevron /></button>
            <div className="disc" id={`${id}pay`} hidden={!disc}>{PAY_TXT}</div>
            <Link className="rw2" href="/privacy" style={{ textDecoration: "none" }}><span>Privacy and terms</span><Chevron /></Link>
            <div className="rw2 static"><span>Version</span><span className="v">{VERSION}</span></div>
          </div>
        </div>
      </div>
      <Dialog open={dlg} onClose={() => setDlg(false)} titleId={`${id}t`}>
        <h3 id={`${id}t`}>Forget your details on this phone?</h3>
        <p>Dibs will ask for your name and UPI ID again on your next bill. Bills you have already shared are not affected.</p>
        <div className="two c2">
          <button className="btn sm" type="button" onClick={() => setDlg(false)}>Keep them</button>
          <button className="btn dng sm" type="button" onClick={forget}>Forget</button>
        </div>
      </Dialog>
      {toast}
    </div>
  );
}
