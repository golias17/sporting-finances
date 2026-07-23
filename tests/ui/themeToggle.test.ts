import { describe, it, expect, beforeEach } from "vitest";
import { state } from "../../src/core/state.js";
import {
  updateChartTheme,
  MOON_SVG,
  SUN_SVG,
} from "../../src/ui/themeToggle.js";
import {
  getBrandColors,
  getZoneColors,
  ZONE_COLORS,
} from "../../src/charts/chartUtils.js";

describe("themeToggle.js", () => {
  beforeEach(() => {
    document.body.className = "";
    state.setIsPt(false);
    // Minimal shape updateChartTheme() needs — the real one is built by
    // initChartDefaults() (chartDefaults.js), not reproduced here.
    state.baseOpts = {
      scales: {
        x: { ticks: {} },
        y: { ticks: {}, grid: {} },
      },
    };
  });

  describe("SVG icon constants", () => {
    it("MOON_SVG contains a path element (crescent moon)", () => {
      expect(MOON_SVG).toContain("<path");
      expect(MOON_SVG).toContain("M21 12.79");
    });

    it("SUN_SVG contains a circle element (sun)", () => {
      expect(SUN_SVG).toContain("<circle");
      expect(SUN_SVG).toContain('cx="12"');
    });
  });

  describe("updateChartTheme", () => {
    it("applies the light-mode brand and zone palettes when body isn't .dark", () => {
      updateChartTheme();
      const light = getBrandColors(false);
      expect(state.COLORS.ink).toBe(light.ink);
      expect(state.COLORS.gold).toBe(light.gold);
      expect(state.COLORS.pos).toBe(light.pos);
      expect(ZONE_COLORS.red).toBe(getZoneColors(false).red);
    });

    it("applies the dark-mode brand and zone palettes when body has .dark", () => {
      document.body.classList.add("dark");
      updateChartTheme();
      const dark = getBrandColors(true);
      expect(state.COLORS.ink).toBe(dark.ink);
      expect(state.COLORS.gold).toBe(dark.gold);
      expect(state.COLORS.pos).toBe(dark.pos);
      expect(ZONE_COLORS.red).toBe(getZoneColors(true).red);
    });

    it("mutates the shared ZONE_COLORS object in place rather than replacing it", () => {
      // themeToggle.js's own comment explains why: consumers import this
      // exact object reference and expect in-place updates to be visible
      // without re-importing.
      const before = ZONE_COLORS;
      document.body.classList.add("dark");
      updateChartTheme();
      expect(ZONE_COLORS).toBe(before);
    });

    it("points baseOpts' axis tick colors at the freshly-applied muted color", () => {
      document.body.classList.add("dark");
      updateChartTheme();
      expect(state.baseOpts.scales.x.ticks.color).toBe(state.COLORS.muted);
      expect(state.baseOpts.scales.y.ticks.color).toBe(state.COLORS.muted);
    });

    it("sets the y-axis grid color for dark vs light mode", () => {
      updateChartTheme();
      expect(state.baseOpts.scales.y.grid.color).toBe("rgba(0,0,0,0.05)");

      document.body.classList.add("dark");
      updateChartTheme();
      expect(state.baseOpts.scales.y.grid.color).toBe("rgba(255,255,255,0.12)");
    });

    it("does not throw when baseOpts.scales.y has no grid object", () => {
      state.baseOpts.scales.y.grid = undefined;
      expect(() => updateChartTheme()).not.toThrow();
    });
  });
});
