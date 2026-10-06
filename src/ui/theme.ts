export type ThemePref = "light" | "dark" | "system";
const KEY = "dibs-theme";

export function readTheme(): ThemePref {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

/** Applies at once and remembers on this phone. "system" removes the override. */
export function applyTheme(p: ThemePref) {
  try {
    if (p === "system") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, p);
  } catch {
    /* private mode: still apply for this visit */
  }
  const el = document.documentElement;
  if (p === "system") el.removeAttribute("data-theme");
  else el.setAttribute("data-theme", p);
  const dark = p === "dark" || (p === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
    if (p === "system") return;
    m.setAttribute("content", dark ? "#0c0d1c" : "#f5f4fb");
    m.removeAttribute("media");
  });
}

export const systemIsDark = () => typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: dark)").matches;
