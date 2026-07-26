import React, { useMemo } from "react";
import { useAppState } from "../core/state.js";
import { styledLineDataset, getBrandColors, fmtMillions } from "../charts/chartUtils.js";
import { HEALTH_THRESHOLDS } from "./healthThresholds.js";
import { scenarioLabels } from "./playgroundUtils.js";
import type { ChartOptions } from "../core/types.js";

export function usePlaygroundCharts(
  baseline: { revenue_operating: number; personnel_costs: number; net_result: number; equity: number; cash: number },
  proj: { revenue_operating: number; personnel_costs: number; net_result: number; equity: number; cash: number },
  pinned: { netResult: number; equity: number } | null,
  isPt: boolean,
) {
  return React.useMemo(() => {
    if (!baseline || !proj) return null;
    const {
      baseline: baselineLabel,
      projected: projectedLabel,
      pinned: pinnedLabel,
    } = scenarioLabels(isPt);

    const labels = [
      isPt ? "Receita" : "Revenue",
      isPt ? "Pessoal" : "Payroll",
      isPt ? "Custos Op." : "Overhead",
      isPt ? "Result. Financeiro" : "Financial Result",
      isPt ? "Result. Líquido" : "Net Result",
      isPt ? "Capital Próprio" : "Equity",
    ];

    // Baseline dataset
    const baselineData = [
      baseline.revenue_operating,
      baseline.personnel_costs,
      0,
      0,
      baseline.net_result,
      baseline.equity,
    ];
    const projectedData = [
      proj.revenue_operating,
      proj.personnel_costs,
      0,
      0,
      proj.net_result,
      proj.equity,
    ];

    const brandColors = getBrandColors(useAppState.getState().theme === "dark");
    const colors = {
      pos: brandColors.green,
      neg: brandColors.neg,
      warn: brandColors.gold,
    };
    const posRgba = (opacity: number) =>
      `rgba(${parseInt(brandColors.green.slice(1, 3), 16)}, ${parseInt(brandColors.green.slice(3, 5), 16)}, ${parseInt(brandColors.green.slice(5, 7), 16)}, ${opacity})`;

    const datasets: any[] = [
      styledLineDataset({
        label: baselineLabel,
        data: baselineData,
        borderColor: colors.warn,
        backgroundColor: `${colors.warn}44`,
        borderDash: [5, 5],
        pointRadius: 4,
        fill: false,
      }),
      styledLineDataset({
        label: projectedLabel,
        data: projectedData,
        borderColor: colors.pos,
        backgroundColor: posRgba(0.15),
        pointRadius: 5,
        fill: "-1",
      }),
    ];

    if (pinned) {
      datasets.push(
        styledLineDataset({
          label: pinnedLabel,
          data: [0, 0, 0, 0, pinned.netResult, pinned.equity],
          borderColor: colors.neg,
          backgroundColor: `${colors.neg}44`,
          borderDash: [3, 3],
          pointRadius: 3,
          fill: false,
        }),
      );
    }

    const baseOpts = useAppState.getState().baseOpts;

    return {
      data: { labels, datasets },
      options: {
        ...baseOpts,
        plugins: {
          ...baseOpts?.plugins,
          tooltip: {
            ...baseOpts?.plugins?.tooltip,
            callbacks: {
              label: function (ctx: { dataset: { label: string }; parsed: { y: number } }) {
                return ` ${ctx.dataset.label}: ${fmtMillions(ctx.parsed.y)}`;
              },
            },
          },
        },
      } as ChartOptions<any>,
    };
  }, [baseline, proj, pinned, isPt]);
}
