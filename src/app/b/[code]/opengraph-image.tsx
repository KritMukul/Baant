import { ImageResponse } from "next/og";
import { admin } from "@/lib/supabase";
import { formatINR } from "@/lib/money";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { data: bill } = await admin().from("bills").select("merchant,total,payer_name,id").eq("code", code).single();
  const { count } = bill
    ? await admin().from("participants").select("id", { count: "exact", head: true }).eq("bill_id", bill.id)
    : { count: 0 };

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, background: "#0f766e", color: "#fff" }}>
        <div style={{ fontSize: 40, opacity: 0.8 }}>Dibs</div>
        <div style={{ fontSize: 80, fontWeight: 800 }}>{bill?.merchant || "Bill"}</div>
        <div style={{ fontSize: 56 }}>{bill ? formatINR(bill.total) : ""}</div>
        <div style={{ fontSize: 36, marginTop: 24, opacity: 0.9 }}>
          {count ?? 0} people · paid by {bill?.payer_name} · call dibs on what you ate
        </div>
      </div>
    ),
    size,
  );
}
