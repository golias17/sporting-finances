import { useMemo } from "react";
import { useAppState, state } from "../../core/state.js";
import {
  baseOpts,
  styledLineDataset,
  eventBoxes,
  fmtMillions,
} from "../../charts/chartUtils.js";
import { useChartLabels, usePosNegBarChart } from "../../charts/chartHooks.js";
import type { ChartData, ChartOptions } from "chart.js";
import { STORY_STEPS } from "../storySteps.js";

export function useOverviewCharts() {
  const isPt = useAppState((s) => s.isPt);
  const annual = useAppState((s) => s.annual);
  const labels = useChartLabels();

  const heroData = useMemo<ChartData<"bar" | "line">>(
    () => ({
      labels,
      datasets: [
        {
          ...styledLineDataset({
            label: isPt ? "Receitas operacionais" : "Operating revenue",
            data: annual.map((d) => d.revenue_operating),
            color: state.COLORS.green,
            bg: state.COLORS.greenSoft,
            extra: { yAxisID: "y" },
          }),
          type: "line",
        },
        {
          ...styledLineDataset({
            label: isPt ? "Resultado líquido" : "Net result",
            data: annual.map((d) => d.net_result),
            color: state.COLORS.gold,
            bg: state.COLORS.goldSoft,
            extra: { yAxisID: "y" },
          }),
          type: "line",
        },
        {
          ...styledLineDataset({
            label: isPt ? "Capital próprio" : "Shareholders' equity",
            data: annual.map((d) => d.equity),
            color: state.COLORS.info,
            bg: "rgba(58,114,184,0.1)",
            extra: { yAxisID: "y" },
          }),
          type: "line",
        },
      ] as any,
    }),
    [labels, annual, isPt],
  );

  const isStoryVisible = useAppState((s) => s.isStoryVisible);
  const storyIndex = useAppState((s) => s.storyIndex);

  const heroOptions = useMemo<ChartOptions<any>>(() => {
    const annotations: Record<string, { type: string; xMin: string; xMax: string; borderColor: string; borderWidth: number; label: { display: boolean; content: string } }> = eventBoxes([
      "restructure14",
      "alcochete",
      "covid",
      "vmoc1",
      "vmoc2",
      "uspp",
    ]);

    if (isStoryVisible) {
      const step = STORY_STEPS[storyIndex];
      const inRange = annual && annual.some((d) => d.label === step.season);
      if (inRange) {
        annotations.storyHighlight = {
          type: "line",
          xMin: step.season,
          xMax: step.season,
          borderColor: "rgba(200,169,81,0.95)",
          borderWidth: 3,
          label: { display: false },
        };
      }
    }

    return {
      ...baseOpts,
      plugins: {
        ...baseOpts.plugins,
        tooltip: {
          ...baseOpts.plugins.tooltip,
          callbacks: {
            label: (ctx: { dataset: { label: string }; parsed: { y: number } }) =>
              ` ${ctx.dataset.label}: ${fmtMillions(ctx.parsed.y)}`,
          },
        },
        annotation: {
          drawTime: "beforeDatasetsDraw",
          annotations,
        },
      },
      scales: {
        ...baseOpts.scales,
        y: {
          ...(baseOpts.scales?.y || {}),
          beginAtZero: false,
          title: {
            display: true,
            text: isPt ? "Milhões de EUR" : "EUR (millions)",
          },
        },
      },
    };
  }, [isPt, isStoryVisible, storyIndex, annual]);

  const netResult = usePosNegBarChart(
    isPt ? "Resultado líquido" : "Net result",
    annual.map((d) => d.net_result),
  );

  const equity = usePosNegBarChart(
    isPt ? "Capital próprio" : "Equity",
    annual.map((d) => d.equity),
  );

  return { heroData, heroOptions, netResult, equity };
}
