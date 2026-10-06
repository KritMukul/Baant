import { notFound } from "next/navigation";
import { admin } from "@/lib/supabase";
import { isHost } from "@/app/actions";
import ClaimBoard from "./ClaimBoard";

export const dynamic = "force-dynamic";

export default async function BillPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const db = admin();
  const { data: bill } = await db.from("bills").select("*").eq("code", code).single();
  if (!bill) notFound();

  const [items, participants, claims, host] = await Promise.all([
    db.from("items").select("id,name,qty,price").eq("bill_id", bill.id).order("position").order("name"),
    db.from("participants").select("id,name").eq("bill_id", bill.id).order("created_at"),
    db.from("claims").select("item_id,participant_id").eq("bill_id", bill.id),
    isHost(code),
  ]);

  return (
    <ClaimBoard
      code={code}
      billId={bill.id}
      bill={{
        merchant: bill.merchant,
        total: bill.total,
        tax: bill.tax,
        service: bill.service,
        discount: bill.discount,
        payerName: bill.payer_name,
        payerVpa: bill.payer_vpa,
      }}
      items={items.data ?? []}
      participants={participants.data ?? []}
      claims={claims.data ?? []}
      isHost={host}
    />
  );
}
