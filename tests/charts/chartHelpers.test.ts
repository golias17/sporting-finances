import { describe, it, expect } from "vitest";
import {
  formatters,
  createTooltipOptions,
  createTooltipOptionsWithFn,
  createChartOptions,
} from "../../src/charts/chartHelpers";

describe("chartHelpers", () => {
  describe("formatters", () => {
    it("formats millions correctly", () => {
      expect(formatters.millions(25500)).toBe("€25.5M");
    });

    it("formats negative millions correctly", () => {
      expect(formatters.millions(-1000)).toBe("€−1.0M");
    });

    it("formats zero millions correctly", () => {
      expect(formatters.millions(0)).toBe("€0.0M");
    });

    it("formats percent correctly", () => {
      expect(formatters.percent(52.345)).toBe("52.3%");
    });

    it("formats percentInt correctly", () => {
      expect(formatters.percentInt(52.3)).toBe("52%");
    });

    it("formats ratio correctly", () => {
      expect(formatters.ratio(2.55)).toBe("2.5×");
    });

    it("formats ratioInt correctly", () => {
      expect(formatters.ratioInt(2.4)).toBe("2×");
    });

    it("formats thousands correctly", () => {
      expect(formatters.thousands(25500)).toBe("€25500.0k");
    });

    it("formats millionsRaw correctly", () => {
      expect(formatters.millionsRaw(25.5)).toBe("€25.5M");
    });
  });

  describe("createTooltipOptions", () => {
    const baseTooltip = {
      enabled: false,
      callbacks: {
        label: () => "",
      },
    };

    it("creates tooltip options with formatter", () => {
      const result = createTooltipOptions(baseTooltip as any, formatters.millions);
      expect(result).toHaveProperty("callbacks");
      expect(result.callbacks).toHaveProperty("label");
    });

    it("formats tooltip label correctly", () => {
      const result = createTooltipOptions(baseTooltip as any, formatters.percent);
      const labelFn = result.callbacks.label as (ctx: any) => string;
      const ctx = {
        dataset: { label: "Test" },
        parsed: { y: 52.345 },
      };
      const label = labelFn(ctx);
      expect(label).toContain("Test");
      expect(label).toContain("52.3%");
    });

    it("creates tooltip options with suffix", () => {
      const result = createTooltipOptions(baseTooltip as any, formatters.millions, "of revenue");
      const labelFn = result.callbacks.label as (ctx: any) => string;
      const ctx = {
        dataset: { label: "Test" },
        parsed: { y: 25500 },
      };
      expect(labelFn(ctx)).toContain("of revenue");
    });
  });

  describe("createTooltipOptionsWithFn", () => {
    const baseTooltip = {
      enabled: false,
      callbacks: {
        label: () => "",
      },
    };

    it("creates tooltip options with custom label function", () => {
      const customLabel = (ctx: any) =>
        `Custom: ${ctx.dataset.label} = ${ctx.parsed.y}`;

      const result = createTooltipOptionsWithFn(baseTooltip as any, customLabel);
      const labelFn = result.callbacks.label as (ctx: any) => string;

      const ctx = {
        dataset: { label: "Test" },
        parsed: { y: 42 },
      };
      expect(labelFn(ctx)).toBe("Custom: Test = 42");
    });
  });

  describe("createChartOptions", () => {
    it("creates chart options with tooltip and scales", () => {
      const baseOpts = {
        responsive: true,
        plugins: {
          tooltip: {
            enabled: false,
            callbacks: {
              label: () => "",
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 10,
            },
          },
        },
      };

      const result = createChartOptions(baseOpts, formatters.millions);
      expect(result).toHaveProperty("responsive", true);
      expect(result).toHaveProperty("plugins.tooltip");
      expect(result).toHaveProperty("scales.y.ticks");
    });
  });
});
