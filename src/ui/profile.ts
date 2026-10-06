/** The host's name and UPI ID, remembered on this phone only (never sent anywhere until a bill is shared). */
const KEY = "dibs-host";
export interface Profile {
  name: string;
  upi: string;
}

export function loadProfile(): Profile | null {
  try {
    const j = JSON.parse(localStorage.getItem(KEY) ?? "null");
    return j && typeof j.name === "string" && typeof j.upi === "string" ? { name: j.name, upi: j.upi } : null;
  } catch {
    return null;
  }
}
export function saveProfile(p: Profile) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* private mode: just do not remember */
  }
}
export function clearProfile() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nothing to clear */
  }
}
