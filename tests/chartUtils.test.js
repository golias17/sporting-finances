import { describe, it, expect } from "vitest";
import {
  getBrandColors,
  getZoneColors,
  hexToRgbArray,
  styledLineDataset,
} from "../src/chartUtils.js";

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
