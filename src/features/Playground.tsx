import React, { useState, useEffect } from "react";
import { createRoot, Root } from "react-dom/client";
import { useAppState, state } from "../core/state.ts";
import {
  styledLineDataset,
  getBrandColors,
  fmtMillions,
} from "../charts/chartUtils.ts";
import { AppChart } from "../components/AppChart.js";
import { syncStateToUrl } from "../utils/urlSync.ts";
import { useTranslation } from "../hooks/useTranslation.js";
import { HEALTH_THRESHOLDS } from "./healthThresholds.ts";

const FALLBACK = getBrandColors(false);

const DEFAULT_INPUTS = {
  uclPrize: 47,
  payrollAdj: 0,
  salesTarget: 117,
  purchasesTarget: 30,
  capexAdj: 0,
  debtRepayTarget: 0,
  revGrowthAdj: 0,
};

const PRESETS: Record<string, typeof DEFAULT_INPUTS> = {
  conservative: {
    uclPrize: 36,
    payrollAdj: 5,
    salesTarget: 80,
    purchasesTarget: 20,
    capexAdj: 5,
    debtRepayTarget: 0,
    revGrowthAdj: -3,
  },
  base: DEFAULT_INPUTS,
  optimistic: {
    uclPrize: 60,
    payrollAdj: 10,
    salesTarget: 140,
    purchasesTarget: 60,
    capexAdj: 0,
    debtRepayTarget: 20,
    revGrowthAdj: 8,
  },
};

const UCL_BONUS_COST_RATE = 0.15;

function getBaseline() {
  const season = state.annual?.find((s: { label: string }) => s.label === "2024/25");
  if (!season) return null;
  return {
    revenue_operating: season.revenue_operating,
    personnel_costs: season.personnel_costs,
    external_supplies: season.external_supplies,
    da_excl_squad: season.da_excl_squad,
    squad_amortization: season.squad_amortization_impairment,
    player_transfer_cost: season.player_transfer_cost,
    player_transfer_income: season.player_transfer_income,
    financial_result: season.financial_result,
    net_result: season.net_result,
    equity: season.equity,
    current_assets: season.current_assets,
    current_liabilities: season.current_liabilities,
    total_assets: season.total_assets,
    cash: season.cash,
  };
}

function computeProjection(
  BASELINE: { revenue_operating: number; personnel_costs: number; net_result: number; equity: number; cash: number },
  {
    uclPrize,
    payrollAdj,
    salesTarget,
    purchasesTarget,
    capexAdj,
    debtRepayTarget,
    revGrowthAdj,
  }: typeof DEFAULT_INPUTS,
) {
  const revenue =
    BASELINE.revenue_operating * (1 + (revGrowthAdj || 0) / 100) +
    uclPrize * 1000 +
    (uclPrize > 0 ? 8000 : 0);
  const uclBonusCost = uclPrize > 0 ? uclPrize * 1000 * UCL_BONUS_COST_RATE : 0;
  const payroll =
    BASELINE.personnel_costs * (1 + payrollAdj / 100) - uclBonusCost;
  const overhead = BASELINE.external_supplies * (1 + capexAdj / 100);

  const sales =
    salesTarget === DEFAULT_INPUTS.salesTarget
      ? BASELINE.player_transfer_income
      : salesTarget * 1000;
  const amortization =
    BASELINE.squad_amortization -
    (purchasesTarget - DEFAULT_INPUTS.purchasesTarget) * 1000 * 0.2;
  const netTrading = sales + amortization + BASELINE.player_transfer_cost;

  const interestSavings = debtRepayTarget * 1000 * 0.02;
  const financialResult = BASELINE.financial_result + interestSavings;

  const modeledBaselineNet =
    BASELINE.revenue_operating +
    BASELINE.personnel_costs +
    BASELINE.external_supplies +
    BASELINE.da_excl_squad +
    (BASELINE.player_transfer_income +
      BASELINE.squad_amortization +
      BASELINE.player_transfer_cost) +
    BASELINE.financial_result;
  const unmodeledCostsAdjustment = BASELINE.net_result - modeledBaselineNet;

  const netResult =
    revenue +
    payroll +
    overhead +
    BASELINE.da_excl_squad +
    netTrading +
    financialResult +
    unmodeledCostsAdjustment;

  const equity = BASELINE.equity + netResult;

  const totalAssets =
    BASELINE.total_assets +
    (netResult - BASELINE.net_result) -
    debtRepayTarget * 1000;
  const solvency = (equity / totalAssets) * 100;

  const amortizationDelta = BASELINE.squad_amortization - amortization;
  const cash =
    BASELINE.cash +
    (netResult - BASELINE.net_result) +
    amortizationDelta -
    debtRepayTarget * 1000 -
    (purchasesTarget - DEFAULT_INPUTS.purchasesTarget) * 1000;

  return {
    revenue,
    payroll,
    overhead,
    sales,
    amortization,
    netTrading,
    financialResult,
    netResult,
    equity,
    totalAssets,
    solvency,
    cash,
  };
}

function equityZoneInfo(equity: number, isPt: boolean) {
  const { strong, positive } = HEALTH_THRESHOLDS.equity;
  if (equity > strong) {
    return {
      cls: "g",
      text: isPt
        ? "Capital próprio positivo e sólido"
        : "Solid positive equity",
    };
  }
  if (equity > positive) {
    return {
      cls: "a",
      text: isPt
        ? "Positivo, mas com margem reduzida"
        : "Positive, but a thin buffer",
    };
  }
  return {
    cls: "r",
    text: isPt ? "Insolvência técnica" : "Technically insolvent",
  };
}

function cashZoneInfo(cash: number, isPt: boolean) {
  const { warn, danger } = HEALTH_THRESHOLDS.cash;
  if (cash > warn) {
    return {
      cls: "g",
      text: isPt ? "Margem confortável" : "Comfortable buffer",
    };
  }
  if (cash > danger) {
    return {
      cls: "a",
      text: isPt ? "Reduzido — risco mensal" : "Thin — one bad month matters",
    };
  }
  return {
    cls: "r",
    text: isPt ? "Criticamente baixo" : "Critically low",
  };
}

function buildVerdict(baseline: { revenue_operating: number; personnel_costs: number; net_result: number; equity: number; cash: number }, proj: { revenue_operating: number; personnel_costs: number; net_result: number; equity: number; cash: number }, isPt: boolean) {
  const netDiff = proj.netResult - baseline.netResult;
  const eqDiff = proj.equity - baseline.equity;
  const cashNegative = proj.cash < 0;
  const flat = Math.abs(netDiff) < 50;

  const parts = [];
  if (isPt) {
    parts.push(
      flat
        ? "Este cenário mantém o resultado líquido em linha com a linha de base."
        : `Este cenário ${netDiff > 0 ? "melhora" : "reduz"} o resultado líquido em ${fmtMillions(Math.abs(netDiff))} e o capital próprio em ${fmtMillions(Math.abs(eqDiff))} face à linha de base.`,
    );
    if (cashNegative) {
      parts.push(
        `Atenção: o caixa projetado é negativo (${fmtMillions(proj.cash)}) — este cenário não é autossustentável sem financiamento externo adicional.`,
      );
    }
  } else {
    parts.push(
      flat
        ? "This scenario keeps net result in line with the baseline."
        : `This scenario ${netDiff > 0 ? "improves" : "reduces"} net result by ${fmtMillions(Math.abs(netDiff))} and equity by ${fmtMillions(Math.abs(eqDiff))} vs. the baseline.`,
    );
    if (cashNegative) {
      parts.push(
        `Warning: projected cash is negative (${fmtMillions(proj.cash)}) — this scenario isn't self-funding without additional external financing.`,
      );
    }
  }
  return { text: parts.join(" "), warn: cashNegative };
}

function scenarioLabels(isPt: boolean) {
  return {
    baseline: isPt
      ? "Linha de Base 2025/26 (sem alterações)"
      : "Baseline 2025/26 (no changes)",
    projected: isPt ? "A Sua Projeção 2025/26" : "Your Projection 2025/26",
    pinned: isPt ? "Cenário Fixado" : "Pinned Scenario",
  };
}

function usePlaygroundCharts(
  baseline: { revenue_operating: number; personnel_costs: number; net_result: number; equity: number; cash: number },
  proj: { revenue_operating: number; personnel_costs: number; net_result: number; equity: number; cash: number },
  pinned: { netResult: number; equity: number } | null,
  isPt: boolean,
) {
  return React.useMemo(() => {
    if (!baseline || !proj) return null;
    const {
      baseline: baselineLabel,
      projected: projectedLabel,
      pinned: pinnedLabel,
    } = scenarioLabels(isPt);

    const labels = [
      isPt ? "Receita" : "Revenue",
      isPt ? "Pessoal" : "Payroll",
      isPt ? "Custos Op." : "Overhead",
      isPt ? "Result. Financeiro" : "Financial Result",
      isPt ? "Trading" : "Trading Net",
      isPt ? "Resultado Líq." : "Net Result",
    ];

    const netData = {
      labels,
      datasets: [
        {
          label: baselineLabel,
          data: [
            baseline.revenue / 1000,
            baseline.payroll / 1000,
            baseline.overhead / 1000,
            baseline.financialResult / 1000,
            baseline.netTrading / 1000,
            baseline.netResult / 1000,
          ],
          backgroundColor: state.COLORS.mutedSoft || FALLBACK.mutedSoft,
          borderColor: state.COLORS.muted || FALLBACK.muted,
          borderWidth: 1,
        },
        {
          label: projectedLabel,
          data: [
            proj.revenue / 1000,
            proj.payroll / 1000,
            proj.overhead / 1000,
            proj.financialResult / 1000,
            proj.netTrading / 1000,
            proj.netResult / 1000,
          ],
          backgroundColor: state.COLORS.greenSoft || FALLBACK.greenSoft,
          borderColor: state.COLORS.green || FALLBACK.green,
          borderWidth: 1,
        },
        ...(pinned
          ? [
              {
                label: pinnedLabel,
                data: [
                  pinned.revenue / 1000,
                  pinned.payroll / 1000,
                  pinned.overhead / 1000,
                  pinned.financialResult / 1000,
                  pinned.netTrading / 1000,
                  pinned.netResult / 1000,
                ],
                backgroundColor: state.COLORS.goldSoft || FALLBACK.goldSoft,
                borderColor: state.COLORS.gold || FALLBACK.gold,
                borderWidth: 1,
              },
            ]
          : []),
      ],
    };

    const netOptions = {
      ...state.baseOpts,
      scales: {
        x: { ...state.baseOpts.scales?.x },
        y: {
          ...state.baseOpts.scales?.y,
          ticks: {
            ...state.baseOpts.scales?.y?.ticks,
            callback: (v: number | string) => v.toFixed(0) + "M€",
          },
          beginAtZero: false,
          title: {
            display: true,
            text: "M€",
            color: state.COLORS.muted || FALLBACK.muted,
          },
        },
      },
      plugins: {
        ...state.baseOpts.plugins,
        tooltip: {
          ...state.baseOpts.plugins?.tooltip,
          callbacks: {
            ...state.baseOpts.plugins?.tooltip?.callbacks,
            label: (context: { dataset: { label: string }; parsed: { y: number } }) => {
              const val = context.parsed.y;
              if (context.datasetIndex === 0) {
                return `${context.dataset.label}: ${val.toFixed(1)} M€`;
              } else {
                const baselineVal =
                  context.chart.data.datasets[0].data[context.dataIndex];
                const delta = val - baselineVal;
                const sign = delta >= 0 ? "+" : "";
                const deltaStr =
                  Math.abs(delta) < 0.05
                    ? " (no change)"
                    : ` (${sign}${delta.toFixed(1)} M€)`;
                return `${context.dataset.label}: ${val.toFixed(1)} M€${deltaStr}`;
              }
            },
          },
        },
      },
    };

    const netPlugins = [
      {
        id: "barDelta",
        afterDatasetsDraw(chart: { getDatasetMeta: (index: number) => { data: Array<{ x: number; y: number; width: number; height: number }> } }) {
          const { ctx, data } = chart;
          ctx.save();
          ctx.font = "bold 9px sans-serif";
          ctx.textAlign = "center";

          const baselineDS = data.datasets[0].data;
          const projDS = data.datasets[1].data;

          chart.getDatasetMeta(1).data.forEach((bar: { x: number; y: number; width: number; height: number }, index: number) => {
            const baselineVal = baselineDS[index];
            const projVal = projDS[index];
            const delta = projVal - baselineVal;
            if (Math.abs(delta) < 0.05) return;

            const sign = delta > 0 ? "+" : "";
            const color =
              delta > 0
                ? state.COLORS.pos || FALLBACK.pos
                : state.COLORS.neg || FALLBACK.neg;
            ctx.fillStyle = color;

            const yPos = bar.y + (projVal >= 0 ? -8 : 12);
            ctx.fillText(`${sign}${delta.toFixed(1)}M`, bar.x, yPos);
          });
          ctx.restore();
        },
      },
    ];

    const chart2Labels = pinned
      ? [baselineLabel, projectedLabel, pinnedLabel]
      : [baselineLabel, projectedLabel];
    const equityData = pinned
      ? [baseline.equity / 1000, proj.equity / 1000, pinned.equity / 1000]
      : [baseline.equity / 1000, proj.equity / 1000];
    const solvencyDataValues = pinned
      ? [baseline.solvency, proj.solvency, pinned.solvency]
      : [baseline.solvency, proj.solvency];

    const solvencyData = {
      labels: chart2Labels,
      datasets: [
        {
          label: isPt ? "Capital Próprio (M€)" : "Shareholders' Equity (M€)",
          data: equityData,
          backgroundColor: state.COLORS.goldSoft || FALLBACK.goldSoft,
          borderColor: state.COLORS.gold || FALLBACK.gold,
          borderWidth: 1.5,
          yAxisID: "y",
          borderRadius: 4,
          order: 1,
        },
        styledLineDataset({
          label: isPt ? "Rácio de Solvabilidade (%)" : "Solvency Ratio (%)",
          data: solvencyDataValues,
          color: state.COLORS.green || FALLBACK.green,
          bg: state.COLORS.greenSoft || FALLBACK.greenSoft,
          pointBorderColor: state.COLORS.green || FALLBACK.green,
          extra: {
            type: "line",
            yAxisID: "y1",
            order: 0,
          },
        }),
      ],
    };

    const solvencyOptions = {
      ...state.baseOpts,
      scales: {
        x: { ...state.baseOpts.scales?.x },
        y: {
          type: "linear",
          position: "left",
          title: {
            display: true,
            text: isPt ? "Capital Próprio (M€)" : "Shareholders' Equity (M€)",
            color: state.COLORS.muted || FALLBACK.muted,
          },
          ticks: {
            ...state.baseOpts.scales?.y?.ticks,
            callback: (v: number | string) => v.toFixed(0),
          },
          grid: { ...state.baseOpts.scales?.y?.grid },
        },
        y1: {
          type: "linear",
          position: "right",
          title: {
            display: true,
            text: isPt ? "Rácio de Solvabilidade (%)" : "Solvency Ratio (%)",
            color: state.COLORS.muted || FALLBACK.muted,
          },
          min: 0,
          max: Math.max(
            30,
            baseline.solvency + 5,
            proj.solvency + 5,
            pinned ? pinned.solvency + 5 : 0,
          ),
          ticks: {
            ...state.baseOpts.scales?.y?.ticks,
            callback: (v: number | string) => v.toFixed(0) + "%",
          },
          grid: { drawOnChartArea: false },
        },
      },
      plugins: {
        ...state.baseOpts.plugins,
        tooltip: {
          ...state.baseOpts.plugins?.tooltip,
          callbacks: {
            ...state.baseOpts.plugins?.tooltip?.callbacks,
            label: (context: { dataset: { label: string }; parsed: { y: number } }) => {
              const val = context.parsed.y;
              const suffix = context.datasetIndex === 0 ? " M€" : "%";
              return `${context.dataset.label}: ${val.toFixed(1)}${suffix}`;
            },
          },
        },
      },
    };

    return { netData, netOptions, netPlugins, solvencyData, solvencyOptions };
  }, [baseline, proj, pinned, isPt]);
}

function KpiCard({
  label,
  projVal,
  baseVal,
  isPt,
  zone,
}: {
  label: string;
  projVal: number;
  baseVal: number;
  isPt: boolean;
  zone?: { cls: string; text: string };
}) {
  const diffVal = projVal - baseVal;
  const isPos = diffVal > 0;
  const cardClass = `kpi ${Math.abs(diffVal) < 0.01 ? "" : isPos ? "pos" : "neg"}`;
  const diffClass = `change ${Math.abs(diffVal) < 0.01 ? "" : isPos ? "pos" : "neg"}`;
  const sign = isPos ? "+" : "";
  const diffText =
    Math.abs(diffVal) < 0.01
      ? isPt
        ? "sem alteração"
        : "no change"
      : `${sign}${diffVal.toFixed(1)}M ${isPt ? "vs linha de base" : "vs baseline"}`;

  return (
    <div className={cardClass}>
      <div className="label">{label}</div>
      <div className="value">€{projVal.toFixed(1)}M</div>
      <div className={diffClass}>{diffText}</div>
      {zone && (
        <div className="pg-zone">
          <span className={`zone-dot ${zone.cls}`}></span> {zone.text}
        </div>
      )}
    </div>
  );
}

function getSliderBackground(val: number, min: number, max: number) {
  const percentage = ((val - min) / (max - min)) * 100;
  return `linear-gradient(to right, var(--green, #0a5d3a) ${percentage}%, var(--rule-2, #e5e5e5) ${percentage}%)`;
}

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
