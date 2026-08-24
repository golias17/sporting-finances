// CHART HELPERS
// =============================================================
// Shared helper functions for chart configurations.
// Reduces code duplication across chart option files.

import { fmtMillions } from "./chartPalette.js";

// Context type for tooltip callbacks
export interface TooltipContext {
  dataset: { label: string };
  parsed: { y: number };
}

// Format options for tooltip values
export type TooltipFormatter = (value: number) => string;

// Default formatters for common use cases
export const formatters = {
  /** Format as millions with currency symbol: €25.5M */
  millions: (v: number) => fmtMillions(v),

  /** Format as percentage: 52.3% */
  percent: (v: number) => `${v.toFixed(1)}%`,

  /** Format as percentage without decimal: 52% */
  percentInt: (v: number) => `${v.toFixed(0)}%`,

  /** Format as ratio with × suffix: 2.5× */
  ratio: (v: number) => `${v.toFixed(1)}×`,

  /** Format as ratio without decimal: 2× */
  ratioInt: (v: number) => `${v.toFixed(0)}×`,

  /** Format as k€: €25.5k */
  thousands: (v: number) => `€${v.toFixed(1)}k`,

  /** Format as M€: €25.5M (for values already in millions) */
  millionsRaw: (v: number) => `€${v.toFixed(1)}M`,
};

/**
 * Creates tooltip options with a label formatter.
 * Reduces boilerplate across chart option files.
 *
 * @param baseOpts - Base chart options from baseOpts.plugins.tooltip
 * @param formatter - Function to format the tooltip value
 * @param suffix - Optional suffix to add after the value
 * @returns Tooltip configuration object
 */
export function createTooltipOptions(
  baseOpts: any,
  formatter: TooltipFormatter,
  suffix?: string,
): Record<string, unknown> {
  return {
    ...baseOpts?.tooltip,
    callbacks: {
      ...baseOpts?.tooltip?.callbacks,
      label: (ctx: TooltipContext) => {
        const value = ctx.parsed.y;
        const formatted = formatter(value);
        const suffixStr = suffix ? ` ${suffix}` : "";
        return ` ${ctx.dataset.label}: ${formatted}${suffixStr}`;
      },
    },
  };
}

/**
 * Creates tooltip options with a custom label function.
 * For cases where the formatter needs more context.
 *
 * @param baseOpts - Base chart options from baseOpts.plugins.tooltip
 * @param labelFn - Custom label function
 * @returns Tooltip configuration object
 */
export function createTooltipOptionsWithFn(
  baseOpts: any,
  labelFn: (ctx: TooltipContext) => string,
): Record<string, unknown> {
  return {
    ...baseOpts?.tooltip,
    callbacks: {
      ...baseOpts?.tooltip?.callbacks,
      label: labelFn,
    },
  };
}

/**
 * Creates chart options with tooltip and y-axis callback.
 * Combines tooltip formatting with y-axis label formatting.
 *
 * @param baseOpts - Base chart options
 * @param formatter - Function to format values
 * @returns Chart options with tooltip and y-axis configured
 */
export function createChartOptions(
  baseOpts: any,
  formatter: TooltipFormatter,
): Record<string, unknown> {
  return {
    ...baseOpts,
    plugins: {
      ...baseOpts?.plugins,
      tooltip: createTooltipOptions(baseOpts?.plugins, formatter),
    },
    scales: {
      ...baseOpts?.scales,
      y: {
        ...baseOpts?.scales?.y,
        ticks: {
          ...baseOpts?.scales?.y?.ticks,
          callback: (value: number | string) => formatter(Number(value)),
        },
      },
    },
  };
}
