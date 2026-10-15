/**
 * Regenerates src/app/favicon.ico: the Dibs mark drawn big and simple (no receipt lines) so it still
 * reads in a 16px browser tab. The 512px version in src/app/icon.tsx keeps the full detail.
 *
 *   npx tsx scripts/make-favicon.mts
 */
import { ImageResponse } from "next/og";
import { createElement as h } from "react";
import { writeFileSync } from "node:fs";

const SIZES = [16, 32, 48];

function mark(px: number) {
  return h(
    "svg",
    { width: px, height: px, viewBox: "0 0 64 64" },
    h("rect", { width: 64, height: 64, rx: 14, fill: "#0c0d1c" }),
    h(
      "g",
      { transform: "translate(-1 0)" },
      h("path", { d: "M9 8 H25 V56 L21 52 L17 56 L13 52 L9 56 Z", fill: "#ecebf8" }),
      h("path", { d: "M30 8 H33 A24 24 0 0 1 33 56 H30 Z", fill: "#ff6b4a" }),
    ),
  );
}

const pngs: Buffer[] = [];
for (const px of SIZES) {
  const res = new ImageResponse(mark(px), { width: px, height: px });
  pngs.push(Buffer.from(await res.arrayBuffer()));
}

// ICO container with PNG payloads (read by every current browser)
const head = Buffer.alloc(6);
head.writeUInt16LE(1, 2); // type: icon
head.writeUInt16LE(SIZES.length, 4);
let offset = 6 + 16 * SIZES.length;
const entries = SIZES.map((px, i) => {
  const e = Buffer.alloc(16);
  e.writeUInt8(px, 0);
  e.writeUInt8(px, 1);
  e.writeUInt16LE(1, 4); // colour planes
  e.writeUInt16LE(32, 6); // bits per pixel
  e.writeUInt32LE(pngs[i].length, 8);
  e.writeUInt32LE(offset, 12);
  offset += pngs[i].length;
  return e;
});
writeFileSync("src/app/favicon.ico", Buffer.concat([head, ...entries, ...pngs]));
console.log("wrote src/app/favicon.ico", SIZES.join("/"), offset, "bytes");
