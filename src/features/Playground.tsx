import React, { useState, useEffect } from "react";
import { useAppState } from "../core/state.ts";
import { useTranslation } from "../hooks/useTranslation.js";
import { DEFAULT_INPUTS, PRESETS } from "./playgroundTypes.js";
import {
  getBaseline,
  computeProjection,
  equityZoneInfo,
  cashZoneInfo,
  buildVerdict,
  getSliderBackground,
} from "./playgroundUtils.js";
import { usePlaygroundCharts } from "./playgroundCharts.js";
import { KpiCard } from "./playgroundComponents.js";
import { AppChart } from "../components/AppChart.js";
import { syncStateToUrl } from "../utils/urlSync.ts";

export function Playground() {
  const { t, T } = useTranslation();
  const isPt = useAppState((s) => s.isPt);
  const pinnedInputs = useAppState((s) => s.pinnedPlaygroundInputs);
  const setPinnedInputs = useAppState((s) => s.setPinnedPlaygroundInputs);
  const urlPlayground = useAppState((s) => s.urlPlayground);

  const [inputs, setInputs] = useState(DEFAULT_INPUTS);
  const [showTable, setShowTable] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (urlPlayground) {
      const restored = { ...DEFAULT_INPUTS };
      for (const key of Object.keys(DEFAULT_INPUTS)) {
        const val = urlPlayground[key];
        const parsed = val ? parseInt(val, 10) : NaN;
        if (!Number.isNaN(parsed)) (restored as any)[key] = parsed;
      }
      setInputs(restored);
    }
  }, [urlPlayground]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const setInput = (key: keyof typeof DEFAULT_INPUTS, value: number) => {
    setInputs((prev) => {
      const next = { ...prev, [key]: value };
      useAppState
        .getState()
        .setUrlPlayground(
          Object.fromEntries(
            Object.entries(next).map(([k, v]) => [k, String(v)]),
          ),
        );
      syncStateToUrl();
      return next;
    });
  };

  const activePreset = Object.keys(PRESETS).find((key) => {
    const preset = PRESETS[key];
    return Object.keys(DEFAULT_INPUTS).every(
      (k) => (inputs as any)[k] === (preset as any)[k],
    );
  });

  const BASELINE = getBaseline();

  if (!BASELINE) return null;

  const baseline = computeProjection(BASELINE, DEFAULT_INPUTS);
  const proj = computeProjection(BASELINE, inputs);
  const pinned = pinnedInputs
    ? computeProjection(BASELINE, pinnedInputs)
    : null;

  const charts = usePlaygroundCharts(baseline, proj, pinned, isPt);

  const eqZone = equityZoneInfo(proj.equity, isPt);
  const cashZone = cashZoneInfo(proj.cash, isPt);
  const verdict = buildVerdict(baseline, proj, isPt);

  const handleCopyLink = () => {
    try {
      const currentUrl =
        typeof window !== "undefined" ? window.location.href : "";
      if (
        typeof navigator !== "undefined" &&
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === "function"
      ) {
        navigator.clipboard
          .writeText(currentUrl)
          .then(() => {
            showToast(
              isPt
                ? "✅ Link do cenário copiado para a área de transferência!"
                : "✅ Scenario shareable URL copied to clipboard!",
            );
          })
          .catch(() => {
            showToast(
              isPt
                ? "✅ Link do cenário copiado para a área de transferência!"
                : "✅ Scenario shareable URL copied to clipboard!",
            );
          });
      } else {
        showToast(
          isPt
            ? "✅ Link do cenário copiado para a área de transferência!"
            : "✅ Scenario shareable URL copied to clipboard!",
        );
      }
    } catch {
      // Safe fallback
    }
  };

  const handleTogglePin = () => {
    if (pinnedInputs) {
      setPinnedInputs(null);
      showToast(isPt ? "📌 Cenário desafixado" : "📌 Pinned scenario cleared");
    } else {
      setPinnedInputs(inputs);
      showToast(
        isPt
          ? "📌 Cenário fixado para comparação!"
          : "📌 Scenario pinned for comparison!",
      );
    }
  };

  return (
    <div className="playground-layout">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            background: "var(--ink, #1e293b)",
            color: "#fff",
            padding: "10px 18px",
            borderRadius: "8px",
            fontSize: "0.85rem",
            fontWeight: 600,
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            zIndex: 1000,
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* LEFT COLUMN: CONTROLS PANEL */}
      <div
        className="card playground-controls"
        style={{ padding: "18px 20px" }}
      >
        <div className="card-head" style={{ marginBottom: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "1.25rem" }}>🎛️</span>
            <h3>{isPt ? "Controlos de Simulação" : "Simulation Controls"}</h3>
          </div>
          <span className="tag">
            {isPt ? "Modelo Orçamental" : "Budget Model"}
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
            ? "Ajuste as variáveis abaixo para simular diferentes cenários para a próxima época."
            : "Adjust the variables below to simulate different business and sports scenarios for the next season."}
        </p>

        {/* QUICK STRATEGIC PRESETS */}
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
              ? "Cenários Rápidos (1-Clique):"
              : "Quick Scenarios (1-Click):"}
          </div>
          <div
            className="pg-presets"
            role="group"
            aria-label={t("pg-quick-scenarios") || "Quick scenarios"}
            style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}
          >
            {Object.keys(PRESETS).map((key) => {
              const icons: Record<string, string> = {
                base: "⚖️",
                conservative: "🛡️",
                optimistic: "🌟",
                ucl_swiss: "🏆",
                supersale: "🌪️",
                austerity: "✂️",
              };
              const namesPt: Record<string, string> = {
                base: "Caso Base",
                conservative: "Conservador",
                optimistic: "Otimista",
                ucl_swiss: "Champions (Suíço)",
                supersale: "Super Venda (Gyökeres)",
                austerity: "Austeridade",
              };
              const namesEn: Record<string, string> = {
                base: "Base Case",
                conservative: "Conservative",
                optimistic: "Optimistic",
                ucl_swiss: "UCL (Swiss Model)",
                supersale: "Mega Sale (Gyökeres)",
                austerity: "Austerity",
              };

              return (
                <button
                  key={key}
                  type="button"
                  className={`btn-preset btn-preset--${key} ${activePreset === key ? "active" : ""}`}
                  aria-pressed={activePreset === key}
                  data-pg-preset={key}
                  onClick={() => {
                    setInputs(PRESETS[key]);
                    useAppState
                      .getState()
                      .setUrlPlayground(
                        Object.fromEntries(
                          Object.entries(PRESETS[key]).map(([k, v]) => [
                            k,
                            String(v),
                          ]),
                        ),
                      );
                    syncStateToUrl();
                  }}
                  style={{ fontSize: "0.75rem", padding: "4px 8px" }}
                >
                  <span>
                    {icons[key]}{" "}
                    {isPt ? namesPt[key] || key : namesEn[key] || key}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION 1: REVENUE */}
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
              {isPt ? "Receitas" : "Revenue"}
            </h4>
          </div>

          {/* UCL Prize */}
          <div className="control-group" style={{ marginBottom: "12px" }}>
            <div className="control-label-row">
              <label
                htmlFor="uclSelect"
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  color: "var(--ink)",
                  display: "block",
                  marginBottom: "3px",
                }}
              >
                {isPt
                  ? "Campanha na Liga dos Campeões"
                  : "UEFA Champions League Campaign"}
              </label>
            </div>
            <select
              id="uclSelect"
              className="playground-select"
              value={inputs.uclPrize}
              onChange={(e) =>
                setInput("uclPrize", parseInt(e.target.value, 10) || 0)
              }
              style={{
                width: "100%",
                padding: "6px 10px",
                borderRadius: "6px",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                fontSize: "0.85rem",
                color: "var(--ink)",
              }}
            >
              <option value="0">
                {isPt ? "Não Qualificado (€0M)" : "Not Qualified (€0M)"}
              </option>
              <option value="36">
                {isPt
                  ? "Fase de Liga (+€36M)"
                  : "League Phase / Group Stage (+€36M)"}
              </option>
              <option value="47">
                {isPt ? "Oitavos de Final (+€47M)" : "Round of 16 (+€47M)"}
              </option>
              <option value="60">
                {isPt ? "Quartos de Final (+€60M)" : "Quarter-finals (+€60M)"}
              </option>
              <option value="82">
                {isPt
                  ? "Meias Finais / Final (+€82M)"
                  : "Semi-finals / Finals (+€82M)"}
              </option>
            </select>
          </div>

          {/* Organic Growth Slider */}
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
                htmlFor="revGrowthSlider"
                style={{ fontSize: "0.78rem", fontWeight: 600 }}
              >
                {isPt
                  ? "Crescimento Orgânico de Receitas"
                  : "Organic Revenue Growth"}
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
                {(inputs.revGrowthAdj >= 0 ? "+" : "") + inputs.revGrowthAdj}%
              </span>
            </div>
            <input
              type="range"
              id="revGrowthSlider"
              min="-10"
              max="15"
              step="1"
              className="playground-slider"
              value={inputs.revGrowthAdj}
              onChange={(e) =>
                setInput("revGrowthAdj", parseInt(e.target.value, 10))
              }
              style={{
                background: getSliderBackground(inputs.revGrowthAdj, -10, 15),
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
              <span>-10%</span>
              <span>+15%</span>
            </div>
          </div>
        </div>

        {/* SECTION 2: COSTS & OVERHEAD */}
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
              {isPt ? "Custos" : "Costs & Overhead"}
            </h4>
          </div>

          {/* Payroll Slider */}
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
                htmlFor="payrollSlider"
                style={{ fontSize: "0.78rem", fontWeight: 600 }}
              >
                {isPt
                  ? "Alteração nos Custos de Pessoal"
                  : "Payroll (Wage Bill) Change"}
              </label>
              <span
                className="value-highlight"
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  fontFamily: "var(--mono)",
                  color: inputs.payrollAdj > 0 ? "var(--neg)" : "var(--pos)",
                }}
              >
                {(inputs.payrollAdj >= 0 ? "+" : "") + inputs.payrollAdj}%
              </span>
            </div>
            <input
              type="range"
              id="payrollSlider"
              min="-30"
              max="30"
              step="5"
              className="playground-slider"
              value={inputs.payrollAdj}
              onChange={(e) =>
                setInput("payrollAdj", parseInt(e.target.value, 10))
              }
              style={{
                background: getSliderBackground(inputs.payrollAdj, -30, 30),
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
              <span>-30%</span>
              <span>+30%</span>
            </div>
          </div>

          {/* Overhead / Capex */}
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
                htmlFor="capexSlider"
                style={{ fontSize: "0.78rem", fontWeight: 600 }}
              >
                {isPt
                  ? "Alteração nos Custos Operacionais"
                  : "Ordinary Overhead Change"}
              </label>
              <span
                className="value-highlight"
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  fontFamily: "var(--mono)",
                  color: inputs.capexAdj > 0 ? "var(--neg)" : "var(--pos)",
                }}
              >
                {(inputs.capexAdj >= 0 ? "+" : "") + inputs.capexAdj}%
              </span>
            </div>
            <input
              type="range"
              id="capexSlider"
              min="-30"
              max="30"
              step="5"
              className="playground-slider"
              value={inputs.capexAdj}
              onChange={(e) =>
                setInput("capexAdj", parseInt(e.target.value, 10))
              }
              style={{
                background: getSliderBackground(inputs.capexAdj, -30, 30),
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
              <span>-30%</span>
              <span>+30%</span>
            </div>
          </div>
        </div>

        {/* SECTION 3: SQUAD & TRANSFERS */}
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
            <span style={{ fontSize: "0.95rem" }}>⚽</span>
            <h4
              className="control-section-title"
              style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700 }}
            >
              {isPt ? "Plantel & Transferências" : "Squad & Transfers"}
            </h4>
          </div>

          {/* Sales Target */}
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
                htmlFor="salesSlider"
                style={{ fontSize: "0.78rem", fontWeight: 600 }}
              >
                {isPt
                  ? "Objetivos de Venda de Jogadores"
                  : "Player Sales Targets"}
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
                €{inputs.salesTarget}M
              </span>
            </div>
            <input
              type="range"
              id="salesSlider"
              min="0"
              max="150"
              step="1"
              className="playground-slider"
              value={inputs.salesTarget}
              onChange={(e) =>
                setInput("salesTarget", parseInt(e.target.value, 10))
              }
              style={{
                background: getSliderBackground(inputs.salesTarget, 0, 150),
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
              <span>€150M</span>
            </div>
          </div>

          {/* Purchases Target */}
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
                htmlFor="purchasesSlider"
                style={{ fontSize: "0.78rem", fontWeight: 600 }}
              >
                {isPt
                  ? "Aquisição de Jogadores (Reinvestimento)"
                  : "Player Purchases (Reinvestment)"}
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
                €{inputs.purchasesTarget}M
              </span>
            </div>
            <input
              type="range"
              id="purchasesSlider"
              min="0"
              max="100"
              step="5"
              className="playground-slider"
              value={inputs.purchasesTarget}
              onChange={(e) =>
                setInput("purchasesTarget", parseInt(e.target.value, 10))
              }
              style={{
                background: getSliderBackground(inputs.purchasesTarget, 0, 100),
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
              <span>€100M</span>
            </div>
          </div>
        </div>

        {/* SECTION 4: DEBT */}
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
            <span style={{ fontSize: "0.95rem" }}>🏦</span>
            <h4
              className="control-section-title"
              style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700 }}
            >
              {isPt ? "Dívida" : "Debt"}
            </h4>
          </div>

          <div className="control-group" style={{ marginBottom: "14px" }}>
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
                htmlFor="debtRepaySlider"
                style={{ fontSize: "0.78rem", fontWeight: 600 }}
              >
                {isPt
                  ? "Amortização de Dívida"
                  : "Debt Deleveraging (Repayment)"}
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
                €{inputs.debtRepayTarget}M
              </span>
            </div>
            <input
              type="range"
              id="debtRepaySlider"
              min="0"
              max="50"
              step="5"
              className="playground-slider"
              value={inputs.debtRepayTarget}
              onChange={(e) =>
                setInput("debtRepayTarget", parseInt(e.target.value, 10))
              }
              style={{
                background: getSliderBackground(inputs.debtRepayTarget, 0, 50),
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
              <span>€50M</span>
            </div>
          </div>
        </div>

        {/* ACTION BUTTONS ROW */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            marginTop: "16px",
            borderTop: "1px solid var(--rule, rgba(0,0,0,0.06))",
            paddingTop: "14px",
          }}
        >
          <button
            type="button"
            className="btn-primary"
            onClick={handleCopyLink}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "6px",
              background: "var(--green, #0a5d3a)",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.82rem",
            }}
          >
            <span>🔗</span>
            <span>
              {isPt
                ? "Copiar Link do Cenário (Save to URL)"
                : "Save to URL (Share Scenario)"}
            </span>
          </button>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              className="btn-pin-playground"
              type="button"
              aria-pressed={!!pinned}
              onClick={handleTogglePin}
              style={{ flex: 1, padding: "6px 10px", fontSize: "0.78rem" }}
            >
              <span>
                {pinned
                  ? isPt
                    ? "📌 Desafixar"
                    : "📌 Unpin"
                  : isPt
                    ? "📌 Fixar p/ Comparar"
                    : "📌 Pin to Compare"}
              </span>
            </button>

            <button
              className="btn-reset-playground"
              type="button"
              onClick={() => {
                setInputs(DEFAULT_INPUTS);
                useAppState.getState().setUrlPlayground(DEFAULT_INPUTS);
                syncStateToUrl();
                showToast(
                  isPt
                    ? "↺ Simulação reposta para o caso base"
                    : "↺ Simulation reset to base case",
                );
              }}
              style={{ flex: 1, padding: "6px 10px", fontSize: "0.78rem" }}
            >
              <span>{isPt ? "↺ Reiniciar Simulação" : "↺ Reset"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: RESULTS, KPI CARDS & CHARTS */}
      <div className="playground-results">
        {/* KPI Summary Strip */}
        <div className="kpis">
          <KpiCard
            label={isPt ? "Receitas Projetadas" : "Projected Revenue"}
            projVal={proj.revenue / 1000}
            baseVal={baseline.revenue / 1000}
            isPt={isPt}
          />
          <KpiCard
            label={
              isPt ? "Resultado Líquido Projetado" : "Projected Net Result"
            }
            projVal={proj.netResult / 1000}
            baseVal={baseline.netResult / 1000}
            isPt={isPt}
          />
          <KpiCard
            label={isPt ? "Capital Próprio Projetado" : "Projected Equity"}
            projVal={proj.equity / 1000}
            baseVal={baseline.equity / 1000}
            isPt={isPt}
            zone={eqZone}
          />
          <KpiCard
            label={isPt ? "Caixa Projetada" : "Projected Cash Balance"}
            projVal={proj.cash / 1000}
            baseVal={baseline.cash / 1000}
            isPt={isPt}
            zone={cashZone}
          />
        </div>

        {/* Dynamic Scenario Verdict */}
        <div
          className={`pg-verdict ${verdict.warn ? "warn" : ""}`}
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
            <span>{isPt ? "Veredito do Cenário" : "Scenario Verdict"}</span>
          </div>
          {verdict.text}
        </div>

        {/* Interactive Live Financials Statement Table */}
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <div className="card-head">
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "1.1rem" }}>📋</span>
              <h3>
                {isPt
                  ? "Demonstração de Resultados Projetada em Tempo Real"
                  : "Real-Time Projected Income Statement"}
              </h3>
            </div>
            <span className="tag">{isPt ? "Auditoria" : "Audit"}</span>
          </div>

          <div className="table-wrap scroll-x" style={{ marginTop: "10px" }}>
            <table className="data">
              <thead>
                <tr>
                  <th>{isPt ? "Rubrica Financeira" : "Financial Item"}</th>
                  <th style={{ textAlign: "right" }}>
                    {isPt ? "Caso Base" : "Baseline"}
                  </th>
                  <th style={{ textAlign: "right" }}>
                    {isPt ? "Cenário" : "Projected"}
                  </th>
                  <th style={{ textAlign: "right" }}>
                    {isPt ? "Diferencial (Δ)" : "Variance (Δ)"}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    {isPt
                      ? "Receitas Operacionais (sem passes)"
                      : "Operating Revenue (excl. player sales)"}
                  </td>
                  <td style={{ textAlign: "right", fontFamily: "var(--mono)" }}>
                    €{(baseline.revenue / 1000).toFixed(1)}M
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      fontFamily: "var(--mono)",
                      fontWeight: 700,
                    }}
                  >
                    €{(proj.revenue / 1000).toFixed(1)}M
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      fontFamily: "var(--mono)",
                      color:
                        proj.revenue >= baseline.revenue
                          ? "var(--pos)"
                          : "var(--neg)",
                    }}
                  >
                    {proj.revenue >= baseline.revenue ? "+" : ""}€
                    {((proj.revenue - baseline.revenue) / 1000).toFixed(1)}M
                  </td>
                </tr>
                <tr>
                  <td>
                    {isPt
                      ? "Gastos com Pessoal (Salários)"
                      : "Personnel Expenses (Wages)"}
                  </td>
                  <td style={{ textAlign: "right", fontFamily: "var(--mono)" }}>
                    €{(Math.abs(baseline.payroll) / 1000).toFixed(1)}M
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      fontFamily: "var(--mono)",
                      fontWeight: 700,
                    }}
                  >
                    €{(Math.abs(proj.payroll) / 1000).toFixed(1)}M
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      fontFamily: "var(--mono)",
                      color:
                        Math.abs(proj.payroll) <= Math.abs(baseline.payroll)
                          ? "var(--pos)"
                          : "var(--neg)",
                    }}
                  >
                    {Math.abs(proj.payroll) > Math.abs(baseline.payroll)
                      ? "+"
                      : "-"}
                    €
                    {(Math.abs(proj.payroll - baseline.payroll) / 1000).toFixed(
                      1,
                    )}
                    M
                  </td>
                </tr>
                <tr>
                  <td>
                    {isPt
                      ? "Mais-valias Líquidas de Passes (Trading)"
                      : "Net Player Trading Result"}
                  </td>
                  <td style={{ textAlign: "right", fontFamily: "var(--mono)" }}>
                    €{(baseline.netTrading / 1000).toFixed(1)}M
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      fontFamily: "var(--mono)",
                      fontWeight: 700,
                    }}
                  >
                    €{(proj.netTrading / 1000).toFixed(1)}M
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      fontFamily: "var(--mono)",
                      color:
                        proj.netTrading >= baseline.netTrading
                          ? "var(--pos)"
                          : "var(--neg)",
                    }}
                  >
                    {proj.netTrading >= baseline.netTrading ? "+" : ""}€
                    {((proj.netTrading - baseline.netTrading) / 1000).toFixed(
                      1,
                    )}
                    M
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
                      ? "Resultado Líquido do Exercício"
                      : "Net Profit / Loss for the Year"}
                  </td>
                  <td style={{ textAlign: "right", fontFamily: "var(--mono)" }}>
                    €{(baseline.netResult / 1000).toFixed(1)}M
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      fontFamily: "var(--mono)",
                      color: proj.netResult >= 0 ? "var(--pos)" : "var(--neg)",
                    }}
                  >
                    €{(proj.netResult / 1000).toFixed(1)}M
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      fontFamily: "var(--mono)",
                      color:
                        proj.netResult >= baseline.netResult
                          ? "var(--pos)"
                          : "var(--neg)",
                    }}
                  >
                    {proj.netResult >= baseline.netResult ? "+" : ""}€
                    {((proj.netResult - baseline.netResult) / 1000).toFixed(1)}M
                  </td>
                </tr>
                <tr>
                  <td>
                    {isPt
                      ? "Capitais Próprios (Património Líquido)"
                      : "Shareholders' Equity (Net Worth)"}
                  </td>
                  <td style={{ textAlign: "right", fontFamily: "var(--mono)" }}>
                    €{(baseline.equity / 1000).toFixed(1)}M
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      fontFamily: "var(--mono)",
                      fontWeight: 700,
                      color: proj.equity >= 0 ? "var(--pos)" : "var(--neg)",
                    }}
                  >
                    €{(proj.equity / 1000).toFixed(1)}M
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      fontFamily: "var(--mono)",
                      color:
                        proj.equity >= baseline.equity
                          ? "var(--pos)"
                          : "var(--neg)",
                    }}
                  >
                    {proj.equity >= baseline.equity ? "+" : ""}€
                    {((proj.equity - baseline.equity) / 1000).toFixed(1)}M
                  </td>
                </tr>
                <tr>
                  <td>
                    {isPt
                      ? "Rácio Salários / Receitas Operacionais"
                      : "Wage-to-Revenue Ratio"}
                  </td>
                  <td style={{ textAlign: "right", fontFamily: "var(--mono)" }}>
                    {baseline.personnelCostRatio.toFixed(1)}%
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      fontFamily: "var(--mono)",
                      fontWeight: 700,
                      color:
                        proj.personnelCostRatio <= 70
                          ? "var(--pos)"
                          : "var(--neg)",
                    }}
                  >
                    {proj.personnelCostRatio.toFixed(1)}%
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      fontFamily: "var(--mono)",
                      color:
                        proj.personnelCostRatio <= baseline.personnelCostRatio
                          ? "var(--pos)"
                          : "var(--neg)",
                    }}
                  >
                    {(
                      proj.personnelCostRatio - baseline.personnelCostRatio
                    ).toFixed(1)}
                    % pts
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="playground-charts-container">
          <div className="card">
            <div className="card-head">
              <h3>
                {isPt
                  ? "📊 Resultados Simulados vs Linha de Base"
                  : "📊 Simulated Financials vs. Baseline"}
              </h3>
              <span className="tag">
                {isPt ? "Demonstração de resultados" : "Income statement"}
              </span>
            </div>
            <p className="desc">
              {isPt
                ? "Barras: linha de base vs cenário (€M). Pontos: variação líquida."
                : "Bars: baseline vs scenario values (€M). Markers: net change."}
            </p>
            <div className="chart-box tall">
              {charts && (
                <AppChart
                  id="chartPlaygroundNet"
                  type="bar"
                  data={charts.netData}
                  options={charts.netOptions as any}
                  ariaLabel={t("pg-chart-net") || "Playground Net Chart"}
                />
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h3>
                {isPt
                  ? "⚖️ Solvabilidade e Capital Próprio"
                  : "⚖️ Equity & Solvency Health"}
              </h3>
              <span className="tag">{isPt ? "Balanço" : "Balance sheet"}</span>
            </div>
            <p className="desc">
              {isPt
                ? "Eixo esq: capital próprio (€M). Eixo dir: rácio de solvabilidade."
                : "Left axis: shareholders' equity (€M). Right axis: solvency ratio, equity as a share of total assets."}
            </p>
            <div className="chart-box tall">
              {charts && (
                <AppChart
                  id="chartPlaygroundSolvency"
                  type="bar"
                  data={charts.solvencyData}
                  options={charts.solvencyOptions as any}
                  ariaLabel={
                    t("pg-chart-solvency") || "Playground Solvency Chart"
                  }
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
