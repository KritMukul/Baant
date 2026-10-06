import { notFound, redirect } from "next/navigation";
import { appOrigin } from "@/server/origin";
import { loadForViewer } from "@/server/load";
import SettleScreen from "./SettleScreen";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settle up" };

export default async function SettlePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const l = await loadForViewer(code);
  if (!l) notFound();
  if (l.viewer.role !== "host") redirect(`/b/${code}`);
  if (l.view.status !== "open") redirect(`/b/${code}/check`);
  return <SettleScreen code={code} initial={l.view} origin={await appOrigin()} />;
}
