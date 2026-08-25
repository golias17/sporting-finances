import React, { useState, useMemo } from "react";
import { useAppState, state } from "../../core/state.js";
import { useTranslation } from "../../hooks/useTranslation.js";
import { AppChart } from "../../components/AppChart.js";
import {
  computeEfficiencySeries,
  computeCycleEfficiencySummary,
} from "./financialEfficiencyData.js";
import type { FinancialRecord } from "../../core/types.js";

interface FinancialEfficiencyModuleProps {
  timeWindow: "all" | "last5" | "last3";
}

type EfficiencyViewMode = "cpp" | "spend_vs_pts" | "cost_per_title";

export function FinancialEfficiencyModule({
  timeWindow = "all",
}: FinancialEfficiencyModuleProps) {
  const { t, T } = useTranslation();
  const isPt = useAppState((s) => s.isPt);
  const annual = useAppState((s) => s.annual) as FinancialRecord[];
  const benfica = (useAppState((s) => s.BENFICA_DATASET?.annual_data) ||
    []) as FinancialRecord[];
  const porto = (useAppState((s) => s.PORTO_DATASET?.annual_data) ||
    []) as FinancialRecord[];
  const baseOpts = useAppState((s) => s.baseOpts);

  const [viewMode, setViewMode] = useState<EfficiencyViewMode>("cpp");
  const [showInsights, setShowInsights] = useState<boolean>(false);

  const series = useMemo(
    () => computeEfficiencySeries(annual, benfica, porto),
    [annual, benfica, porto],
  );

  const cycleSummary = useMemo(
    () => computeCycleEfficiencySummary(annual, benfica, porto, timeWindow),
    [annual, benfica, porto, timeWindow],
  );

  const savingsVsBenfica = useMemo(() => {
    return Math.max(0, cycleSummary.benfica.totalSpend - cycleSummary.sporting.totalSpend);
  }, [cycleSummary]);

  const count = timeWindow === "last3" ? 3 : timeWindow === "last5" ? 5 : 15;
  const slicedSeries = useMemo(() => series.slice(-count), [series, count]);

  // Chart configuration based on viewMode
  const chartData = useMemo(() => {
    if (viewMode === "cpp") {
      return {
        labels: slicedSeries.map((s) => s.season),
        datasets: [
          {
            label: "Sporting CP",
            data: slicedSeries.map((s) => s.sportingCpp),
            borderColor: state.COLORS.pos || "#0a5d3a",
            backgroundColor: state.COLORS.pos || "#0a5d3a",
            borderWidth: 3,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBackgroundColor: state.COLORS.pos || "#0a5d3a",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 2,
            fill: false,
            tension: 0.25,
          },
          {
            label: "SL Benfica",
            data: slicedSeries.map((s) => s.benficaCpp),
            borderColor: state.COLORS.neg || "#b8403a",
            backgroundColor: state.COLORS.neg || "#b8403a",
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: state.COLORS.neg || "#b8403a",
            fill: false,
            tension: 0.25,
          },
          {
            label: "FC Porto",
            data: slicedSeries.map((s) => s.portoCpp),
            borderColor: state.COLORS.info || "#2c5b8a",
            backgroundColor: state.COLORS.info || "#2c5b8a",
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: state.COLORS.info || "#2c5b8a",
            fill: false,
            tension: 0.25,
          },
        ],
      };
    }

    if (viewMode === "spend_vs_pts") {
      return {
        labels: slicedSeries.map((s) => s.season),
        datasets: [
          {
            type: "bar" as const,
            label: isPt ? "Gasto Futebol Sporting (€M)" : "Sporting Football Spend (€M)",
            data: slicedSeries.map((s) => s.sportingSpend),
            backgroundColor: state.COLORS.pos || "#0a5d3a",
            borderRadius: 4,
          },
          {
            type: "bar" as const,
            label: isPt ? "Gasto Futebol Benfica (€M)" : "Benfica Football Spend (€M)",
            data: slicedSeries.map((s) => s.benficaSpend),
            backgroundColor: state.COLORS.neg || "#b8403a",
            borderRadius: 4,
          },
          {
            type: "bar" as const,
            label: isPt ? "Gasto Futebol Porto (€M)" : "Porto Football Spend (€M)",
            data: slicedSeries.map((s) => s.portoSpend),
            backgroundColor: state.COLORS.info || "#2c5b8a",
            borderRadius: 4,
          },
        ],
      };
    }

    // viewMode === "cost_per_title"
    return {
      labels: ["Sporting CP", "SL Benfica", "FC Porto"],
      datasets: [
        {
          label: isPt ? "Custo Médio / Título Oficial (€M)" : "Average Cost / Title (€M)",
          data: [
            cycleSummary.sporting.costPerTitle,
            cycleSummary.benfica.costPerTitle,
            cycleSummary.porto.costPerTitle,
          ],
          backgroundColor: [
            state.COLORS.pos || "#0a5d3a",
            state.COLORS.neg || "#b8403a",
            state.COLORS.info || "#2c5b8a",
          ],
          borderRadius: 6,
        },
      ],
    };
  }, [viewMode, slicedSeries, cycleSummary, isPt]);

  const chartOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 10 } },
        },
        y: {
          beginAtZero: true,
          grid: { color: state.COLORS.lineBorder || "rgba(0,0,0,0.06)" },
          ticks: {
            callback: (v: number) =>
              viewMode === "cpp"
                ? `€${v.toFixed(0)}k/pt`
                : `€${v.toFixed(0)}M`,
            font: { size: 11 },
          },
          title: {
            display: true,
            text:
              viewMode === "cpp"
                ? isPt
                  ? "Milhares € / ponto"
                  : "Thousand € / point"
                : isPt
                  ? "Milhões €"
                  : "Million €",
            font: { size: 11, weight: "bold" as const },
          },
        },
      },
      plugins: {
        legend: {
          position: "bottom" as const,
          labels: { boxWidth: 12, padding: 16 },
        },
        tooltip: {
          ...baseOpts?.plugins?.tooltip,
          mode: "index" as const,
          callbacks: {
            label: (ctx: { dataset: { label: string }; parsed: { y: number } }) => {
              if (viewMode === "cpp") {
                return ` ${ctx.dataset.label}: €${ctx.parsed.y.toFixed(0)}k / ponto`;
              }
              return ` ${ctx.dataset.label}: €${ctx.parsed.y.toFixed(1)}M`;
            },
          },
        },
      },
    };
  }, [baseOpts, isPt, viewMode]);

  const maxCostPerPoint = useMemo(() => {
    return Math.max(
      cycleSummary.sporting.costPerPoint,
      cycleSummary.benfica.costPerPoint,
      cycleSummary.porto.costPerPoint,
      1,
    );
  }, [cycleSummary]);

  return (
    <div className="card card--spaced" id="financialEfficiencySection">
      {/* Header */}
      <div className="card-head">
        <div>
          <T as="h3" i18nKey="eff_section_h3" />
          <T as="span" className="tag" i18nKey="eff_section_tag" />
        </div>
      </div>
      <T as="p" className="desc" i18nKey="eff_section_desc" />

      {/* Efficiency Executive Verdict */}
      <div className="pg-verdict safe" style={{ marginTop: "1rem", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
          <span style={{ fontSize: "1.2rem" }}>🏆</span>
          <T
            as="h4"
            i18nKey="eff_verdict_title"
            style={{ margin: 0, fontSize: "0.92rem", fontWeight: 700 }}
          />
        </div>
        <T
          as="p"
          i18nKey="eff_verdict_p1"
          style={{
            fontSize: "0.82rem",
            color: "var(--ink)",
            margin: 0,
            lineHeight: 1.5,
          }}
        />
      </div>

      {/* KPI Cards comparing the Big Three */}
      <div className="dmt-kpis">
        <div className="dmt-kpi-card accent-pos">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <T as="div" className="dmt-kpi-label" i18nKey="eff_kpi_scp_cpp" />
            <span className="uefa-pillar-badge status-green" style={{ fontSize: "0.65rem" }}>
              Top ROI 🥇
            </span>
          </div>
          <div className="dmt-kpi-value" style={{ color: "var(--pos)" }}>
            €{cycleSummary.sporting.costPerPoint.toFixed(0)}k
          </div>
          <div className="dmt-kpi-sub">
            {cycleSummary.sporting.totalPoints} {isPt ? "pts" : "pts"} • {cycleSummary.sporting.totalTitles} {isPt ? "títulos" : "titles"}
          </div>
        </div>

        <div className="dmt-kpi-card accent-info">
          <T as="div" className="dmt-kpi-label" i18nKey="eff_kpi_fcp_cpp" />
          <div className="dmt-kpi-value" style={{ color: "var(--info)" }}>
            €{cycleSummary.porto.costPerPoint.toFixed(0)}k
          </div>
          <div className="dmt-kpi-sub">
            {cycleSummary.porto.totalPoints} {isPt ? "pts" : "pts"} • {cycleSummary.porto.totalTitles} {isPt ? "títulos" : "titles"}
          </div>
        </div>

        <div className="dmt-kpi-card accent-gold">
          <T as="div" className="dmt-kpi-label" i18nKey="eff_kpi_slb_cpp" />
          <div className="dmt-kpi-value" style={{ color: "var(--neg)" }}>
            €{cycleSummary.benfica.costPerPoint.toFixed(0)}k
          </div>
          <div className="dmt-kpi-sub">
            {cycleSummary.benfica.totalPoints} {isPt ? "pts" : "pts"} • {cycleSummary.benfica.totalTitles} {isPt ? "títulos" : "titles"}
          </div>
        </div>

        <div className="dmt-kpi-card accent-green">
          <T as="div" className="dmt-kpi-label" i18nKey="eff_kpi_savings_vs_slb" />
          <div className="dmt-kpi-value" style={{ color: "var(--green)" }}>
            ~€{savingsVsBenfica.toFixed(1)}M
          </div>
          <T as="div" className="dmt-kpi-sub" i18nKey="eff_kpi_savings_vs_slb_sub" />
        </div>
      </div>

      {/* Visual Mode Switcher Toolbar */}
      <div className="filter-toolbar">
        <div className="filter-toolbar-group">
          <button
            className={`btn-preset ${viewMode === "cpp" ? "active" : ""}`}
            onClick={() => setViewMode("cpp")}
          >
            {t("eff_view_cpp")}
          </button>
          <button
            className={`btn-preset ${viewMode === "spend_vs_pts" ? "active" : ""}`}
            onClick={() => setViewMode("spend_vs_pts")}
          >
            {t("eff_view_spend_vs_pts")}
          </button>
          <button
            className={`btn-preset ${viewMode === "cost_per_title" ? "active" : ""}`}
            onClick={() => setViewMode("cost_per_title")}
          >
            {t("eff_view_cost_per_title")}
          </button>
        </div>
      </div>

      {/* Chart */}
      <div style={{ marginBottom: "1.5rem" }}>
        <AppChart
          id="chartFinancialEfficiencyView"
          type={viewMode === "cost_per_title" ? "bar" : viewMode === "spend_vs_pts" ? "bar" : "line"}
          data={chartData}
          options={chartOptions}
          hideTable={true}
        />
      </div>

      {/* Detailed Trophies and Spending ROI Table */}
      <div className="table-wrap" style={{ marginBottom: "1.25rem" }}>
        <div className="scroll-x">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>{t("eff_col_club")}</th>
                <th style={{ textAlign: "center" }}>{t("eff_col_leagues")}</th>
                <th style={{ textAlign: "center" }}>{t("eff_col_cups")}</th>
                <th style={{ textAlign: "center" }}>{t("eff_col_titles")}</th>
                <th style={{ textAlign: "right" }}>{t("eff_col_total_spent")}</th>
                <th style={{ textAlign: "right" }}>{t("eff_col_cost_per_title")}</th>
                <th style={{ textAlign: "right" }}>{t("eff_col_cost_per_point")}</th>
              </tr>
            </thead>
            <tbody>
              {([cycleSummary.sporting, cycleSummary.benfica, cycleSummary.porto] as const).map(
                (club) => {
                  const isSporting = club.clubKey === "sporting";
                  const barPercent = Math.min(100, (club.costPerPoint / maxCostPerPoint) * 100);

                  return (
                    <tr
                      key={club.clubKey}
                      style={
                        isSporting
                          ? { background: "rgba(10, 93, 58, 0.06)", fontWeight: 700 }
                          : undefined
                      }
                    >
                      <td style={{ fontWeight: 700 }}>
                        {club.name}
                        {isSporting && (
                          <span
                            className="uefa-pillar-badge status-green"
                            style={{ marginLeft: "6px", fontSize: "0.65rem" }}
                          >
                            Top ROI
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: "center", fontFamily: "var(--mono)" }}>
                        {club.totalLeagues} 🏆
                      </td>
                      <td style={{ textAlign: "center", fontFamily: "var(--mono)" }}>
                        {club.totalCups}
                      </td>
                      <td style={{ textAlign: "center", fontFamily: "var(--mono)", fontWeight: 700 }}>
                        {club.totalTitles}
                      </td>
                      <td style={{ textAlign: "right", fontFamily: "var(--mono)" }}>
                        €{club.totalSpend.toFixed(1)}M
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          fontFamily: "var(--mono)",
                          fontWeight: isSporting ? 700 : 400,
                          color: isSporting ? "var(--pos)" : undefined,
                        }}
                      >
                        {club.totalTitles > 0
                          ? `€${club.costPerTitle.toFixed(1)}M / título`
                          : "—"}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <span
                          style={{
                            fontFamily: "var(--mono)",
                            fontWeight: 700,
                            color: isSporting ? "var(--pos)" : undefined,
                          }}
                        >
                          €{club.costPerPoint.toFixed(0)}k / pt
                        </span>
                        <div className="dmt-mini-bar-container">
                          <div
                            className="dmt-mini-bar-fill"
                            style={{
                              width: `${barPercent}%`,
                              background: isSporting
                                ? "var(--green)"
                                : club.clubKey === "benfica"
                                  ? "var(--neg)"
                                  : "var(--info)",
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                },
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Structural Insights Accordion */}
      <div className="dmt-guide-box">
        <button
          onClick={() => setShowInsights((v) => !v)}
          style={{
            background: "none",
            border: "none",
            width: "100%",
            textAlign: "left",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
            color: "var(--ink)",
            fontFamily: "var(--sans)",
            fontWeight: 700,
            fontSize: "0.85rem",
            padding: 0,
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span>💡</span>
            <T as="span" i18nKey="eff_insights_title" />
          </span>
          <span className="pill-btn" style={{ fontSize: "0.72rem" }}>
            {showInsights ? t("eff_insights_hide") : t("eff_insights_show")}
          </span>
        </button>

        {showInsights && (
          <div className="dmt-guide-grid">
            <div className="dmt-guide-item">
              <T
                as="h5"
                className="dmt-guide-item-title"
                i18nKey="eff_ins_1_title"
                style={{ color: "var(--green)" }}
              />
              <T as="p" className="dmt-guide-item-desc" i18nKey="eff_ins_1_desc" />
            </div>
            <div className="dmt-guide-item">
              <T
                as="h5"
                className="dmt-guide-item-title"
                i18nKey="eff_ins_2_title"
                style={{ color: "var(--gold)" }}
              />
              <T as="p" className="dmt-guide-item-desc" i18nKey="eff_ins_2_desc" />
            </div>
            <div className="dmt-guide-item">
              <T
                as="h5"
                className="dmt-guide-item-title"
                i18nKey="eff_ins_3_title"
                style={{ color: "var(--info)" }}
              />
              <T as="p" className="dmt-guide-item-desc" i18nKey="eff_ins_3_desc" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
