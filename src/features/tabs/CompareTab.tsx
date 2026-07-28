import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "../../hooks/useTranslation.js";
import { useAppState, state } from "../../core/state.js";
import { AppChart } from "../../components/AppChart.js";
import { baseOpts } from "../../charts/chartDefaults.js";
import { fmtMillions } from "../../charts/chartUtils.js";
import { netDebt, wageBillRatio } from "../financialMetrics.js";

export const CompareTab = React.memo(function CompareTab() {
  const { T } = useTranslation();
  const isPt = useAppState((s) => s.isPt);
  const data = useAppState((s) => s.fullAnnual);

  const [idxA, setIdxA] = useState(0);
  const [vsAverage, setVsAverage] = useState(false);
  const [avgWindow, setAvgWindow] = useState("all");
  const [idxB, setIdxB] = useState(() =>
    data && data.length > 0 ? data.length - 1 : 0,
  );

  useEffect(() => {
    if (!data || data.length === 0) return;
    const idxOf = (label: string) => data.findIndex((d) => d.label === label);
    let restoreA = -1;
    let restoreB = -1;

    if (state.urlCmpA) restoreA = idxOf(state.urlCmpA);
    if (state.urlCmpB) restoreB = idxOf(state.urlCmpB);

    if (restoreA >= 0) setIdxA(restoreA);
    if (restoreB >= 0) setIdxB(restoreB);
  }, [data]);

  useEffect(() => {
    if (data && data[idxA] && data[idxB]) {
      state.urlCmpA = data[idxA].label;
      state.urlCmpB = data[idxB].label;
    }
  }, [idxA, idxB, data]);

  if (!data || data.length === 0) return null;

  const a = data[idxA];
  const b = data[idxB];
  if (!a || !b) return null;

  // Averages for vsAverage mode — excludes selected season, supports windows
  const avgData = useMemo(() => {
    if (!data || data.length === 0) return null;
    // Determine window range
    const currentIdx = idxA;
    let windowData = data;
    if (avgWindow === "last3" && data.length >= 3) {
      windowData = data.slice(-3);
    } else if (avgWindow === "last5" && data.length >= 5) {
      windowData = data.slice(-5);
    }
    // Exclude the selected season from the average
    const filtered = windowData.filter((_: any, i: number) => {
      const globalIdx = data.indexOf(windowData[i]);
      return globalIdx !== currentIdx;
    });
    if (filtered.length === 0) return null;
    const count = filtered.length;
    const avg = (field: string) => filtered.reduce((s: number, d: any) => s + (d[field] || 0), 0) / count;
    const vals = (field: string) => filtered.map((d: any) => d[field] || 0);
    const min = (field: string) => Math.min(...vals(field));
    const max = (field: string) => Math.max(...vals(field));
    return {
      revenue_operating: avg("revenue_operating"),
      player_transfer_income: avg("player_transfer_income"),
      net_result: avg("net_result"),
      equity: avg("equity"),
      cash: avg("cash"),
      operating_result_excl_players: avg("operating_result_excl_players"),
      financial_result: avg("financial_result"),
      squad_book_value: avg("squad_book_value"),
      squad_amortization_impairment: avg("squad_amortization_impairment"),
      player_transfer_cost: avg("player_transfer_cost"),
      total_assets: avg("total_assets"),
      current_assets: avg("current_assets"),
      current_liabilities: avg("current_liabilities"),
      personnel_costs: avg("personnel_costs"),
      borrowings_nc: avg("borrowings_nc"),
      borrowings_c: avg("borrowings_c"),
      min_revenue: min("revenue_operating"),
      max_revenue: max("revenue_operating"),
      min_equity: min("equity"),
      max_equity: max("equity"),
      min_net_result: min("net_result"),
      max_net_result: max("net_result"),
      min_cash: min("cash"),
      max_cash: max("cash"),
      count,
      label: isPt ? "Média" : "Average",
    };
  }, [data, isPt, idxA, avgWindow]);

  const useAverage = vsAverage && avgData !== null;
  const seasonB = useAverage ? avgData : b;

  const netDebtA = netDebt(a);
  const netDebtB = netDebt(seasonB);
  const wageRatioA = wageBillRatio(a);
  const wageRatioB = wageBillRatio(seasonB);

  // Chart data
  const barKeys = [
    {
      label: isPt ? "Receitas" : "Revenue",
      a: a.revenue_operating,
      b: seasonB.revenue_operating,
    },
    {
      label: isPt ? "Transferências" : "Transfers",
      a: a.player_transfer_income,
      b: seasonB.player_transfer_income,
    },
    {
      label: isPt ? "Res. Líquido" : "Net result",
      a: a.net_result,
      b: seasonB.net_result,
    },
    { label: isPt ? "Cap. Próprio" : "Equity", a: a.equity, b: seasonB.equity },
    { label: isPt ? "Dívida Líq." : "Net debt", a: netDebtA, b: netDebtB },
    { label: isPt ? "Caixa" : "Cash", a: a.cash, b: seasonB.cash },
  ];

  const chartData = {
    labels: barKeys.map((k) => k.label),
    datasets: [
      {
        label: a.label,
        data: barKeys.map((k) => k.a),
        backgroundColor: state.COLORS.posSoft,
        borderColor: state.COLORS.pos,
        borderWidth: 1,
        borderRadius: 3,
      },
      {
        label: useAverage ? (isPt ? "Média" : "Average") : b.label,
        data: barKeys.map((k) => k.b),
        backgroundColor: useAverage ? state.COLORS.mutedSoft : state.COLORS.goldSoft,
        borderColor: useAverage ? state.COLORS.muted : state.COLORS.gold,
        borderWidth: 1,
        borderRadius: 3,
      },
    ],
  };

  const chartOptions = {
    ...baseOpts,
    plugins: {
      ...baseOpts.plugins,
      tooltip: {
        ...baseOpts.plugins?.tooltip,
        callbacks: {
          label: (ctx: { dataset: { label: string }; parsed: { y: number } }) => {
            const val = ctx.parsed.y;
            const sign = val < 0 ? "−" : "";
            return ` ${ctx.dataset.label}: ${sign}€${(Math.abs(val) / 1000).toFixed(1)}M`;
          },
        },
      },
    },
    scales: {
      ...baseOpts.scales,
      y: { ...(baseOpts.scales?.y || {}), beginAtZero: false },
    },
  };

  // Narrative
  const revGrowth =
    Number.isFinite(a.revenue_operating) && a.revenue_operating !== 0
      ? ((seasonB.revenue_operating - a.revenue_operating) /
          Math.abs(a.revenue_operating)) *
        100
      : null;
  const wageBillA = wageRatioA !== null ? (wageRatioA * 100).toFixed(0) : null;
  const wageBillB = wageRatioB !== null ? (wageRatioB * 100).toFixed(0) : null;
  const equityFlip = a.equity < 0 && seasonB.equity >= 0;

  const parts = [];
  if (isPt) {
    parts.push(
      revGrowth !== null
        ? `A receita ${revGrowth >= 0 ? "cresceu" : "caiu"} ${Math.abs(revGrowth).toFixed(0)}% — de ${fmtMillions(a.revenue_operating)} para ${fmtMillions(seasonB.revenue_operating)}.`
        : `A receita passou de ${fmtMillions(a.revenue_operating)} para ${fmtMillions(seasonB.revenue_operating)}.`,
    );
    if (equityFlip) {
      parts.push(
        `O capital próprio passou a ser positivo (${fmtMillions(a.equity)} → ${fmtMillions(seasonB.equity)}), um marco estrutural.`,
      );
    } else {
      parts.push(
        `O capital próprio passou de ${fmtMillions(a.equity)} para ${fmtMillions(seasonB.equity)}.`,
      );
    }
    parts.push(
      wageBillA !== null && wageBillB !== null
        ? `Custos com pessoal: de ${wageBillA}% para ${wageBillB}% da receita. Dívida líquida: de ${fmtMillions(netDebtA)} para ${fmtMillions(netDebtB)}.`
        : `Dívida líquida: de ${fmtMillions(netDebtA)} para ${fmtMillions(netDebtB)}.`,
    );
  } else {
    parts.push(
      revGrowth !== null
        ? `Revenue ${revGrowth >= 0 ? "grew" : "fell"} ${Math.abs(revGrowth).toFixed(0)}% — from ${fmtMillions(a.revenue_operating)} to ${fmtMillions(seasonB.revenue_operating)}.`
        : `Revenue moved from ${fmtMillions(a.revenue_operating)} to ${fmtMillions(seasonB.revenue_operating)}.`,
    );
    if (equityFlip) {
      parts.push(
        `Equity crossed zero (${fmtMillions(a.equity)} → ${fmtMillions(seasonB.equity)}), a structural milestone.`,
      );
    } else {
      parts.push(
        `Equity moved from ${fmtMillions(a.equity)} to ${fmtMillions(seasonB.equity)}.`,
      );
    }
    parts.push(
      wageBillA !== null && wageBillB !== null
        ? `Wage bill: ${wageBillA}% → ${wageBillB}% of revenue. Net debt: ${fmtMillions(netDebtA)} → ${fmtMillions(netDebtB)}.`
        : `Net debt: ${fmtMillions(netDebtA)} → ${fmtMillions(netDebtB)}.`,
    );
  }
  const narrative = useAverage
    ? (isPt
        ? `Comparação entre ${a.label} e a média do período. ${parts.join(" ")}`
        : `Comparison between ${a.label} and the period average. ${parts.join(" ")}`)
    : parts.join(" ");

  // Grid
  const safeDiv = (n: number, d: number) =>
    Number.isFinite(d) && d !== 0 ? n / d : null;

  const groups = [
    {
      title: isPt
        ? "Rentabilidade & Demonstração de Resultados"
        : "Profitability & P&L",
      metrics: [
        {
          icon: "💰",
          label: isPt ? "Receita Operacional" : "Operating Revenue",
          a: a.revenue_operating,
          b: seasonB.revenue_operating,
          fmt: fmtMillions,
          better: "high",
          monetary: true,
        },
        {
          icon: "📈",
          label: isPt ? "Resultado Líquido" : "Net Result",
          a: a.net_result,
          b: seasonB.net_result,
          fmt: fmtMillions,
          better: "high",
          monetary: true,
        },
        {
          icon: "⚙️",
          label: isPt ? "Resultado Oper. Recorrente" : "Recurring Op. Result",
          a: a.operating_result_excl_players,
          b: seasonB.operating_result_excl_players,
          fmt: fmtMillions,
          better: "high",
          monetary: true,
        },
        {
          icon: "💸",
          label: isPt ? "Resultado Financeiro" : "Financial Result",
          a: a.financial_result,
          b: seasonB.financial_result,
          fmt: fmtMillions,
          better: "high",
          monetary: true,
        },
      ],
    },
    {
      title: isPt ? "Balanço" : "Balance Sheet",
      metrics: [
        {
          icon: "⚖️",
          label: isPt ? "Capital Próprio" : "Shareholders' Equity",
          a: a.equity,
          b: seasonB.equity,
          fmt: fmtMillions,
          better: "high",
          monetary: true,
        },
        {
          icon: "📊",
          label: isPt ? "Ativo Total" : "Total Assets",
          a: a.total_assets,
          b: seasonB.total_assets,
          fmt: fmtMillions,
          better: "high",
          monetary: true,
        },
        {
          icon: "💳",
          label: isPt ? "Dívida Líquida" : "Net Debt",
          a: netDebtA,
          b: netDebtB,
          fmt: fmtMillions,
          better: "low",
          monetary: true,
        },
        {
          icon: "🏧",
          label: isPt ? "Caixa e Equivalentes" : "Cash on Hand",
          a: a.cash,
          b: seasonB.cash,
          fmt: fmtMillions,
          better: "high",
          monetary: true,
        },
      ],
    },
    {
      title: isPt ? "Rácios de Eficiência" : "Efficiency Ratios",
      metrics: [
        {
          icon: "💼",
          label: isPt ? "Custos com Pessoal" : "Wage Bill",
          a: wageRatioA !== null ? wageRatioA * 100 : null,
          b: wageRatioB !== null ? wageRatioB * 100 : null,
          fmt: (v: number | null) =>
            v === null
              ? "—"
              : v.toFixed(0) + "% " + (isPt ? "da receita" : "of revenue"),
          better: "low",
          monetary: false,
        },
        {
          icon: "🔗",
          label: isPt ? "Dívida Líquida / Receita" : "Net Debt / Revenue",
          a: safeDiv(netDebtA, a.revenue_operating),
          b: safeDiv(netDebtB, seasonB.revenue_operating),
          fmt: (v: number | null) => (v === null ? "—" : v.toFixed(1) + "×"),
          better: "low",
          monetary: false,
        },
        {
          icon: "🔄",
          label: isPt ? "Dependência de Passes" : "Transfer Reliance",
          a: safeDiv(
            a.player_transfer_income * 100,
            a.revenue_operating + a.player_transfer_income,
          ),
          b: safeDiv(
            seasonB.player_transfer_income * 100,
            seasonB.revenue_operating + seasonB.player_transfer_income,
          ),
          fmt: (v: number | null) =>
            v === null
              ? "—"
              : v.toFixed(0) +
                "% " +
                (isPt ? "do rendimento total" : "of total income"),
          better: "low",
          monetary: false,
        },
        {
          icon: "⚡",
          label: isPt ? "Rácio de Solvência" : "Current Ratio",
          a: safeDiv(a.current_assets, a.current_liabilities),
          b: safeDiv(seasonB.current_assets, seasonB.current_liabilities),
          fmt: (v: number | null) => (v === null ? "—" : v.toFixed(2) + "×"),
          better: "high",
          monetary: false,
        },
      ],
    },
    {
      title: isPt ? "Plantel & Transferências" : "Squad & Transfers",
      metrics: [
        {
          icon: "💵",
          label: isPt ? "Receitas de Passes" : "Transfer Income",
          a: a.player_transfer_income,
          b: seasonB.player_transfer_income,
          fmt: fmtMillions,
          better: "high",
          monetary: true,
        },
        {
          icon: "🏆",
          label: isPt ? "Saldo de Transf. + Amort." : "Net Player Trading",
          a:
            a.player_transfer_income +
            a.player_transfer_cost +
            a.squad_amortization_impairment,
          b:
            seasonB.player_transfer_income +
            seasonB.player_transfer_cost +
            seasonB.squad_amortization_impairment,
          fmt: fmtMillions,
          better: "high",
          monetary: true,
        },
        {
          icon: "📋",
          label: isPt ? "Valor Contabilístico" : "Squad Book Value",
          a: a.squad_book_value,
          b: seasonB.squad_book_value,
          fmt: fmtMillions,
          better: "high",
          monetary: true,
        },
        {
          icon: "📉",
          label: isPt ? "Amortização do Plantel" : "Squad Amortization",
          a: a.squad_amortization_impairment,
          b: seasonB.squad_amortization_impairment,
          fmt: fmtMillions,
          better: "high",
          monetary: true,
        },
      ],
    },
  ];

  return (
    <>
      <div className="chapter">
        <T as="div" className="num" i18nKey="ch07-num" />
        <div>
          <T as="h2" i18nKey="ch07-h2" />
          <T as="p" className="lede" i18nKey="ch07-lede" />
        </div>
      </div>
      <div className="card">
        <div className="card-head">
          <T as="h3" i18nKey="ch07-cmp-h3" />
          <T as="span" className="tag" i18nKey="ch07-cmp-tag" />
        </div>
        <T as="p" className="desc" i18nKey="ch07-cmp-desc" />

        <div className="cmp-selectors">
          <div className="cmp-season-pick">
            <T as="label" htmlFor="compareSeasonA" i18nKey="ch07-season-a" />
            <select
              id="compareSeasonA"
              value={idxA}
              onChange={(e) => setIdxA(parseInt(e.target.value, 10))}
            >
              {data.map((d, i) => (
                <option key={i} value={i}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
          <T as="div" className="cmp-vs" i18nKey="ch07-vs" />
          <div className="cmp-season-pick">
            <T as="label" htmlFor="compareSeasonB" i18nKey="ch07-season-b" />
            <select
              id="compareSeasonB"
              value={idxB}
              onChange={(e) => setIdxB(parseInt(e.target.value, 10))}
            >
              {data.map((d, i) => (
                <option key={i} value={i}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", padding: "0 20px", flexWrap: "wrap" }}>
          <span className="desc" style={{ margin: 0 }}>
            {isPt ? "Comparar vs média:" : "Compare vs average:"}
          </span>
          <button
            className={`btn-preset ${vsAverage ? "active" : ""}`}
            onClick={() => setVsAverage(!vsAverage)}
            style={{ padding: "6px 14px", fontSize: "var(--fs-sm)" }}
          >
            {vsAverage
              ? (isPt ? "Duas épocas" : "Two seasons")
              : (isPt ? "Vs média" : "Vs average")}
          </button>
          {vsAverage && (
            <>
              <span style={{ fontSize: "var(--fs-sm)", color: "var(--muted)" }}>|</span>
              <button
                className={`btn-preset ${avgWindow === "all" ? "active" : ""}`}
                onClick={() => setAvgWindow("all")}
                style={{ padding: "4px 10px", fontSize: "var(--fs-sm)" }}
              >
                {isPt ? "Todas" : "All"}
              </button>
              <button
                className={`btn-preset ${avgWindow === "last5" ? "active" : ""}`}
                onClick={() => setAvgWindow("last5")}
                style={{ padding: "4px 10px", fontSize: "var(--fs-sm)" }}
              >
                {isPt ? "Últ. 5" : "Last 5"}
              </button>
              <button
                className={`btn-preset ${avgWindow === "last3" ? "active" : ""}`}
                onClick={() => setAvgWindow("last3")}
                style={{ padding: "4px 10px", fontSize: "var(--fs-sm)" }}
              >
                {isPt ? "Últ. 3" : "Last 3"}
              </button>
              <span style={{ fontSize: "var(--fs-sm)", color: "var(--muted)" }}>
                {avgData
                  ? (isPt
                      ? `${avgData.count} épocas (exclui ${data[idxA]?.label || ""})`
                      : `${avgData.count} seasons (excludes ${data[idxA]?.label || ""})`)
                  : ""}
              </span>
            </>
          )}
        </div>

        <p className="cmp-narrative">{narrative}</p>

        <AppChart
          id="compareBarChart"
          type="bar"
          data={chartData}
          options={chartOptions as any}
          className="chart-box--short"
          valueType="currency-thousands"
        />

        <div className="cmp-col-headers">
          <span className="sr-only">Metric</span>
          <span>{a.label}</span>
          <span className="sr-only">Trend</span>
          <span>{b.label}</span>
        </div>

        <div className="comparison-grid">
          {groups.map((g, i) => (
            <div key={i} className="cmp-group">
              <div className="cmp-group-title">{g.title}</div>
              <div className="cmp-group-grid">
                {g.metrics.map((m, j) => {
                  const hasValues =
                    m.a !== null &&
                    m.b !== null &&
                    Number.isFinite(m.a) &&
                    Number.isFinite(m.b);
                  const aVal = m.a as number;
                  const bVal = m.b as number;
                  const improved =
                    hasValues &&
                    (m.better === "high" ? bVal > aVal : bVal < aVal);
                  const same = hasValues && aVal === bVal;
                  const pct =
                    hasValues && aVal !== 0
                      ? ((bVal - aVal) / Math.abs(aVal)) * 100
                      : null;
                  const absDelta = hasValues ? bVal - aVal : null;
                  const arrow = !hasValues
                    ? ""
                    : same
                      ? "—"
                      : improved
                        ? "▲"
                        : "▼";
                  const pctStr =
                    pct !== null
                      ? (pct >= 0 ? "+" : "") + pct.toFixed(0) + "%"
                      : "";
                  const cls = !hasValues
                    ? "neu"
                    : same
                      ? "neu"
                      : improved
                        ? "pos"
                        : "neg";
                  const absStr =
                    m.monetary && absDelta !== null
                      ? `${absDelta >= 0 ? "+" : ""}${fmtMillions(absDelta)} ${isPt ? "variação absoluta" : "absolute change"}`
                      : null;

                  return (
                    <div key={j} className="cmp-card">
                      <div className="cmp-icon">{m.icon}</div>
                      <div className="cmp-label">{m.label}</div>
                      <div className="cmp-row">
                        <div className="cmp-val">{m.fmt(m.a as any)}</div>
                        <div className={`cmp-delta ${cls}`}>
                          {arrow} {pctStr}
                        </div>
                        <div className="cmp-val b">{m.fmt(m.b as any)}</div>
                      </div>
                      {absStr && (
                        <div className={`cmp-abs-delta ${cls}`}>{absStr}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
});
