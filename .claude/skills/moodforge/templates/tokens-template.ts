/**
 * <Project> · <Theme Name> Design Tokens
 * v1.0 · YYYY-MM-DD
 *
 * Single source of truth for the <Project> brand.
 * Locked by design-pipeline skill, round N.
 *
 * Import into your app:
 *   import { colors, typography, spacing } from '@/theme/tokens';
 */

export const colors = {
  // ── Base surfaces (never pure #fff or #000 — always warm/tinted) ──
  base:     '#f3eddd',
  surface:  '#ebe3ce',
  elevated: '#ffffff',
  ink:      '#1a1f15',

  // ── Primary brand ──
  primary:     '#2a4a2b',
  primaryDeep: '#1a3a1c',
  primarySoft: '#5a7d4f',

  // ── Highlight / accent ──
  accent:     '#c89530',
  accentDeep: '#9a7020', // USE FOR TEXT — meets WCAG AA
  accentSoft: '#f0d78a',

  // ── Semantic ──
  success: '#5a7d4f',
  warning: '#c89530',
  danger:  '#8a3324',
  info:    '#5a7d4f',

  // ── Neutrals ──
  border:     '#d5ccb3',
  borderSoft: '#e0d7bf',
  muted:      '#a8bca0',

  // ── Text variants ──
  textPrimary:   '#1a1f15',
  textSecondary: 'rgba(26, 31, 21, 0.72)',
  textTertiary:  'rgba(26, 31, 21, 0.5)',
  textInverse:   '#f3eddd',
} as const;

export const typography = {
  // Pick distinctive fonts — avoid Inter, Roboto, Arial defaults.
  fontFamily: {
    display: 'Fraunces',
    body:    'Bricolage Grotesque',
    hand:    'Caveat',
    mono:    'DM Mono',
  },
  scale: {
    display:  { size: 76, lineHeight: 0.88, weight: '900', tracking: -4,   font: 'display', italic: true },
    h1:       { size: 44, lineHeight: 1.0,  weight: '900', tracking: -1.5, font: 'display' },
    h2:       { size: 28, lineHeight: 1.1,  weight: '800', tracking: -0.6, font: 'body'    },
    h3:       { size: 20, lineHeight: 1.2,  weight: '700', tracking: -0.3, font: 'body'    },
    numeric:  { size: 48, lineHeight: 0.9,  weight: '500', tracking: -1.5, font: 'mono'    },
    body:     { size: 16, lineHeight: 1.5,  weight: '500', tracking: 0,    font: 'body'    },
    caption:  { size: 13, lineHeight: 1.55, weight: '600', tracking: 0,    font: 'body'    },
    label:    { size: 10, lineHeight: 1.0,  weight: '500', tracking: 2,    font: 'mono', uppercase: true },
  },
} as const;

export const spacing = {
  unit: 4,
  xxs: 4, xs: 8, sm: 12, md: 16, lg: 24, xl: 32, xxl: 48, xxxl: 64, huge: 96,
  screenPadding: 24,
  cardPadding: 16,
} as const;

export const radius = {
  xs: 6, sm: 12, md: 18, lg: 22, xl: 28, pill: 9999,
} as const;

export const shadows = {
  // Warm shadows — tinted with your primary color, never cold black.
  card: {
    shadowColor: '#2a4a2b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  modal: {
    shadowColor: '#2a4a2b',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 50,
    elevation: 16,
  },
} as const;

export const motion = {
  easing: {
    default: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
    exit:    'cubic-bezier(0.4, 0, 1, 1)',
  },
  duration: { fast: 200, normal: 300, slow: 500 },
} as const;

export const voice = {
  principles: [
    'Speak like a friend, not a corporation',
    'Use lowercase in small labels for warmth',
    'Never say "error" — say what happened plainly',
  ],
  replacements: {
    'Error':   "That didn't work",
    'Loading': 'Taking a sec',
    'No data': 'Nothing yet',
  },
} as const;

export default { colors, typography, spacing, radius, shadows, motion, voice };
