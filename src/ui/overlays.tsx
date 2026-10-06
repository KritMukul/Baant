"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePresence } from "./hooks";

/** Keeps Tab inside `ref`, closes on Escape, and returns focus to whatever opened it. */
function useModalBehaviour(open: boolean, ref: React.RefObject<HTMLElement | null>, onClose: () => void, initial?: string) {
  const opener = useRef<Element | null>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (!open) return;
    opener.current = document.activeElement;
    const root = ref.current;
    const first = root?.querySelector<HTMLElement>(initial ?? "button, [href], input, [tabindex]:not([tabindex='-1'])");
    const t = setTimeout(() => first?.focus(), 30);
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close.current();
      } else if (e.key === "Tab" && root) {
        const f = [...root.querySelectorAll<HTMLElement>("button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex='-1'])")];
        if (!f.length) return;
        const a = document.activeElement;
        if (e.shiftKey && a === f[0]) {
          e.preventDefault();
          f.at(-1)!.focus();
        } else if (!e.shiftKey && a === f.at(-1)) {
          e.preventDefault();
          f[0].focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    const back = opener.current;
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", key);
      if (back instanceof HTMLElement && document.contains(back)) back.focus();
    };
  }, [open, ref, initial]);
}

/** Bottom sheet over the page. `label` names it for screen readers. */
export function Sheet({ open, onClose, label, children }: { open: boolean; onClose: () => void; label: string; children: ReactNode }) {
  const { mounted, on, leaving } = usePresence(open, 320);
  const ref = useRef<HTMLDivElement>(null);
  useModalBehaviour(open, ref, onClose);
  if (!mounted) return null;
  return (
    <div data-k="sw">
      <div className={`sheetbg${on ? " on" : ""}${leaving ? " leaving" : ""}`} onClick={onClose} />
      <div ref={ref} className={`sheet${on ? " on" : ""}${leaving ? " leaving" : ""}`} role="dialog" aria-modal="true" aria-label={label}>
        <div className="grab" />
        {children}
      </div>
    </div>
  );
}

/** Centered question. The safe choice should be the first button (it gets focus). */
export function Dialog({ open, onClose, titleId, children }: { open: boolean; onClose: () => void; titleId: string; children: ReactNode }) {
  const { mounted, on, leaving } = usePresence(open, 200);
  const ref = useRef<HTMLDivElement>(null);
  useModalBehaviour(open, ref, onClose);
  if (!mounted) return null;
  return (
    <div className="modal on" data-k="dlg">
      <div className={`sheetbg${on ? " on" : ""}${leaving ? " leaving" : ""}`} style={{ pointerEvents: "auto" }} onClick={onClose} />
      <div ref={ref} className={`dlg${on ? " on" : ""}${leaving ? " leaving" : ""}`} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        {children}
      </div>
    </div>
  );
}
