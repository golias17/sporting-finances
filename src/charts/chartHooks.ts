import { useMemo } from "react";
import { useAppState, state } from "../core/state.js";
import { baseOpts, fmtMillions } from "./chartUtils.js";
import { getBrandColors } from "./chartPalette.js";

const FALLBACK = getBrandColors(false);

export function useChartLabels() {
  const annual = useAppState((s) => s.annual);
  return useMemo(() => annual.map((d) => d.label), [annual]);
}

export function usePosNegBarChart(
  labelText: string,
  data: number[],
  borderRadius?: number,
) {
  const labels = useChartLabels();

  const chartData = useMemo(
    () => ({
      labels,
      datasets: [
        {
          type: "bar",
          label: labelText,
          data,
          backgroundColor: data.map((v) =>
            v >= 0
              ? state.COLORS.posSoft || FALLBACK.posSoft
              : state.COLORS.negSoft || FALLBACK.negSoft,
          ),
          borderColor: data.map((v) =>
            v >= 0
              ? state.COLORS.pos || FALLBACK.pos
              : state.COLORS.neg || FALLBACK.neg,
          ),
          borderWidth: 1,
          ...(borderRadius ? { borderRadius } : {}),
        },
      ],
    }),
    [labels, labelText, data, borderRadius],
  );

  const chartOptions = useMemo(
    () => ({
      ...baseOpts,
      plugins: {
        ...baseOpts.plugins,
        legend: { display: false },
        tooltip: {
          ...baseOpts.plugins.tooltip,
          callbacks: {
            label: (ctx: { dataset: { label: string }; parsed: { y: number } }) =>
              ` ${ctx.dataset.label}: ${fmtMillions(ctx.parsed.y)}`,
          },
        },
      },
      scales: {
        ...baseOpts.scales,
        y: { ...(baseOpts.scales?.y || {}), beginAtZero: false },
      },
    }),
    [],
  );

  return { data: chartData, options: chartOptions };
}
