import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export const newToken = (bytes = 16) => randomBytes(bytes).toString("base64url");
/** 7 characters, case-sensitive, as in the share link. */
export const newCode = () => randomBytes(5).toString("base64url");

/** No 0/O/1/I/L so it survives being read aloud or typed from a UPI note. */
const REF_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export function newRef(): string {
  const b = randomBytes(3);
  return [...b].map((x) => REF_ALPHABET[x % REF_ALPHABET.length]).join("");
}

export const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");

export function tokenMatches(token: string, hash: string): boolean {
  const a = Buffer.from(hashToken(token));
  const b = Buffer.from(hash);
  return a.length === b.length && timingSafeEqual(a, b);
}
