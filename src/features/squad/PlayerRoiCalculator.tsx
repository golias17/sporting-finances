import React, { useState, useMemo, useRef } from "react";
import { useAppState, state } from "../../core/state.js";
import { useTranslation } from "../../hooks/useTranslation.js";
import { AppChart } from "../../components/AppChart.js";
import { ChartDownloadButton } from "../../components/ChartDownloadButton.js";
import { getSliderBackground } from "../playgroundUtils.js";
import {
  SQUAD_VALUATION_PROFILES,
  calculatePlayerSaleRoi,
  type PlayerValuationProfile,
} from "./playerValuationData.js";
import { PlayerValuationTable } from "./PlayerValuationTable.js";

export function PlayerRoiCalculator() {
  const { t, T } = useTranslation();
  const isPt = useAppState((s) => s.isPt);
  const baseOpts = useAppState((s) => s.baseOpts);
  const chartRef = useRef<any>(null);

  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("gyokeres");
  const [positionFilter, setPositionFilter] = useState<string>("all");
  const [proposedFee, setProposedFee] = useState<number>(85.0);
  const [agentFeePct, setAgentFeePct] = useState<number>(0.05);

  const activePlayer = useMemo(() => {
    return (
      SQUAD_VALUATION_PROFILES.find((p) => p.id === selectedPlayerId) ||
      SQUAD_VALUATION_PROFILES[0]
    );
  }, [selectedPlayerId]);

  const filteredPlayers = useMemo(() => {
    if (positionFilter === "all") return SQUAD_VALUATION_PROFILES;
    if (positionFilter === "academy")
      return SQUAD_VALUATION_PROFILES.filter((p) => p.isHomegrown);
    return SQUAD_VALUATION_PROFILES.filter((p) => p.position === positionFilter);
  }, [positionFilter]);

  const handleSelectPlayer = (player: PlayerValuationProfile) => {
    setSelectedPlayerId(player.id);
    setProposedFee(player.marketValue);
  };

  const setPresetFee = (type: "market" | "clause" | "conservative") => {
    if (type === "market") setProposedFee(activePlayer.marketValue);
    if (type === "clause") setProposedFee(activePlayer.releaseClause);
    if (type === "conservative")
      setProposedFee(Math.round(activePlayer.marketValue * 0.8));
  };

  const simulation = useMemo(() => {
    return calculatePlayerSaleRoi(activePlayer, proposedFee, agentFeePct);
  }, [activePlayer, proposedFee, agentFeePct]);

  const waterfallChartData = useMemo(() => {
    const labels = [
      isPt ? "1. Valor Facial Bruto" : "1. Gross Transfer Fee",
      isPt ? "2. (-) Valor Contab. Residual" : "2. (-) Residual Book Value",
      isPt ? "3. (-) Direitos de Revenda" : "3. (-) Retained Sell-On",
      isPt ? "4. (-) Solidariedade FIFA (5%)" : "4. (-) FIFA Solidarity (5%)",
      isPt ? "5. (-) Comissão Agente" : "5. (-) Agent Commission",
      isPt ? "6. (=) Mais-Valia Líquida (P&L)" : "6. (=) Net Capital Gain (P&L)",
    ];

    const values = [
      simulation.grossFee,
      -simulation.bookValueDeduction,
      -simulation.sellOnFee,
      -simulation.fifaSolidarity,
      -simulation.agentFee,
      simulation.netAccountingGain,
    ];

    const bgColors = [
      "rgba(10, 93, 58, 0.75)",
      "rgba(184, 64, 58, 0.75)",
      "rgba(200, 169, 81, 0.75)",
      "rgba(100, 116, 139, 0.75)",
      "rgba(184, 64, 58, 0.75)",
      simulation.netAccountingGain >= 0
        ? "rgba(10, 93, 58, 0.9)"
        : "rgba(184, 64, 58, 0.9)",
    ];

    return {
      labels,
      datasets: [
        {
          label: isPt ? "Desagregação Financeira (€M)" : "Financial Waterfall (€M)",
          data: values,
          backgroundColor: bgColors,
          borderColor: bgColors.map((c) => c.replace("0.75", "1").replace("0.9", "1")),
          borderWidth: 1.5,
          borderRadius: 4,
        },
      ],
    };
  }, [simulation, isPt]);

  const waterfallChartOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: "y" as const,
      scales: {
        x: {
          grid: { color: state.COLORS.lineBorder || "rgba(0,0,0,0.06)" },
          ticks: {
            callback: (v: number) => `€${v.toFixed(0)}M`,
            font: { size: 10 },
          },
          title: {
            display: true,
            text: isPt ? "Impacto em Milhões de Euros (€M)" : "Impact in Millions of Euros (€M)",
            font: { size: 11, weight: "bold" as const },
          },
        },
        y: {
          grid: { display: false },
          ticks: { font: { size: 11, weight: "600" as const } },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          ...baseOpts?.plugins?.tooltip,
          callbacks: {
            label: (ctx: { parsed: { x: number } }) => {
              const val = ctx.parsed.x;
              return ` ${val >= 0 ? "+" : ""}€${val.toFixed(2)}M`;
            },
          },
        },
      },
    };
  }, [baseOpts, isPt]);

  return (
    <div className="card card--spaced" id="playerRoiSection">
      {/* Header */}
      <div className="card-head">
        <div>
          <T as="h3" i18nKey="player_roi_title" />
          <T as="span" className="tag" i18nKey="player_roi_tag" />
        </div>
        <ChartDownloadButton
          chartRef={chartRef}
          fileName={`player_roi_simulation_${activePlayer.id}`}
        />
      </div>
      <T as="p" className="desc" i18nKey="player_roi_desc" />

      {/* Position Filter Toolbar */}
      <div
        className="filter-toolbar"
        style={{ marginTop: "1.25rem", marginBottom: "1rem" }}
      >
        <div className="filter-toolbar-group">
          <span className="filter-toolbar-label">
            {isPt ? "Filtrar Posição:" : "Filter Position:"}
          </span>
          <button
            className={`btn-preset ${positionFilter === "all" ? "active" : ""}`}
            onClick={() => setPositionFilter("all")}
          >
            {t("player_roi_filter_all")}
          </button>
          <button
            className={`btn-preset ${positionFilter === "forward" ? "active" : ""}`}
            onClick={() => setPositionFilter("forward")}
          >
            {t("player_roi_filter_forwards")}
          </button>
          <button
            className={`btn-preset ${positionFilter === "midfielder" ? "active" : ""}`}
            onClick={() => setPositionFilter("midfielder")}
          >
            {t("player_roi_filter_midfielders")}
          </button>
          <button
            className={`btn-preset ${positionFilter === "defender" ? "active" : ""}`}
            onClick={() => setPositionFilter("defender")}
          >
            {t("player_roi_filter_defenders")}
          </button>
          <button
            className={`btn-preset ${positionFilter === "academy" ? "active" : ""}`}
            onClick={() => setPositionFilter("academy")}
          >
            {t("player_roi_filter_academy")}
          </button>
        </div>
      </div>

      {/* Quick Player Selection Chips */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          overflowX: "auto",
          paddingBottom: "8px",
          marginBottom: "1.5rem",
        }}
      >
        {filteredPlayers.map((p) => {
          const isSelected = p.id === activePlayer.id;
          return (
            <button
              key={p.id}
              onClick={() => handleSelectPlayer(p)}
              style={{
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 14px",
                borderRadius: "var(--radius-md)",
                border: isSelected
                  ? "2px solid var(--green)"
                  : "1px solid var(--rule)",
                background: isSelected ? "var(--accent-glow, rgba(10, 93, 58, 0.1))" : "var(--paper)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--mono)",
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  color: isSelected ? "var(--green)" : "var(--muted)",
                }}
              >
                #{p.number}
              </span>
              <div style={{ textAlign: "left" }}>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    color: isSelected ? "var(--green)" : "var(--ink)",
                  }}
                >
                  {p.shortName}
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--muted)" }}>
                  {p.isHomegrown ? "Formação" : `NBV: €${p.currentBookValue.toFixed(1)}M`}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Player Dossier Card */}
      <div
        className="card"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--rule)",
          padding: "16px 20px",
          marginBottom: "1.5rem",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h4 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800 }}>
                {activePlayer.name}
              </h4>
              {activePlayer.isHomegrown ? (
                <span className="uefa-pillar-badge status-green">
                  {t("player_roi_academy_badge")}
                </span>
              ) : activePlayer.sellOnPercentage > 0 ? (
                <span className="uefa-pillar-badge status-yellow">
                  {t("player_roi_sellon_badge")} ({(activePlayer.sellOnPercentage * 100).toFixed(0)}%)
                </span>
              ) : null}
            </div>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: "0.8rem",
                color: "var(--muted)",
              }}
            >
              {activePlayer.nationality} • {isPt ? "Contrato até" : "Contract until"} {activePlayer.contractExpiry} ({activePlayer.contractYearsTotal - activePlayer.yearsElapsed} {isPt ? "anos restantes" : "years remaining"})
            </p>
          </div>

          {/* Preset Buttons */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              className="btn-preset"
              onClick={() => setPresetFee("conservative")}
              style={{ fontSize: "0.75rem", padding: "4px 10px" }}
            >
              📉 {t("player_roi_preset_conservative")} (€{(activePlayer.marketValue * 0.8).toFixed(0)}M)
            </button>
            <button
              className="btn-preset"
              onClick={() => setPresetFee("market")}
              style={{ fontSize: "0.75rem", padding: "4px 10px" }}
            >
              📊 {t("player_roi_preset_market")} (€{activePlayer.marketValue.toFixed(0)}M)
            </button>
            <button
              className="btn-preset"
              onClick={() => setPresetFee("clause")}
              style={{ fontSize: "0.75rem", padding: "4px 10px", borderColor: "var(--gold)" }}
            >
              ⭐ {t("player_roi_preset_clause")} (€{activePlayer.releaseClause.toFixed(0)}M)
            </button>
          </div>
        </div>

        {/* Financial Metrics Strip */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            gap: "12px",
            marginTop: "14px",
            paddingTop: "12px",
            borderTop: "1px solid var(--rule)",
          }}
        >
          <div>
            <div style={{ fontSize: "0.72rem", color: "var(--muted)" }}>{isPt ? "Custo Original" : "Original Cost"}</div>
            <div style={{ fontFamily: "var(--mono)", fontWeight: 700, fontSize: "0.92rem" }}>
              {activePlayer.isHomegrown ? "€0.0M" : `€${activePlayer.acquisitionCost.toFixed(1)}M`}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.72rem", color: "var(--muted)" }}>{isPt ? "Amortização Anual" : "Annual Amort."}</div>
            <div style={{ fontFamily: "var(--mono)", fontWeight: 700, fontSize: "0.92rem", color: "var(--muted)" }}>
              €{activePlayer.annualAmortization.toFixed(2)}M/ano
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.72rem", color: "var(--muted)" }}>{isPt ? "Valor Contabilístico Residual" : "Net Book Value"}</div>
            <div style={{ fontFamily: "var(--mono)", fontWeight: 800, fontSize: "0.92rem", color: "var(--ink)" }}>
              €{activePlayer.currentBookValue.toFixed(2)}M
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.72rem", color: "var(--muted)" }}>{isPt ? "Cláusula de Rescisão" : "Release Clause"}</div>
            <div style={{ fontFamily: "var(--mono)", fontWeight: 800, fontSize: "0.92rem", color: "var(--gold)" }}>
              €{activePlayer.releaseClause.toFixed(0)}M
            </div>
          </div>
        </div>
      </div>

      {/* 4 Accent KPI Cards */}
      <div className="dmt-kpis" style={{ marginBottom: "1.75rem" }}>
        <div className="dmt-kpi-card accent-green">
          <T as="div" className="dmt-kpi-label" i18nKey="player_roi_kpi_gross_fee" />
          <div className="dmt-kpi-value" style={{ color: "var(--green)" }}>
            €{proposedFee.toFixed(1)}M
          </div>
          <T as="div" className="dmt-kpi-sub" i18nKey="player_roi_kpi_gross_fee_sub" />
        </div>

        <div className="dmt-kpi-card accent-pos">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <T as="div" className="dmt-kpi-label" i18nKey="player_roi_kpi_net_gain" />
            <span className="uefa-pillar-badge status-green" style={{ fontSize: "0.65rem" }}>
              {simulation.roiMultiple === 999
                ? "100% Formação"
                : `${simulation.roiMultiple.toFixed(1)}x ROI`}
            </span>
          </div>
          <div className="dmt-kpi-value" style={{ color: "var(--pos)" }}>
            +€{simulation.netAccountingGain.toFixed(1)}M
          </div>
          <T as="div" className="dmt-kpi-sub" i18nKey="player_roi_kpi_net_gain_sub" />
        </div>

        <div className="dmt-kpi-card accent-gold">
          <T as="div" className="dmt-kpi-label" i18nKey="player_roi_kpi_cash_in" />
          <div className="dmt-kpi-value" style={{ color: "var(--gold)" }}>
            €{simulation.netCashInflow.toFixed(1)}M
          </div>
          <T as="div" className="dmt-kpi-sub" i18nKey="player_roi_kpi_cash_in_sub" />
        </div>

        <div className="dmt-kpi-card accent-info">
          <T as="div" className="dmt-kpi-label" i18nKey="player_roi_kpi_uefa_relief" />
          <div className="dmt-kpi-value" style={{ color: "var(--info)" }}>
            +€{simulation.uefaSquadCostRelief.toFixed(2)}M/ano
          </div>
          <T as="div" className="dmt-kpi-sub" i18nKey="player_roi_kpi_uefa_relief_sub" />
        </div>
      </div>

      {/* Interactive Controls Sliders */}
      <div className="pg-controls-grid" style={{ marginBottom: "1.75rem" }}>
        <div className="pg-control-card">
          <div className="pg-control-header">
            <label>
              <span>💶</span>
              <T as="span" i18nKey="player_roi_slider_label" />
            </label>
            <span className="pg-control-val" style={{ color: "var(--green)" }}>
              €{proposedFee}M
            </span>
          </div>
          <input
            type="range"
            min={5}
            max={120}
            step={2.5}
            value={proposedFee}
            onChange={(e) => setProposedFee(Number(e.target.value))}
            className="pg-slider"
            style={{ background: getSliderBackground(proposedFee, 5, 120) }}
            aria-label={t("player_roi_slider_label")}
          />
          <div className="pg-slider-bounds">
            <span>€5M (Mínimo)</span>
            <span>€120M (Recorde)</span>
          </div>
        </div>

        <div className="pg-control-card">
          <div className="pg-control-header">
            <label>
              <span>🤝</span>
              <T as="span" i18nKey="player_roi_agent_fee_label" />
            </label>
            <span className="pg-control-val">
              {(agentFeePct * 100).toFixed(0)}% (€{(proposedFee * agentFeePct).toFixed(1)}M)
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={0.12}
            step={0.01}
            value={agentFeePct}
            onChange={(e) => setAgentFeePct(Number(e.target.value))}
            className="pg-slider"
            style={{ background: getSliderBackground(agentFeePct * 100, 0, 12) }}
            aria-label={t("player_roi_agent_fee_label")}
          />
          <div className="pg-slider-bounds">
            <span>0% (Sem comissão)</span>
            <span>12% (Teto FIFA)</span>
          </div>
        </div>
      </div>

      {/* Waterfall Breakdown Horizontal Bar Chart */}
      <div className="card" style={{ marginBottom: "1.75rem" }}>
        <div className="card-head">
          <T as="h3" i18nKey="player_roi_waterfall_title" />
          <span className="tag">
            {activePlayer.name} (€{proposedFee}M)
          </span>
          <ChartDownloadButton
            chartRef={chartRef}
            fileName={`waterfall_${activePlayer.id}_roi`}
            title={`Venda de ${activePlayer.name} (€${proposedFee}M)`}
            subtitle={`Mais-valia Líquida: €${simulation.netAccountingGain.toFixed(1)}M | Entrada em Caixa: €${simulation.netCashInflow.toFixed(1)}M`}
          />
        </div>
        <AppChart
          id="chartPlayerRoiWaterfall"
          type="bar"
          chartRef={chartRef}
          data={waterfallChartData}
          options={waterfallChartOptions}
          hideTable={true}
        />
      </div>

      {/* Full Squad Valuation Matrix Table */}
      <PlayerValuationTable
        onSelectPlayer={handleSelectPlayer}
        selectedPlayerId={activePlayer.id}
      />
    </div>
  );
}
