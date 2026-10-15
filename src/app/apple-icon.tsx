import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iPhone "Add to Home Screen" icon: same mark, full-bleed square because iOS rounds the corners itself.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <svg width="180" height="180" viewBox="0 0 64 64">
        <rect width="64" height="64" fill="#0c0d1c" />
        <g transform="translate(4.9 5.7) scale(0.82)">
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
