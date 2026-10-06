"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { BillView } from "@/server/service";

/** Shows one line at the bottom for a couple of seconds. Use as: const [toast, say] = useToast(); */
export function useToast() {
  const [text, setText] = useState("");
  const [on, setOn] = useState(false);
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  const say = useCallback((s: string, ms = 2000) => {
    setText(s);
    setOn(true);
    if (t.current) clearTimeout(t.current);
    t.current = setTimeout(() => setOn(false), ms);
  }, []);
  useEffect(() => () => void (t.current && clearTimeout(t.current)), []);
  const node = (
    <div className={`toast${on ? " on" : ""}`} role="status" aria-live="polite">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
      <span>{text}</span>
    </div>
  );
  return [node, say] as const;
}

/**
 * Keeps a bill's view fresh while the screen is open: fetches every few seconds, and straight away
 * when the tab comes back or the phone reconnects. `refresh()` is for right after your own action.
 */
export function useLive(code: string, initial: BillView, intervalMs = 3000) {
  const [view, setView] = useState(initial);
  const [offline, setOffline] = useState(false);
  const busy = useRef(false);
  const refresh = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      const res = await fetch(`/api/b/${encodeURIComponent(code)}/state`, { cache: "no-store" });
      if (res.ok) {
        const j = (await res.json()) as { view: BillView | null };
        if (j.view) setView(j.view);
        setOffline(false);
      } else if (res.status !== 404) setOffline(true);
    } catch {
      setOffline(true);
    } finally {
      busy.current = false;
    }
  }, [code]);
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const id = setInterval(tick, intervalMs);
    document.addEventListener("visibilitychange", tick);
    window.addEventListener("online", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
      window.removeEventListener("online", tick);
    };
  }, [refresh, intervalMs]);
  return { view, setView, refresh, offline };
}

/** Mounts a panel with an enter and an exit animation: pass `open`, render while `mounted`, add `on`/`leaving`. */
export function usePresence(open: boolean, exitMs = 240) {
  const [mounted, setMounted] = useState(open);
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (open) {
      setMounted(true);
      const r = requestAnimationFrame(() => requestAnimationFrame(() => setOn(true)));
      return () => cancelAnimationFrame(r);
    }
    setOn(false);
    const t = setTimeout(() => setMounted(false), matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : exitMs);
    return () => clearTimeout(t);
  }, [open, exitMs]);
  return { mounted, on, leaving: mounted && !on && !open };
}
