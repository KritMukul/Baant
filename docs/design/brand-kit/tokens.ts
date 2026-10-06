/**
 * Baant · Night Tab design tokens (TypeScript)
 * v1.0 · generated from one source; do not hand-edit values.
 *
 *   import { theme, colors } from '@/theme/tokens';
 *   const c = colors[mode]; // mode: 'light' | 'dark'
 */

export const colors = {
  light: {
    bg: '#f5f4fb',
    surface: '#ffffff',
    border: '#dcdcf0',
    text: '#14152b',
    textMuted: '#5b5f80',
    accent: '#ff6b4a',
    accentEdge: '#d9431a',
    onAccent: '#ffffff',
    accentText: '#c2371a',
    link: '#4a5fd0',
    friend1: '#4a5fd0',
    friend2: '#7c4fe0',
    friend3: '#0e7f6d',
    onFriend: '#ffffff',
    me: '#ff6b4a',
    onMe: '#1b1020',
    warn: '#b42318',
    warnBg: '#fdecea',
    success: '#0e7f6d',
    glow: 'rgba(255, 107, 74, 0.18)',
  },
  dark: {
    bg: '#0c0d1c',
    surface: '#171a30',
    border: '#2b2f55',
    text: '#ecebf8',
    textMuted: '#8e92b3',
    accent: '#ffb59a',
    accentEdge: '#ffb59a',
    onAccent: '#1b1020',
    accentText: '#ffb59a',
    link: '#8fa4ff',
    friend1: '#8fa4ff',
    friend2: '#c6a7ff',
    friend3: '#7fe3d0',
    onFriend: '#0c0d1c',
    me: '#ffb59a',
    onMe: '#1b1020',
    warn: '#ffb4a8',
    warnBg: '#3a1620',
    success: '#7fe3d0',
    glow: 'rgba(255, 181, 154, 0.27)',
  },
} as const;

export type ThemeMode = keyof typeof colors;
export type ColorToken = keyof (typeof colors)['light'];

export const typography = {
  fontFamily: { ui: 'Sora', mono: 'JetBrains Mono' },
  scale: {
    amount: { size: 42, lineHeight: 1.05, weight: 600, tracking: '-0.06em', font: 'mono' },
    amountSm: { size: 24, lineHeight: 1.0, weight: 600, tracking: '-0.04em', font: 'mono' },
    h1: { size: 28, lineHeight: 1.1, weight: 700, tracking: '-0.03em', font: 'ui' },
    h2: { size: 20, lineHeight: 1.2, weight: 700, tracking: '-0.02em', font: 'ui' },
    h3: { size: 16, lineHeight: 1.3, weight: 600, tracking: '-0.01em', font: 'ui' },
    body: { size: 14, lineHeight: 1.5, weight: 400, tracking: '0em', font: 'ui' },
    caption: { size: 12, lineHeight: 1.4, weight: 500, tracking: '0em', font: 'ui' },
    label: { size: 10, lineHeight: 1.0, weight: 500, tracking: '0.1em', font: 'mono', uppercase: true },
  },
} as const;

export const spacing = { unit: 4, xxs: 4, xs: 8, sm: 12, md: 16, lg: 24, xl: 32, xxl: 48, xxxl: 64 } as const;

export const radius = { xs: 8, sm: 10, md: 14, lg: 16, xl: 22, phone: 44, pill: 9999 } as const;

export const motion = {
  easing: { out: 'cubic-bezier(0.23, 1, 0.32, 1)', inOut: 'cubic-bezier(0.77, 0, 0.175, 1)', sheet: 'cubic-bezier(0.32, 0.72, 0, 1)', hover: 'ease', linear: 'linear' },
  duration: { press: 140, hover: 150, popover: 180, toast: 220, modal: 240, sheet: 320 },
  /** Exit animations run at ~75% of the enter duration. */
  exitRatio: 0.75,
} as const;

export const theme = { name: 'Night Tab', version: '1.0.0', colors, typography, spacing, radius, motion } as const;
export default theme;
