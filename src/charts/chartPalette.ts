// CHART PALETTE & NUMBER FORMATTING
// =============================================================

export const fmtMillions = (v: number | null | undefined) => {
  if (v === null || v === undefined) return "—";
  return "€" + (v < 0 ? "−" : "") + Math.abs(v / 1000).toFixed(1) + "M";
};

// =============================================================
// CANONICAL COLOR PALETTE
//
// Single source of truth for the app's brand/status colors, in both light
// and dark mode. These used to be hand-duplicated across initChartDefaults()
// (chartDefaults.js), updateChartTheme() in themeToggle.js, the hardcoded
// fallback literals in squadAnalytics.js/playground.js, and an entirely
// separate RGB-array copy in pdfGenerator.js for the PDF export — copies
// that had already drifted out of sync with each other (the PDF's gold and
// "negative" colors were stale values from before the app's palette was
// last tuned). Every consumer now derives from getBrandColors()/
// getZoneColors() so there is exactly one place to edit a color.
//
// Light-mode values match _variables.css's :root block exactly (--ink,
// --muted, --gold, --neg, --warn, --info, --pos, --green). Dark-mode
// green/gold/info are intentionally brighter than their CSS variables
// (which don't define dark-mode overrides for those three): a chart line
// needs more contrast against a near-black canvas than a button or badge
// does against a translucent dark surface, so dimming these to match CSS
// would hurt legibility. Dark-mode ink/muted/pos/neg/warn do have CSS
// overrides (body.dark in _variables.css) and match those exactly.
//
// mutedSoft is dimmer than the other *Soft tokens (0.35/0.2 opacity vs their
// 0.7/0.35) — it's used for catch-all "other" categories that should recede
// behind the real data series, not compete with them at the same visual
// weight the way posSoft/negSoft/infoSoft/goldSoft do for meaningful values.
const PALETTE = {
  light: {
    ink: "#111814",
    muted: "#6a716e",
    mutedSoft: "rgba(106,113,110,0.35)",
    chartBg: "#ffffff",
    green: "#0a5d3a",
    greenLight: "#2e9e6c",
    greenSoft: "rgba(10,93,58,0.15)",
    // gold/pos/warn were darkened to their current values in a WCAG AA
    // contrast pass (see _variables.css's matching comment) that touched
    // --gold/--pos/--warn there but missed updating this palette to match
    // — exactly the "drifted out of sync" failure mode this comment block
    // warns about above, just a new instance of it. Chart lines/bars and
    // the PDF export (both derived from this file, not CSS) were rendering
    // the old, contrast-failing colors while CSS-driven UI text had
    // already moved to the compliant ones.
    gold: "#8b6c1c",
    goldSoft: "rgba(139,108,28,0.4)",
    pos: "#2a7f4e",
    posSoft: "rgba(42,127,78,0.7)",
    neg: "#b8403a",
    negSoft: "rgba(184,64,58,0.7)",
    warn: "#956817",
    info: "#2c5b8a",
    infoSoft: "rgba(44,91,138,0.7)",
    lineBorder: "rgba(0, 0, 0, 0.12)",
  },
  dark: {
    ink: "#eaeaea",
    muted: "#8c938f",
    mutedSoft: "rgba(140,147,143,0.2)",
    chartBg: "#121513",
    green: "#2e9e6c",
    greenLight: "#3de080",
    greenSoft: "rgba(46, 158, 105, 0.2)",
    gold: "#ffd54f",
    goldSoft: "rgba(255, 213, 79, 0.25)",
    pos: "#3de080",
    posSoft: "rgba(61, 224, 128, 0.35)",
    neg: "#ff6b6b",
    negSoft: "rgba(255, 107, 107, 0.35)",
    warn: "#ffb300",
    info: "#52a3ff",
    infoSoft: "rgba(82, 163, 255, 0.35)",
    lineBorder: "rgba(255, 255, 255, 0.3)",
  },
};

// Low-opacity zone backgrounds for the health-ratio charts. Light-mode
// values match the --neg/--warn/--pos CSS variables above, just translucent.
const ZONE_PALETTE = {
  light: {
    red: "rgba(184,64,58,0.07)",
    amber: "rgba(201,140,31,0.08)",
    green: "rgba(46,138,85,0.06)",
  },
  dark: {
    red: "rgba(255, 107, 107, 0.15)",
    amber: "rgba(255, 179, 0, 0.15)",
    green: "rgba(61, 224, 128, 0.08)",
  },
};

export function getBrandColors(isDark: boolean) {
  return { ...PALETTE[isDark ? "dark" : "light"] };
}

export function getZoneColors(isDark: boolean) {
  return { ...ZONE_PALETTE[isDark ? "dark" : "light"] };
}

// Converts a "#rrggbb" hex string to a jsPDF-style [r, g, b] array. Used by
// pdfGenerator.js so the PDF export's colors stay derived from the same
// canonical hex values instead of a hand-copied RGB triple.
export function hexToRgbArray(hex: string) {
  const int = parseInt(hex.replace("#", ""), 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

// Exported as a mutable object (rather than reassigned) because consumers
// import this exact reference and expect in-place updates from
// updateChartTheme() (themeToggle.js) to be visible without re-importing.
export const ZONE_COLORS = getZoneColors(false);

