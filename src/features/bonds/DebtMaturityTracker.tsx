import React, { useState, useMemo } from "react";
import { useAppState, state } from "../../core/state.js";
import { useTranslation } from "../../hooks/useTranslation.js";
import { AppChart } from "../../components/AppChart.js";
import {
  computeDebtSchedule,
  computeDebtKPIs,
  getDebtMaturityChartOptions,
  DebtFilterType,
  DebtScenarioType,
} from "./debtMaturityCalculations.js";

export function DebtMaturityTracker() {
  const { t, T } = useTranslation();
  const isPt = useAppState((s) => s.isPt);
  const baseOpts = useAppState((s) => s.baseOpts);

  const [activeFilter, setActiveFilter] = useState<DebtFilterType>("all");
  const [activeScenario, setActiveScenario] = useState<DebtScenarioType>("base");
  const [showGuide, setShowGuide] = useState<boolean>(false);

  const schedule = useMemo(
    () => computeDebtSchedule(activeFilter, activeScenario),
    [activeFilter, activeScenario],
  );
  const kpis = useMemo(() => computeDebtKPIs(schedule), [schedule]);

  // Chart dataset configuration
  const chartData = useMemo(() => {
    const labels = schedule.map((s) => s.season);
    return {
      labels,
      datasets: [
        {
          type: "bar" as const,
          label: isPt ? "Amortização de Capital" : "Principal Repayment",
          data: schedule.map((s) => s.totalPrincipal),
          backgroundColor: state.COLORS.pos || "#0a5d3a",
          stack: "stack0",
          borderRadius: 4,
          order: 2,
        },
        {
          type: "bar" as const,
          label: isPt ? "Juros & Cupões" : "Interest & Coupons",
          data: schedule.map((s) => s.totalInterest),
          backgroundColor: state.COLORS.gold || "#c8a951",
          stack: "stack0",
          borderRadius: 4,
          order: 2,
        },
        {
          type: "line" as const,
          label: isPt ? "EBITDA Operacional" : "Operating EBITDA",
          data: schedule.map((s) => s.ebitda),
          borderColor: state.COLORS.info || "#2c5b8a",
          backgroundColor: state.COLORS.info || "#2c5b8a",
          pointBackgroundColor: state.COLORS.info || "#2c5b8a",
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
          borderWidth: 3,
          pointRadius: 5,
          pointHoverRadius: 7,
          fill: false,
          tension: 0.25,
          order: 0,
        },
      ],
    };
  }, [schedule, isPt]);

  const chartOptions = useMemo(
    () => getDebtMaturityChartOptions(isPt, baseOpts, state.COLORS.lineBorder),
    [baseOpts, isPt],
  );

  const maxDebtService = useMemo(() => {
    return Math.max(...schedule.map((s) => s.totalDebtService), 1);
  }, [schedule]);

  return (
    <div className="card card--spaced" id="debtMaturityCard">
      {/* Header */}
      <div className="card-head">
        <div>
          <T as="h3" i18nKey="dmt_h3" />
          <T as="span" className="tag" i18nKey="dmt_tag" />
        </div>
      </div>
      <T as="p" className="desc" i18nKey="dmt_desc" />

      {/* Institutional Capital Structure Verdict */}
      <div className="pg-verdict safe" style={{ marginTop: "1rem", marginBottom: "1.25rem" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "10px",
            marginBottom: "6px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "1.2rem" }}>🏛️</span>
            <T
              as="h4"
              i18nKey="dmt_verdict_title"
              style={{ margin: 0, fontSize: "0.92rem", fontWeight: 700 }}
            />
          </div>
          <span className="rating-badge investment-grade">
            Fitch BBB− / DBRS BBB (low)
          </span>
        </div>
        <T
          as="p"
          i18nKey="dmt_verdict_p1"
          style={{
            fontSize: "0.82rem",
            color: "var(--ink)",
            margin: 0,
            lineHeight: 1.5,
          }}
        />
      </div>

      {/* KPI Cards Grid */}
      <div className="dmt-kpis">
        <div className="dmt-kpi-card accent-pos">
          <T as="div" className="dmt-kpi-label" i18nKey="dmt_kpi_annual_service" />
          <div className="dmt-kpi-value">€{kpis.avgAnnualService.toFixed(1)}M</div>
          <T as="div" className="dmt-kpi-sub" i18nKey="dmt_kpi_annual_service_sub" />
        </div>

        <div className="dmt-kpi-card accent-green">
          <T as="div" className="dmt-kpi-label" i18nKey="dmt_kpi_dscr" />
          <div className="dmt-kpi-value" style={{ color: "var(--pos)" }}>
            {kpis.avgDscr.toFixed(1)}×
          </div>
          <T as="div" className="dmt-kpi-sub" i18nKey="dmt_kpi_dscr_sub" />
        </div>

        <div className="dmt-kpi-card accent-info">
          <T as="div" className="dmt-kpi-label" i18nKey="dmt_kpi_lt_share" />
          <div className="dmt-kpi-value" style={{ color: "var(--green)" }}>
            {kpis.ltShare.toFixed(0)}%
          </div>
          <T as="div" className="dmt-kpi-sub" i18nKey="dmt_kpi_lt_share_sub" />
        </div>

        <div className="dmt-kpi-card accent-gold">
          <T as="div" className="dmt-kpi-label" i18nKey="dmt_kpi_savings" />
          <div className="dmt-kpi-value" style={{ color: "var(--gold)" }}>
            ~€{kpis.estimatedAnnualSavings.toFixed(1)}M
          </div>
          <T as="div" className="dmt-kpi-sub" i18nKey="dmt_kpi_savings_sub" />
        </div>
      </div>

      {/* Control Filters Row: Instrument Scope + Stress Scenario Switcher */}
      <div className="filter-toolbar">
        {/* Instrument Filter */}
        <div className="filter-toolbar-group">
          <button
            className={`btn-preset ${activeFilter === "all" ? "active" : ""}`}
            onClick={() => setActiveFilter("all")}
          >
            {t("dmt_filter_all")}
          </button>
          <button
            className={`btn-preset ${activeFilter === "uspp" ? "active" : ""}`}
            onClick={() => setActiveFilter("uspp")}
          >
            {t("dmt_filter_uspp")}
          </button>
          <button
            className={`btn-preset ${activeFilter === "banking" ? "active" : ""}`}
            onClick={() => setActiveFilter("banking")}
          >
            {t("dmt_filter_banking")}
          </button>
        </div>

        {/* Stress Scenario Switcher */}
        <div className="filter-toolbar-group">
          <span className="filter-toolbar-label">{t("dmt_scenario_title")}</span>
          <button
            className={`pill-btn ${activeScenario === "base" ? "active" : ""}`}
            onClick={() => setActiveScenario("base")}
          >
            {t("dmt_scen_base")}
          </button>
          <button
            className={`pill-btn ${activeScenario === "rates_up" ? "active" : ""}`}
            onClick={() => setActiveScenario("rates_up")}
          >
            {t("dmt_scen_rates_up")}
          </button>
          <button
            className={`pill-btn ${activeScenario === "no_ucl" ? "active" : ""}`}
            onClick={() => setActiveScenario("no_ucl")}
          >
            {t("dmt_scen_no_ucl")}
          </button>
        </div>
      </div>

      {/* Chart */}
      <div style={{ marginBottom: "1.5rem" }}>
        <AppChart
          id="chartDebtMaturitySchedule"
          type="bar"
          data={chartData}
          options={chartOptions}
          hideTable={true}
        />
      </div>

      {/* Schedule Table */}
      <div className="table-wrap" style={{ marginBottom: "1.25rem" }}>
        <div className="scroll-x">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>{t("dmt_col_year")}</th>
                <th style={{ textAlign: "right" }}>{t("dmt_col_principal")}</th>
                <th style={{ textAlign: "right" }}>{t("dmt_col_interest")}</th>
                <th style={{ textAlign: "right" }}>{t("dmt_col_total")}</th>
                <th style={{ textAlign: "right" }}>{t("dmt_col_ebitda")}</th>
                <th style={{ textAlign: "center" }}>{t("dmt_col_dscr")}</th>
                <th style={{ textAlign: "center" }}>{t("dmt_col_status")}</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((row) => {
                const isGrade = row.status === "grade";
                const isAdequate = row.status === "adequate";
                const barPercent = Math.min(100, (row.totalDebtService / maxDebtService) * 100);

                return (
                  <tr
                    key={row.season}
                    style={
                      row.isBulletYear
                        ? { background: "rgba(44, 91, 138, 0.06)" }
                        : undefined
                    }
                  >
                    <td style={{ fontWeight: "bold" }}>
                      {row.season}
                      {row.isBulletYear && (
                        <span
                          className="uefa-pillar-badge"
                          style={{
                            marginLeft: "6px",
                            fontSize: "0.65rem",
                            background: "rgba(44,91,138,0.12)",
                            color: "var(--info)",
                          }}
                        >
                          {t("dmt_col_refinancing")}
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: "right", fontFamily: "var(--mono)" }}>
                      €{row.totalPrincipal.toFixed(1)}M
                    </td>
                    <td style={{ textAlign: "right", fontFamily: "var(--mono)" }}>
                      €{row.totalInterest.toFixed(2)}M
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <span
                        style={{
                          fontWeight: 700,
                          fontFamily: "var(--mono)",
                          display: "inline-block",
                        }}
                      >
                        €{row.totalDebtService.toFixed(2)}M
                      </span>
                      <div className="dmt-mini-bar-container">
                        <div
                          className="dmt-mini-bar-fill"
                          style={{
                            width: `${barPercent}%`,
                            background: row.isBulletYear ? "var(--info)" : "var(--green)",
                          }}
                        />
                      </div>
                    </td>
                    <td style={{ textAlign: "right", fontFamily: "var(--mono)" }}>
                      €{row.ebitda.toFixed(1)}M
                    </td>
                    <td
                      style={{
                        textAlign: "center",
                        fontWeight: "bold",
                        fontFamily: "var(--mono)",
                        color: isGrade
                          ? "var(--pos)"
                          : isAdequate
                            ? "var(--gold)"
                            : "var(--neg)",
                      }}
                    >
                      {row.dscr < 90 ? `${row.dscr.toFixed(1)}×` : "—"}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span
                        className={`uefa-pillar-badge ${
                          isGrade
                            ? "status-green"
                            : isAdequate
                              ? "status-amber"
                              : "status-red"
                        }`}
                      >
                        {isGrade
                          ? t("dmt_status_grade")
                          : isAdequate
                            ? t("dmt_status_adequate")
                            : t("dmt_col_refinancing")}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td style={{ textAlign: "left" }}>{t("dmt_total_row")}</td>
                <td style={{ textAlign: "right", fontFamily: "var(--mono)" }}>
                  €{kpis.totalPrincipal.toFixed(1)}M
                </td>
                <td style={{ textAlign: "right", fontFamily: "var(--mono)" }}>
                  €{kpis.totalInterest.toFixed(2)}M
                </td>
                <td
                  style={{
                    textAlign: "right",
                    fontFamily: "var(--mono)",
                    color: "var(--ink)",
                  }}
                >
                  €{kpis.totalDebtService.toFixed(2)}M
                </td>
                <td style={{ textAlign: "right", fontFamily: "var(--mono)" }}>
                  €{kpis.avgEbitda.toFixed(1)}M
                </td>
                <td
                  style={{
                    textAlign: "center",
                    fontFamily: "var(--mono)",
                    color: "var(--pos)",
                  }}
                >
                  {kpis.avgDscr.toFixed(1)}×
                </td>
                <td style={{ textAlign: "center" }}>
                  <span className="uefa-pillar-badge status-green">
                    {t("dmt_status_grade")}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Collapsible Methodology & USPP Debt Nuances */}
      <div className="dmt-guide-box">
        <button
          onClick={() => setShowGuide((v) => !v)}
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
            <T as="span" i18nKey="dmt_guide_title" />
          </span>
          <span className="pill-btn" style={{ fontSize: "0.72rem" }}>
            {showGuide ? t("dmt_guide_hide") : t("dmt_guide_show")}
          </span>
        </button>

        {showGuide && (
          <div className="dmt-guide-grid">
            <div className="dmt-guide-item">
              <T
                as="h5"
                className="dmt-guide-item-title"
                i18nKey="dmt_guide_p1_title"
                style={{ color: "var(--green)" }}
              />
              <T as="p" className="dmt-guide-item-desc" i18nKey="dmt_guide_p1_desc" />
            </div>
            <div className="dmt-guide-item">
              <T
                as="h5"
                className="dmt-guide-item-title"
                i18nKey="dmt_guide_p2_title"
                style={{ color: "var(--gold)" }}
              />
              <T as="p" className="dmt-guide-item-desc" i18nKey="dmt_guide_p2_desc" />
            </div>
            <div className="dmt-guide-item">
              <T
                as="h5"
                className="dmt-guide-item-title"
                i18nKey="dmt_guide_p3_title"
                style={{ color: "var(--info)" }}
              />
              <T as="p" className="dmt-guide-item-desc" i18nKey="dmt_guide_p3_desc" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
