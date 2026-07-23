import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "../../hooks/useTranslation.js";
import { useAppState, state } from "../../core/state.js";
import { AppChart } from "../../components/AppChart.js";
import { baseOpts } from "../../charts/chartDefaults.js";
import { fmtMillions } from "../../charts/chartUtils.js";
import { netDebt, wageBillRatio } from "../metrics.js";

export function CompareTab() {
  const { T } = useTranslation();
  const isPt = useAppState((s) => s.isPt);
  const data = useAppState((s) => s.fullAnnual);

  const [idxA, setIdxA] = useState(0);
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

  const netDebtA = netDebt(a);
  const netDebtB = netDebt(b);
  const wageRatioA = wageBillRatio(a);
  const wageRatioB = wageBillRatio(b);

  // Chart data
  const barKeys = [
    {
      label: isPt ? "Receitas" : "Revenue",
      a: a.revenue_operating,
      b: b.revenue_operating,
    },
    {
      label: isPt ? "Transferências" : "Transfers",
      a: a.player_transfer_income,
      b: b.player_transfer_income,
    },
    {
      label: isPt ? "Res. Líquido" : "Net result",
      a: a.net_result,
      b: b.net_result,
    },
    { label: isPt ? "Cap. Próprio" : "Equity", a: a.equity, b: b.equity },
    { label: isPt ? "Dívida Líq." : "Net debt", a: netDebtA, b: netDebtB },
    { label: isPt ? "Caixa" : "Cash", a: a.cash, b: b.cash },
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
        label: b.label,
        data: barKeys.map((k) => k.b),
        backgroundColor: state.COLORS.goldSoft,
        borderColor: state.COLORS.gold,
        borderWidth: 1,
        borderRadius: 3,
      },
    ],
  };

  const chartOptions = {
    ...baseOpts,
    scales: {
      ...baseOpts.scales,
      y: { ...(baseOpts.scales?.y || {}), beginAtZero: false },
    },
  };

  // Narrative
  const revGrowth =
    Number.isFinite(a.revenue_operating) && a.revenue_operating !== 0
      ? ((b.revenue_operating - a.revenue_operating) /
          Math.abs(a.revenue_operating)) *
        100
      : null;
  const wageBillA = wageRatioA !== null ? (wageRatioA * 100).toFixed(0) : null;
  const wageBillB = wageRatioB !== null ? (wageRatioB * 100).toFixed(0) : null;
  const equityFlip = a.equity < 0 && b.equity >= 0;

  const parts = [];
  if (isPt) {
    parts.push(
      revGrowth !== null
        ? `A receita ${revGrowth >= 0 ? "cresceu" : "caiu"} ${Math.abs(revGrowth).toFixed(0)}% — de ${fmtMillions(a.revenue_operating)} para ${fmtMillions(b.revenue_operating)}.`
        : `A receita passou de ${fmtMillions(a.revenue_operating)} para ${fmtMillions(b.revenue_operating)}.`,
    );
    if (equityFlip) {
      parts.push(
        `O capital próprio passou a ser positivo (${fmtMillions(a.equity)} → ${fmtMillions(b.equity)}), um marco estrutural.`,
      );
    } else {
      parts.push(
        `O capital próprio passou de ${fmtMillions(a.equity)} para ${fmtMillions(b.equity)}.`,
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
        ? `Revenue ${revGrowth >= 0 ? "grew" : "fell"} ${Math.abs(revGrowth).toFixed(0)}% — from ${fmtMillions(a.revenue_operating)} to ${fmtMillions(b.revenue_operating)}.`
        : `Revenue moved from ${fmtMillions(a.revenue_operating)} to ${fmtMillions(b.revenue_operating)}.`,
    );
    if (equityFlip) {
      parts.push(
        `Equity crossed zero (${fmtMillions(a.equity)} → ${fmtMillions(b.equity)}), a structural milestone.`,
      );
    } else {
      parts.push(
        `Equity moved from ${fmtMillions(a.equity)} to ${fmtMillions(b.equity)}.`,
      );
    }
    parts.push(
      wageBillA !== null && wageBillB !== null
        ? `Wage bill: ${wageBillA}% → ${wageBillB}% of revenue. Net debt: ${fmtMillions(netDebtA)} → ${fmtMillions(netDebtB)}.`
        : `Net debt: ${fmtMillions(netDebtA)} → ${fmtMillions(netDebtB)}.`,
    );
  }
  const narrative = parts.join(" ");

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
          b: b.revenue_operating,
          fmt: fmtMillions,
          better: "high",
          monetary: true,
        },
        {
          icon: "📈",
          label: isPt ? "Resultado Líquido" : "Net Result",
          a: a.net_result,
          b: b.net_result,
          fmt: fmtMillions,
          better: "high",
          monetary: true,
        },
        {
          icon: "⚙️",
          label: isPt ? "Resultado Oper. Recorrente" : "Recurring Op. Result",
          a: a.operating_result_excl_players,
          b: b.operating_result_excl_players,
          fmt: fmtMillions,
          better: "high",
          monetary: true,
        },
        {
          icon: "💸",
          label: isPt ? "Resultado Financeiro" : "Financial Result",
          a: a.financial_result,
          b: b.financial_result,
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
          b: b.equity,
          fmt: fmtMillions,
          better: "high",
          monetary: true,
        },
        {
          icon: "📊",
          label: isPt ? "Ativo Total" : "Total Assets",
          a: a.total_assets,
          b: b.total_assets,
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
          b: b.cash,
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
          b: safeDiv(netDebtB, b.revenue_operating),
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
            b.player_transfer_income * 100,
            b.revenue_operating + b.player_transfer_income,
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
          b: safeDiv(b.current_assets, b.current_liabilities),
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
          b: b.player_transfer_income,
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
            b.player_transfer_income +
            b.player_transfer_cost +
            b.squad_amortization_impairment,
          fmt: fmtMillions,
          better: "high",
          monetary: true,
        },
        {
          icon: "📋",
          label: isPt ? "Valor Contabilístico" : "Squad Book Value",
          a: a.squad_book_value,
          b: b.squad_book_value,
          fmt: fmtMillions,
          better: "high",
          monetary: true,
        },
        {
          icon: "📉",
          label: isPt ? "Amortização do Plantel" : "Squad Amortization",
          a: a.squad_amortization_impairment,
          b: b.squad_amortization_impairment,
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
        <T as="div" className="num" i18nKey="ch08-num" />
        <div>
          <T as="h2" i18nKey="ch08-h2" />
          <T as="p" className="lede" i18nKey="ch08-lede" />
        </div>
      </div>
      <div className="card">
        <div className="card-head">
          <T as="h3" i18nKey="ch08-cmp-h3" />
          <T as="span" className="tag" i18nKey="ch08-cmp-tag" />
        </div>
        <T as="p" className="desc" i18nKey="ch08-cmp-desc" />

        <div className="cmp-selectors">
          <div className="cmp-season-pick">
            <T as="label" htmlFor="compareSeasonA" i18nKey="ch08-season-a" />
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
          <T as="div" className="cmp-vs" i18nKey="ch08-vs" />
          <div className="cmp-season-pick">
            <T as="label" htmlFor="compareSeasonB" i18nKey="ch08-season-b" />
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

        <p className="cmp-narrative">{narrative}</p>

        <AppChart
          id="compareBarChart"
          type="bar"
          data={chartData}
          options={chartOptions as any}
          className="chart-box--short"
          valueType="currency-millions"
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
}
