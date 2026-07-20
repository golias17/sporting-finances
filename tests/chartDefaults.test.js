import { describe, it, expect, beforeEach } from "vitest";
import { state } from "../src/state.js";
import { initChartDefaults, baseOpts } from "../src/chartDefaults.js";
import { externalTooltipHandler } from "../src/chartWidgets.js";
import { getBrandColors } from "../src/chartPalette.js";

// initChartDefaults() is called exactly once during real app boot (and once
// in chart.test.js's beforeAll, purely as setup for the chart builders under
// test there) but its own output — the actual shape of state.baseOpts/
// state.COLORS it produces — was never directly asserted on anywhere. These
// tests exercise every branch of the object it builds.
describe("chartDefaults.js — initChartDefaults()", () => {
  beforeEach(() => {
    state.isPt = false;
  });

  it("sets the core Chart.js-wide behavior flags", () => {
    initChartDefaults();
    expect(state.baseOpts.responsive).toBe(true);
    expect(state.baseOpts.maintainAspectRatio).toBe(false);
    expect(state.baseOpts.interaction).toEqual({
      mode: "index",
      intersect: false,
    });
  });

  it("configures the shared legend", () => {
    initChartDefaults();
    const legend = state.baseOpts.plugins.legend;
    expect(legend.position).toBe("bottom");
    expect(legend.labels.boxWidth).toBe(12);
    expect(legend.labels.font.size).toBe(11.5);
  });

  it("disables the built-in tooltip renderer in favor of the shared glass tooltip", () => {
    initChartDefaults();
    const tooltip = state.baseOpts.plugins.tooltip;
    expect(tooltip.enabled).toBe(false);
    expect(tooltip.external).toBe(externalTooltipHandler);
  });

  it("tooltip footer callback resolves the hovered season's pitch milestone", () => {
    initChartDefaults();
    const footer = state.baseOpts.plugins.tooltip.callbacks.footer;

    expect(footer([{ label: "2020/21" }])).toContain(
      "Champions! First Primeira Liga title in 19 years.",
    );

    state.isPt = true;
    expect(footer([{ label: "2020/21" }])).toContain(
      "Campeões! 1º título da Primeira Liga em 19 anos.",
    );
  });

  it("tooltip footer callback returns an empty string when there's no label to resolve", () => {
    initChartDefaults();
    const footer = state.baseOpts.plugins.tooltip.callbacks.footer;
    expect(footer([])).toBe("");
    expect(footer([{}])).toBe("");
  });

  it("enables ctrl-modified wheel zoom, pinch zoom, and panning on the x axis", () => {
    initChartDefaults();
    const zoom = state.baseOpts.plugins.zoom;
    expect(zoom.pan).toEqual({ enabled: true, mode: "x" });
    expect(zoom.zoom.wheel).toEqual({ enabled: true, modifierKey: "ctrl" });
    expect(zoom.zoom.pinch).toEqual({ enabled: true });
    expect(zoom.zoom.mode).toBe("x");
  });

  it("configures the x/y scales, including a hidden x-grid and a visible y-grid", () => {
    initChartDefaults();
    const { x, y } = state.baseOpts.scales;
    expect(x.ticks.font.size).toBe(11);
    expect(x.ticks.color).toBe(state.COLORS.muted);
    expect(x.grid.display).toBe(false);
    expect(y.ticks.font.size).toBe(11);
    expect(y.ticks.color).toBe(state.COLORS.muted);
    expect(y.grid.color).toBe("rgba(0,0,0,0.05)");
    expect(y.beginAtZero).toBe(true);
  });

  it("formats y-axis ticks as whole-number euro-millions", () => {
    initChartDefaults();
    const fmt = state.baseOpts.scales.y.ticks.callback;
    expect(fmt(25000)).toBe("€25M");
    expect(fmt(0)).toBe("€0M");
    expect(fmt(-5000)).toBe("€-5M");
  });

  it("populates state.COLORS with the light-mode brand palette", () => {
    initChartDefaults();
    const light = getBrandColors(false);
    expect(state.COLORS.green).toBe(light.green);
    expect(state.COLORS.gold).toBe(light.gold);
    expect(state.COLORS.muted).toBe(light.muted);
    expect(state.COLORS.chartBg).toBe(light.chartBg);
  });

  it("mutates state.baseOpts in place, so a reference captured before the call stays live", () => {
    // The function's own doc comment: reassigning state.baseOpts instead of
    // Object.assign-ing into it would leave any module that captured
    // `const x = state.baseOpts` at import time pointing at a stale, empty
    // object once initChartDefaults() actually runs.
    const capturedBeforeCall = state.baseOpts;
    initChartDefaults();
    expect(state.baseOpts).toBe(capturedBeforeCall);
    expect(capturedBeforeCall.responsive).toBe(true);
  });

  it("keeps chartDefaults.js's own `baseOpts` export in sync with state.baseOpts by reference", () => {
    // baseOpts is exported as `state.baseOpts` captured once at module load —
    // only a live reference (not a copy) makes it correct to consume before
    // vs. after initChartDefaults() runs, per this file's own comment.
    initChartDefaults();
    expect(baseOpts).toBe(state.baseOpts);
    expect(baseOpts.responsive).toBe(true);
    expect(baseOpts.plugins.legend.position).toBe("bottom");
  });
});
