import { useMemo } from "react";
import { useAppState, state } from "../../core/state.js";
import { baseOpts, styledLineDataset, fmtMillions } from "../../charts/chartUtils.js";
import { useChartLabels } from "../../charts/chartHooks.js";
import type { ChartData, ChartOptions } from "chart.js";

export function useDebtCharts() {
  const isPt = useAppState((s) => s.isPt);
  const annual = useAppState((s) => s.annual);
  const labels = useChartLabels();

  const debtData = useMemo<ChartData<"bar" | "line">>(
    () => ({
      labels,
      datasets: [
        {
          label: isPt
            ? "Financiamentos não correntes (L. Prazo)"
            : "Non-current borrowings",
          data: annual.map((d) => d.borrowings_nc),
          backgroundColor: state.COLORS.infoSoft,
          borderColor: state.COLORS.info,
          borderWidth: 1,
          stack: "s1",
          order: 1,
        },
        {
          label: isPt
            ? "Financiamentos correntes (C. Prazo)"
            : "Current borrowings",
          data: annual.map((d) => d.borrowings_c),
          backgroundColor: state.COLORS.posSoft,
          borderColor: state.COLORS.pos,
          borderWidth: 1,
          stack: "s1",
          order: 1,
        },
        styledLineDataset({
          label: isPt ? "Caixa e equivalentes" : "Cash on hands; equivalents",
          data: annual.map((d) => d.cash),
          color: state.COLORS.gold,
          bg: state.COLORS.goldSoft,
          extra: { type: "line", order: 0 },
        }),
      ] as any,
    }),
    [labels, annual, isPt],
  );

  const debtOptions = useMemo<ChartOptions<any>>(
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
        x: { ...baseOpts.scales.x, stacked: true },
        y: { ...baseOpts.scales.y, stacked: true, beginAtZero: true },
      },
    }),
    [],
  );

  const assetsLiabData = useMemo<ChartData<"bar">>(
    () => ({
      labels,
      datasets: [
        {
          label: isPt ? "Ativo total" : "Total assets",
          data: annual.map((d) => d.total_assets),
          backgroundColor: state.COLORS.posSoft,
          borderColor: state.COLORS.pos,
          borderWidth: 1,
          borderRadius: 3,
        },
        {
          label: isPt ? "Passivo total" : "Total liabilities",
          data: annual.map(
            (d) => d.non_current_liabilities + d.current_liabilities,
          ),
          backgroundColor: state.COLORS.negSoft,
          borderColor: state.COLORS.neg,
          borderWidth: 1,
          borderRadius: 3,
        },
      ] as any,
    }),
    [labels, annual, isPt],
  );

  const debtMaturityData = useMemo<ChartData<"line">>(() => {
    const ncShare = annual.map((d) => {
      const totalDebt = d.borrowings_nc + d.borrowings_c;
      return totalDebt !== 0 ? d.borrowings_nc / totalDebt : null;
    });

    return {
      labels,
      datasets: [
        styledLineDataset({
          label: isPt
            ? "Percentagem de dívida a longo prazo"
            : "Long-term share of debt",
          data: ncShare.map((v) => (v == null ? null : v * 100)),
          color: state.COLORS.green,
          bg: state.COLORS.greenSoft,
          fill: true,
        }),
      ] as any,
    };
  }, [labels, annual, isPt]);

  const debtMaturityOptions = useMemo<ChartOptions<any>>(
    () => ({
      ...baseOpts,
      plugins: {
        ...baseOpts.plugins,
        legend: { display: false },
        tooltip: {
          ...baseOpts.plugins.tooltip,
          callbacks: {
            label: (ctx: { dataset: { label: string }; parsed: { y: number } }) =>
              `${isPt ? "Longo prazo" : "Long-term"}: ${ctx.parsed.y.toFixed(0)}%`,
          },
        },
      },
      scales: {
        ...baseOpts.scales,
        y: {
          ...baseOpts.scales.y,
          ticks: {
            ...(baseOpts.scales?.y?.ticks || {}),
            callback: (v: number | string) => v + "%",
          },
          beginAtZero: true,
          max: 100,
        },
      },
    }),
    [isPt],
  );

  const assetsLiabOptions = useMemo<ChartOptions<any>>(
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
        y: { ...baseOpts.scales.y, beginAtZero: true },
      },
    }),
    [],
  );

  return {
    debtData,
    debtOptions,
    assetsLiabData,
    assetsLiabOptions,
    debtMaturityData,
    debtMaturityOptions,
  };
}
