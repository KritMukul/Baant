import { notFound, redirect } from "next/navigation";
import { appOrigin } from "@/server/origin";
import { loadForViewer } from "@/server/load";
import BoardScreen from "./BoardScreen";
import JoinScreen, { DeadEnd } from "./JoinScreen";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return { title: "Dibs", robots: { index: false, follow: false }, alternates: { canonical: `/b/${code}` } };
}

/** One link, four outcomes: the host goes on to check the scan, a friend who has joined sees the board, a stranger joins, a dead link says so. */
export default async function BillPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const l = await loadForViewer(code);
  if (!l) notFound();
  const { view, viewer } = l;
  if (viewer.role === "host" && view.status === "draft") redirect(`/b/${code}/check`);
  if (viewer.role === "anon") return view.settled ? <DeadEnd kind="settled" view={view} /> : <JoinScreen code={code} view={view} />;
  return <BoardScreen code={code} initial={view} origin={await appOrigin()} />;
}
