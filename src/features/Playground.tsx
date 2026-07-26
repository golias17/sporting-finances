import React, { useState, useEffect } from "react";
import { createRoot, Root } from "react-dom/client";
import { useAppState, state } from "../core/state.ts";
import { getBrandColors, fmtMillions } from "../charts/chartUtils.ts";
import { AppChart } from "../components/AppChart.js";
import { syncStateToUrl } from "../utils/urlSync.ts";
import { useTranslation } from "../hooks/useTranslation.js";
import { HEALTH_THRESHOLDS } from "./healthThresholds.ts";
import { FALLBACK, DEFAULT_INPUTS, PRESETS, UCL_BONUS_COST_RATE } from "./playgroundTypes.js";
import type { PlaygroundInputs, ZoneInfo } from "./playgroundTypes.js";
import {
  getBaseline,
  computeProjection,
  equityZoneInfo,
  cashZoneInfo,
  buildVerdict,
  scenarioLabels,
  getSliderBackground,
} from "./playgroundUtils.js";
import { usePlaygroundCharts } from "./playgroundCharts.js";
import { KpiCard } from "./playgroundComponents.js";

export function Playground() {
  const { t, T } = useTranslation();
  const isPt = useAppState((s) => s.isPt);
  const pinnedInputs = useAppState((s) => s.pinnedPlaygroundInputs);
  const urlPlayground = useAppState((s) => s.urlPlayground);

  const [inputs, setInputs] = useState(DEFAULT_INPUTS);

  useEffect(() => {
    if (urlPlayground) {
      const restored = { ...DEFAULT_INPUTS };
      for (const key of Object.keys(DEFAULT_INPUTS)) {
        const parsed = parseInt(urlPlayground[key], 10);
        if (!Number.isNaN(parsed)) (restored as any)[key] = parsed;
      }
      setInputs(restored);
    }
  }, [urlPlayground]);

  const setInput = (key: keyof typeof DEFAULT_INPUTS, value: number) => {
    setInputs((prev) => {
      const next = { ...prev, [key]: value };
      useAppState.getState().setUrlPlayground(next);
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

  return (
    <div className="playground-layout">
      <div className="card playground-controls">
        <h3>{isPt ? "Controlos de Simulação" : "Simulation Controls"}</h3>
        <p className="section-desc">
          {isPt
            ? "Ajuste as variáveis abaixo para simular diferentes cenários para a próxima época."
            : "Adjust the variables below to simulate different business and sports scenarios for the next season."}
        </p>

        <div
          className="pg-presets"
          role="group"
          aria-label={t("pg-quick-scenarios") || "Quick scenarios"}
        >
          {Object.keys(PRESETS).map((key) => (
            <button
              key={key}
              type="button"
              className={`btn-preset ${key === "optimistic" ? "btn-preset--optimistic" : ""} ${activePreset === key ? "active" : ""}`}
              aria-pressed={activePreset === key}
              onClick={() => {
                setInputs(PRESETS[key]);
                useAppState.getState().setUrlPlayground(PRESETS[key]);
                syncStateToUrl();
              }}
            >
              <span>
                {key === "conservative"
                  ? isPt
                    ? "Conservador"
                    : "Conservative"
                  : key === "base"
                    ? isPt
                      ? "Caso Base"
                      : "Base Case"
                    : isPt
                      ? "Otimista"
                      : "Optimistic"}
              </span>
            </button>
          ))}
        </div>

        <div className="control-section">
          <h4 className="control-section-title">
            {isPt ? "Receitas" : "Revenue"}
          </h4>

          <div className="control-group">
            <div className="control-label-row">
              <label htmlFor="uclSelect">
                {isPt
                  ? "Campanha na Liga dos Campeões"
                  : "UEFA Champions League Campaign"}
              </label>
            </div>
            <span className="control-help">
              {isPt
                ? "Prémios UEFA, direitos TV e impacto na bilhética."
                : "UEFA prize money, TV rights and ticket sales spillover."}
            </span>
            <select
              id="uclSelect"
              className="playground-select"
              value={inputs.uclPrize}
              onChange={(e) =>
                setInput("uclPrize", parseInt(e.target.value, 10))
              }
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

          <div className="control-group">
            <div className="control-label-row">
              <label htmlFor="revGrowthSlider">
                {isPt
                  ? "Crescimento Orgânico de Receitas"
                  : "Organic Revenue Growth"}
              </label>
              <span className="value-highlight">
                {(inputs.revGrowthAdj >= 0 ? "+" : "") + inputs.revGrowthAdj}%
              </span>
            </div>
            <span className="control-help">
              {isPt
                ? "Preços de bilhética e acordos comerciais existentes, independente da UCL."
                : "Ticket pricing and existing commercial deals, independent of UCL."}
            </span>
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
              }}
            />
            <div className="slider-bounds">
              <span>-10%</span>
              <span>+15%</span>
            </div>
          </div>
        </div>

        <div className="control-section">
          <h4 className="control-section-title">
            {isPt ? "Custos" : "Costs & Overhead"}
          </h4>

          <div className="control-group">
            <div className="control-label-row">
              <label htmlFor="payrollSlider">
                {isPt
                  ? "Alteração nos Custos de Pessoal"
                  : "Payroll (Wage Bill) Change"}
              </label>
              <span className="value-highlight">
                {(inputs.payrollAdj >= 0 ? "+" : "") + inputs.payrollAdj}%
              </span>
            </div>
            <span className="control-help">
              {isPt
                ? "Despesas com pessoal. Uma alteração de 10% representa cerca de €8.8M."
                : "Personnel expenses. A 10% change represents a €8.8M shift."}
            </span>
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
              }}
            />
            <div className="slider-bounds">
              <span>-30%</span>
              <span>+30%</span>
            </div>
          </div>

          <div className="control-group">
            <div className="control-label-row">
              <label htmlFor="capexSlider">
                {isPt
                  ? "Alteração nos Custos Operacionais"
                  : "Ordinary Overhead Change"}
              </label>
              <span className="value-highlight">
                {(inputs.capexAdj >= 0 ? "+" : "") + inputs.capexAdj}%
              </span>
            </div>
            <span className="control-help">
              {isPt
                ? "Fornecimentos externos, segurança, jogos e viagens."
                : "External supplies, security, matches and travel."}
            </span>
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
              }}
            />
            <div className="slider-bounds">
              <span>-30%</span>
              <span>+30%</span>
            </div>
          </div>
        </div>

        <div className="control-section">
          <h4 className="control-section-title">
            {isPt ? "Plantel & Transferências" : "Squad & Transfers"}
          </h4>

          <div className="control-group">
            <div className="control-label-row">
              <label htmlFor="salesSlider">
                {isPt
                  ? "Objetivos de Venda de Jogadores"
                  : "Player Sales Targets"}
              </label>
              <span className="value-highlight">€{inputs.salesTarget}M</span>
            </div>
            <span className="control-help">
              {isPt
                ? "A venda de jogadores gera mais-valias diretas."
                : "Selling players generates direct capital gains."}
            </span>
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
              }}
            />
            <div className="slider-bounds">
              <span>€0M</span>
              <span>€150M</span>
            </div>
          </div>

          <div className="control-group">
            <div className="control-label-row">
              <label htmlFor="purchasesSlider">
                {isPt
                  ? "Aquisição de Jogadores (Reinvestimento)"
                  : "Player Purchases (Reinvestment)"}
              </label>
              <span className="value-highlight">
                €{inputs.purchasesTarget}M
              </span>
            </div>
            <span className="control-help">
              {isPt
                ? "Reforços. O custo é amortizado ao longo de contratos de 5 anos."
                : "Squad additions. Outflow is spread over 5-year contracts."}
            </span>
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
              }}
            />
            <div className="slider-bounds">
              <span>€0M</span>
              <span>€100M</span>
            </div>
          </div>
        </div>

        <div className="control-section">
          <h4 className="control-section-title">{isPt ? "Dívida" : "Debt"}</h4>

          <div className="control-group">
            <div className="control-label-row">
              <label htmlFor="debtRepaySlider">
                {isPt
                  ? "Amortização de Dívida"
                  : "Debt Deleveraging (Repayment)"}
              </label>
              <span className="value-highlight">
                €{inputs.debtRepayTarget}M
              </span>
            </div>
            <span className="control-help">
              {isPt
                ? "Pagar dívida bancária poupa 2% em juros líquidos."
                : "Paying down bank debt principal saves 2% net interest."}
            </span>
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
              }}
            />
            <div className="slider-bounds">
              <span>€0M</span>
              <span>€50M</span>
            </div>
          </div>
        </div>

        <button
          className="btn-reset-playground"
          onClick={() => {
            setInputs(DEFAULT_INPUTS);
            useAppState.getState().setUrlPlayground(DEFAULT_INPUTS);
            syncStateToUrl();
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="feather feather-rotate-ccw"
          >
            <polyline points="1 4 1 10 7 10"></polyline>
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
          </svg>
          <span>{isPt ? "Reiniciar Simulação" : "Reset Simulation"}</span>
        </button>

        <button
          className="btn-pin-playground"
          type="button"
          aria-pressed={!!pinned}
          onClick={() => {
            useAppState
              .getState()
              .setPinnedPlaygroundInputs(pinned ? null : inputs);
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="feather feather-pin"
          >
            <line x1="12" y1="17" x2="12" y2="22"></line>
            <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a1 1 0 0 0 0-2H8a1 1 0 0 0 0 2h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path>
          </svg>
          <span>
            {pinned
              ? isPt
                ? "Remover Fixação"
                : "Unpin Scenario"
              : isPt
                ? "Fixar Este Cenário"
                : "Pin This Scenario"}
          </span>
        </button>

        {pinned && (
          <div className="pg-pin-readout" style={{ display: "flex" }}>
            {isPt
              ? `Fixado: Resultado Líq. ${fmtMillions(pinned.netResult)} · Capital Próprio ${fmtMillions(pinned.equity)}`
              : `Pinned: Net Result ${fmtMillions(pinned.netResult)} · Equity ${fmtMillions(pinned.equity)}`}
          </div>
        )}
      </div>

      <div className="playground-results">
        <div className="kpis">
          <KpiCard
            label={isPt ? "Receita Projetada" : "Projected Revenue"}
            projVal={proj.revenue / 1000}
            baseVal={baseline.revenue / 1000}
            isPt={isPt}
          />
          <KpiCard
            label={isPt ? "Resultado Líq. Projetado" : "Projected Net Result"}
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

        <div
          className={`pg-verdict ${verdict.warn ? "warn" : ""}`}
          style={{ display: "block" }}
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

        <div className="playground-charts-container">
          <div className="card">
            <div className="card-head">
              <h3>
                {isPt
                  ? "Resultados Simulados vs Linha de Base"
                  : "Simulated Financials vs. Baseline"}
              </h3>
              <span className="tag">
                {isPt ? "Comparação" : "Scenario compare"}
              </span>
            </div>
            <p className="desc">
              {isPt
                ? "A linha de base assume que 2024/25 se repete; rótulos mostram como a projeção difere."
                : "Baseline assumes 2024/25 repeats exactly; labels above each bar show how your projection differs from it."}
            </p>
            <div className="chart-box tall">
              {charts && (
                <AppChart
                  id="chartPlaygroundNet"
                  type="bar"
                  data={charts.netData}
                  options={charts.netOptions as any}
                  plugins={charts.netPlugins}
                  ariaLabel={
                    t("pg-chart-net") || "Playground Net Results Chart"
                  }
                />
              )}
            </div>
          </div>
          <div className="card">
            <div className="card-head">
              <h3>
                {isPt
                  ? "Solvabilidade e Capital Próprio"
                  : "Equity & Solvency Health"}
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
