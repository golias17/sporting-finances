import { useMemo } from "react";
import { useAppState, state } from "../../core/state.js";
import {
  baseOpts,
  styledLineDataset,
  fmtMillions,
} from "../../charts/chartUtils.js";
import { useChartLabels } from "../../charts/chartHooks.js";
import { wageBillRatio } from "../financialMetrics.js";
import { HEALTH_THRESHOLDS } from "../healthThresholds.js";
import type { ChartData, ChartOptions } from "chart.js";

export function useRevenueCharts() {
  const isPt = useAppState((s) => s.isPt);
  const annual = useAppState((s) => s.annual);
  const labels = useChartLabels();

  const revenueData = useMemo<ChartData<"bar" | "line">>(
    () => ({
      labels,
      datasets: [
        {
          label: isPt ? "Receitas operacionais" : "Operating revenue",
          data: annual.map((d) => d.revenue_operating),
          backgroundColor: state.COLORS.posSoft,
          borderColor: state.COLORS.pos,
          borderWidth: 1,
          borderRadius: 3,
          order: 1,
        },
        {
          type: "line",
          label: isPt ? "Custos com pessoal" : "Personnel Costs",
          data: annual.map((d) => Math.abs(d.personnel_costs)),
          borderColor: state.COLORS.neg,
          backgroundColor: state.COLORS.neg,
          tension: 0.35,
          fill: false,
          pointRadius: 3,
          pointHoverRadius: 5,
          order: 0,
        },
      ] as any,
    }),
    [labels, annual, isPt],
  );

  const revStreamsData = useMemo<ChartData<"bar">>(() => {
    const tvComp = annual.map((d) => d.rev_tv_comp ?? null);
    const matchday = annual.map((d) => d.rev_matchday ?? null);
    const commercial = annual.map((d) => d.rev_commercial ?? null);
    const other = annual.map((d) => {
      if (d.rev_tv_comp == null) return null;
      const gap =
        d.revenue_operating - d.rev_tv_comp - d.rev_matchday - d.rev_commercial;
      return gap > 1 ? gap : null;
    });

    return {
      labels,
      datasets: [
        {
          label: isPt ? "TV & Competições" : "TV & Competitions",
          data: tvComp,
          backgroundColor: state.COLORS.posSoft,
          borderColor: state.COLORS.pos,
          borderWidth: 1,
          borderRadius: 0,
          stack: "s1",
        },
        {
          label: isPt ? "Bilheteira & Estádio" : "Matchday",
          data: matchday,
          backgroundColor: state.COLORS.infoSoft,
          borderColor: state.COLORS.info,
          borderWidth: 1,
          borderRadius: 0,
          stack: "s1",
        },
        {
          label: isPt ? "Comercial & Patrocínios" : "Commercial",
          data: commercial,
          backgroundColor: state.COLORS.goldSoft,
          borderColor: state.COLORS.gold,
          borderWidth: 1,
          borderRadius: 0,
          stack: "s1",
        },
        {
          label: isPt
            ? "Outras receitas operacionais"
            : "Other operating income",
          data: other,
          backgroundColor: state.COLORS.mutedSoft || state.COLORS.muted,
          borderColor: state.COLORS.muted,
          borderWidth: 1,
          borderRadius: 3,
          stack: "s1",
        },
      ] as any,
    };
  }, [labels, annual, isPt]);

  const revStreamsOptions = useMemo<ChartOptions<any>>(
    () => ({
      ...baseOpts,
      plugins: {
        ...baseOpts.plugins,
        legend: {
          display: true,
          position: "bottom",
          labels: {
            color: state.COLORS.ink,
            font: { size: 12 },
            padding: 16,            boxWidth: 8,
          },
        },
        tooltip: {
          ...baseOpts.plugins.tooltip,          callbacks: {
            label: (ctx: { dataset: { label: string }; parsed: { y: number } }) =>
              ` ${ctx.dataset.label}: ${fmtMillions(ctx.parsed.y)}`,
            footer: (items: Array<{ parsed: { y: number } }>) => {
              const total = items.reduce(
                (s: number, i: { parsed: { y: number } }) => s + i.parsed.y,
                0,
              );
              return `Total: ${fmtMillions(total)}`;
            },
          },
        },
      },
      scales: {
        ...baseOpts.scales,
        x: { ...baseOpts.scales.x, stacked: true },
        y: { ...baseOpts.scales.y, stacked: true },
      },
    }),
    [],
  );

  const revVsPayrollData = useMemo<ChartData<"bar">>(() => {
    const ratios = annual.map((d) => wageBillRatio(d));
    const { warn, danger } = HEALTH_THRESHOLDS.payrollRatio;

    return {
      labels,
      datasets: [
        {
          label: isPt
            ? "Custos com pessoal / Receitas"
            : "Personnel cost / revenue",
          data: ratios.map((r) => (r == null ? null : r * 100)),
          backgroundColor: ratios.map((r) =>
            r == null
              ? state.COLORS.muted
              : r > danger
                ? state.COLORS.negSoft || state.COLORS.neg
                : r > warn
                  ? state.COLORS.goldSoft
                  : state.COLORS.posSoft,
          ),
          borderColor: ratios.map((r) =>
            r == null
              ? state.COLORS.muted
              : r > danger
                ? state.COLORS.neg
                : r > warn
                  ? state.COLORS.gold
                  : state.COLORS.pos,
          ),
          borderWidth: 1,
        },
      ] as any,
    };
  }, [labels, annual, isPt]);

  const revVsPayrollOptions = useMemo<ChartOptions<any>>(
    () => ({
      ...baseOpts,
      plugins: {
        ...baseOpts.plugins,
        legend: { display: false },
        tooltip: {
          ...baseOpts.plugins.tooltip,          callbacks: {
            label: (ctx: { dataset: { label: string }; parsed: { y: number } }) =>
              `${isPt ? "Rácio" : "Ratio"}: ${ctx.parsed.y.toFixed(0)}%`,
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
        },
      },
    }),
    [isPt],
  );

  const opResultData = useMemo<ChartData<"bar" | "line">>(() => {
    const recurring = annual.map((d) => d.operating_result_excl_players);
    const players = annual.map((d) => d.operating_result_players);
    const total = recurring.map((v, i) => v + (players[i] || 0));

    return {
      labels,
      datasets: [
        {
          label: isPt
            ? "Operações Recorrentes (excl. passes)"
            : "Recurring (excl. players)",
          data: recurring,
          backgroundColor: state.COLORS.negSoft || state.COLORS.neg,
          borderColor: state.COLORS.neg,
          borderWidth: 1,
          stack: "s1",
          order: 1,
        },
        {
          label: isPt ? "Trading de passes" : "Player trading",
          data: players,
          backgroundColor: state.COLORS.posSoft,
          borderColor: state.COLORS.pos,
          borderWidth: 1,
          stack: "s1",
          order: 1,
        },
        {
          label: isPt
            ? "Resultado Operacional Total"
            : "Total Operating Result",
          data: total,
          borderColor: state.COLORS.gold,
          backgroundColor: state.COLORS.gold,
          tension: 0.35,
          fill: false,
          pointRadius: 3,
          pointHoverRadius: 5,
          type: "line",
          order: 0,
        },
      ] as any,
    };
  }, [labels, annual, isPt]);

  const opResultOptions = useMemo<ChartOptions<any>>(
    () => ({
      ...baseOpts,
      plugins: {
        ...baseOpts.plugins,
        tooltip: {
          ...baseOpts.plugins.tooltip,          callbacks: {
            label: (ctx: { dataset: { label: string }; parsed: { y: number } }) =>
              ` ${ctx.dataset.label}: ${fmtMillions(ctx.parsed.y)}`,
          },
        },
      },
      scales: {
        ...baseOpts.scales,
        x: { ...baseOpts.scales.x, stacked: true },
        y: { ...baseOpts.scales.y, stacked: true, beginAtZero: false },
      },
    }),
    [],
  );

  // Personnel Costs Breakdown
  const costLabels = annual.map((d: any) => d.label);
  const wageData = annual.map((d: any) => Math.abs(d.personnel_costs || 0));
  const squadAmortData = annual.map((d: any) => Math.abs(d.squad_amortization_impairment || 0));
  const extSuppliesData = annual.map((d: any) => Math.abs(d.external_supplies || 0));
  const daData = annual.map((d: any) => Math.abs(d.da_excl_squad || 0));

  const costBreakdownData = {
    labels: costLabels,
    datasets: [
      {
        label: isPt ? "Salários" : "Wages",
        data: wageData,
        backgroundColor: state.COLORS.posSoft,
        borderColor: state.COLORS.pos,
        borderWidth: 1,
        stack: "costs",
        fill: true,
      },
      {
        label: isPt ? "Amort. Plantel" : "Squad Amort.",
        data: squadAmortData,
        backgroundColor: state.COLORS.goldSoft,
        borderColor: state.COLORS.gold,
        borderWidth: 1,
        stack: "costs",
        fill: true,
      },
      {
        label: isPt ? "Fornec. Externos" : "External Supplies",
        data: extSuppliesData,
        backgroundColor: state.COLORS.infoSoft,
        borderColor: state.COLORS.info,
        borderWidth: 1,
        stack: "costs",
        fill: true,
      },
      {
        label: isPt ? "Dep. & Amort." : "Dep. & Amort.",
        data: daData,
        backgroundColor: state.COLORS.mutedSoft || state.COLORS.muted,
        borderColor: state.COLORS.muted,
        borderWidth: 1,
        stack: "costs",
        fill: true,
      },
    ],
  };

  const costBreakdownOptions = {
    ...state.baseOpts,
    plugins: {
      ...state.baseOpts.plugins,
      tooltip: {
        ...state.baseOpts.plugins.tooltip,        callbacks: {
          label: (ctx: { dataset: { label: string }; parsed: { y: number } }) => {
            return ` ${ctx.dataset.label}: ${fmtMillions(ctx.parsed.y)}`;
          },
          footer: (items: { chart: { data: { datasets: { data: number[] }[] } }; dataIndex: number }[]) => {
            if (items.length === 0) return "";
            const idx = items[0].dataIndex;
            const total = items[0].chart.data.datasets.reduce(
              (sum: number, ds: { data: number[] }) => sum + (ds.data[idx] as number || 0), 0
            );
            return `Total: ${fmtMillions(total)}`;
          },
        },
      },
    },
    scales: {
      ...state.baseOpts.scales,
      x: { ...state.baseOpts.scales?.x, stacked: true },
      y: {
        ...state.baseOpts.scales?.y,
        stacked: true,
        ticks: {
          ...state.baseOpts.scales?.y?.ticks,
          callback: (v: number | string) => fmtMillions(Number(v)),
        },
      },
    },
  };

  return {
    revenueData,
    revenueOptions: {
      ...state.baseOpts,
      plugins: {
        ...state.baseOpts.plugins,
        tooltip: {
          ...state.baseOpts.plugins.tooltip,          callbacks: {
            label: (ctx: { dataset: { label: string }; parsed: { y: number } }) =>
              ` ${ctx.dataset.label}: ${fmtMillions(ctx.parsed.y)}`,
          },
        },
      },
    } as ChartOptions<any>,
    revStreamsData,
    revStreamsOptions,
    revVsPayrollData,
    revVsPayrollOptions,
    opResultData,
    opResultOptions,
    costBreakdownData,
    costBreakdownOptions,
  };
}
