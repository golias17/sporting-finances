import React, { useMemo } from "react";
import { state } from "../core/state.js";
import {
  } from "../charts/chartUtils.js";
import { scenarioLabels } from "./playgroundUtils.js";
import type { ProjectionData, PinnedData } from "./playgroundTypes.js";
import { FALLBACK } from "./playgroundTypes.js";

export function usePlaygroundCharts(
  baseline: ProjectionData,
  proj: ProjectionData,
  pinned: PinnedData | null,
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
      isPt ? "Trading" : "Trading Net",
      isPt ? "Resultado Líq." : "Net Result",
    ];

    const colors = state.COLORS || FALLBACK;
    const mutedSoft = colors.mutedSoft;
    const muted = colors.muted;

    const netData = {
      labels,
      datasets: [
        {
          label: baselineLabel,
          data: [
            baseline.revenue / 1000,
            baseline.payroll / 1000,
            baseline.overhead / 1000,
            baseline.financialResult / 1000,
            baseline.netTrading / 1000,
            baseline.netResult / 1000,
          ],
          backgroundColor: mutedSoft,
          borderColor: muted,
          borderWidth: 1,
        },
        {
          label: projectedLabel,
          data: [
            proj.revenue / 1000,
            proj.payroll / 1000,
            proj.overhead / 1000,
            proj.financialResult / 1000,
            proj.netTrading / 1000,
            proj.netResult / 1000,
          ],
          backgroundColor: colors.greenSoft,
          borderColor: colors.green,
          borderWidth: 1,
        },
        ...(pinned
          ? [
              {
                label: pinnedLabel,
                data: [
                  pinned.revenue / 1000,
                  pinned.payroll / 1000,
                  pinned.overhead / 1000,
                  pinned.financialResult / 1000,
                  pinned.netTrading / 1000,
                  pinned.netResult / 1000,
                ],
                backgroundColor: colors.goldSoft,
                borderColor: colors.gold,
                borderWidth: 1,
              },
            ]
          : []),
      ],
    };

    const baseOpts = state.baseOpts || {};
    const netOptions = {
      ...baseOpts,
      scales: {
        x: { ...baseOpts.scales?.x },
        y: {
          ...baseOpts.scales?.y,
          ticks: {
            ...baseOpts.scales?.y?.ticks,
            callback: (v: number | string) => Number(v).toFixed(0) + "M€",
          },
          beginAtZero: false,
          title: {
            display: true,
            text: "M€",
            color: muted,
          },
        },
      },
      plugins: {
        ...baseOpts.plugins,
        tooltip: {
          ...baseOpts.plugins?.tooltip,
          callbacks: {
            ...baseOpts.plugins?.tooltip?.callbacks,
            label: (context: {
              dataset: { label: string };
              dataIndex: number;
              chart: { data: { datasets: { data: number[] }[] } };
              parsed: { y: number };
              datasetIndex: number;
            }) => {
              const val = context.parsed.y;
              if (context.datasetIndex === 0) {
                return `${context.dataset.label}: ${val.toFixed(1)} M€`;
              } else {
                const baselineVal =
                  context.chart.data.datasets[0].data[context.dataIndex];
                const delta = val - baselineVal;
                const sign = delta >= 0 ? "+" : "";
                const deltaStr =
                  Math.abs(delta) < 0.05
                    ? " (no change)"
                    : ` (${sign}${delta.toFixed(1)} M€)`;
                return `${context.dataset.label}: ${val.toFixed(1)} M€${deltaStr}`;
              }
            },
            footer: () => [],
          },
        },
      },
    };

    const netPlugins = [
      {
        id: "barDelta",
        afterDatasetsDraw(chart: {
          ctx: CanvasRenderingContext2D;
          data: { datasets: { data: number[] }[] };
          getDatasetMeta: (index: number) => {
            data: Array<{
              x: number;
              y: number;
              width: number;
              height: number;
            }>;
          };
        }) {
          const { ctx, data } = chart;
          ctx.save();
          ctx.font = "bold 9px sans-serif";
          ctx.textAlign = "center";

          const baselineDS = data.datasets[0].data;
          const projDS = data.datasets[1].data;

          chart
            .getDatasetMeta(1)
            .data.forEach(
              (
                bar: { x: number; y: number; width: number; height: number },
                index: number,
              ) => {
                const baselineVal = baselineDS[index];
                const projVal = projDS[index];
                const delta = projVal - baselineVal;
                if (Math.abs(delta) < 0.05) return;

                const sign = delta > 0 ? "+" : "";
                const color = delta > 0 ? colors.pos : colors.neg;
                ctx.fillStyle = color;

                const yPos = bar.y + (projVal >= 0 ? -8 : 12);
                ctx.fillText(`${sign}${delta.toFixed(1)}M`, bar.x, yPos);
              },
            );
          ctx.restore();
        },
      },
    ];

    const chart2Labels = pinned
      ? [baselineLabel, projectedLabel, pinnedLabel]
      : [baselineLabel, projectedLabel];
    const equityData = pinned
      ? [baseline.equity / 1000, proj.equity / 1000, pinned.equity / 1000]
      : [baseline.equity / 1000, proj.equity / 1000];
    const solvencyDataValues = pinned
      ? [baseline.solvency, proj.solvency, pinned.solvency]
      : [baseline.solvency, proj.solvency];

    const solvencyData = {
      labels: chart2Labels,
      datasets: [
        {
          label: isPt ? "Capital Próprio (M€)" : "Shareholders' Equity (M€)",
          data: equityData,
          backgroundColor: colors.goldSoft,
          borderColor: colors.gold,
          borderWidth: 1.5,
          yAxisID: "y",
          borderRadius: 4,
          order: 1,
        },
        {
          label: isPt ? "Rácio de Solvabilidade (%)" : "Solvency Ratio (%)",
          data: solvencyDataValues,
          type: "line",
          borderColor: colors.green,
          backgroundColor: colors.greenSoft,
          pointBackgroundColor: colors.green,
          pointBorderColor: colors.green,
          yAxisID: "y1",
          order: 0,
        },
      ],
    };

    const solvencyOptions = {
      ...baseOpts,
      scales: {
        x: { ...baseOpts.scales?.x },
        y: {
          type: "linear",
          position: "left",
          title: {
            display: true,
            text: isPt ? "Capital Próprio (M€)" : "Shareholders' Equity (M€)",
            color: muted,
          },
          ticks: {
            ...baseOpts.scales?.y?.ticks,
            callback: (v: number | string) => Number(v).toFixed(0),
          },
          grid: { ...baseOpts.scales?.y?.grid },
        },
        y1: {
          type: "linear",
          position: "right",
          title: {
            display: true,
            text: isPt ? "Rácio de Solvabilidade (%)" : "Solvency Ratio (%)",
            color: muted,
          },
          min: 0,
          max: Math.max(
            30,
            baseline.solvency + 5,
            proj.solvency + 5,
            pinned ? pinned.solvency + 5 : 0,
          ),
          ticks: {
            ...baseOpts.scales?.y?.ticks,
            callback: (v: number | string) => Number(v).toFixed(0) + "%",
          },
          grid: { drawOnChartArea: false },
        },
      },
      plugins: {
        ...baseOpts.plugins,
        tooltip: {
          ...baseOpts.plugins?.tooltip,
          callbacks: {
            ...baseOpts.plugins?.tooltip?.callbacks,
            label: (context: {
              dataset: { label: string };
              dataIndex: number;
              chart: { data: { datasets: { data: number[] }[] } };
              parsed: { y: number };
              datasetIndex: number;
            }) => {
              const val = context.parsed.y;
              const suffix = context.datasetIndex === 0 ? " M€" : "%";
              return `${context.dataset.label}: ${val.toFixed(1)}${suffix}`;
            },
            footer: () => [],
          },
        },
      },
    };

    return { netData, netOptions, netPlugins, solvencyData, solvencyOptions };
  }, [baseline, proj, pinned, isPt]);
}
