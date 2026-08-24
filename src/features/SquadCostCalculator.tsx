import React, { useState, useMemo } from "react";
import { useAppState } from "../core/state.js";
import { useTranslation } from "../hooks/useTranslation.js";
import {
  SquadCostCalculatorInputs,
  DEFAULT_CALCULATOR_INPUTS,
  CALCULATOR_PRESETS,
  calculateSquadCostImpact,
} from "./squadCostCalculatorCalculations.js";
import { getSliderBackground } from "./playgroundUtils.js";

export function SquadCostCalculator() {
  const { t, T } = useTranslation();
  const isPt = useAppState((s) => s.isPt);
  const annual = useAppState((s) => s.annual);
  const latestSeason = useMemo(
    () => (annual.length > 0 ? annual[annual.length - 1] : null),
    [annual],
  );

  const [inputs, setInputs] = useState<SquadCostCalculatorInputs>(
    DEFAULT_CALCULATOR_INPUTS,
  );
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [showTable, setShowTable] = useState(true);

  const result = useMemo(
    () => calculateSquadCostImpact(inputs, latestSeason, isPt),
    [inputs, latestSeason, isPt],
  );

  const updateInput = <K extends keyof SquadCostCalculatorInputs>(
    key: K,
    val: SquadCostCalculatorInputs[K],
  ) => {
    setActivePreset(null);
    setInputs((prev) => ({ ...prev, [key]: val }));
  };

  const applyPreset = (presetId: string) => {
    const preset = CALCULATOR_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setInputs(preset.inputs);
      setActivePreset(presetId);
    }
  };

  const resetInputs = () => {
    setInputs(DEFAULT_CALCULATOR_INPUTS);
    setActivePreset(null);
  };

  return (
    <div className="playground-layout">
      {/* LEFT COLUMN: CONTROLS PANEL */}
      <div
        className="card playground-controls"
        style={{ padding: "18px 20px" }}
      >
        <div className="card-head" style={{ marginBottom: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "1.25rem" }}>🧮</span>
            <h3>
              {isPt
                ? "Calculador de Impacto de Contratações (UEFA Squad Cost Rule)"
                : "UEFA Squad Cost Rule — Transfer Impact Calculator"}
            </h3>
          </div>
          <span className="tag">
            {isPt ? "Simulador Regulamentar" : "Regulatory Simulator"}
          </span>
        </div>

        <p
          className="section-desc"
          style={{
            fontSize: "0.8rem",
            color: "var(--muted)",
            marginBottom: "14px",
          }}
        >
          {isPt
            ? "Simule o impacto financeiro de uma contratação ou venda no teto de 70% de custos com plantel da UEFA (FSR). Amortização limitada a 5 anos."
            : "Simulate the financial impact of a signing or sale on UEFA's 70% Squad Cost cap under Financial Sustainability Regulations (FSR)."}
        </p>

        {/* PRESET QUICK BUTTONS */}
        <div style={{ marginBottom: "16px" }}>
          <div
            style={{
              fontSize: "0.72rem",
              fontWeight: 700,
              textTransform: "uppercase",
              color: "var(--muted)",
              marginBottom: "6px",
            }}
          >
            {isPt
              ? "Cenários de Exemplo (1-Clique):"
              : "Quick Deal Presets (1-Click):"}
          </div>
          <div
            className="pg-presets"
            role="group"
            aria-label="deal-presets"
            style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}
          >
            {CALCULATOR_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`btn-preset ${activePreset === p.id ? "active" : ""}`}
                onClick={() => applyPreset(p.id)}
                style={{ fontSize: "0.75rem", padding: "4px 8px" }}
              >
                {isPt ? p.namePt : p.nameEn}
              </button>
            ))}
          </div>
        </div>

        {/* SECTION 1: TIMING & WINDOW */}
        <div
          className="control-section"
          style={{
            borderTop: "1px solid var(--rule, rgba(0,0,0,0.06))",
            paddingTop: "12px",
            marginTop: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "8px",
            }}
          >
            <span style={{ fontSize: "0.95rem" }}>📅</span>
            <h4
              className="control-section-title"
              style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700 }}
            >
              {isPt ? "Época & Janela de Mercado" : "Season & Transfer Window"}
            </h4>
          </div>

          <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="seasonSelect"
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "var(--muted)",
                  display: "block",
                  marginBottom: "3px",
                }}
              >
                {isPt ? "Época Alvo:" : "Target Season:"}
              </label>
              <select
                id="seasonSelect"
                className="playground-select"
                value={inputs.targetSeason}
                onChange={(e) => updateInput("targetSeason", e.target.value)}
                style={{
                  width: "100%",
                  padding: "5px 8px",
                  borderRadius: "6px",
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  color: "var(--ink)",
                  fontSize: "0.82rem",
                }}
              >
                <option value="2025/26">
                  {isPt ? "2025/26 (Teto 70%)" : "2025/26 (70% Cap)"}
                </option>
                <option value="2024/25">
                  {isPt ? "2024/25 (Teto 80%)" : "2024/25 (80% Cap)"}
                </option>
                <option value="2026/27">
                  {isPt ? "2026/27 (Teto 70%)" : "2026/27 (70% Cap)"}
                </option>
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <label
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "var(--muted)",
                  display: "block",
                  marginBottom: "3px",
                }}
              >
                {isPt ? "Janela da Operação:" : "Transfer Window:"}
              </label>
              <div style={{ display: "flex", gap: "4px" }}>
                <button
                  type="button"
                  className={`btn-preset ${inputs.transferWindow === "summer" ? "active" : ""}`}
                  onClick={() => updateInput("transferWindow", "summer")}
                  style={{ flex: 1, padding: "5px 4px", fontSize: "0.75rem" }}
                >
                  ☀️ {isPt ? "Verão (12m)" : "Summer (12m)"}
                </button>
                <button
                  type="button"
                  className={`btn-preset ${inputs.transferWindow === "winter" ? "active" : ""}`}
                  onClick={() => updateInput("transferWindow", "winter")}
                  style={{ flex: 1, padding: "5px 4px", fontSize: "0.75rem" }}
                >
                  ❄️ {isPt ? "Inverno (6m)" : "Winter (6m)"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: TRANSFER FEE & CONTRACT */}
        <div
          className="control-section"
          style={{
            borderTop: "1px solid var(--rule, rgba(0,0,0,0.06))",
            paddingTop: "12px",
            marginTop: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "8px",
            }}
          >
            <span style={{ fontSize: "0.95rem" }}>💰</span>
            <h4
              className="control-section-title"
              style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700 }}
            >
              {isPt ? "Passe & Duração Contratual" : "Transfer Fee & Contract"}
            </h4>
          </div>

          {/* Player Name */}
          <div className="control-group" style={{ marginBottom: "12px" }}>
            <label
              htmlFor="playerNameInput"
              style={{
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "var(--ink)",
                display: "block",
                marginBottom: "3px",
              }}
            >
              {isPt
                ? "Identificação / Perfil do Atleta"
                : "Player Name / Profile"}
            </label>
            <input
              id="playerNameInput"
              type="text"
              className="input-text"
              value={inputs.playerName}
              onChange={(e) => updateInput("playerName", e.target.value)}
              style={{
                width: "100%",
                padding: "6px 10px",
                borderRadius: "6px",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--ink)",
                fontSize: "0.85rem",
              }}
            />
          </div>

          {/* Transfer Fee Slider */}
          <div className="control-group" style={{ marginBottom: "12px" }}>
            <div
              className="control-label-row"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "4px",
              }}
            >
              <label
                htmlFor="transferFeeSlider"
                style={{ fontSize: "0.78rem", fontWeight: 600 }}
              >
                {isPt ? "Custo de Aquisição (Passe):" : "Transfer Fee:"}
              </label>
              <span
                className="value-highlight"
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  fontFamily: "var(--mono)",
                  color: "var(--pos)",
                }}
              >
                €{inputs.transferFee.toFixed(1)}M
              </span>
            </div>
            <input
              type="range"
              id="transferFeeSlider"
              min="0"
              max="60"
              step="0.5"
              className="playground-slider"
              value={inputs.transferFee}
              onChange={(e) =>
                updateInput("transferFee", parseFloat(e.target.value))
              }
              style={{
                background: getSliderBackground(inputs.transferFee, 0, 60),
                width: "100%",
              }}
            />
            <div
              className="slider-bounds"
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.7rem",
                color: "var(--muted)",
              }}
            >
              <span>€0M</span>
              <span>€60M</span>
            </div>
          </div>

          {/* Contract Years Slider */}
          <div className="control-group" style={{ marginBottom: "12px" }}>
            <div
              className="control-label-row"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "4px",
              }}
            >
              <label
                htmlFor="contractYearsSlider"
                style={{ fontSize: "0.78rem", fontWeight: 600 }}
              >
                {isPt
                  ? "Duração do Contrato (Máx. 5 anos UEFA):"
                  : "Contract Duration (Max 5 yrs UEFA):"}
              </label>
              <span
                className="value-highlight"
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  fontFamily: "var(--mono)",
                  color: "var(--ink)",
                }}
              >
                {inputs.contractYears} {isPt ? "anos" : "years"}
              </span>
            </div>
            <input
              type="range"
              id="contractYearsSlider"
              min="1"
              max="5"
              step="1"
              className="playground-slider"
              value={inputs.contractYears}
              onChange={(e) =>
                updateInput("contractYears", parseInt(e.target.value, 10))
              }
              style={{
                background: getSliderBackground(inputs.contractYears, 1, 5),
                width: "100%",
              }}
            />
            <div
              className="slider-bounds"
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.7rem",
                color: "var(--muted)",
              }}
            >
              <span>1 {isPt ? "ano" : "yr"}</span>
              <span>5 {isPt ? "anos (teto UEFA)" : "yrs (UEFA cap)"}</span>
            </div>
          </div>
        </div>

        {/* SECTION 3: WAGES & AGENT COMMISSIONS */}
        <div
          className="control-section"
          style={{
            borderTop: "1px solid var(--rule, rgba(0,0,0,0.06))",
            paddingTop: "12px",
            marginTop: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "8px",
            }}
          >
            <span style={{ fontSize: "0.95rem" }}>💼</span>
            <h4
              className="control-section-title"
              style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700 }}
            >
              {isPt ? "Vencimentos & Comissões" : "Wages & Intermediary Fees"}
            </h4>
          </div>

          {/* Gross Wage Slider */}
          <div className="control-group" style={{ marginBottom: "12px" }}>
            <div
              className="control-label-row"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "4px",
              }}
            >
              <label
                htmlFor="annualWageSlider"
                style={{ fontSize: "0.78rem", fontWeight: 600 }}
              >
                {isPt ? "Salário Bruto Anual:" : "Annual Gross Wage:"}
              </label>
              <span
                className="value-highlight"
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  fontFamily: "var(--mono)",
                  color: "var(--gold)",
                }}
              >
                €{inputs.annualGrossWage.toFixed(1)}M / {isPt ? "ano" : "yr"}
              </span>
            </div>
            <input
              type="range"
              id="annualWageSlider"
              min="0.5"
              max="8.0"
              step="0.1"
              className="playground-slider"
              value={inputs.annualGrossWage}
              onChange={(e) =>
                updateInput("annualGrossWage", parseFloat(e.target.value))
              }
              style={{
                background: getSliderBackground(
                  inputs.annualGrossWage,
                  0.5,
                  8.0,
                ),
                width: "100%",
              }}
            />
            <div
              className="slider-bounds"
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.7rem",
                color: "var(--muted)",
              }}
            >
              <span>€0.5M</span>
              <span>€8.0M</span>
            </div>
          </div>

          {/* Agent Fees Slider */}
          <div className="control-group" style={{ marginBottom: "12px" }}>
            <div
              className="control-label-row"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "4px",
              }}
            >
              <label
                htmlFor="agentFeeSlider"
                style={{ fontSize: "0.78rem", fontWeight: 600 }}
              >
                {isPt
                  ? "Comissões & Prémio de Assinatura:"
                  : "Agent & Sign-on Fees:"}
              </label>
              <span
                className="value-highlight"
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  fontFamily: "var(--mono)",
                  color: "var(--ink)",
                }}
              >
                €{inputs.agentFee.toFixed(1)}M
              </span>
            </div>
            <input
              type="range"
              id="agentFeeSlider"
              min="0"
              max="6.0"
              step="0.2"
              className="playground-slider"
              value={inputs.agentFee}
              onChange={(e) =>
                updateInput("agentFee", parseFloat(e.target.value))
              }
              style={{
                background: getSliderBackground(inputs.agentFee, 0, 6.0),
                width: "100%",
              }}
            />
            <div
              className="slider-bounds"
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.7rem",
                color: "var(--muted)",
              }}
            >
              <span>€0M</span>
              <span>€6.0M</span>
            </div>
          </div>
        </div>

        {/* SECTION 4: COMPENSATORY SALE OFFSET */}
        <div
          className="control-section"
          style={{
            borderTop: "1px solid var(--rule, rgba(0,0,0,0.06))",
            paddingTop: "12px",
            marginTop: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "8px",
            }}
          >
            <span style={{ fontSize: "0.95rem" }}>🔄</span>
            <h4
              className="control-section-title"
              style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700 }}
            >
              {isPt
                ? "Venda Compensatória Opcional"
                : "Compensatory Sale Offset"}
            </h4>
          </div>

          <div
            style={{
              padding: "10px 12px",
              background: "var(--surface-soft, rgba(0,0,0,0.02))",
              borderRadius: "6px",
              border: "1px solid var(--rule, rgba(0,0,0,0.06))",
            }}
          >
            <div
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "var(--muted)",
                marginBottom: "8px",
              }}
            >
              {isPt
                ? "Simular saída de jogador para amortecer o rácio:"
                : "Simulate outgoing sale to absorb squad costs:"}
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <div style={{ flex: 1 }}>
                <label
                  htmlFor="offsetSaleInput"
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--muted)",
                    display: "block",
                    marginBottom: "2px",
                  }}
                >
                  {isPt ? "Encaixe de Venda (€M):" : "Sale Fee (€M):"}
                </label>
                <input
                  id="offsetSaleInput"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={inputs.offsetSaleFee}
                  onChange={(e) =>
                    updateInput(
                      "offsetSaleFee",
                      parseFloat(e.target.value) || 0,
                    )
                  }
                  style={{
                    width: "100%",
                    padding: "5px 8px",
                    borderRadius: "4px",
                    border: "1px solid var(--border)",
                    background: "var(--surface)",
                    color: "var(--ink)",
                    fontSize: "0.82rem",
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label
                  htmlFor="offsetWageInput"
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--muted)",
                    display: "block",
                    marginBottom: "2px",
                  }}
                >
                  {isPt ? "Salário Poupado (€M):" : "Wage Saved (€M):"}
                </label>
                <input
                  id="offsetWageInput"
                  type="number"
                  min="0"
                  max="10"
                  step="0.5"
                  value={inputs.offsetWageSaved}
                  onChange={(e) =>
                    updateInput(
                      "offsetWageSaved",
                      parseFloat(e.target.value) || 0,
                    )
                  }
                  style={{
                    width: "100%",
                    padding: "5px 8px",
                    borderRadius: "4px",
                    border: "1px solid var(--border)",
                    background: "var(--surface)",
                    color: "var(--ink)",
                    fontSize: "0.82rem",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* RESET ACTION BUTTON */}
        <div
          style={{
            marginTop: "16px",
            borderTop: "1px solid var(--rule, rgba(0,0,0,0.06))",
            paddingTop: "14px",
          }}
        >
          <button
            type="button"
            className="btn-reset-playground"
            onClick={resetInputs}
            style={{
              width: "100%",
              padding: "8px 12px",
              fontSize: "0.82rem",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>↺</span>
            <span>
              {isPt ? "Repor Parâmetros Base" : "Reset Default Parameters"}
            </span>
          </button>
        </div>
      </div>

      {/* RIGHT COLUMN: RESULTS, KPI CARDS & REGULATORY SUMMARY */}
      <div className="playground-results">
        {/* KPI Summary Strip */}
        <div className="kpis">
          <div className="kpi">
            <div className="label">
              {isPt ? "Amortização Anual" : "Annual Amortization"}
            </div>
            <div className="value">
              €{result.annualAmortization.toFixed(1)}M
            </div>
            <div className="change" style={{ color: "var(--muted)" }}>
              {isPt
                ? `(Passe / ${inputs.contractYears} anos)`
                : `(Fee / ${inputs.contractYears} yrs)`}
            </div>
          </div>

          <div className="kpi">
            <div className="label">
              {isPt ? "Custo Salarial Anual" : "Annual Wage Cost"}
            </div>
            <div className="value">€{inputs.annualGrossWage.toFixed(1)}M</div>
            <div className="change" style={{ color: "var(--muted)" }}>
              {isPt
                ? inputs.transferWindow === "winter"
                  ? "€" +
                    (inputs.annualGrossWage * 0.5).toFixed(1) +
                    "M no 1º ano"
                  : "Vencimento bruto"
                : "Gross salary"}
            </div>
          </div>

          <div
            className={`kpi ${result.status === "green" ? "pos" : result.status === "amber" ? "amber" : "neg"}`}
          >
            <div className="label">
              {isPt ? "Impacto Anual no Rácio" : "Annual Cost Impact"}
            </div>
            <div className="value">
              +€{result.annualSquadCostImpact.toFixed(1)}M
            </div>
            <div className="change">
              {isPt ? "Amortização + Salário" : "Amortization + Wages"}
            </div>
          </div>

          <div className={`kpi ${result.uefaHeadroom >= 0 ? "pos" : "neg"}`}>
            <div className="label">
              {isPt
                ? `Folga UEFA (${result.uefaCapPercent}%)`
                : `UEFA Headroom (${result.uefaCapPercent}%)`}
            </div>
            <div className="value">
              {result.uefaHeadroom >= 0 ? "€" : "-€"}
              {Math.abs(result.uefaHeadroom).toFixed(1)}M
            </div>
            <div className="pg-zone">
              <span
                className={`zone-dot ${result.status === "green" ? "g" : result.status === "amber" ? "a" : "r"}`}
              ></span>
              {result.status === "green"
                ? isPt
                  ? `Conforme (≤ ${result.uefaCapPercent}%)`
                  : `Compliant (≤ ${result.uefaCapPercent}%)`
                : result.status === "amber"
                  ? isPt
                    ? "Atenção (Margem Ultrapassada)"
                    : "Warning (Exceeded)"
                  : isPt
                    ? "Sanção (Risco Elevado)"
                    : "Penalty (High Risk)"}
            </div>
          </div>
        </div>

        {/* Dynamic Regulatory Verdict */}
        <div
          className={`pg-verdict ${result.status !== "green" ? "warn" : ""}`}
          style={{ display: "block" }}
          aria-live="polite"
        >
          <div className="pg-verdict-header">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
            <span>
              {isPt
                ? "Diagnóstico da Operação (UEFA FSR)"
                : "Deal Regulatory Verdict (UEFA FSR)"}
            </span>
          </div>
          {isPt ? result.verdictPt : result.verdictEn}
          <div
            style={{
              marginTop: "6px",
              fontSize: "0.75rem",
              color: "var(--muted)",
              fontWeight: 600,
            }}
          >
            {isPt
              ? `Compromisso total acumulado no contrato (${inputs.contractYears} anos): €${result.totalCommitment.toFixed(1)}M`
              : `Total cumulative contract commitment (${inputs.contractYears} yrs): €${result.totalCommitment.toFixed(1)}M`}
          </div>
        </div>

        {/* Multi-Year Horizon Projection Card (Ano 1 vs Ano 2 vs Ano 3) */}
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <div className="card-head">
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "1.1rem" }}>📈</span>
              <h3>
                {isPt
                  ? "Projeção Plurianual do Rácio UEFA (Ano 1 vs Ano 2 vs Ano 3)"
                  : "3-Year Multi-Year Horizon Projection (Year 1 vs Year 2 vs Year 3)"}
              </h3>
            </div>
            <span className="tag">
              {isPt
                ? "Sustentabilidade a Médio Prazo"
                : "Medium-Term Sustainability"}
            </span>
          </div>

          <p className="desc">
            {isPt
              ? "Evidencia o impacto da mais-valia imediata da venda no Ano 1 vs o encargo estrutural fixo que continua nos Anos 2 e 3."
              : "Demonstrates the one-off transfer windfall impact in Year 1 vs recurring structural squad costs in Years 2 and 3."}
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "12px",
              marginTop: "14px",
            }}
          >
            {[result.year1, result.year2, result.year3].map((y) => (
              <div
                key={y.yearIndex}
                style={{
                  padding: "12px 14px",
                  borderRadius: "8px",
                  background: "var(--surface-soft, rgba(0,0,0,0.02))",
                  border: `1px solid ${y.status === "green" ? "rgba(42, 127, 78, 0.3)" : y.status === "amber" ? "rgba(176, 137, 35, 0.3)" : "rgba(184, 64, 58, 0.3)"}`,
                }}
              >
                <div
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "var(--muted)",
                    textTransform: "uppercase",
                    marginBottom: "4px",
                  }}
                >
                  {isPt ? y.labelPt : y.labelEn}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: "6px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "1.4rem",
                      fontWeight: 800,
                      fontFamily: "var(--mono)",
                      color: "var(--ink)",
                    }}
                  >
                    {y.ratio.toFixed(1)}%
                  </span>
                  <span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>
                    (Teto: {y.uefaCap.toFixed(0)}%)
                  </span>
                </div>
                <div
                  style={{
                    marginTop: "4px",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: y.headroom >= 0 ? "var(--pos)" : "var(--neg)",
                  }}
                >
                  {y.headroom >= 0
                    ? isPt
                      ? `Folga: +€${y.headroom.toFixed(1)}M`
                      : `Headroom: +€${y.headroom.toFixed(1)}M`
                    : isPt
                      ? `Défice: -€${Math.abs(y.headroom).toFixed(1)}M`
                      : `Deficit: -€${Math.abs(y.headroom).toFixed(1)}M`}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real-Time Regulatory Breakdown Table */}
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <div className="card-head">
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "1.1rem" }}>📋</span>
              <h3>
                {isPt
                  ? "Decomposição Regulamentar Detalhada"
                  : "Detailed Regulatory Breakdown"}
              </h3>
            </div>
            <span className="tag">{isPt ? "Auditoria" : "Audit"}</span>
          </div>

          <div className="table-wrap scroll-x" style={{ marginTop: "10px" }}>
            <table className="data">
              <thead>
                <tr>
                  <th>{isPt ? "Rubrica do Plantel" : "Squad Item"}</th>
                  <th style={{ textAlign: "right" }}>
                    {isPt ? "Situação Atual" : "Baseline"}
                  </th>
                  <th style={{ textAlign: "right" }}>
                    {isPt ? "Com o Reforço (Ano 1)" : "With Signing (Yr 1)"}
                  </th>
                  <th style={{ textAlign: "right" }}>
                    {isPt ? "Ano 2 (Recorrente)" : "Year 2 (Recurring)"}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    {isPt
                      ? "Custos Totais com o Plantel (Salários + Amortizações)"
                      : "Total Squad Costs (Wages + Amortization)"}
                  </td>
                  <td style={{ textAlign: "right", fontFamily: "var(--mono)" }}>
                    €{result.baselineSquadCosts.toFixed(1)}M
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      fontFamily: "var(--mono)",
                      fontWeight: 700,
                    }}
                  >
                    €{result.year1.squadCosts.toFixed(1)}M
                  </td>
                  <td style={{ textAlign: "right", fontFamily: "var(--mono)" }}>
                    €{result.year2.squadCosts.toFixed(1)}M
                  </td>
                </tr>
                <tr>
                  <td>
                    {isPt
                      ? "Receita Total Elegível (Operacional + Mais-Valias)"
                      : "Total Eligible Revenue (Operating + Transfers)"}
                  </td>
                  <td style={{ textAlign: "right", fontFamily: "var(--mono)" }}>
                    €{result.baselineTotalRevenue.toFixed(1)}M
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      fontFamily: "var(--mono)",
                      fontWeight: 700,
                    }}
                  >
                    €{result.year1.totalRevenue.toFixed(1)}M
                  </td>
                  <td style={{ textAlign: "right", fontFamily: "var(--mono)" }}>
                    €{result.year2.totalRevenue.toFixed(1)}M
                  </td>
                </tr>
                <tr
                  style={{
                    background: "var(--surface-soft, rgba(0,0,0,0.02))",
                    fontWeight: 700,
                  }}
                >
                  <td>
                    {isPt
                      ? "Rácio UEFA Squad Cost Resultante"
                      : "Resulting UEFA Squad Cost Ratio"}
                  </td>
                  <td style={{ textAlign: "right", fontFamily: "var(--mono)" }}>
                    {result.baselineRatio.toFixed(1)}%
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      fontFamily: "var(--mono)",
                      color:
                        result.year1.status === "green"
                          ? "var(--pos)"
                          : "var(--neg)",
                    }}
                  >
                    {result.year1.ratio.toFixed(1)}%
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      fontFamily: "var(--mono)",
                      color:
                        result.year2.status === "green"
                          ? "var(--pos)"
                          : "var(--neg)",
                    }}
                  >
                    {result.year2.ratio.toFixed(1)}%
                  </td>
                </tr>
                <tr>
                  <td>
                    {isPt
                      ? `Teto Regulamentar Máximo (UEFA FSR)`
                      : `Maximum Regulatory Cap (UEFA FSR)`}
                  </td>
                  <td style={{ textAlign: "right", fontFamily: "var(--mono)" }}>
                    €
                    {(
                      (result.uefaCapPercent / 100) *
                      result.baselineTotalRevenue
                    ).toFixed(1)}
                    M
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      fontFamily: "var(--mono)",
                      fontWeight: 700,
                    }}
                  >
                    €
                    {(
                      (result.uefaCapPercent / 100) *
                      result.year1.totalRevenue
                    ).toFixed(1)}
                    M ({result.uefaCapPercent}%)
                  </td>
                  <td style={{ textAlign: "right", fontFamily: "var(--mono)" }}>
                    €{(0.7 * result.year2.totalRevenue).toFixed(1)}M (70%)
                  </td>
                </tr>
                <tr>
                  <td>
                    {isPt
                      ? "Folga Orçamental Restante"
                      : "Remaining Budget Headroom"}
                  </td>
                  <td style={{ textAlign: "right", fontFamily: "var(--mono)" }}>
                    €
                    {(
                      (result.uefaCapPercent / 100) *
                        result.baselineTotalRevenue -
                      result.baselineSquadCosts
                    ).toFixed(1)}
                    M
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      fontFamily: "var(--mono)",
                      fontWeight: 700,
                      color:
                        result.year1.headroom >= 0
                          ? "var(--pos)"
                          : "var(--neg)",
                    }}
                  >
                    €{result.year1.headroom.toFixed(1)}M
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      fontFamily: "var(--mono)",
                      color:
                        result.year2.headroom >= 0
                          ? "var(--pos)"
                          : "var(--neg)",
                    }}
                  >
                    €{result.year2.headroom.toFixed(1)}M
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
