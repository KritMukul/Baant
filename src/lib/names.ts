export const MAX_NAME = 24;

/** Trim and collapse runs of whitespace. */
export const cleanName = (s: string) => s.replace(/\s+/g, " ").trim();

/** Names are compared ignoring case and extra spaces. */
export const nameKey = (s: string) => cleanName(s).toLowerCase();

export const firstName = (full: string) => cleanName(full).split(" ")[0] ?? "";

export type NameCheck =
  | { ok: true; name: string }
  | { ok: false; reason: "empty" }
  | { ok: false; reason: "host"; hostName: string }
  | { ok: false; reason: "taken"; takenName: string; participantId: string };

/**
 * Decide whether a guest may join under `input`.
 * - empty -> ask for a name
 * - the host's first or full name -> never allowed (nobody poses as the person being paid)
 * - the name of someone already in -> "Is that you?" (the caller may then allow a takeover)
 */
export function checkJoinName(
  input: string,
  host: { name: string; fullName: string },
  others: { id: string; name: string }[],
): NameCheck {
  const name = cleanName(input).slice(0, MAX_NAME);
  if (!name) return { ok: false, reason: "empty" };
  const k = nameKey(name);
  if (k === nameKey(host.name) || k === nameKey(host.fullName)) return { ok: false, reason: "host", hostName: host.name };
  const same = others.find((o) => nameKey(o.name) === k);
  if (same) return { ok: false, reason: "taken", takenName: same.name, participantId: same.id };
  return { ok: true, name };
}
