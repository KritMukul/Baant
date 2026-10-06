import { notFound, redirect } from "next/navigation";
import { loadForViewer } from "@/server/load";
import CheckScreen from "./CheckScreen";

export const dynamic = "force-dynamic";
export const metadata = { title: "Check the scan" };

export default async function CheckPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const l = await loadForViewer(code);
  if (!l) notFound();
  if (l.viewer.role !== "host") redirect(`/b/${code}`);
  if (l.view.locked) redirect(`/b/${code}`);
  return <CheckScreen code={code} initial={l.view} />;
}
