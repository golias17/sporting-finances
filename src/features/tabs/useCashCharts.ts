import { useMemo } from "react";
import { useAppState, state } from "../../core/state.js";
import { baseOpts, styledLineDataset, fmtMillions } from "../../charts/chartUtils.js";
import { useChartLabels, usePosNegBarChart } from "../../charts/chartHooks.js";
import type { ChartData, ChartOptions } from "chart.js";

export function useCashCharts() {
  const isPt = useAppState((s) => s.isPt);
  const annual = useAppState((s) => s.annual);
  const baseLabels = useChartLabels();

  const cashFlowData = useMemo<ChartData<"bar">>(
    () => ({
      labels: baseLabels,
      datasets: [
        {
          label: isPt ? "Operacional" : "Operating",
          data: annual.map((d) => d.cf_operating),
          backgroundColor: state.COLORS.negSoft,
          borderColor: state.COLORS.neg,
          borderWidth: 1,
        },
        {
          label: isPt
            ? "Investimento (incl. passes)"
            : "Investing (incl. player sales)",
          data: annual.map((d) => d.cf_investing),
          backgroundColor: state.COLORS.posSoft,
          borderColor: state.COLORS.pos,
          borderWidth: 1,
        },
        {
          label: isPt ? "Financiamento" : "Financing",
          data: annual.map((d) => d.cf_financing),
          backgroundColor: state.COLORS.infoSoft,
          borderColor: state.COLORS.info,
          borderWidth: 1,
        },
      ],
    }),
    [baseLabels, annual, isPt],
  );

  const cashFlowOptions = useMemo<ChartOptions<"bar">>(
    () => ({
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
      },
      scales: {
        ...baseOpts.scales,
        y: { ...(baseOpts.scales?.y || {}), beginAtZero: false },
      },
    }),
    [],
  );

  const cashData = useMemo<ChartData<"line">>(
    () => ({
      labels: baseLabels,
      datasets: [
        {
          ...styledLineDataset({
            label: isPt ? "Caixa e equivalentes" : "Cash & equivalents",
            data: annual.map((d) => d.cash),
            color: state.COLORS.gold,
            bg: state.COLORS.goldSoft,
            fill: true,
          }),
        } as any,
      ],
    }),
    [baseLabels, annual, isPt],
  );

  const cashOptions = useMemo<ChartOptions<"line">>(
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
    }),
    [],
  );

  const annualNet = usePosNegBarChart(
    isPt ? "Resultado líquido" : "Net result",
    annual.map((d) => d.net_result),
    3,
  );

  return {
    cashFlow: { data: cashFlowData, options: cashFlowOptions },
    cash: { data: cashData, options: cashOptions },
    annualNet,
  };
}
