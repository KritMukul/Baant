"use client";

import { useEffect, useState } from "react";

/**
 * A scannable QR for `text`. Always near-black on white with a 4-module quiet zone, in light and dark
 * mode alike: inverted or themed codes scan badly. Generated in the browser (nothing is sent anywhere).
 */
export function QrCode({ text, size = 259 }: { text: string; size?: number }) {
  const [m, setM] = useState<{ n: number; rows: string[] } | null>(null);
  useEffect(() => {
    let live = true;
    void import("qrcode").then((Q) => {
      if (!live) return;
      const q = Q.create(text, { errorCorrectionLevel: "M" });
      const n = q.modules.size;
      const rows: string[] = [];
      for (let y = 0; y < n; y++) {
        let r = "";
        for (let x = 0; x < n; x++) r += q.modules.get(x, y) ? "1" : "0";
        rows.push(r);
      }
      setM({ n, rows });
    });
    return () => {
      live = false;
    };
  }, [text]);
  if (!m) return <div style={{ width: size, height: size, background: "#fff" }} aria-busy="true" />;
  const quiet = 4;
  let d = "";
  m.rows.forEach((r, y) => {
    let x = 0;
    while (x < m.n) {
      if (r[x] === "1") {
        const s = x;
        while (x < m.n && r[x] === "1") x++;
        d += `M${s + quiet} ${y + quiet}h${x - s}v1h-${x - s}z`;
      } else x++;
    }
  });
  const v = m.n + quiet * 2;
  return (
    <svg viewBox={`0 0 ${v} ${v}`} width={size} height={size} shapeRendering="crispEdges" role="img" aria-label={`QR code for ${text}`} data-qr="1" style={{ display: "block" }}>
      <rect width={v} height={v} fill="#ffffff" />
      <path d={d} fill="#0c0d1c" />
    </svg>
  );
}
