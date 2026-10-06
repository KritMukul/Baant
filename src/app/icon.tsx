import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

// Dibs mark: a D built from a torn receipt and half a plate (see docs/design/brand-kit).
export default function Icon() {
  return new ImageResponse(
    (
      <svg width="512" height="512" viewBox="0 0 512 512">
        <rect width="512" height="512" rx="112" fill="#0c0d1c" />
        <g transform="translate(25 32) scale(7)">
          <path d="M9 8 H25 V56 L21 52 L17 56 L13 52 L9 56 Z" fill="#ecebf8" />
          <path d="M30 8 H33 A24 24 0 0 1 33 56 H30 Z" fill="#ffb59a" />
          <rect x="13" y="15" width="8" height="3.2" rx="1.6" fill="#0c0d1c" opacity="0.85" />
          <rect x="13" y="22" width="8" height="3.2" rx="1.6" fill="#0c0d1c" opacity="0.85" />
          <rect x="13" y="29" width="5" height="3.2" rx="1.6" fill="#0c0d1c" opacity="0.85" />
        </g>
      </svg>
    ),
    size,
  );
}
