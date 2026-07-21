import { describe, it, expect, beforeEach } from "vitest";
import { state } from "../../src/core/state.js";
import { updateThemeUI, updateChartTheme } from "../../src/ui/themeToggle.js";
import {
  getBrandColors,
  getZoneColors,
  ZONE_COLORS,
} from "../../src/charts/chartUtils.js";

describe("themeToggle.js", () => {
  beforeEach(() => {
    document.body.className = "";
    document.body.innerHTML = `
      <button id="themeToggleBtn">
        <svg></svg>
        <span></span>
      </button>
    `;
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

  describe("updateThemeUI", () => {
    it("does nothing (no throw) when the theme button isn't in the DOM", () => {
      document.body.innerHTML = "";
      expect(() => updateThemeUI(true)).not.toThrow();
    });

    it("does nothing (no throw) when the button has no span/svg children", () => {
      document.body.innerHTML = `<button id="themeToggleBtn"></button>`;
      expect(() => updateThemeUI(true)).not.toThrow();
      expect(() => updateThemeUI(false)).not.toThrow();
    });

    it("shows 'Light Mode' and a sun icon when switching to dark mode (EN)", () => {
      updateThemeUI(true);
      const btn = document.getElementById("themeToggleBtn");
      expect(btn.querySelector("span").textContent).toBe("Light Mode");
      // Sun icon is built from <circle>/<line> primitives; moon is a single <path>.
      expect(btn.querySelector("svg").innerHTML).toContain("<circle");
    });

    it("shows 'Dark Mode' and a moon icon when switching to light mode (EN)", () => {
      updateThemeUI(false);
      const btn = document.getElementById("themeToggleBtn");
      expect(btn.querySelector("span").textContent).toBe("Dark Mode");
      expect(btn.querySelector("svg").innerHTML).toContain("<path");
      expect(btn.querySelector("svg").innerHTML).not.toContain("<circle");
    });

    it("localises the label to Portuguese when state.isPt is true", () => {
      state.setIsPt(true);
      const btn = document.getElementById("themeToggleBtn");

      updateThemeUI(true);
      expect(btn.querySelector("span").textContent).toBe("Modo Claro");

      updateThemeUI(false);
      expect(btn.querySelector("span").textContent).toBe("Modo Escuro");
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
