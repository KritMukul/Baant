import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Baant",
  description: "Photograph the bill. Split it fairly in 30 seconds.",
  appleWebApp: { capable: true, title: "Baant" },
};
export const viewport: Viewport = { themeColor: "#0f766e", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}
