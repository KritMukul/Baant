import { NextResponse } from "next/server";
import { store } from "@/server/store";

export const dynamic = "force-dynamic";

/** For uptime checks and the first thing to open after deploying: is the database reachable? */
export async function GET() {
  const kind = process.env.DIBS_STORE === "memory" ? "memory" : "postgres";
  try {
    await store().getBillData("health-check");
    return NextResponse.json({ ok: true, store: kind });
  } catch (e) {
    console.error("health check failed:", e);
    return NextResponse.json({ ok: false, store: kind }, { status: 503 });
  }
}
