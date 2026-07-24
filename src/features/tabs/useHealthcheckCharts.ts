import { useMemo } from "react";
import { useAppState, state } from "../../core/state.js";
import { baseOpts, ZONE_COLORS, fmtMillions } from "../../charts/chartUtils.js";

import { getBrandColors } from "../../charts/chartPalette.js";
import { useChartLabels } from "../../charts/chartHooks.js";
import { wageBillRatio, netDebt } from "../metrics.js";
import { HEALTH_THRESHOLDS } from "../healthThresholds.js";
import type { ChartData, ChartOptions } from "chart.js";

function zoneColor(
  value: number | null,
  low: number,
  high: number,
  invert = false,
) {
  if (value == null) return state.COLORS.muted;
  if (invert) {
    return value < low
      ? state.COLORS.neg
      : value < high
        ? state.COLORS.warn
        : state.COLORS.pos;
  }
  return value > high
    ? state.COLORS.neg
    : value > low
      ? state.COLORS.warn
      : state.COLORS.pos;
}

function zoneAnnotations({ zones, lines }: { zones: Array<{ low: number; high: number; color: string; label: string }>; lines: Array<{ value: number; color: string; label: string }> }) {
  const annotations: Record<string, { type: string; yMin: number; yMax: number; backgroundColor: string; label: { display: boolean; content: string } }> = {};
  zones.forEach((z) => {
    annotations[z.key] = {
      type: "box",
      yMin: z.min,
      yMax: z.max,
      backgroundColor: z.color,
      borderWidth: 0,
      label: z.label || { display: false, padding: 6 },
    };
  });
  lines.forEach((l) => {
    annotations[l.key] = {
      type: "line",
      yMin: l.value,
      yMax: l.value,
      borderColor: l.color,
      borderWidth: 1.5,
      z: -1,
      borderDash: [4, 4],
    };
  });
  return annotations;
}

export function useHealthcheckCharts() {
  const isPt = useAppState((s) => s.isPt);
  const annual = useAppState((s) => s.annual);
  const labels = useChartLabels();

  // 1. Payroll Burden
  const payrollBurdenData = useMemo<ChartData<"line">>(() => {
    const ratios = annual.map((d) => {
      const r = wageBillRatio(d);
      return r !== null ? r * 100 : null;
    });
    const warnPct = HEALTH_THRESHOLDS.payrollRatio.warn * 100;
    const dangerPct = HEALTH_THRESHOLDS.payrollRatio.danger * 100;

    return {
      labels,
      datasets: [
        {
          label: isPt
            ? "Custos com pessoal em % da receita"
            : "Wage bill as % of revenue",
          data: ratios,
          borderColor: state.COLORS.lineBorder,
          backgroundColor: "transparent",
          borderWidth: 2.5,
          tension: 0.25,
          pointRadius: 5,
          pointBackgroundColor: ratios.map((r) =>
            zoneColor(r, warnPct, dangerPct),
          ),
          pointBorderColor: "#fff",
          pointBorderWidth: 1.5,
          fill: false,
        },
      ] as any,
    };
  }, [labels, annual, isPt]);

  const payrollBurdenOptions = useMemo<ChartOptions<any>>(() => {
    const warnPct = HEALTH_THRESHOLDS.payrollRatio.warn * 100;
    const dangerPct = HEALTH_THRESHOLDS.payrollRatio.danger * 100;
    return {
      ...baseOpts,
      plugins: {
        ...baseOpts.plugins,
        legend: { display: false },
        tooltip: {
          ...baseOpts.plugins.tooltip,
          callbacks: {
            label: (ctx: { dataset: { label: string }; parsed: { y: number } }) =>
              `${isPt ? "Custos com pessoal" : "Wage bill"}: ${ctx.parsed.y.toFixed(0)}% ${isPt ? "da receita" : "of revenue"}`,
          },
        },
        annotation: {
          drawTime: "beforeDatasetsDraw",
          annotations: zoneAnnotations({
            zones: [
              {
                key: "redBg",
                min: dangerPct,
                max: 135,
                color: ZONE_COLORS.red,
              },
              {
                key: "amberBg",
                min: warnPct,
                max: dangerPct,
                color: ZONE_COLORS.amber,
              },
              {
                key: "greenBg",
                min: 0,
                max: warnPct,
                color: ZONE_COLORS.green,
              },
            ],
            lines: [
              { key: "line70", value: dangerPct, color: state.COLORS.neg },
              { key: "line60", value: warnPct, color: state.COLORS.warn },
            ],
          }),
        },
      },
      scales: {
        ...baseOpts.scales,
        y: {
          ...baseOpts.scales.y,
          min: 30,
          max: 130,
          ticks: {
            ...(baseOpts.scales?.y?.ticks || {}),
            callback: (v: number | string) => v + "%",
          },
        },
      },
    };
  }, [isPt]);

  // 2. Transfer Reliance
  const transferRelianceData = useMemo<ChartData<"line">>(() => {
    const reliance = annual.map((d) => {
      const total = d.revenue_operating + d.player_transfer_income;
      return total !== 0 ? (d.player_transfer_income / total) * 100 : null;
    });
    const warnPct = HEALTH_THRESHOLDS.transferReliance.warn * 100;
    const dangerPct = HEALTH_THRESHOLDS.transferReliance.danger * 100;

    return {
      labels,
      datasets: [
        {
          label: isPt
            ? "Receitas de passes em % das receitas totais"
            : "Transfer income as % of total revenue",
          data: reliance,
          borderColor: state.COLORS.lineBorder,
          backgroundColor: "transparent",
          borderWidth: 2.5,
          tension: 0.25,
          pointRadius: 5,
          pointBackgroundColor: reliance.map((r) =>
            zoneColor(r, warnPct, dangerPct),
          ),
          pointBorderColor: "#fff",
          pointBorderWidth: 1.5,
          fill: false,
        },
      ] as any,
    };
  }, [labels, annual, isPt]);

  const transferRelianceOptions = useMemo<ChartOptions<any>>(() => {
    const warnPct = HEALTH_THRESHOLDS.transferReliance.warn * 100;
    const dangerPct = HEALTH_THRESHOLDS.transferReliance.danger * 100;
    return {
      ...baseOpts,
      plugins: {
        ...baseOpts.plugins,
        legend: { display: false },
        tooltip: {
          ...baseOpts.plugins.tooltip,
          callbacks: {
            label: (ctx: { dataset: { label: string }; parsed: { y: number } }) =>
              `${isPt ? "Dependência de passes" : "Transfer reliance"}: ${ctx.parsed.y.toFixed(0)}%`,
          },
        },
        annotation: {
          drawTime: "beforeDatasetsDraw",
          annotations: zoneAnnotations({
            zones: [
              { key: "redBg", min: dangerPct, max: 90, color: ZONE_COLORS.red },
              {
                key: "amberBg",
                min: warnPct,
                max: dangerPct,
                color: ZONE_COLORS.amber,
              },
              {
                key: "greenBg",
                min: 0,
                max: warnPct,
                color: ZONE_COLORS.green,
              },
            ],
            lines: [
              { key: "line50", value: dangerPct, color: state.COLORS.neg },
              { key: "line35", value: warnPct, color: state.COLORS.warn },
            ],
          }),
        },
      },
      scales: {
        ...baseOpts.scales,
        y: {
          ...baseOpts.scales.y,
          min: 0,
          max: 80,
          ticks: {
            ...(baseOpts.scales?.y?.ticks || {}),
            callback: (v: number | string) => v + "%",
          },
        },
      },
    };
  }, [isPt]);

  // 3. Debt Load
  const debtLoadData = useMemo<ChartData<"line">>(() => {
    const netDebtRatio = annual.map((d) =>
      d.revenue_operating !== 0 ? netDebt(d) / d.revenue_operating : null,
    );
    const { warn, danger } = HEALTH_THRESHOLDS.netDebtRatio;

    return {
      labels,
      datasets: [
        {
          label: isPt
            ? "Dívida líquida / receita anual"
            : "Net debt / annual revenue",
          data: netDebtRatio,
          borderColor: state.COLORS.lineBorder,
          backgroundColor: "transparent",
          borderWidth: 2.5,
          tension: 0.25,
          pointRadius: 5,
          pointBackgroundColor: netDebtRatio.map((r) =>
            zoneColor(r, warn, danger),
          ),
          pointBorderColor: "#fff",
          pointBorderWidth: 1.5,
          fill: false,
        },
      ] as any,
    };
  }, [labels, annual, isPt]);

  const debtLoadOptions = useMemo<ChartOptions<any>>(() => {
    const { warn, danger } = HEALTH_THRESHOLDS.netDebtRatio;
    const amberLabel = {
      display: false,
      content: isPt
        ? `Alerta (${warn.toFixed(1)}-${danger.toFixed(1)}x)`
        : `Caution (${warn.toFixed(1)}-${danger.toFixed(1)}x)`,
      position: { x: "start", y: "center" },
      xAdjust: 10,
      color: state.COLORS.warn,
      font: { family: "Inter", size: 10, weight: "bold" },
      padding: 6,
    };
    return {
      ...baseOpts,
      plugins: {
        ...baseOpts.plugins,
        legend: { display: false },
        tooltip: {
          ...baseOpts.plugins.tooltip,
          callbacks: {
            label: (ctx: { dataset: { label: string }; parsed: { y: number } }) =>
              `${isPt ? "Dívida líquida" : "Net debt"}: ${ctx.parsed.y.toFixed(1)}× ${isPt ? "receita anual" : "annual revenue"}`,
          },
        },
        annotation: {
          drawTime: "beforeDatasetsDraw",
          annotations: zoneAnnotations({
            zones: [
              { key: "redBg", min: danger, max: 14, color: ZONE_COLORS.red },
              {
                key: "amberBg",
                min: warn,
                max: danger,
                color: ZONE_COLORS.amber,
                label: amberLabel,
              },
              { key: "greenBg", min: -2, max: warn, color: ZONE_COLORS.green },
            ],
            lines: [
              { key: "line2", value: danger, color: state.COLORS.neg },
              { key: "line1", value: warn, color: state.COLORS.warn },
            ],
          }),
        },
      },
      scales: {
        ...baseOpts.scales,
        y: {
          ...baseOpts.scales.y,
          beginAtZero: false,
          ticks: {
            ...(baseOpts.scales?.y?.ticks || {}),
            callback: (v: number | string) => v.toFixed(1) + "×",
          },
        },
      },
    };
  }, [isPt]);

  // 4. Current Ratio
  const currentRatioData = useMemo<ChartData<"line">>(() => {
    const ratios = annual.map((d) =>
      d.current_liabilities !== 0
        ? d.current_assets / d.current_liabilities
        : null,
    );
    const { danger, warn } = HEALTH_THRESHOLDS.currentRatio;

    return {
      labels,
      datasets: [
        {
          label: isPt
            ? "Ativo de curto prazo / Passivo de curto prazo"
            : "Short-term assets / short-term liabilities",
          data: ratios,
          borderColor: state.COLORS.lineBorder,
          backgroundColor: "transparent",
          borderWidth: 2.5,
          tension: 0.25,
          pointRadius: 5,
          pointBackgroundColor: ratios.map((r) =>
            zoneColor(r, danger, warn, true),
          ),
          pointBorderColor: "#fff",
          pointBorderWidth: 1.5,
          fill: false,
        },
      ] as any,
    };
  }, [labels, annual, isPt]);

  const currentRatioOptions = useMemo<ChartOptions<any>>(() => {
    const { danger, warn } = HEALTH_THRESHOLDS.currentRatio;
    const amberLabel = {
      display: false,
      content: isPt
        ? `Alerta (${danger.toFixed(1)}-${warn.toFixed(1)}x)`
        : `Caution (${danger.toFixed(1)}-${warn.toFixed(1)}x)`,
      position: { x: "start", y: "center" },
      xAdjust: 10,
      color: state.COLORS.warn,
      font: { family: "Inter", size: 10, weight: "bold" },
      padding: 6,
    };

    return {
      ...baseOpts,
      plugins: {
        ...baseOpts.plugins,
        legend: { display: false },
        tooltip: {
          ...baseOpts.plugins.tooltip,
          callbacks: {
            label: (ctx: { dataset: { label: string }; parsed: { y: number } }) =>
              `${isPt ? "Rácio de solvência" : "Current ratio"}: ${ctx.parsed.y.toFixed(2)}×`,
          },
        },
        annotation: {
          drawTime: "beforeDatasetsDraw",
          annotations: zoneAnnotations({
            zones: [
              { key: "redBg", min: 0, max: danger, color: ZONE_COLORS.red },
              {
                key: "amberBg",
                min: danger,
                max: warn,
                color: ZONE_COLORS.amber,
                label: amberLabel,
              },
              { key: "greenBg", min: warn, max: 3.5, color: ZONE_COLORS.green },
            ],
            lines: [
              { key: "line05", value: danger, color: state.COLORS.neg },
              { key: "line1", value: warn, color: state.COLORS.warn },
            ],
          }),
        },
      },
      scales: {
        ...baseOpts.scales,
        y: {
          ...baseOpts.scales.y,
          beginAtZero: true,
          ticks: {
            ...(baseOpts.scales?.y?.ticks || {}),
            callback: (v: number | string) => v.toFixed(1) + "×",
          },
        },
      },
    };
  }, [isPt]);

  const theme = useAppState((s) => s.theme);
  const colors = useMemo(() => getBrandColors(theme === "dark"), [theme]);

  // 5. Transfer Net Debt (Payables vs Receivables)
  const transferDebtData = useMemo<ChartData<"bar">>(() => {
    return {
      labels,
      datasets: [
        {
          label: isPt ? "Dívidas a Clubes (Passes)" : "Transfer Payables",
          data: annual.map(
            (d) =>
              (d.transfer_payables_c || 0) + (d.transfer_payables_nc || 0),
          ),
          backgroundColor: colors.neg + "B3",
          borderColor: colors.neg,
          borderWidth: 1,
        },
        {
          label: isPt ? "Créditos a Receber de Clubes" : "Transfer Receivables",
          data: annual.map(
            (d) =>
              (d.transfer_receivables_c || 0) +
                (d.transfer_receivables_nc || 0),
          ),
          backgroundColor: colors.pos + "B3",
          borderColor: colors.pos,
          borderWidth: 1,
        },
      ],
    };
  }, [labels, annual, isPt, colors]);

  const transferDebtOptions = useMemo<ChartOptions<any>>(() => {
    return {
      ...baseOpts,
      plugins: {
        ...baseOpts.plugins,
        legend: { display: true, position: "bottom" },
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
        y: {
          ...baseOpts.scales.y,
          ticks: {
            ...(baseOpts.scales?.y?.ticks || {}),
            callback: (v: number | string) => `€${v}M`,
          },
        },
      },
    };
  }, []);

  // 6. EBITDA (Operacional vs Total)
  const ebitdaData = useMemo<ChartData<"line">>(() => {
    return {
      labels,
      datasets: [
        {
          label: isPt ? "EBITDA Operacional" : "Operating EBITDA",
          data: annual.map(
            (d) =>
              d.operating_result_excl_players + Math.abs(d.da_excl_squad),
          ),
          borderColor: colors.gold,
          backgroundColor: "transparent",
          borderWidth: 2,
          tension: 0.25,
          fill: false,
        },
        {
          label: isPt ? "EBITDA Total (c/ Passes)" : "Total EBITDA (w/ Transfers)",
          data: annual.map(
            (d) =>
              d.operating_result_total +
                Math.abs(d.da_excl_squad) +
                Math.abs(d.squad_amortization_impairment),
          ),
          borderColor: colors.pos,
          backgroundColor: "transparent",
          borderWidth: 2.5,
          tension: 0.25,
          fill: false,
        },
      ],
    };
  }, [labels, annual, isPt, colors]);

  const ebitdaOptions = useMemo<ChartOptions<any>>(() => {
    return {
      ...baseOpts,
      plugins: {
        ...baseOpts.plugins,
        legend: { display: true, position: "bottom" },
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
        y: {
          ...baseOpts.scales.y,
          ticks: {
            ...(baseOpts.scales?.y?.ticks || {}),
            callback: (v: number | string) => `€${v}M`,
          },
        },
      },
    };
  }, []);

  return {
    payrollBurdenData,
    payrollBurdenOptions,
    transferRelianceData,
    transferRelianceOptions,
    debtLoadData,
    debtLoadOptions,
    currentRatioData,
    currentRatioOptions,
    transferDebtData,
    transferDebtOptions,
    ebitdaData,
    ebitdaOptions,
  };
}
