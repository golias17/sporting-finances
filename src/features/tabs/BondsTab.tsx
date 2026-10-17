import React, { useMemo } from "react";
import {
  VmocCost,
  LionFinance,
  PublicBonds,
  UsppTerms,
  DebtMaturityTracker,
} from "../Bonds";
import { ChartCard } from "../../components/ChartCard.js";
import { useAppState, state } from "../../core/state.js";
import { useChartLabels } from "../../charts/chartHooks.js";
import { useTranslation } from "../../hooks/useTranslation.js";

export const BondsTab = React.memo(function BondsTab() {
  const { T } = useTranslation();
  const baseOpts = useAppState((s) => s.baseOpts);
  const isPt = useAppState((s) => s.isPt);
  const theme = useAppState((s) => s.theme);
  const annual = useAppState((s) => s.annual);
  const labels = useChartLabels();

  const firstSeason = labels[0] || "2010/11";
  const lastSeason = labels[labels.length - 1] || "2025/26";
  const financingPeriodTag = `${firstSeason} → ${lastSeason}`;

  // Financing Cost Evolution — total borrowings (NC + C) over time
  const financingData = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: isPt ? "Empréstimos não correntes" : "Non-current borrowings",
          data: annual.map((d: any) => d.borrowings_nc / 1000),
          borderColor: state.COLORS.pos,
          backgroundColor: state.COLORS.pos,
          tension: 0.35,
          fill: false,
          pointRadius: 3,
          pointHoverRadius: 5,
        },
        {
          label: isPt ? "Empréstimos correntes" : "Current borrowings",
          data: annual.map((d: any) => d.borrowings_c / 1000),
          borderColor: state.COLORS.gold,
          backgroundColor: state.COLORS.gold,
          tension: 0.35,
          fill: false,
          pointRadius: 3,
          pointHoverRadius: 5,
        },
      ],
    }),
    [labels, annual, isPt, theme],
  );

  const financingOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index" as const, intersect: false },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: state.COLORS.lineBorder },
          ticks: {
            color: state.COLORS.muted,
            callback: (v: number) => v.toFixed(0) + "M€",
            font: { size: 11 },
          },
          title: {
            display: true,
            text: isPt ? "Milhões €" : "Millions €",
            color: state.COLORS.muted,
            font: { size: 12, weight: "bold" as const },
          },
        },
        x: {
          grid: { display: false },
          ticks: { color: state.COLORS.muted, font: { size: 10 } },
        },
      },
      plugins: {
        legend: {
          position: "bottom" as const,
          labels: { color: state.COLORS.ink, boxWidth: 12, padding: 16 },
        },
        tooltip: {
          ...baseOpts?.plugins?.tooltip,
          mode: "index" as const,
          callbacks: {
            label: (ctx: {
              dataset: { label: string };
              parsed: { y: number };
            }) => {
              return ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(1)} M€`;
            },
            footer: (items: { parsed: { y: number } }[]) => {
              if (items.length === 0) return "";
              const total = items.reduce(
                (s: number, i: { parsed: { y: number } }) => s + i.parsed.y,
                0,
              );
              return [`Total: ${total.toFixed(1)} M€`];
            },
          },
        },
      },
    }),
    [baseOpts, isPt, theme],
  );

  return (
    <>
      <div className="chapter">
        <T as="div" className="num" i18nKey="ch05-num" />
        <div>
          <T as="h2" i18nKey="ch05-h2" />
          <T as="p" className="lede" i18nKey="ch05-lede" />
        </div>
      </div>
      {/* VMOC narrative */}
      <div className="narrative">
        <T as="h4" i18nKey="ch05-vmoc-h4" />
        <T as="p" i18nKey="ch05-vmoc-p1" />
        <T as="p" i18nKey="ch05-vmoc-p2" />
      </div>
      {/* Financing Cost Evolution Chart */}
      <ChartCard
        id="chartFinancingCost"
        title={
          <T as="h3" i18nKey="ch05-borrowings-h3">
            {isPt
              ? "🏦 Estrutura da dívida financeira — não corrente vs. corrente"
              : "🏦 Financial debt structure — non-current vs. current"}
          </T>
        }
        tag={<span className="tag">{financingPeriodTag}</span>}
        desc={
          <T as="p" className="desc" i18nKey="ch05-borrowings-desc">
            {isPt
              ? "Evolução dos empréstimos bancários e obrigacionistas de curto e longo prazo (M€), evidenciando o alongamento de maturidades após a emissão USPP de €225M."
              : "Evolution of short-term and long-term bank and bond borrowings (€M), highlighting the maturity extension following the €225M USPP placement."}
          </T>
        }
        chartType="line"
        data={financingData}
        options={financingOptions}
        chartClassName="tall"
        valueType="currency-millions"
      />

      {/* VMOC cost breakdown table */}
      <div className="card">
        <div className="card-head">
          <T as="h3" i18nKey="ch05-uspp-h3" />
          <T as="span" className="tag" i18nKey="ch05-uspp-tag" />
        </div>
        <T as="p" className="desc" i18nKey="ch05-uspp-desc" />
        <VmocCost />
      </div>
      {/* Lion Finance narrative */}
      <div className="narrative narrative--spaced">
        <T as="h4" i18nKey="ch05-timeline-h4" />
        <T as="p" i18nKey="ch05-timeline-p1" />
        <T as="p" i18nKey="ch05-timeline-p2" />
      </div>
      {/* Lion Finance cards */}
      <div className="card">
        <div className="card-head">
          <T as="h3" i18nKey="ch05-summary-h3" />
          <T as="span" className="tag" i18nKey="ch05-summary-tag" />
        </div>
        <T as="p" className="desc" i18nKey="ch05-summary-desc" />
        <LionFinance />
      </div>

      {/* Public Retail Bonds (Empréstimos Obrigacionistas) */}
      <PublicBonds />
      {/* USPP narrative + key terms */}
      <div className="narrative narrative--spaced">
        <T as="h4" i18nKey="ch05-impact-h4" />
        <T as="p" i18nKey="ch05-impact-p1" />
        <T as="p" i18nKey="ch05-impact-p2" />
      </div>
      {/* USPP key terms card */}
      <div className="card">
        <div className="card-head">
          <T as="h3" i18nKey="ch05-schedule-h3" />
          <T as="span" className="tag" i18nKey="ch05-schedule-tag" />
        </div>
        <T as="p" className="desc" i18nKey="ch05-schedule-p1" />
        <UsppTerms />
      </div>

      {/* Debt Maturity Tracker & Repayment Schedule */}
      <DebtMaturityTracker />
    </>
  );
});
