// src/theme/colors.ts
//
// Light + Dark color palettes for Cureli Mobile.
// Three dark mode variants included — switch via DARK_VARIANT constant.
//
// Usage:
//   import { useTheme } from '../theme/ThemeContext';
//   const { colors } = useTheme();
//   style={{ backgroundColor: colors.background.page }}
//
// To change dark mode style:
//   Change DARK_VARIANT below to 'pure' | 'navy' | 'neutral'
//   Restart Metro.

// ── Dark variant selector ─────────────────────────────────────
// Change this to try different dark modes.
// 'navy' is the branded default that matches your app icon bg.

export type DarkVariant = "pure" | "navy" | "neutral";
export const DARK_VARIANT: DarkVariant = "navy";

// ── Color palette type ────────────────────────────────────────

export interface ColorPalette {
  brand: {
    primary: string; // main brand color — buttons, active states
    secondary: string; // gradient end, secondary brand elements
    mid: string; // medium brand shade
    light: string; // lighter brand
    soft: string; // softest brand — badges, tints
    accent: string; // purple accent from logo
  };

  background: {
    page: string; // app background
    card: string; // card / surface
    elevated: string; // modal, bottom sheet
    tint: string; // light brand wash
    accent: string; // stronger brand wash
    input: string; // text input background
    trans: string; // fully transparent — overlays, ghost elements
  };

  text: {
    primary: string; // headings, important text
    secondary: string; // body text
    muted: string; // descriptions, helpers
    faint: string; // timestamps, hints
    disabled: string; // disabled state
    brand: string; // links, active states
    inverse: string; // text on brand backgrounds
  };

  border: {
    default: string;
    subtle: string;
    brand: string;
    strong: string;
    input: string; // text input border
    inputFocused: string;
  };

  status: {
    success: string;
    successBg: string;
    successBorder: string;
    warning: string;
    warningBg: string;
    error: string;
    errorBg: string;
    errorBorder: string;
    info: string;
    infoBg: string;
  };

  overlay: {
    dark: string;
    light: string;
    medium: string;
  };

  tab: {
    active: string;
    inactive: string;
    background: string;
    border: string;
    itemactive: string;
    iteminactive: string;
  };

  transparent: string;
}

// ── Light palette ─────────────────────────────────────────────

export const LightColors: ColorPalette = {
  brand: {
    primary: "#16044d",
    secondary: "#0a0280",
    mid: "#1a10a0",
    light: "#3b2fd4",
    soft: "#6366f1",
    accent: "#6b44dc",
  },

  background: {
    page: "#f8fafc",
    card: "#ffffff",
    elevated: "#ffffff",
    tint: "#eef2ff",
    accent: "#e0e7ff",
    input: "#f8fafc",
    trans: "transparent",
  },

  text: {
    primary: "#0f172a",
    secondary: "#374151",
    muted: "#64748b",
    faint: "#94a3b8",
    disabled: "#cbd5e1",
    brand: "#4338ca",
    inverse: "#ffffff",
  },

  border: {
    default: "#e2e8f0",
    subtle: "#f1f5f9",
    brand: "#c7d2fe",
    strong: "#6366f1",
    input: "#e2e8f0",
    inputFocused: "#090025",
  },

  status: {
    success: "#22c55e",
    successBg: "#f0fdf4",
    successBorder: "#bbf7d0",
    warning: "#f59e0b",
    warningBg: "#fffbeb",
    error: "#ef4444",
    errorBg: "#fef2f2",
    errorBorder: "#fecaca",
    info: "#3b82f6",
    infoBg: "#eff6ff",
  },

  overlay: {
    dark: "rgba(0,0,0,0.5)",
    light: "rgba(255,255,255,0.1)",
    medium: "rgba(255,255,255,0.2)",
  },

  tab: {
    active: "#090025",
    inactive: "#94a3b8",
    background: "#ffffff",
    border: "#e2e8f0",
    itemactive: "#30215f",
    iteminactive: "#94a3b8",
  },

  transparent: "transparent",
};

// ── Dark palettes ─────────────────────────────────────────────

// Option A — Pure dark (Twitter/X style)
const DarkPure: ColorPalette = {
  brand: {
    primary: "#8b7cf6",
    secondary: "#7c6df0",
    mid: "#6d5de8",
    light: "#a78bfa",
    soft: "#4c3d99",
    accent: "#9b7aed",
  },

  background: {
    page: "#000000",
    card: "#111111",
    elevated: "#1a1a1a",
    tint: "#1a1030",
    accent: "#231845",
    input: "#111111",
    trans: "transparent",
  },

  text: {
    primary: "#f0f0f0",
    secondary: "#d4d4d4",
    muted: "#9ca3af",
    faint: "#6b7280",
    disabled: "#4b5563",
    brand: "#a78bfa",
    inverse: "#000000",
  },

  border: {
    default: "#222222",
    subtle: "#1a1a1a",
    brand: "#3b2f80",
    strong: "#7c6df0",
    input: "#333333",
    inputFocused: "#8b7cf6",
  },

  status: {
    success: "#4ade80",
    successBg: "#0a2017",
    successBorder: "#166534",
    warning: "#fbbf24",
    warningBg: "#1a1505",
    error: "#f87171",
    errorBg: "#1f0a0a",
    errorBorder: "#7f1d1d",
    info: "#60a5fa",
    infoBg: "#0a1628",
  },

  overlay: {
    dark: "rgba(0,0,0,0.7)",
    light: "rgba(255,255,255,0.05)",
    medium: "rgba(255,255,255,0.1)",
  },

  tab: {
    active: "#a78bfa",
    inactive: "#6b7280",
    background: "#000000",
    border: "#222222",
    itemactive: '#a78bfa',
    iteminactive: '#6b7280',

  },

  transparent: "transparent",
};

// Option B — Navy-tinted dark (branded, matches app icon)
const DarkNavy: ColorPalette = {
  brand: {
    primary: "#8b7cf6",
    secondary: "#7c6df0",
    mid: "#6d5de8",
    light: "#a78bfa",
    soft: "#4c3d99",
    accent: "#9b7aed",
  },

  background: {
    page: "#090025",
    card: "#130840",
    elevated: "#1a0f50",
    tint: "#1a1050",
    accent: "#231860",
    input: "#130840",
    trans: "transparent",
  },

  text: {
    primary: "#f0eeff",
    secondary: "#d4d0f0",
    muted: "#9b93c9",
    faint: "#6e65a0",
    disabled: "#4a4278",
    brand: "#a78bfa",
    inverse: "#090025",
  },

  border: {
    default: "#1e1260",
    subtle: "#150a45",
    brand: "#3b2f90",
    strong: "#7c6df0",
    input: "#251870",
    inputFocused: "#8b7cf6",
  },

  status: {
    success: "#4ade80",
    successBg: "#0a2020",
    successBorder: "#166534",
    warning: "#fbbf24",
    warningBg: "#1a1508",
    error: "#f87171",
    errorBg: "#200a10",
    errorBorder: "#7f1d1d",
    info: "#60a5fa",
    infoBg: "#0a1530",
  },

  overlay: {
    dark: "rgba(0,0,0,0.7)",
    light: "rgba(255,255,255,0.05)",
    medium: "rgba(255,255,255,0.1)",
  },

  tab: {
    active: "#a78bfa",
    inactive: "#6e65a0",
    background: "#090025",
    border: "#1e1260",
    itemactive: "#a78bfa",
    iteminactive: "#6e65a0",
  },

  transparent: "transparent",
};

// Option C — Near-black neutral (iOS style)
const DarkNeutral: ColorPalette = {
  brand: {
    primary: "#8b7cf6",
    secondary: "#7c6df0",
    mid: "#6d5de8",
    light: "#a78bfa",
    soft: "#4c3d99",
    accent: "#9b7aed",
  },

  background: {
    page: "#0a0a0a",
    card: "#1c1c1e",
    elevated: "#2c2c2e",
    tint: "#1a1530",
    accent: "#231845",
    input: "#1c1c1e",
    trans: "transparent",
  },

  text: {
    primary: "#f5f5f5",
    secondary: "#d1d1d1",
    muted: "#8e8e93",
    faint: "#636366",
    disabled: "#48484a",
    brand: "#a78bfa",
    inverse: "#0a0a0a",
  },

  border: {
    default: "#2c2c2e",
    subtle: "#1c1c1e",
    brand: "#3b2f80",
    strong: "#7c6df0",
    input: "#3a3a3c",
    inputFocused: "#8b7cf6",
  },

  status: {
    success: "#4ade80",
    successBg: "#0a2017",
    successBorder: "#166534",
    warning: "#fbbf24",
    warningBg: "#1a1505",
    error: "#f87171",
    errorBg: "#1f0a0a",
    errorBorder: "#7f1d1d",
    info: "#60a5fa",
    infoBg: "#0a1628",
  },

  overlay: {
    dark: "rgba(0,0,0,0.7)",
    light: "rgba(255,255,255,0.05)",
    medium: "rgba(255,255,255,0.1)",
  },

  tab: {
    active: "#a78bfa",
    inactive: "#636366",
    background: "#0a0a0a",
    border: "#2c2c2e",
    itemactive: "#a78bfa",
    iteminactive: "#636366",
  },

  transparent: "transparent",
};

// ── Dark palette map ──────────────────────────────────────────

const DarkPalettes: Record<DarkVariant, ColorPalette> = {
  pure: DarkPure,
  navy: DarkNavy,
  neutral: DarkNeutral,
};

export function getDarkColors(
  variant: DarkVariant = DARK_VARIANT,
): ColorPalette {
  return DarkPalettes[variant];
}

// ── Convenience export for current selection ──────────────────

export const DarkColors = DarkPalettes[DARK_VARIANT];
export const Colors = LightColors;
