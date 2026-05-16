// src/theme/colors.ts
//
// Single source of truth for all colors in Cureli Mobile.
// Derived from the brand guide in cadmin/src/config/colorGuide.js
// Do not hardcode hex values anywhere else in the app.

export const Colors = {
  // ── Brand ────────────────────────────────────────────────
  brand: {
    dark:    '#05015A',   // deep navy — primary brand color
    base:    '#0a0280',   // royal blue — gradient end
    mid:     '#1a10a0',   // medium blue
    light:   '#3b2fd4',   // lighter blue
    soft:    '#6366f1',   // indigo-500
  },

  // ── Background ───────────────────────────────────────────
  background: {
    page:    '#f8fafc',   // slate-50 — app background
    card:    '#ffffff',   // white — card/surface
    tint:    '#eef2ff',   // indigo-50 — light brand wash
    accent:  '#e0e7ff',   // indigo-100 — stronger brand wash
  },

  // ── Text ─────────────────────────────────────────────────
  text: {
    primary:   '#0f172a',   // slate-900 — headings, important text
    secondary: '#374151',   // gray-700 — body text
    muted:     '#64748b',   // slate-500 — descriptions, helpers
    faint:     '#94a3b8',   // slate-400 — timestamps, hints
    disabled:  '#cbd5e1',   // slate-300 — disabled state
    brand:     '#4338ca',   // indigo-700 — links, active states
    onDark:    '#ffffff',   // white — text on dark/brand bg
    onDarkMuted: 'rgba(255,255,255,0.65)',  // white/65 — secondary on dark
    onDarkFaint: 'rgba(255,255,255,0.40)',  // white/40 — hints on dark
  },

  // ── Border ───────────────────────────────────────────────
  border: {
    default: '#e2e8f0',   // slate-200
    subtle:  '#f1f5f9',   // slate-100
    brand:   '#c7d2fe',   // indigo-200
    strong:  '#6366f1',   // indigo-500
  },

  // ── Status ───────────────────────────────────────────────
  status: {
    success:     '#22c55e',
    successBg:   '#f0fdf4',
    successBorder:'#bbf7d0',
    warning:     '#f59e0b',
    warningBg:   '#fffbeb',
    error:       '#ef4444',
    errorBg:     '#fef2f2',
    errorBorder: '#fecaca',
    info:        '#3b82f6',
    infoBg:      '#eff6ff',
  },

  // ── Overlay ──────────────────────────────────────────────
  overlay: {
    dark:   'rgba(0,0,0,0.5)',
    light:  'rgba(255,255,255,0.1)',
    medium: 'rgba(255,255,255,0.2)',
  },

  // ── Transparent ──────────────────────────────────────────
  transparent: 'transparent',
} as const;