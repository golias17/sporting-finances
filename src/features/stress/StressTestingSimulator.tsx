import React, { useState, useMemo, useRef } from "react";
import { useAppState, state } from "../../core/state.js";
import { useTranslation } from "../../hooks/useTranslation.js";
import { AppChart } from "../../components/AppChart.js";
import { ChartDownloadButton } from "../../components/ChartDownloadButton.js";
import {
  STRESS_PRESETS,
  runStressSimulation,
  getStressSliderBackground,
  type StressTestInputs,
} from "./stressTestCalculations.js";

export function StressTestingSimulator() {
  const { t, T } = useTranslation();
  const isPt = useAppState((s) => s.isPt);
  const baseOpts = useAppState((s) => s.baseOpts);
  const chartRef = useRef<any>(null);

  const [activePreset, setActivePreset] = useState<string>("base");
  const [inputs, setInputs] = useState<StressTestInputs>(STRESS_PRESETS.base);
  const [showTable, setShowTable] = useState<boolean>(false);
  const [showGuide, setShowGuide] = useState<boolean>(false);

  const applyPreset = (key: string) => {
    setActivePreset(key);
    if (STRESS_PRESETS[key]) {
      setInputs(STRESS_PRESETS[key]);
    }
  };

  const handleCustomChange = (key: keyof StressTestInputs, value: number) => {
    setActivePreset("custom");
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const result = useMemo(() => {
    return runStressSimulation(inputs);
  }, [inputs]);

  const maxCashInTrajectory = useMemo(() => {
    return Math.max(
      ...result.monthlyTrajectory.map((p) => p.cashBalance),
      35.0,
    );
  }, [result]);

  const chartData = useMemo(() => {
    const trajectory = result.monthlyTrajectory;
    const balanceColor =
      result.verdictType === "danger"
        ? state.COLORS.neg || "#b8403a"
        : result.verdictType === "warning"
          ? state.COLORS.gold || "#c8a951"
          : state.COLORS.pos || "#0a5d3a";

    return {
      labels: trajectory.map((p) => p.label),
      datasets: [
        {
          type: "line" as const,
          label: isPt ? "Saldo de Caixa Projetado (€M)" : "Projected Cash Balance (€M)",
          data: trajectory.map((p) => p.cashBalance),
          borderColor: balanceColor,
          backgroundColor: balanceColor,
          borderWidth: 3.5,
          pointRadius: 4.5,
          pointHoverRadius: 7,
          pointBackgroundColor: balanceColor,
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
          fill: false,
          tension: 0.25,
          yAxisID: "y",
          order: 0,
        },
        {
          type: "line" as const,
          label: isPt ? "Reserva Prudencial (€10M)" : "Prudential Buffer (€10M)",
          data: trajectory.map(() => 10.0),
          borderColor: state.COLORS.gold || "#c8a951",
          borderWidth: 2,
          borderDash: [6, 6],
          pointRadius: 0,
          pointHoverRadius: 0,
          fill: false,
          yAxisID: "y",
          order: 1,
        },
        {
          type: "bar" as const,
          label: isPt ? "Fluxo Líquido Mensal (€M)" : "Monthly Net Flow (€M)",
          data: trajectory.map((p) => p.netCashFlow),
          backgroundColor: trajectory.map((p) =>
            p.netCashFlow >= 0
              ? "rgba(10, 93, 58, 0.45)"
              : "rgba(184, 64, 58, 0.45)",
          ),
          borderColor: trajectory.map((p) =>
            p.netCashFlow >= 0
              ? state.COLORS.pos || "#0a5d3a"
              : state.COLORS.neg || "#b8403a",
          ),
          borderWidth: 1,
          borderRadius: 3,
          yAxisID: "yFlow",
          order: 2,
        },
      ],
    };
  }, [result, isPt]);

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
          type: "linear" as const,
          position: "left" as const,
          grid: { color: state.COLORS.lineBorder || "rgba(0,0,0,0.06)" },
          ticks: {
            callback: (v: number) => `€${v.toFixed(0)}M`,
            font: { size: 11 },
          },
          title: {
            display: true,
            text: isPt ? "Saldo de Caixa (€M)" : "Cash Balance (€M)",
            font: { size: 11, weight: "bold" as const },
          },
        },
        yFlow: {
          type: "linear" as const,
          position: "right" as const,
          grid: { display: false },
          ticks: {
            callback: (v: number) => `€${v.toFixed(0)}M`,
            font: { size: 10 },
          },
          title: {
            display: true,
            text: isPt ? "Fluxo Mensal (€M)" : "Monthly Flow (€M)",
            font: { size: 10, weight: "bold" as const },
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
              const val = ctx.parsed.y;
              return ` ${ctx.dataset.label}: ${val >= 0 ? "+" : ""}€${val.toFixed(1)}M`;
            },
          },
        },
      },
    };
  }, [baseOpts, isPt]);

  return (
    <div className="card card--spaced" id="stressTestingSection">
      {/* Header */}
      <div className="card-head">
        <div>
          <T as="h3" i18nKey="stress_title" />
          <T as="span" className="tag" i18nKey="stress_tag" />
        </div>
        <ChartDownloadButton chartRef={chartRef} fileName="stress_testing_cash_runway" />
      </div>
      <T as="p" className="desc" i18nKey="stress_desc" />

      {/* Preset Toolbar */}
      <div className="filter-toolbar" style={{ marginTop: "1rem", marginBottom: "1.25rem" }}>
        <div className="filter-toolbar-group">
          <span className="filter-toolbar-label">
            {isPt ? "Cenários de Stress:" : "Stress Scenarios:"}
          </span>
          <button
            className={`btn-preset ${activePreset === "base" ? "active" : ""}`}
            onClick={() => applyPreset("base")}
          >
            {t("stress_preset_base")}
          </button>
          <button
            className={`btn-preset ${activePreset === "no_ucl_1y" ? "active" : ""}`}
            onClick={() => applyPreset("no_ucl_1y")}
          >
            {t("stress_preset_no_ucl_1y")}
          </button>
          <button
            className={`btn-preset ${activePreset === "winter_2y" ? "active" : ""}`}
            onClick={() => applyPreset("winter_2y")}
          >
            {t("stress_preset_winter_2y")}
          </button>
          <button
            className={`btn-preset ${activePreset === "perfect_storm" ? "active" : ""}`}
            onClick={() => applyPreset("perfect_storm")}
          >
            {t("stress_preset_perfect_storm")}
          </button>
        </div>
      </div>

      {/* Executive Risk Verdict Card */}
      <div className={`pg-verdict ${result.verdictType}`} style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
          <span style={{ fontSize: "1.2rem" }}>
            {result.verdictType === "safe" ? "🛡️" : result.verdictType === "warning" ? "⚠️" : "🚨"}
          </span>
          <T
            as="h4"
            i18nKey={
              result.verdictType === "safe"
                ? "stress_verdict_safe_title"
                : result.verdictType === "warning"
                  ? "stress_verdict_warning_title"
                  : "stress_verdict_danger_title"
            }
            style={{ margin: 0, fontSize: "0.92rem", fontWeight: 700 }}
          />
        </div>
        <T
          as="p"
          i18nKey={
            result.verdictType === "safe"
              ? "stress_verdict_safe_desc"
              : result.verdictType === "warning"
                ? "stress_verdict_warning_desc"
                : "stress_verdict_danger_desc"
          }
          style={{
            fontSize: "0.82rem",
            color: "var(--ink)",
            margin: 0,
            lineHeight: 1.5,
          }}
        />
      </div>

      {/* 4 Accent KPI Cards */}
      <div className="dmt-kpis" style={{ marginBottom: "1.75rem" }}>
        <div className={`dmt-kpi-card ${result.cashRunwayMonths >= 24 ? "accent-pos" : result.cashRunwayMonths >= 18 ? "accent-gold" : "accent-neg"}`}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <T as="div" className="dmt-kpi-label" i18nKey="stress_kpi_runway" />
            <span
              className={`uefa-pillar-badge ${result.cashRunwayMonths >= 24 ? "status-green" : result.cashRunwayMonths >= 18 ? "status-yellow" : "status-red"}`}
              style={{ fontSize: "0.65rem" }}
            >
              {result.cashRunwayMonths >= 24 ? (isPt ? "Plena" : "Full") : `${result.cashRunwayMonths}m`}
            </span>
          </div>
          <div
            className="dmt-kpi-value"
            style={{
              color:
                result.cashRunwayMonths >= 24
                  ? "var(--pos)"
                  : result.cashRunwayMonths >= 18
                    ? "var(--gold)"
                    : "var(--neg)",
            }}
          >
            {result.cashRunwayMonths >= 24 ? "> 24 meses" : `${result.cashRunwayMonths} meses`}
          </div>
          <T as="div" className="dmt-kpi-sub" i18nKey="stress_kpi_runway_sub" />
        </div>

        <div className={`dmt-kpi-card ${result.finalCashBalance > 10 ? "accent-green" : result.finalCashBalance >= 0 ? "accent-gold" : "accent-neg"}`}>
          <T as="div" className="dmt-kpi-label" i18nKey="stress_kpi_final_cash" />
          <div
            className="dmt-kpi-value"
            style={{
              color:
                result.finalCashBalance > 10
                  ? "var(--green)"
                  : result.finalCashBalance >= 0
                    ? "var(--gold)"
                    : "var(--neg)",
            }}
          >
            €{result.finalCashBalance.toFixed(1)}M
          </div>
          <T as="div" className="dmt-kpi-sub" i18nKey="stress_kpi_final_cash_sub" />
        </div>

        <div className={`dmt-kpi-card ${result.projectedEquity24 > 0 ? "accent-info" : "accent-neg"}`}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <T as="div" className="dmt-kpi-label" i18nKey="stress_kpi_proj_equity" />
            {result.projectedEquity24 < 0 && (
              <span className="uefa-pillar-badge status-red" style={{ fontSize: "0.65rem" }}>
                Art. 35º CSC ⚠️
              </span>
            )}
          </div>
          <div
            className="dmt-kpi-value"
            style={{
              color: result.projectedEquity24 > 0 ? "var(--info)" : "var(--neg)",
            }}
          >
            €{result.projectedEquity24.toFixed(1)}M
          </div>
          <T as="div" className="dmt-kpi-sub" i18nKey="stress_kpi_proj_equity_sub" />
        </div>

        <div className={`dmt-kpi-card ${result.requiredAssetSales === 0 ? "accent-pos" : "accent-gold"}`}>
          <T as="div" className="dmt-kpi-label" i18nKey="stress_kpi_asset_sales_req" />
          <div
            className="dmt-kpi-value"
            style={{
              color: result.requiredAssetSales === 0 ? "var(--pos)" : "var(--gold)",
            }}
          >
            {result.requiredAssetSales === 0
              ? "€0.0M (Colchão OK)"
              : `€${result.requiredAssetSales.toFixed(1)}M`}
          </div>
          <T as="div" className="dmt-kpi-sub" i18nKey="stress_kpi_asset_sales_req_sub" />
        </div>
      </div>

      {/* Interactive Parameter Controls Sliders */}
      <div className="pg-controls-grid" style={{ marginBottom: "1.75rem" }}>
        <div className="pg-control-card">
          <div className="pg-control-header">
            <label>
              <span>🏆</span>
              <T as="span" i18nKey="stress_param_ucl_shock" />
            </label>
            <span className="pg-control-val" style={{ color: inputs.uclShock > 0 ? "var(--neg)" : "var(--ink)" }}>
              -€{inputs.uclShock}M
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={60}
            step={5}
            value={inputs.uclShock}
            onChange={(e) => handleCustomChange("uclShock", Number(e.target.value))}
            className="pg-slider"
            style={{ background: getStressSliderBackground(inputs.uclShock, 0, 60) }}
            aria-label={t("stress_param_ucl_shock")}
          />
          <div className="pg-slider-bounds">
            <span>0 M€ (Base)</span>
            <span>-60 M€ (Crítico)</span>
          </div>
        </div>

        <div className="pg-control-card">
          <div className="pg-control-header">
            <label>
              <span>🔄</span>
              <T as="span" i18nKey="stress_param_transfers_shock" />
            </label>
            <span className="pg-control-val" style={{ color: inputs.transfersShock > 0 ? "var(--neg)" : "var(--ink)" }}>
              -€{inputs.transfersShock}M
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={45}
            step={5}
            value={inputs.transfersShock}
            onChange={(e) => handleCustomChange("transfersShock", Number(e.target.value))}
            className="pg-slider"
            style={{ background: getStressSliderBackground(inputs.transfersShock, 0, 45) }}
            aria-label={t("stress_param_transfers_shock")}
          />
          <div className="pg-slider-bounds">
            <span>0 M€ (Normal)</span>
            <span>-45 M€ (Congelamento)</span>
          </div>
        </div>

        <div className="pg-control-card">
          <div className="pg-control-header">
            <label>
              <span>📈</span>
              <T as="span" i18nKey="stress_param_cost_inflation" />
            </label>
            <span className="pg-control-val" style={{ color: inputs.costInflation > 0 ? "var(--gold)" : "var(--ink)" }}>
              +{inputs.costInflation}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={25}
            step={1}
            value={inputs.costInflation}
            onChange={(e) => handleCustomChange("costInflation", Number(e.target.value))}
            className="pg-slider"
            style={{ background: getStressSliderBackground(inputs.costInflation, 0, 25) }}
            aria-label={t("stress_param_cost_inflation")}
          />
          <div className="pg-slider-bounds">
            <span>+0%</span>
            <span>+25% (Inflação Alta)</span>
          </div>
        </div>

        <div className="pg-control-card">
          <div className="pg-control-header">
            <label>
              <span>🏛️</span>
              <T as="span" i18nKey="stress_param_rate_shock" />
            </label>
            <span className="pg-control-val" style={{ color: inputs.rateShock > 0 ? "var(--gold)" : "var(--ink)" }}>
              +{inputs.rateShock} bps
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={300}
            step={25}
            value={inputs.rateShock}
            onChange={(e) => handleCustomChange("rateShock", Number(e.target.value))}
            className="pg-slider"
            style={{ background: getStressSliderBackground(inputs.rateShock, 0, 300) }}
            aria-label={t("stress_param_rate_shock")}
          />
          <div className="pg-slider-bounds">
            <span>+0 bps</span>
            <span>+300 bps (+3.0%)</span>
          </div>
        </div>
      </div>

      {/* 24-Month Monthly Cash Trajectory Line Chart */}
      <div style={{ marginBottom: "1.5rem" }}>
        <AppChart
          id="chartMonthlyCashTrajectory"
          type="chart"
          chartRef={chartRef}
          data={chartData}
          options={chartOptions}
          hideTable={true}
        />
      </div>

      {/* Monthly Breakdown Data Table Toggle */}
      <div style={{ marginBottom: "1.5rem" }}>
        <button
          className="btn-preset"
          onClick={() => setShowTable((v) => !v)}
          style={{ marginBottom: showTable ? "1rem" : 0 }}
        >
          {showTable ? t("stress_toggle_table_hide") : t("stress_toggle_table_show")}
        </button>

        {showTable && (
          <div className="table-wrap">
            <div className="scroll-x">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: "left" }}>{t("stress_col_month")}</th>
                    <th style={{ textAlign: "right" }}>{t("stress_col_net_flow")}</th>
                    <th style={{ textAlign: "right" }}>{t("stress_col_cash_balance")}</th>
                    <th style={{ textAlign: "center" }}>{t("stress_col_status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {result.monthlyTrajectory.map((p) => {
                    const isPositiveFlow = p.netCashFlow >= 0;
                    const barWidth = Math.min(100, Math.max(5, (p.cashBalance / maxCashInTrajectory) * 100));

                    return (
                      <tr key={p.month}>
                        <td style={{ fontWeight: 600, fontFamily: "var(--mono)" }}>{p.label}</td>
                        <td
                          style={{
                            textAlign: "right",
                            fontFamily: "var(--mono)",
                            color: isPositiveFlow ? "var(--pos)" : "var(--neg)",
                            fontWeight: 600,
                          }}
                        >
                          {isPositiveFlow ? `+€${p.netCashFlow.toFixed(1)}M` : `€${p.netCashFlow.toFixed(1)}M`}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <span
                            style={{
                              fontFamily: "var(--mono)",
                              fontWeight: 700,
                              color: p.cashBalance < 0 ? "var(--neg)" : p.cashBalance < 10 ? "var(--gold)" : "var(--pos)",
                            }}
                          >
                            €{p.cashBalance.toFixed(1)}M
                          </span>
                          {p.cashBalance > 0 && (
                            <div className="dmt-mini-bar-container">
                              <div
                                className="dmt-mini-bar-fill"
                                style={{
                                  width: `${barWidth}%`,
                                  background: p.cashBalance >= 10 ? "var(--green)" : "var(--gold)",
                                }}
                              />
                            </div>
                          )}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <span
                            className={`uefa-pillar-badge ${p.cashBalance >= 10 ? "status-green" : p.cashBalance >= 0 ? "status-yellow" : "status-red"}`}
                            style={{ fontSize: "0.68rem" }}
                          >
                            {p.cashBalance >= 10 ? t("stress_status_safe") : p.cashBalance >= 0 ? t("stress_status_buffer") : t("stress_status_deficit")}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Structural Defense Mechanisms Accordion */}
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
            <span>🛡️</span>
            <T as="span" i18nKey="stress_guide_title" />
          </span>
          <span className="pill-btn" style={{ fontSize: "0.72rem" }}>
            {showGuide ? t("stress_guide_hide") : t("stress_guide_show")}
          </span>
        </button>

        {showGuide && (
          <div className="dmt-guide-grid">
            <div className="dmt-guide-item">
              <T
                as="h5"
                className="dmt-guide-item-title"
                i18nKey="stress_guide_p1_title"
                style={{ color: "var(--green)" }}
              />
              <T as="p" className="dmt-guide-item-desc" i18nKey="stress_guide_p1_desc" />
            </div>
            <div className="dmt-guide-item">
              <T
                as="h5"
                className="dmt-guide-item-title"
                i18nKey="stress_guide_p2_title"
                style={{ color: "var(--gold)" }}
              />
              <T as="p" className="dmt-guide-item-desc" i18nKey="stress_guide_p2_desc" />
            </div>
            <div className="dmt-guide-item">
              <T
                as="h5"
                className="dmt-guide-item-title"
                i18nKey="stress_guide_p3_title"
                style={{ color: "var(--info)" }}
              />
              <T as="p" className="dmt-guide-item-desc" i18nKey="stress_guide_p3_desc" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
