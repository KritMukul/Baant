import type { ReactNode } from "react";

function svg(path: ReactNode, w = 2.4) {
  // eslint-disable-next-line react/display-name
  return function Icon(props: { className?: string; style?: React.CSSProperties }) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
        {path}
      </svg>
    );
  };
}

export const Check = svg(<path d="M5 12.5l4.5 4.5L19 7.5" />);
export const X = svg(<path d="M6 6l12 12M18 6L6 18" />);
export const Back = svg(<path d="M15 5l-7 7 7 7" />, 2);
export const Chevron = svg(<path d="M9 5l7 7-7 7" />, 2);
export const Moon = svg(<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />, 1.8);
export const Sun = svg(
  <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6" />
  </>,
  1.8,
);
export const Gear = svg(
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </>,
  1.7,
);
export const Share = svg(
  <>
    <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
    <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
  </>,
  2,
);
export const List = svg(
  <>
    <path d="M9 6h11M9 12h11M9 18h11" />
    <path d="M4 6l1 1 1.8-2M4 12l1 1 1.8-2M4 18l1 1 1.8-2" />
  </>,
  1.8,
);
export const Info = svg(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 7.6v.1" />
  </>,
  2,
);
export const Warn = svg(
  <>
    <path d="M12 4l9 16H3z" />
    <path d="M12 10v4.5M12 17.4v.1" />
  </>,
  2,
);
export const Clock = svg(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </>,
  2,
);
export const Camera = svg(
  <>
    <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.2l1.1-1.6A1.5 1.5 0 0 1 10 3.7h4a1.5 1.5 0 0 1 1.2.7L16.3 6h1.2A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5z" />
    <circle cx="12" cy="12.5" r="3.4" />
  </>,
  1.8,
);
export const Pencil = svg(
  <>
    <path d="M4 20l1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L8 19z" />
    <path d="M14 7l3 3" />
  </>,
  1.8,
);
export const Copy = svg(
  <>
    <rect x="8.5" y="8.5" width="11" height="11" rx="2.5" />
    <path d="M15.5 8.5V6.5a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2" />
  </>,
  1.9,
);
export const Lock = svg(
  <>
    <rect x="5" y="11" width="14" height="9" rx="2.5" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </>,
  1.9,
);
export const Unlock = svg(
  <>
    <rect x="5" y="11" width="14" height="9" rx="2.5" />
    <path d="M8 11V8a4 4 0 0 1 7.5-1.9" />
  </>,
  1.9,
);
export const Qr = svg(
  <>
    <rect x="4" y="4" width="6.5" height="6.5" rx="1.2" />
    <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.2" />
    <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.2" />
    <path d="M14 14h2.5v2.5H14zM18 18h2M18 14v.1M14 19v1" />
  </>,
  1.8,
);
export const Upload = svg(
  <>
    <path d="M12 15V4M8 8l4-4 4 4" />
    <path d="M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
  </>,
  1.9,
);
export const Offline = svg(
  <>
    <path d="M3 3l18 18" />
    <path d="M8.5 16.4a5 5 0 0 1 7 0M5 12.9a10 10 0 0 1 4-2.3M19 12.9a10 10 0 0 0-3.2-2.1M12 20h.01" />
  </>,
  2,
);
export const Receipt = svg(
  <>
    <path d="M7 3.5h10v17l-2.5-1.7L12 20.5l-2.5-1.7L7 20.5z" />
    <path d="M10.2 9.2a2 2 0 1 1 2.6 1.9c-.6.3-.8.7-.8 1.3M12 14.6v.1" />
  </>,
  1.6,
);
export const ReceiptDone = svg(
  <>
    <path d="M7 3.5h10v17l-2.5-1.7L12 20.5l-2.5-1.7L7 20.5z" />
    <path d="M9.3 11.6l1.9 1.9 3.5-3.7" />
  </>,
  1.6,
);

/** Logo lockup in theme colours: a D made from a torn receipt and half a plate, then "ibs". */
export function Lockup() {
  return (
    <svg viewBox="6 0 160 64" overflow="visible" role="img" aria-label="Dibs">
      <path d="M9 8 H25 V56 L21 52 L17 56 L13 52 L9 56 Z" style={{ fill: "var(--color-text)" }} />
      <path d="M30 8 H33 A24 24 0 0 1 33 56 H30 Z" style={{ fill: "var(--color-accent)" }} />
      <rect x="13" y="15" width="8" height="3.2" rx="1.6" style={{ fill: "var(--color-bg)" }} opacity=".85" />
      <rect x="13" y="22" width="8" height="3.2" rx="1.6" style={{ fill: "var(--color-bg)" }} opacity=".85" />
      <rect x="13" y="29" width="5" height="3.2" rx="1.6" style={{ fill: "var(--color-bg)" }} opacity=".85" />
      <text x="57" y="56" fontFamily="Sora Variable, Sora, system-ui, sans-serif" fontSize="68" fontWeight="700" letterSpacing="-2.6" style={{ fill: "var(--color-text)" }}>
        ibs
      </text>
    </svg>
  );
}

/** Just the mark (no wordmark), for the small header on guest screens. */
export function Mark() {
  return (
    <svg className="mk" viewBox="6 6 54 50" aria-hidden="true">
      <path className="r" d="M9 8 H25 V56 L21 52 L17 56 L13 52 L9 56 Z" />
      <path className="p" d="M30 8 H33 A24 24 0 0 1 33 56 H30 Z" />
      <rect className="l" x="13" y="15" width="8" height="3.2" rx="1.6" />
      <rect className="l" x="13" y="22" width="8" height="3.2" rx="1.6" />
      <rect className="l" x="13" y="29" width="5" height="3.2" rx="1.6" />
    </svg>
  );
}
