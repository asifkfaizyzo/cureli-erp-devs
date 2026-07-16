// src/theme/colors.ts

export interface ColorPalette {
  brand: {
    primary: string;
    secondary: string;
    mid: string;
    light: string;
    soft: string;
    accent: string;
    primaryText: string;
    primaryTextMuted: string;
    primaryTextSubtle: string;
    primaryBadgeBg: string;
    primaryThumbBorder: string;
  };

  background: {
    page: string;
    card: string;
    elevated: string;
    tint: string;
    accent: string;
    input: string;
    trans: string;
  };

  text: {
    primary: string;
    secondary: string;
    muted: string;
    faint: string;
    disabled: string;
    brand: string;
    inverse: string;
  };

  border: {
    default: string;
    subtle: string;
    brand: string;
    strong: string;
    input: string;
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

  header: {
    gradientFrom: string;
    gradientTo: string;
    onGradientText: string;
    onGradientTextMuted: string;
    onGradientTextSubtle: string;
    pillBg: string;
    pillBorder: string;
    locationGps: string;
    locationSaved: string;
    locationNone: string;
  };

  /**
   * Hero carousel card gradients + on-surface colors.
   * Each entry is a gradient pair [from, to] plus the text/icon
   * colors that sit on top of that gradient.
   */
  hero: {
    gradients: Array<[string, string]>;
    onGradientText: string;
    onGradientTextMuted: string;
    onGradientTextSubtle: string;
    ctaBg: string;
    ctaBorder: string;
    ctaText: string;
    placeholderBg: string;
    placeholderBorder: string;
    placeholderIcon: string;
    decorCircle: string;
    decorCircleSecondary: string;
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
    primaryText: "#ffffff",
    primaryTextMuted: "rgba(255,255,255,0.6)",
    primaryTextSubtle: "rgba(255,255,255,0.15)",
    primaryBadgeBg: "rgba(255,255,255,0.2)",
    primaryThumbBorder: "rgba(255,255,255,0.3)",
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

  header: {
    gradientFrom: "#05015A",
    gradientTo: "#a291f8",
    onGradientText: "#ffffff",
    onGradientTextMuted: "rgba(255,255,255,0.75)",
    onGradientTextSubtle: "rgba(255,255,255,0.55)",
    pillBg: "rgba(255,255,255,0.06)",
    pillBorder: "rgba(255,255,255,0.10)",
    locationGps: "#4ade80",
    locationSaved: "#c9b7ff",
    locationNone: "rgba(255,255,255,0.60)",
  },

  hero: {
    // Light mode: rich, saturated dark gradients — white text pops
    gradients: [
      ["#05015A", "#3b2fd4"],   // deep navy → indigo
      ["#0a0280", "#6366f1"],   // royal blue → soft purple
      ["#16044d", "#7c3aed"],   // dark plum → violet
    ],
    onGradientText: "#ffffff",
    onGradientTextMuted: "rgba(255,255,255,0.80)",
    onGradientTextSubtle: "rgba(255,255,255,0.55)",
    ctaBg: "rgba(255,255,255,0.20)",
    ctaBorder: "rgba(255,255,255,0.35)",
    ctaText: "#ffffff",
    placeholderBg: "rgba(255,255,255,0.13)",
    placeholderBorder: "rgba(255,255,255,0.20)",
    placeholderIcon: "rgba(255,255,255,0.90)",
    decorCircle: "rgba(255,255,255,0.07)",
    decorCircleSecondary: "rgba(255,255,255,0.05)",
  },

  transparent: "transparent",
};

// ── Dark palette ──────────────────────────────────────────────

export const DarkColors: ColorPalette = {
  brand: {
    primary: "#8b7cf6",
    secondary: "#7c6df0",
    mid: "#6d5de8",
    light: "#a78bfa",
    soft: "#4c3d99",
    accent: "#9b7aed",
    primaryText: "#0f0a2e",
    primaryTextMuted: "rgba(15,10,46,0.6)",
    primaryTextSubtle: "rgba(15,10,46,0.15)",
    primaryBadgeBg: "rgba(15,10,46,0.2)",
    primaryThumbBorder: "rgba(15,10,46,0.25)",
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

  header: {
    gradientFrom: "#0d0a2e",
    gradientTo: "#2d2060",
    onGradientText: "#f0eeff",
    onGradientTextMuted: "rgba(240,238,255,0.70)",
    onGradientTextSubtle: "rgba(240,238,255,0.45)",
    pillBg: "rgba(255,255,255,0.05)",
    pillBorder: "rgba(255,255,255,0.08)",
    locationGps: "#4ade80",
    locationSaved: "#a78bfa",
    locationNone: "rgba(240,238,255,0.50)",
  },

  hero: {
    // Dark mode: lighter, more vibrant gradients so they POP against
    // the near-black page background. Text is dark for contrast.
    gradients: [
      ["#6a5dcb", "#7a6cad"],   // purple → lavender
      ["#5456ca", "#6471a8"],   // indigo → periwinkle
      ["#6845ba", "#7f72a4"],   // violet → lilac
    ],
    // gradients: [
    //   ["#7c6df0", "#b4a0ff"],   // purple → lavender
    //   ["#6366f1", "#93a5f8"],   // indigo → periwinkle
    //   ["#8b5cf6", "#c4b0ff"],   // violet → lilac
    // ],
    onGradientText: "#ffffff",
    onGradientTextMuted: "rgba(255,255,255,0.80)",
    onGradientTextSubtle: "rgba(255,255,255,0.55)",
    ctaBg: "rgba(255,255,255,0.20)",
    ctaBorder: "rgba(255,255,255,0.35)",
    ctaText: "#ffffffe2",
    placeholderBg: "rgba(255,255,255,0.13)",
    placeholderBorder: "rgba(255,255,255,0.20)",
    placeholderIcon: "rgba(255,255,255,0.90)",
    decorCircle: "rgba(255,255,255,0.07)",
    decorCircleSecondary: "rgba(255,255,255,0.05)",
  },

  transparent: "transparent",
};

// ── Convenience alias ─────────────────────────────────────────

export const Colors = LightColors;