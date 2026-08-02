import { useMemo } from "react";
import { useAppState, state } from "../../core/state.js";
import {
  baseOpts,
  styledLineDataset,
  fmtMillions,
} from "../../charts/chartUtils.js";
import { getLatestH1Data } from "../financialMetrics.js";
import { useChartLabels, usePosNegBarChart } from "../../charts/chartHooks.js";
import type { ChartData, ChartOptions } from "chart.js";

export function useSquadCharts() {
  const isPt = useAppState((s) => s.isPt);
  const annual = useAppState((s) => s.annual);
  const fullAnnual = useAppState((s) => s.fullAnnual);
  const DATASET = useAppState((s) => s.DATASET);
  const transferLedger = useAppState((s) => s.TRANSFER_LEDGER);
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
          label: isPt
            ? "Valor de mercado do plantel (Transfermarkt)"
            : "Squad market value (Transfermarkt)",
          data: marketValues,
          borderColor: state.COLORS.gold,
          backgroundColor: state.COLORS.gold,
          tension: 0.35,
          fill: false,
          pointRadius: 3,
          pointHoverRadius: 5,
          spanGaps: true,
          type: "line",
          order: 1,
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
          ...baseOpts.plugins.tooltip,          callbacks: {
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

  const transferDonutData = useMemo<ChartData<"bar">>(() => {
    if (!transferLedger) return { labels: [], datasets: [] };
    const labels = transferLedger.map((d) => d.season);
    const stats = transferLedger.map((d) => {
      const sales = d.sales || [];
      let totalFee = 0;
      let totalComm = 0;
      let totalTP = 0;

      for (const sale of sales) {
        let fee = sale.fee || 0;
        let comm = sale.commission || 0;
        if (sale.timeline) {
          sale.timeline.forEach((e: any) => {
            if (e.type === "bonus") fee += e.amount;
            if (e.type === "commission" || e.type === "other") comm += e.amount;
          });
        }
        
        totalFee += fee;
        totalComm += comm;
        
        let thirdParty = 0;
        if (sale.sell_on_gain_pct !== undefined && sale.purchase_fee !== undefined) {
          const gain = Math.max(0, fee - sale.purchase_fee);
          thirdParty = gain * (sale.sell_on_gain_pct / 100);
        } else {
          const rights = parseFloat((sale.rights || "100%").replace("%", "")) / 100;
          thirdParty = fee * (1 - rights);
        }
        totalTP += thirdParty;
      }
      
      const netToSad = totalFee - totalComm - totalTP;
      
      if (totalFee > 0) {
        return {
           netPct: (netToSad / totalFee) * 100,
           commPct: (totalComm / totalFee) * 100,
           tpPct: (totalTP / totalFee) * 100,
        };
      }
      return { netPct: 0, commPct: 0, tpPct: 0 };
    });

    const netProceeds = stats.map(s => s.netPct);
    const commissions = stats.map(s => s.commPct);
    const thirdParty = stats.map(s => s.tpPct);
    return {
      labels,
      datasets: [
        {
          label: isPt ? "Líquido SAD" : "Net SAD",
          data: netProceeds,
          backgroundColor: state.COLORS.posSoft,
          borderColor: state.COLORS.pos,
          borderWidth: 1,
        },
        {
          label: isPt ? "Comissões" : "Commissions",
          data: commissions,
          backgroundColor: state.COLORS.goldSoft,
          borderColor: state.COLORS.gold,
          borderWidth: 1,
        },
        {
          label: isPt ? "Terceiros" : "Third-Party",
          data: thirdParty,
          backgroundColor: state.COLORS.infoSoft,
          borderColor: state.COLORS.info,
          borderWidth: 1,
        },
      ],
    };
  }, [isPt, transferLedger]);

  const transferDonutOptions = useMemo<ChartOptions<"bar">>(
    () => ({
      ...baseOpts,
      plugins: {
        ...baseOpts.plugins,
        tooltip: {
          ...baseOpts.plugins?.tooltip,
          callbacks: {
            label: (ctx: { dataset: { label: string }; parsed: { y: number } }) => {
              const val = ctx.parsed.y;
              return ` ${ctx.dataset.label}: ${val.toFixed(1)}%`;
            },
          },
        },
      },
      scales: {
        x: {
          stacked: true,
          ticks: { font: { size: 10 } },
        },
        y: {
          stacked: true,
          max: 100,
          beginAtZero: true,
          ticks: {
            callback: (v: number) => v.toFixed(0) + "%",
          },
        },
      },
    }),
    [baseOpts],
  );

  return {
    squadBook: { data: squadBookData, options: squadBookOptions },
    transfers: { data: transfersData, options: transfersOptions },
    netTrading,
    transferDonut: { data: transferDonutData, options: transferDonutOptions },
  };
}
