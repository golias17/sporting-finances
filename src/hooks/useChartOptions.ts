import { useMemo } from "react";
import { useAppState } from "../core/state.js";
import { getBrandColors, getZoneColors } from "../charts/chartPalette.js";
import type { TooltipFormatter } from "../charts/chartHelpers.js";
import { createTooltipOptions } from "../charts/chartHelpers.js";

// Hook to create memoized chart options with theme-aware colors
export function useChartOptions(
  formatter: TooltipFormatter,
  extraOptions?: Record<string, unknown>
) {
  const theme = useAppState((s) => s.theme);
  const baseOpts = useAppState((s) => s.baseOpts);

  const isDark = theme === "dark";

  const options = useMemo(() => {
    const colors = getBrandColors(isDark);
    const zoneColors = getZoneColors(isDark);

    return {
      ...baseOpts,
      plugins: {
        ...baseOpts?.plugins,
        tooltip: createTooltipOptions(baseOpts?.plugins as any, formatter),
      },
      ...extraOptions,
    };
  }, [baseOpts, isDark, formatter, extraOptions]);

  return { options, colors: getBrandColors(isDark), zoneColors: getZoneColors(isDark) };
}

// Hook to create memoized chart options for percentage charts
export function usePercentageChartOptions(
  extraOptions?: Record<string, unknown>
) {
  const { options, colors, zoneColors } = useChartOptions(
    (v: number) => `${v.toFixed(1)}%`,
    extraOptions
  );

  return { options, colors, zoneColors };
}

// Hook to create memoized chart options for million charts
export function useMillionsChartOptions(
  extraOptions?: Record<string, unknown>
) {
  const { options, colors, zoneColors } = useChartOptions(
    (v: number) => `€${(v / 1000).toFixed(1)}M`,
    extraOptions
  );

  return { options, colors, zoneColors };
}

// Hook to create memoized chart options for ratio charts
export function useRatioChartOptions(
  extraOptions?: Record<string, unknown>
) {
  const { options, colors, zoneColors } = useChartOptions(
    (v: number) => `${v.toFixed(1)}×`,
    extraOptions
  );

  return { options, colors, zoneColors };
}
