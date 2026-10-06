import { cookies } from "next/headers";
import type { Creds } from "./service";

const MAX_AGE = 60 * 60 * 24 * 60; // 60 days

/** Cookies are only marked Secure when the app is served over https (APP_URL starts with https://). */
const base = () => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: (process.env.APP_URL ?? "").startsWith("https://"),
  path: "/",
  maxAge: MAX_AGE,
});

export async function credsFor(code: string): Promise<Creds> {
  const c = await cookies();
  return { host: c.get(`dibs_h_${code}`)?.value ?? null, participant: c.get(`dibs_p_${code}`)?.value ?? null };
}

export async function setHostCookie(code: string, token: string) {
  (await cookies()).set(`dibs_h_${code}`, token, base());
}

export async function setParticipantCookie(code: string, participantId: string, token: string) {
  (await cookies()).set(`dibs_p_${code}`, `${participantId}.${token}`, base());
}
