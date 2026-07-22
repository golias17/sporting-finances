import { describe, it, expect } from "vitest";
import * as chartUtils from "../../src/charts/chartUtils.js";
import {
  getBrandColors,
  getZoneColors,
  hexToRgbArray,
  styledLineDataset,
} from "../../src/charts/chartUtils.js";
import * as chartPalette from "../../src/charts/chartPalette.js";
import * as chartAnnotations from "../../src/charts/chartAnnotations.js";
import * as chartWidgets from "../../src/charts/chartWidgets.js";
import * as chartDefaults from "../../src/charts/chartDefaults.js";

// chartUtils.js itself has no logic of its own — it's a pure re-export
// barrel over chartPalette.js/chartAnnotations.js/chartWidgets.js/
// chartDefaults.js (see the file's own header comment for why it was split
// this way while keeping one stable import path). Every consumer elsewhere
// in the app imports through this barrel, so the one thing actually worth
// testing about chartUtils.js itself is that the barrel doesn't silently
// drop or shadow anything — every symbol the four source files export must
// come through, and must be the exact same reference (not a copy), since
// e.g. ZONE_COLORS is relied on as a shared mutable object (see
// themeToggle.js's updateChartTheme()).
describe("chartUtils.js — re-export barrel", () => {
  it("re-exports every symbol from chartPalette.js unchanged", () => {
    for (const key of Object.keys(chartPalette)) {
      expect(chartUtils[key]).toBe(chartPalette[key]);
    }
  });

  it("re-exports every symbol from chartAnnotations.js unchanged", () => {
    for (const key of Object.keys(chartAnnotations)) {
      expect(chartUtils[key]).toBe(chartAnnotations[key]);
    }
  });

  it("re-exports every symbol from chartWidgets.js unchanged", () => {
    for (const key of Object.keys(chartWidgets)) {
      expect(chartUtils[key]).toBe(chartWidgets[key]);
    }
  });

  it("re-exports every symbol from chartDefaults.js unchanged", () => {
    for (const key of Object.keys(chartDefaults)) {
      expect(chartUtils[key]).toBe(chartDefaults[key]);
    }
  });

  it("exposes the specific named exports every other module actually imports by name", () => {
    // A generic "every key round-trips" loop (above) wouldn't catch a typo'd
    // rename in a downstream import statement — pin down the exact names
    // that matter, matched against real import statements across src/.
    const expected = [
      // chartPalette.js
      "fmtMillions",
      "getBrandColors",
      "getZoneColors",
      "hexToRgbArray",
      "ZONE_COLORS",
      // chartAnnotations.js
      "getPitchMilestone",
      "getEventAnnotations",
      "eventBoxes",
      // chartWidgets.js
      "externalTooltipHandler",
      // chartDefaults.js
      "styledLineDataset",
      "initChartDefaults",
      "baseOpts",
    ];
    expected.forEach((name) => {
      expect(chartUtils).toHaveProperty(name);
      expect(chartUtils[name]).toBeDefined();
    });
  });

  it("does not have any name collide across the four source files (later export * wouldn't silently shadow an earlier one)", () => {
    const sources = [
      chartPalette,
      chartAnnotations,
      chartWidgets,
      chartDefaults,
    ];
    const seen = new Map();
    sources.forEach((mod, i) => {
      Object.keys(mod).forEach((key) => {
        if (seen.has(key)) {
          throw new Error(
            `"${key}" is exported by both source module #${seen.get(key)} and #${i} — one silently shadows the other through the barrel.`,
          );
        }
        seen.set(key, i);
      });
    });
    // Getting here without throwing is the assertion; this line just gives
    // the test a visible pass condition too.
    expect(seen.size).toBeGreaterThan(0);
  });
});

// getBrandColors()/getZoneColors() are the single source of truth for the
// app's colors — chart builders, the PDF export (via hexToRgbArray), and
// FALLBACK constants in squadAnalytics.js/playground.js all derive from
// them instead of hand-copying hex values. These tests exist to catch the
// exact failure mode the code comments warn about: a color edited in one
// derived copy (e.g. a CSS variable) without updating this canonical
// source, or vice versa.
describe("chartUtils.js — getBrandColors()", () => {
  it("returns the light palette by default / when isDark is false", () => {
    const colors = getBrandColors(false);
    expect(colors.chartBg).toBe("#ffffff");
    expect(colors.green).toBe("#0a5d3a");
  });

  it("returns the dark palette when isDark is true", () => {
    const colors = getBrandColors(true);
    expect(colors.chartBg).toBe("#121513");
    expect(colors.pos).toBe("#3de080");
  });

  it("returns a fresh copy each call, not a shared mutable reference", () => {
    const a = getBrandColors(false);
    const b = getBrandColors(false);
    expect(a).not.toBe(b);
    a.green = "#000000";
    expect(b.green).toBe("#0a5d3a");
  });

  it("keeps gold/pos/warn at their current WCAG-AA-darkened values, matching _variables.css", () => {
    // Regression guard: these three were darkened for contrast in
    // _variables.css but the change initially missed this file, leaving
    // charts/PDF exports rendering the old, contrast-failing colors while
    // CSS-driven UI text had already moved on — silent drift between two
    // copies of the same "single source of truth". If this ever fails,
    // check whether _variables.css's :root values changed without this
    // palette being updated to match, or vice versa.
    const colors = getBrandColors(false);
    expect(colors.gold).toBe("#8b6c1c");
    expect(colors.pos).toBe("#2a7f4e");
    expect(colors.warn).toBe("#956817");
  });
});

describe("chartUtils.js — getZoneColors()", () => {
  it("returns translucent red/amber/green zone backgrounds for light mode", () => {
    const zones = getZoneColors(false);
    expect(zones.red).toContain("rgba(184,64,58");
    expect(zones.amber).toContain("rgba(201,140,31");
    expect(zones.green).toContain("rgba(46,138,85");
  });

  it("returns brighter zone backgrounds for dark mode", () => {
    const zones = getZoneColors(true);
    expect(zones.red).toContain("rgba(255, 107, 107");
  });

  it("returns a fresh copy each call", () => {
    const a = getZoneColors(false);
    const b = getZoneColors(false);
    expect(a).not.toBe(b);
  });
});

describe("chartUtils.js — hexToRgbArray()", () => {
  it("converts a #rrggbb hex string to a jsPDF-style [r, g, b] array", () => {
    expect(hexToRgbArray("#0a5d3a")).toEqual([10, 93, 58]);
    expect(hexToRgbArray("#ffffff")).toEqual([255, 255, 255]);
    expect(hexToRgbArray("#000000")).toEqual([0, 0, 0]);
  });

  it("round-trips the current brand palette's hex values correctly", () => {
    const colors = getBrandColors(false);
    expect(hexToRgbArray(colors.gold)).toEqual([139, 108, 28]);
    expect(hexToRgbArray(colors.pos)).toEqual([42, 127, 78]);
    expect(hexToRgbArray(colors.warn)).toEqual([149, 104, 23]);
  });
});

describe("chartUtils.js — styledLineDataset()", () => {
  it("builds the standard premium line-dataset shape from minimal args", () => {
    const ds = styledLineDataset({
      label: "Net Result",
      data: [1, 2, 3],
      color: "#0a5d3a",
      bg: "rgba(10,93,58,0.15)",
    });
    expect(ds.label).toBe("Net Result");
    expect(ds.data).toEqual([1, 2, 3]);
    expect(ds.borderColor).toBe("#0a5d3a");
    expect(ds.backgroundColor).toBe("rgba(10,93,58,0.15)");
    expect(ds.fill).toBe(false);
    expect(ds.spanGaps).toBe(false);
    expect(ds.borderWidth).toBe(3);
    expect(ds.tension).toBe(0.35);
  });

  it("only sets pointBorderColor when explicitly provided", () => {
    const withoutIt = styledLineDataset({
      label: "A",
      data: [],
      color: "#000",
      bg: "#000",
    });
    expect(withoutIt).not.toHaveProperty("pointBorderColor");

    const withIt = styledLineDataset({
      label: "A",
      data: [],
      color: "#000",
      bg: "#000",
      pointBorderColor: "#fff",
    });
    expect(withIt.pointBorderColor).toBe("#fff");
  });

  it("merges `extra` on top of the defaults, letting callers override any key", () => {
    const ds = styledLineDataset({
      label: "A",
      data: [],
      color: "#000",
      bg: "#000",
      extra: { type: "line", order: 1, borderWidth: 5 },
    });
    expect(ds.type).toBe("line");
    expect(ds.order).toBe(1);
    expect(ds.borderWidth).toBe(5); // extra overrides the default of 3
  });

  it("respects explicit fill/spanGaps overrides", () => {
    const ds = styledLineDataset({
      label: "A",
      data: [],
      color: "#000",
      bg: "#000",
      fill: true,
      spanGaps: true,
    });
    expect(ds.fill).toBe(true);
    expect(ds.spanGaps).toBe(true);
  });
});
