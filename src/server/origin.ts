import { headers } from "next/headers";

/** The public address of this deployment: APP_URL if set, else what the browser asked for. */
export async function appOrigin(): Promise<string> {
  const env = process.env.APP_URL?.trim().replace(/\/+$/, "");
  if (env) return env;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}
