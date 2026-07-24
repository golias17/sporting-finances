import { useMemo } from "react";
import { useAppState, state } from "../../core/state.js";
import {
  baseOpts,
  styledLineDataset,
  fmtMillions,
} from "../../charts/chartUtils.js";
import { getLatestH1Data } from "../metrics.js";
import { useChartLabels, usePosNegBarChart } from "../../charts/chartHooks.js";
import type { ChartData, ChartOptions } from "chart.js";

export function useSquadCharts() {
  const isPt = useAppState((s) => s.isPt);
  const annual = useAppState((s) => s.annual);
  const fullAnnual = useAppState((s) => s.fullAnnual);
  const DATASET = useAppState((s) => s.DATASET);
  const baseLabels = useChartLabels();

  const squadBookData = useMemo<ChartData<"bar" | "line">>(() => {
    // Filter data up to 2024/25 only
    const filteredAnnual = annual.filter((d) => {
      const season = d.label || d.season;
      return season && season <= "2024/25";
    });
    const filteredLabels = baseLabels.filter((l) => l <= "2024/25");
    
    const h1Data = getLatestH1Data(DATASET);
    const labels = [...filteredLabels];
    const bookValues: (number | null)[] = filteredAnnual.map((d) => d.squad_book_value);
    const marketValues: (number | null)[] = filteredAnnual.map(
      (d) => d.squad_market_value,
    );
    if (h1Data && h1Data.label && h1Data.label <= "2024/25") {
      labels.push(h1Data.label ?? (isPt ? "1º Semestre" : "H1"));
      bookValues.push(null);
      marketValues.push(h1Data.squad_market_value ?? null);
    }

    return {
      labels,
      datasets: [
        {
          label: isPt
            ? "Valor contabilístico do plantel (balanço)"
            : "Squad book value (balance sheet)",
          data: bookValues,
          backgroundColor: state.COLORS.posSoft,
          borderColor: state.COLORS.pos,
          borderWidth: 1,
          borderRadius: 3,
          order: 2,
          type: "bar",
        },
        {
          ...styledLineDataset({
            label: isPt
              ? "Valor de mercado do plantel (Transfermarkt)"
              : "Squad market value (Transfermarkt)",
            data: marketValues,
            color: state.COLORS.gold,
            bg: "rgba(200,169,81,0.18)",
            spanGaps: true,
            pointBorderColor: state.COLORS.gold,
            extra: { order: 1 },
          }),
          type: "line",
        },
      ] as any,
    };
  }, [baseLabels, annual, DATASET, isPt]);

  const squadBookOptions = useMemo<ChartOptions<any>>(
    () => ({
      ...baseOpts,
      plugins: {
        ...baseOpts.plugins,
        tooltip: {
          ...baseOpts.plugins?.tooltip,
          callbacks: {
            label: (ctx: { dataset: { label: string }; parsed: { y: number | null } }) => {
              if (ctx.parsed.y === null || ctx.parsed.y === undefined)
                return null;
              return ctx.dataset.label + ": " + fmtMillions(ctx.parsed.y);
            },
          },
        },
      },
    }),
    [],
  );

  const transfersData = useMemo<ChartData<"bar">>(() => {
    const recordLabel = fullAnnual?.reduce(
      (best: { player_transfer_income: number } | null, d: { player_transfer_income: number }) =>
        best === null || d.player_transfer_income > best.player_transfer_income
          ? d
          : best,
      null,
    )?.label;

    return {
      labels: baseLabels,
      datasets: [
        {
          label: isPt
            ? "Receitas de passes de jogadores"
            : "Player transfer income",
          data: annual.map((d) => d.player_transfer_income),
          backgroundColor: annual.map((d) =>
            d.label === recordLabel
              ? state.COLORS.goldSoft
              : state.COLORS.posSoft,
          ),
          borderColor: annual.map((d) =>
            d.label === recordLabel ? state.COLORS.gold : state.COLORS.pos,
          ),
          borderWidth: 1,
        },
      ],
    };
  }, [baseLabels, annual, fullAnnual, isPt]);

  const transfersOptions = useMemo<ChartOptions<"bar">>(
    () => ({
      ...baseOpts,
      plugins: {
        ...baseOpts.plugins,
        legend: { display: false },
        tooltip: {
          ...baseOpts.plugins.tooltip,
          callbacks: {
            label: (ctx: { dataset: { label: string }; parsed: { y: number | null } }) =>
              ` ${ctx.dataset.label}: ${fmtMillions(ctx.parsed.y)}`,
          },
        },
      },
    }),
    [],
  );

  const netTrading = usePosNegBarChart(
    isPt
      ? "Resultado líquido de trading de jogadores"
      : "Net player trading result",
    annual.map(
      (d) =>
        d.player_transfer_income +
        d.player_transfer_cost +
        d.squad_amortization_impairment,
    ),
  );

  return {
    squadBook: { data: squadBookData, options: squadBookOptions },
    transfers: { data: transfersData, options: transfersOptions },
    netTrading,
  };
}
