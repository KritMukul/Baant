import { NextResponse } from "next/server";
import { loadForViewer } from "@/server/load";

export const dynamic = "force-dynamic";

/** Polled by open screens. Same visibility rules as the pages: you only ever get your own view. */
export async function GET(_req: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  try {
    const l = await loadForViewer(code);
    return NextResponse.json({ view: l?.view ?? null }, { status: l ? 200 : 404, headers: { "cache-control": "no-store" } });
  } catch (e) {
    console.error("state failed:", e);
    return NextResponse.json({ view: null, error: "server" }, { status: 500, headers: { "cache-control": "no-store" } });
  }
}
