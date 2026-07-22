import React, { useMemo } from "react";
import { AppChart } from "../components/AppChart.js";
import { useAppState } from "../core/state.ts";
import { getBrandColors } from "../charts/chartUtils.ts";
import { useTranslation } from "../hooks/useTranslation.js";
import type { ChartOptions, BrandColors } from "../core/types.js";

const FALLBACK = getBrandColors(false);

interface ManagerEra {
  seasons: string[];
  en: string;
  pt?: string;
  isFallback?: boolean;
}

const MANAGER_ERAS: ManagerEra[] = [
  {
    seasons: ["2012/13"],
    en: "Jesualdo/Sa Pinto (12/13)",
    pt: "Jesualdo/Sá Pinto (12/13)",
  },
  { seasons: ["2013/14"], en: "Leonardo Jardim (13/14)" },
  { seasons: ["2014/15"], en: "Marco Silva (14/15)" },
  {
    seasons: ["2015/16", "2016/17", "2017/18"],
    en: "Jorge Jesus (15/16 - 17/18)",
  },
  { seasons: ["2018/19", "2019/20"], en: "Keizer / Silas (18/19 - 19/20)" },
  {
    seasons: ["2020/21", "2021/22", "2022/23", "2023/24"],
    en: "Rúben Amorim (20/21 - 23/24)",
  },
  { seasons: ["2024/25"], en: "Amorim / Pereira / Borges (24/25)" },
  { seasons: [], en: "Rui Borges (25/26 - )", isFallback: true },
];

function getEraForSeason(season: string, isPt: boolean) {
  const entry =
    MANAGER_ERAS.find((e) => e.seasons.includes(season)) ||
    MANAGER_ERAS[MANAGER_ERAS.length - 1];
  return isPt && entry.pt ? entry.pt : entry.en;
}

function transferChartOptions(stacked = false, baseOpts: ChartOptions, COLORS: BrandColors) {
  return {
    ...baseOpts,
    plugins: {
      ...baseOpts?.plugins,
      legend: {
        display: true,
        position: "bottom" as const,
        labels: {
          color: COLORS?.ink || FALLBACK.ink,
          font: { size: 12 },
          padding: 16,
        },
      },
      tooltip: {
        ...baseOpts?.plugins?.tooltip,
        callbacks: {
          ...baseOpts?.plugins?.tooltip?.callbacks,
          label: function (context: any) {
            return `${context.dataset.label}: ${context.raw.toFixed(1)} M€`;
          },
        },
      },
    },
    scales: {
      x: { ...baseOpts?.scales?.x, stacked },
      y: {
        ...baseOpts?.scales?.y,
        stacked,
        ticks: {
          ...baseOpts?.scales?.y?.ticks,
          callback: (value: any) => value + " M€",
        },
      },
    },
  };
}

export function SquadAnalytics() {
  const { t, T } = useTranslation();
  const isPt = useAppState((s) => s.isPt);
  const ledger = useAppState((s) => s.TRANSFER_LEDGER);
  const baseOpts = useAppState((s) => s.baseOpts);
  const COLORS = useAppState((s) => s.COLORS);

  const labels = useMemo(
    () => MANAGER_ERAS.map((e) => (isPt && e.pt ? e.pt : e.en)),
    [isPt],
  );

  const {
    sales,
    purchases,
    netSpend,
    salesCommissions,
    purchasesCommissions,
    seasons,
  } = useMemo(() => {
    const erasData: Record<string, { sales: number; purchases: number }> = {};
    labels.forEach((label) => {
      erasData[label] = { sales: 0, purchases: 0 };
    });

    const seasonsList: string[] = [];
    const salesComm: number[] = [];
    const purchComm: number[] = [];

    (ledger || []).forEach((seasonObj) => {
      seasonsList.push(seasonObj.season);
      const era = getEraForSeason(seasonObj.season, isPt);

      let sTotal = 0;
      let pTotal = 0;
      let sComm = 0;
      let pComm = 0;

      if (seasonObj.sales) {
        seasonObj.sales.forEach((p) => {
          sTotal += p.fee || 0;
          sComm += p.commission || 0;
        });
      }
      if (seasonObj.purchases) {
        seasonObj.purchases.forEach((p) => {
          pTotal += p.fee || 0;
          pComm += p.commission || 0;
        });
      }

      if (erasData[era]) {
        erasData[era].sales += sTotal;
        erasData[era].purchases += pTotal;
      }

      salesComm.push(sComm);
      purchComm.push(pComm);
    });

    return {
      sales: labels.map((l) => erasData[l].sales),
      purchases: labels.map((l) => erasData[l].purchases),
      netSpend: labels.map((l) => erasData[l].sales - erasData[l].purchases),
      salesCommissions: salesComm,
      purchasesCommissions: purchComm,
      seasons: seasonsList,
    };
  }, [ledger, labels, isPt]);

  const erasData = {
    labels,
    datasets: [
      {
        type: "bar" as const,
        label: isPt ? "Vendas (M€)" : "Sales (M€)",
        data: sales,
        backgroundColor: COLORS?.posSoft || FALLBACK.posSoft,
        borderColor: COLORS?.pos || FALLBACK.pos,
        borderWidth: 1,
        borderRadius: 4,
        order: 1,
      },
      {
        type: "bar" as const,
        label: isPt ? "Compras (M€)" : "Purchases (M€)",
        data: purchases,
        backgroundColor: COLORS?.negSoft || FALLBACK.negSoft,
        borderColor: COLORS?.neg || FALLBACK.neg,
        borderWidth: 1,
        borderRadius: 4,
        order: 1,
      },
      {
        type: "line" as const,
        label: isPt ? "Ganho Líquido (M€)" : "Net Earnings (M€)",
        data: netSpend,
        backgroundColor: COLORS?.goldSoft || FALLBACK.goldSoft,
        borderColor: COLORS?.gold || FALLBACK.gold,
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
        order: 0,
      },
    ],
  };

  const commData = {
    labels: seasons,
    datasets: [
      {
        label: isPt ? "Comissões em Vendas" : "Sales Commissions",
        data: salesCommissions,
        backgroundColor: COLORS?.posSoft || FALLBACK.posSoft,
        borderColor: COLORS?.pos || FALLBACK.pos,
        borderWidth: 1,
        stack: "Stack 0",
      },
      {
        label: isPt ? "Comissões em Compras" : "Acquisition Commissions",
        data: purchasesCommissions,
        backgroundColor: COLORS?.negSoft || FALLBACK.negSoft,
        borderColor: COLORS?.neg || FALLBACK.neg,
        borderWidth: 1,
        stack: "Stack 0",
      },
    ],
  };

  return (
    <>
      <div className="card">
        <div className="card-head">
          <T as="h3" i18nKey="chart_eras_title" />
          <T as="span" className="tag" i18nKey="chart_eras_subtitle" />
        </div>
        <div className="chart-box tall">
          <AppChart
            id="squad-eras"
            type="bar"
            data={erasData as any}
            options={transferChartOptions(false, baseOpts, COLORS)}
          />
        </div>
      </div>
      <div className="card">
        <div className="card-head">
          <T as="h3" i18nKey="chart_commissions_title" />
          <T as="span" className="tag" i18nKey="chart_commissions_subtitle" />
        </div>
        <div className="chart-box tall">
          <AppChart
            id="squad-commissions"
            type="bar"
            data={commData}
            options={transferChartOptions(true, baseOpts, COLORS)}
          />
        </div>
      </div>
    </>
  );
}
