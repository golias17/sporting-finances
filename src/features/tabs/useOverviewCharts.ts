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
          label: isPt ? "Receitas operacionais" : "Operating revenue",
          data: annual.map((d) => d.revenue_operating),
          borderColor: state.COLORS.green,
          backgroundColor: state.COLORS.green,
          tension: 0.35,
          fill: false,
          pointRadius: 3,
          pointHoverRadius: 5,
          type: "line",
          yAxisID: "y",
        },
        {
          label: isPt ? "Resultado líquido" : "Net result",
          data: annual.map((d) => d.net_result),
          borderColor: state.COLORS.gold,
          backgroundColor: state.COLORS.gold,
          tension: 0.35,
          fill: false,
          pointRadius: 3,
          pointHoverRadius: 5,
          type: "line",
          yAxisID: "y",
        },
        {
          label: isPt ? "Capital próprio" : "Shareholders' equity",
          data: annual.map((d) => d.equity),
          borderColor: state.COLORS.info,
          backgroundColor: state.COLORS.info,
          tension: 0.35,
          fill: false,
          pointRadius: 3,
          pointHoverRadius: 5,
          type: "line",
          yAxisID: "y",
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
      "amorim",
      "title21",
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

  const healthBarIdx = useAppState((s) => s.healthBarIdx);
  const activeIdx = healthBarIdx ?? (annual.length > 0 ? annual.length - 1 : 0);
  const d = annual[activeIdx];
  const activeSeasonLabel = d?.label || "";

  const rev = d ? d.revenue_operating / 1000 : 0;
  const opExcl = d ? d.operating_result_excl_players / 1000 : 0;
  const costs = d ? opExcl - rev : 0;
  const trading = d ? (d.player_transfer_income + d.player_transfer_cost) / 1000 : 0;
  const opTotal = d ? d.operating_result_total / 1000 : 0;
  const amort = d ? d.squad_amortization_impairment / 1000 : 0;
  const net = d ? d.net_result / 1000 : 0;
  const fin = d ? net - opTotal : 0;

  const val1 = rev;
  const val2 = opExcl;
  const val3 = opExcl + trading;
  const val4 = opTotal;
  const val5 = net;

  const waterfallData = useMemo<ChartData<"bar">>(() => {
    return {
      labels: isPt
        ? [
            "Receita Operacional",
            "Custos Operacionais",
            "Trading Jogadores",
            "Amortizações",
            "Custos Financeiros",
            `Resultado Líquido ${activeSeasonLabel}`,
          ]
        : [
            "Operating Revenue",
            "Operating Costs",
            "Player Trading",
            "Amortizations",
            "Financial Costs",
            `Net Result ${activeSeasonLabel}`,
          ],
      datasets: [
        {
          label: isPt ? "Montante (€M)" : "Amount (€M)",
          data: [
            [0, val1],
            [val1, val2],
            [val2, val3],
            [val3, val4],
            [val4, val5],
            [0, val5],
          ] as any,
          backgroundColor: [
            state.COLORS.posSoft,
            state.COLORS.negSoft,
            state.COLORS.posSoft,
            state.COLORS.negSoft,
            state.COLORS.negSoft,
            net > 0 ? state.COLORS.goldSoft : state.COLORS.negSoft,
          ],
          borderColor: [
            state.COLORS.pos,
            state.COLORS.neg,
            state.COLORS.pos,
            state.COLORS.neg,
            state.COLORS.neg,
            net > 0 ? state.COLORS.gold : state.COLORS.neg,
          ],
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    };
  }, [isPt, activeSeasonLabel, val1, val2, val3, val4, val5, net]);

  const waterfallOptions = useMemo<ChartOptions<"bar">>(
    () => ({
      ...baseOpts,
      plugins: {
        ...baseOpts.plugins,
        legend: { display: false },
        tooltip: {
          ...baseOpts.plugins.tooltip,
          callbacks: {
            label: (ctx: { dataIndex: number }) => {
              const diffs = [rev, costs, trading, amort, fin, net];
              const val = diffs[ctx.dataIndex];
              const sign = val > 0 ? "+" : val < 0 ? "-" : "";
              const absVal = Math.abs(val).toLocaleString("de-DE", {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              });
              const labelsPt = [
                "Receita Operacional",
                "Custos Operacionais",
                "Trading Jogadores",
                "Amortizações",
                "Custos Financeiros & Outros",
                `Resultado Líquido ${activeSeasonLabel}`,
              ];
              const labelsEn = [
                "Operating Revenue",
                "Operating Costs",
                "Player Trading",
                "Amortizations",
                "Financial Costs & Other",
                `Net Result ${activeSeasonLabel}`,
              ];
              return `${isPt ? labelsPt[ctx.dataIndex] : labelsEn[ctx.dataIndex]}: ${sign}€${absVal}M`;
            },
          },
        },
      },
      scales: {
        ...baseOpts.scales,
        y: {
          ...(baseOpts.scales?.y || {}),
          beginAtZero: true,
          title: {
            display: true,
            text: isPt ? "Milhões de EUR (€M)" : "EUR Millions (€M)",
          },
          ticks: {
            font: { size: 11 },
            color: state.COLORS.muted || "#666",
            callback: (v: number | string) => {
              const num = typeof v === "string" ? parseFloat(v) : v;
              return "€" + num.toFixed(0) + "M";
            },
          },
        },
      },
    }),
    [isPt, activeSeasonLabel, rev, costs, trading, amort, fin, net],
  );

  return { heroData, heroOptions, netResult, equity, waterfallData, waterfallOptions, activeSeasonLabel };
}
