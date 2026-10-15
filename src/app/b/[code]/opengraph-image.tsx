import { ImageResponse } from "next/og";
import { store } from "@/server/store";
import { formatINR } from "@/lib/money";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-dynamic";

/** The preview card WhatsApp shows under the link: merchant and total only (the link already says it is a bill). */
export default async function OG({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const d = await store().getBillData(code).catch(() => null);
  const open = d && d.bill.status === "open";
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#0c0d1c", color: "#ecebf8" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="84" height="78" viewBox="6 6 54 50">
            <path d="M9 8 H25 V56 L21 52 L17 56 L13 52 L9 56 Z" fill="#ecebf8" />
            <path d="M30 8 H33 A24 24 0 0 1 33 56 H30 Z" fill="#ff6b4a" />
          </svg>
          <div style={{ fontSize: 44, fontWeight: 700 }}>Dibs</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 40, color: "#8e92b3" }}>{open ? "Call dibs on what you ate" : "Call dibs on what you ate"}</div>
          <div style={{ fontSize: 88, fontWeight: 700, lineHeight: 1.05 }}>{open ? d!.bill.merchant : "Split the bill"}</div>
          {open ? <div style={{ fontSize: 64, color: "#ff6b4a" }}>{formatINR(d!.bill.total)}</div> : null}
        </div>
      </div>
    ),
    size,
  );
}
