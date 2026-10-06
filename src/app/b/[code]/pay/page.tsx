import { notFound, redirect } from "next/navigation";
import { loadForViewer } from "@/server/load";
import PayScreen from "./PayScreen";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pay" };

export default async function PayPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const l = await loadForViewer(code);
  if (!l) notFound();
  if (l.viewer.role !== "guest" || !l.view.myPay) redirect(`/b/${code}`);
  const { pay } = l.view.myPay;
  if (pay.state === "none" || (pay.state === "unpaid" && !l.view.allClaimed)) redirect(`/b/${code}`);
  return <PayScreen code={code} initial={l.view} />;
}
