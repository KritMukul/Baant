import type { Metadata, Viewport } from "next";
import "@fontsource-variable/sora";
import "@fontsource-variable/jetbrains-mono";
import "./tokens.css";
import "./base.css";
import "./dibs.css";

export const metadata: Metadata = {
  title: { default: "Dibs", template: "%s · Dibs" },
  description: "Call dibs on what you ate. Photograph the bill, share a link, everyone pays their own share.",
  appleWebApp: { capable: true, title: "Dibs", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // keeps the Join button above the on-screen keyboard on Android Chrome
  interactiveWidget: "resizes-content",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f4fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0d1c" },
  ],
};

/** Runs before first paint so a remembered Light/Dark choice never flashes the wrong theme. */
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('dibs-theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);var c=t==='dark'?'#0c0d1c':'#f5f4fb';document.querySelectorAll('meta[name=theme-color]').forEach(function(m){m.setAttribute('content',c);m.removeAttribute('media')})}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
