"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { publishAction, removeChargeAction, removeItemAction, saveChargeAction, saveItemAction } from "@/app/actions";
import { formatINR, formatNum } from "@/lib/money";
import { rupeesText } from "@/lib/rupees";
import { Back, Check, Pencil, Warn, X } from "@/ui/icons";
import { Dialog, Sheet } from "@/ui/overlays";
import { useLive, useToast } from "@/ui/hooks";
import { ROUND_OFF } from "@/lib/charges";
import type { BillView } from "@/server/service";

type Item = BillView["items"][number];
type ItemDraft = { id?: string; name: string; qty: number; price: string; flag: Item["flag"]; eName?: boolean; ePrice?: boolean; err?: string };
type ChargeDraft = { kind: "tax" | "service" | "discount"; label: string; amount: string; eLabel?: boolean; eAmount?: boolean; err?: string };

const KIND = { tax: "Tax", service: "Service charge", discount: "Discount" } as const;

export default function CheckScreen({ code, initial }: { code: string; initial: BillView }) {
  const router = useRouter();
  const { view, refresh } = useLive(code, initial);
  const [toast, say] = useToast();
  const [item, setItem] = useState<ItemDraft | null>(null);
  const [charge, setCharge] = useState<ChargeDraft | null>(null);
  const [anyway, setAnyway] = useState(false);
  const [dupGone, setDupGone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [shareErr, setShareErr] = useState("");
  const ids = useId();

  const c = view.check!;
  const printed = view.charges.filter((x) => !(x.kind === "discount" && x.label === ROUND_OFF));
  const ro = view.total - c.actual; // what Dibs will round off at share time (only when it adds up)
  const flagged = view.items.filter((i) => i.flag).length;
  const dup = c.duplicateId ? view.items.find((i) => i.id === c.duplicateId) : undefined;
  const dupHelps = !!dup && !c.ok && c.diff > 0 && Math.abs(c.diff - dup.price) <= 100 && !dupGone;

  async function saveItem() {
    if (!item) return;
    const nameBad = !item.name.trim();
    const priceBad = !item.price.trim() || !/^[\d,.\s₹]+$/.test(item.price);
    if (nameBad || priceBad) {
      setItem({ ...item, eName: nameBad, ePrice: priceBad });
      return;
    }
    setBusy(true);
    const r = await saveItemAction(code, { id: item.id, name: item.name, qty: item.qty, price: item.price });
    setBusy(false);
    if (!r.ok) {
      setItem({ ...item, ePrice: r.error.startsWith("Use numbers"), eName: r.error.startsWith("Give"), err: r.error });
      return;
    }
    setItem(null);
    await refresh();
    say("Saved");
  }

  async function deleteItem() {
    if (!item?.id) return;
    setBusy(true);
    const r = await removeItemAction(code, item.id);
    setBusy(false);
    if (!r.ok) return setItem({ ...item, err: r.error });
    const name = item.name;
    setItem(null);
    await refresh();
    say(`Deleted ${name}`);
  }

  async function saveCharge() {
    if (!charge) return;
    const bad = { eLabel: !charge.label.trim(), eAmount: !charge.amount.trim() || !/^[\d,.\s₹]+$/.test(charge.amount) };
    if (bad.eLabel || bad.eAmount) return setCharge({ ...charge, ...bad });
    setBusy(true);
    const r = await saveChargeAction(code, { kind: charge.kind, label: charge.label, amount: charge.amount });
    setBusy(false);
    if (!r.ok) return setCharge({ ...charge, err: r.error, eAmount: r.error.startsWith("Use numbers"), eLabel: r.error.startsWith("Give") });
    const label = charge.label.trim();
    setCharge(null);
    await refresh();
    say(`Added ${label}`);
  }

  async function dropCharge(id: string, label: string) {
    const r = await removeChargeAction(code, id);
    if (!r.ok) return say(r.error);
    await refresh();
    say(`Removed ${label}`);
  }

  async function removeDup() {
    if (!dup) return;
    const r = await removeItemAction(code, dup.id);
    if (!r.ok) return say(r.error);
    await refresh();
    say("Removed the duplicate");
  }

  async function share(any: boolean) {
    setBusy(true);
    setShareErr("");
    const r = await publishAction(code, any);
    if (!r.ok) {
      setBusy(false);
      setAnyway(false);
      setShareErr(r.error);
      if (r.code === "not_balanced") await refresh();
      return;
    }
    router.push(`/b/${code}/share`);
  }

  const pillOk = c.ok;
  return (
    <div className="page s-b">
      <div className="scr">
        <div className="appbar">
          <Link className="icon-btn" href="/" aria-label="Back">
            <Back />
          </Link>
          <span className="ttl">Check the scan</span>
          <span style={{ width: 44 }} />
        </div>
        <div className="body">
          <div className="mh2">
            <div className="pthumb">{view.thumb ? <img src={view.thumb} alt="Your bill" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}</div>
            <div>
              <div className="name">{view.merchant}</div>
              <div className="sub">{view.items.length} items · {printed.length} charges</div>
            </div>
          </div>

          <div className="bal" data-k="bal">
            <div className="r t"><span>Bill total</span><b>{formatNum(view.total)}</b></div>
            <div className="r"><span>Items + charges</span><b>{formatNum(c.actual)}</b></div>
            <span className={`pill2 ${pillOk ? "ok" : "bad"}`} aria-live="polite">
              {pillOk ? <Check /> : <Warn />}
              {pillOk ? "Matches the bill" : `${formatINR(Math.abs(c.diff))} ${c.diff < 0 ? "short" : "over"}`}
            </span>
            {pillOk ? (
              ro !== 0 ? <span className="ro">Round-off {ro < 0 ? "−" : "+"}{formatINR(Math.abs(ro))} added so friends pay exactly {formatINR(view.total)}.</span> : null
            ) : (
              <span className="ro">{c.diff < 0 ? "A charge or an item may be missing." : "An item may be listed twice."}</span>
            )}
          </div>

          {dupHelps && dup ? (
            <div className="sg">
              <span className="ic">!</span>
              <div>
                <b>{dup.name} appears twice</b>
                <span className="t">The bill lists it once. Removing the extra row closes the gap.</span>
                <div className="two">
                  <button className="btn sm" type="button" onClick={() => void removeDup()}>Remove it</button>
                  <button className="btn sec sm" type="button" onClick={() => setDupGone(true)}>Keep both</button>
                </div>
              </div>
            </div>
          ) : null}

          <div className="lh">
            <span className="sect">Items · <span>{view.items.length}</span></span>
            <button className="link" type="button" onClick={() => setItem({ name: "", qty: 1, price: "", flag: null })}>+ Add item</button>
          </div>
          <p style={{ margin: "-4px 2px 0", fontSize: 12, color: "var(--color-text-muted)" }}>Prices are before tax. Tax goes under Charges.</p>
          <div className="lst">
            {view.items.map((it) => {
              const isDup = dupHelps && dup?.id === it.id;
              return (
                <div key={it.id} className={`li${it.flag ? " flag" : ""}${isDup ? " dup" : ""}`}>
                  <span>
                    <span className="nm">{it.name}{it.qty > 1 ? ` ×${it.qty}` : ""}</span>
                    {it.qty > 1 || it.flag ? <span className="sb">{it.qty > 1 ? `${it.qty} × ${formatINR(Math.round(it.price / it.qty))}` : ""}{it.qty > 1 && it.flag ? " · " : ""}{it.flag ? `read as ${it.flag.read}` : ""}</span> : null}
                    {it.flag ? <span className="fg"><Warn style={{ width: 11, height: 11 }} />Check · {it.flag.why}</span> : null}
                    {isDup ? <span className="fg">Possible duplicate</span> : null}
                  </span>
                  <span className="pr">{formatNum(it.price)}</span>
                  <button className="ed" type="button" aria-label={`Edit ${it.name}`} onClick={() => setItem({ id: it.id, name: it.name, qty: it.qty, price: rupeesText(it.price), flag: it.flag })}>
                    <Pencil />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="lh">
            <span className="sect">Charges · <span>{printed.length}</span></span>
            <button className="link" type="button" onClick={() => setCharge({ kind: "tax", label: "", amount: "" })}>+ Add charge</button>
          </div>
          <div className="lst">
            {printed.map((ch) => (
              <div key={ch.id} className="li">
                <span>
                  <span className="nm">{ch.label}</span>
                  <span className="sb">{ch.kind === "discount" ? "Discount" : ch.kind === "service" ? "Service charge" : "Tax"}</span>
                </span>
                <span className="pr">{ch.kind === "discount" ? "−" : ""}{formatNum(ch.amount)}</span>
                <button className="ed" type="button" aria-label={`Remove ${ch.label}`} onClick={() => void dropCharge(ch.id, ch.label)}>
                  <X />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="dock">
          {shareErr ? <p className="fine" role="alert" style={{ color: "var(--color-warn)" }}>{shareErr}</p> : null}
          {c.ok ? (
            <>
              <button className="btn" type="button" disabled={busy || view.items.length === 0} onClick={() => void share(false)}>{flagged ? "Share link" : "Looks right, share link"}</button>
              {flagged ? <p className="fine">{flagged} row{flagged > 1 ? "s are" : " is"} marked Check. You can still fix {flagged > 1 ? "them" : "it"} later.</p> : null}
            </>
          ) : (
            <>
              <button className="btn" type="button" disabled>Fix the difference</button>
              <button className="link c" type="button" onClick={() => setAnyway(true)}>Share anyway</button>
            </>
          )}
        </div>
      </div>

      <Sheet open={!!item} onClose={() => setItem(null)} label={item?.id ? "Edit item" : "Add an item"}>
        {item ? (
          <>
            <h2>{item.id ? "Edit item" : "Add an item"}</h2>
            {item.flag ? (
              <div className="note2 warn" style={{ margin: "6px 0 0", gridTemplateColumns: "auto 1fr", fontSize: 12.5 }}>
                <Warn />
                <div><b style={{ fontSize: 13 }}>Dibs read {item.flag.read}</b>{item.flag.why}. Check it against the bill.</div>
              </div>
            ) : null}
            <div className="stack" style={{ marginTop: 6 }}>
              <div className={`fld${item.eName ? " err" : ""}`}>
                <label htmlFor={`${ids}n`}>Name</label>
                <input className="t" id={`${ids}n`} value={item.name} placeholder="Item name" maxLength={60} aria-invalid={item.eName || undefined} onChange={(e) => setItem({ ...item, name: e.target.value, eName: false, err: "" })} />
                <div className="h">{item.eName ? "Give the item a name" : ""}</div>
              </div>
              <div className="fl2">
                <div className="fld">
                  <label>Quantity</label>
                  <div className="step">
                    <button type="button" aria-label="Fewer" onClick={() => setItem({ ...item, qty: Math.max(1, item.qty - 1) })}>−</button>
                    <span aria-live="polite">{item.qty}</span>
                    <button type="button" aria-label="More" onClick={() => setItem({ ...item, qty: Math.min(99, item.qty + 1) })}>+</button>
                  </div>
                  <div className="h" />
                </div>
                <div className={`fld${item.ePrice ? " err" : ""}`}>
                  <label htmlFor={`${ids}p`}>Line total (₹)</label>
                  <input id={`${ids}p`} inputMode="decimal" value={item.price} placeholder="0.00" aria-invalid={item.ePrice || undefined} onChange={(e) => setItem({ ...item, price: e.target.value, ePrice: false, err: "" })} />
                  <div className="h">{item.ePrice ? "Use numbers, like 295.00" : "Before tax"}</div>
                </div>
              </div>
              {item.err && !item.eName && !item.ePrice ? <p className="fine" role="alert" style={{ color: "var(--color-warn)", margin: 0 }}>{item.err}</p> : null}
              <button className="btn" type="button" disabled={busy} style={{ marginTop: 4 }} onClick={() => void saveItem()}>Save item</button>
              {item.id ? <button className="link c warn" type="button" onClick={() => void deleteItem()}>Delete item</button> : null}
            </div>
          </>
        ) : null}
      </Sheet>

      <Sheet open={!!charge} onClose={() => setCharge(null)} label="Add a charge">
        {charge ? (
          <>
            <h2>Add a charge</h2>
            <div className="stack" style={{ marginTop: 6 }}>
              <div className="seg3" role="group" aria-label="Type">
                {(["tax", "service", "discount"] as const).map((k) => (
                  <button key={k} type="button" aria-pressed={charge.kind === k} onClick={() => setCharge({ ...charge, kind: k })}>{k === "tax" ? "Tax" : k === "service" ? "Service" : "Discount"}</button>
                ))}
              </div>
              <div className={`fld${charge.eLabel ? " err" : ""}`}>
                <label htmlFor={`${ids}l`}>Label</label>
                <input className="t" id={`${ids}l`} value={charge.label} placeholder="For example S.Tax" maxLength={40} aria-invalid={charge.eLabel || undefined} onChange={(e) => setCharge({ ...charge, label: e.target.value, eLabel: false, err: "" })} />
                <div className="h">{charge.eLabel ? "Give the charge a name" : ""}</div>
              </div>
              <div className={`fld${charge.eAmount ? " err" : ""}`}>
                <label htmlFor={`${ids}a`}>Amount (₹)</label>
                <input id={`${ids}a`} inputMode="decimal" value={charge.amount} placeholder="0.00" aria-invalid={charge.eAmount || undefined} onChange={(e) => setCharge({ ...charge, amount: e.target.value, eAmount: false, err: "" })} />
                <div className="h">{charge.eAmount ? "Use numbers, like 51.75" : "Exactly as printed on the bill"}</div>
              </div>
              {charge.err && !charge.eLabel && !charge.eAmount ? <p className="fine" role="alert" style={{ color: "var(--color-warn)", margin: 0 }}>{charge.err}</p> : null}
              <button className="btn" type="button" disabled={busy} style={{ marginTop: 4 }} onClick={() => void saveCharge()}>Add charge</button>
            </div>
          </>
        ) : null}
      </Sheet>

      <Dialog open={anyway} onClose={() => setAnyway(false)} titleId={`${ids}t`}>
        <h3 id={`${ids}t`}>{formatINR(Math.abs(c.diff))} {c.diff < 0 ? "short of" : "over"} the bill total</h3>
        <p>Friends will {c.diff < 0 ? "pay a little less" : "pay a little more"} than the bill. You can still fix it later from the ledger.</p>
        <div className="two c2">
          <button className="btn sec sm" type="button" onClick={() => setAnyway(false)}>Fix it</button>
          <button className="btn sm" type="button" disabled={busy} onClick={() => void share(true)}>Share anyway</button>
        </div>
      </Dialog>
      {toast}
    </div>
  );
}
