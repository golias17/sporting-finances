import React, { useMemo, useState, useRef } from "react";
import { useAppState } from "../core/state.js";
import { useTranslation } from "../hooks/useTranslation.js";
import { calculateUefaRadar, RadarPillar } from "./uefaRadarCalculations.js";
import { AppChart } from "../components/AppChart.js";
import { ChartDownloadButton } from "../components/ChartDownloadButton.js";
import { getBrandColors } from "../charts/chartPalette.js";

export function UefaRadar() {
  const { t } = useTranslation();
  const isPt = useAppState((s) => s.isPt);
  const annual = useAppState((s) => s.annual);
  const healthBarIdx = useAppState((s) => s.healthBarIdx);
  const setHealthBarIdx = useAppState((s) => s.setHealthBarIdx);
  const theme = useAppState((s) => s.theme);
  const isDark = theme === "dark";
  const brand = useMemo(() => getBrandColors(isDark), [isDark]);
  const chartRef = useRef<any>(null);

  const selectedIdx =
    healthBarIdx ?? (annual.length > 0 ? annual.length - 1 : 0);

  const handleSeasonSelect = (idx: number) => {
    setHealthBarIdx(idx);
    import("../utils/urlSync.ts").then((m) => m.syncStateToUrl());
  };

  const [compareBaselineIdx, setCompareBaselineIdx] = useState<number | null>(
    () => {
      const crisisIdx = annual.findIndex(
        (d) => d.label === "2012/13" || d.label === "2013/14",
      );
      return crisisIdx !== -1 ? crisisIdx : null;
    },
  );

  const currentRecord = annual[selectedIdx] || annual[annual.length - 1];
  const compareRecord =
    compareBaselineIdx !== null ? annual[compareBaselineIdx] : null;

  const currentAnalysis = useMemo(
    () => calculateUefaRadar(currentRecord, isPt),
    [currentRecord, isPt],
  );

  const compareAnalysis = useMemo(
    () => (compareRecord ? calculateUefaRadar(compareRecord, isPt) : null),
    [compareRecord, isPt],
  );

  const radarLabels = useMemo(() => {
    return currentAnalysis.pillars.map((p) => (isPt ? p.namePt : p.name));
  }, [currentAnalysis.pillars, isPt]);

  const chartData = useMemo(() => {
    const datasets: any[] = [
      {
        label: `Sporting CP (${currentAnalysis.seasonLabel})`,
        data: currentAnalysis.pillars.map((p) => p.score),
        backgroundColor: isDark
          ? "rgba(0, 184, 101, 0.32)"
          : "rgba(10, 93, 58, 0.22)",
        borderColor: brand.pos,
        borderWidth: 2.5,
        pointBackgroundColor: brand.pos,
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: brand.pos,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: isPt
          ? "Referencial de Conformidade UEFA FSR"
          : "UEFA FSR Compliance Benchmark",
        data: currentAnalysis.benchmarkScores,
        backgroundColor: "rgba(176, 137, 35, 0.08)",
        borderColor: brand.gold,
        borderWidth: 1.8,
        borderDash: [5, 5],
        pointBackgroundColor: brand.gold,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
    ];

    if (compareAnalysis) {
      datasets.push({
        label: isPt
          ? `Comparativo (${compareAnalysis.seasonLabel})`
          : `Benchmark Era (${compareAnalysis.seasonLabel})`,
        data: compareAnalysis.pillars.map((p) => p.score),
        backgroundColor: "rgba(220, 53, 69, 0.15)",
        borderColor: brand.neg,
        borderWidth: 1.5,
        borderDash: [3, 3],
        pointBackgroundColor: brand.neg,
        pointRadius: 3,
        pointHoverRadius: 4,
      });
    }

    return {
      labels: radarLabels,
      datasets,
    };
  }, [currentAnalysis, compareAnalysis, radarLabels, brand, isDark, isPt]);

  const chartOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          angleLines: {
            color: isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)",
          },
          grid: {
            color: isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)",
          },
          pointLabels: {
            font: {
              family: "Inter, system-ui, sans-serif",
              size: 11,
              weight: "600",
            },
            color: isDark ? "#e2e8f0" : "#1e293b",
          },
          ticks: {
            display: false,
            stepSize: 20,
            min: 0,
            max: 100,
          },
          suggestedMin: 0,
          suggestedMax: 100,
        },
      },
      plugins: {
        legend: {
          display: true,
          position: "bottom" as const,
          labels: {
            boxWidth: 12,
            font: { size: 11, family: "Inter, sans-serif" },
            color: isDark ? "#cbd5e1" : "#475569",
            padding: 16,
          },
        },
        tooltip: {
          callbacks: {
            label: (ctx: any) => {
              const pIdx = ctx.dataIndex;
              const pillar = currentAnalysis.pillars[pIdx];
              if (ctx.datasetIndex === 0 && pillar) {
                return ` ${ctx.dataset.label}: ${pillar.score} pts (${pillar.actualValueStr})`;
              }
              return ` ${ctx.dataset.label}: ${ctx.parsed.r} pts`;
            },
          },
        },
      },
    };
  }, [isDark, currentAnalysis.pillars]);

  return (
    <div className="card uefa-radar-card">
      <div className="card-head">
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "1.2rem" }}>🛡️</span>
          <h3>
            {isPt
              ? "Radar de Sustentabilidade Financeira & Conformidade UEFA FSR"
              : "Financial Sustainability Radar & UEFA FSR Compliance"}
          </h3>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span className="tag">
            {isPt ? "Supervisão Regulatória" : "Regulatory Oversight"}
          </span>
          <ChartDownloadButton
            chartRef={chartRef}
            fileName="uefa-radar-compliance"
          />
        </div>
      </div>

      <p className="desc">
        {isPt
          ? "Avaliação multi-eixo da solidez financeira do Sporting CP face ao novo regulamento de sustentabilidade financeira da UEFA (FSR) e aos rácios bancários estruturais de solvência e liquidez."
          : "Multi-axis evaluation of Sporting CP's financial resilience against UEFA's Financial Sustainability Regulations (FSR) and structural banking solvency benchmarks."}
      </p>

      {/* Synchronized Season Selectors */}
      <div className="season-selector" style={{ margin: "14px 0 12px 0" }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span
            className="season-selector-label"
            style={{
              marginRight: "4px",
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "var(--muted)",
              textTransform: "uppercase",
            }}
          >
            {isPt ? "Época em análise:" : "Active season:"}
          </span>
          {annual.map((season, idx) => (
            <button
              key={season.label}
              type="button"
              className={`season-pill ${selectedIdx === idx ? "active" : ""}`}
              aria-pressed={selectedIdx === idx}
              onClick={() => handleSeasonSelect(idx)}
            >
              {season.label}
            </button>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "6px",
            marginTop: "8px",
          }}
        >
          <span
            className="season-selector-label"
            style={{
              marginRight: "4px",
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "var(--muted)",
              textTransform: "uppercase",
            }}
          >
            {isPt ? "Comparar com era histórica:" : "Compare historical era:"}
          </span>
          <button
            type="button"
            className={`season-pill ${compareBaselineIdx === null ? "active" : ""}`}
            aria-pressed={compareBaselineIdx === null}
            onClick={() => setCompareBaselineIdx(null)}
          >
            {isPt ? "Nenhum" : "None"}
          </button>
          {annual.map((season, idx) => (
            <button
              key={`cmp-${season.label}`}
              type="button"
              className={`season-pill ${compareBaselineIdx === idx ? "active" : ""}`}
              aria-pressed={compareBaselineIdx === idx}
              onClick={() => setCompareBaselineIdx(idx)}
            >
              {season.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid: Radar Graphic + Pillars Breakdown */}
      <div className="uefa-radar-grid">
        {/* Radar Chart */}
        <div className="uefa-radar-chart-box">
          <AppChart
            id="chartUefaRadar"
            type="radar"
            chartRef={chartRef}
            data={chartData}
            options={chartOptions as any}
            valueType="points"
            ariaLabel={
              isPt
                ? "Gráfico Radar de Sustentabilidade Financeira UEFA"
                : "UEFA Financial Sustainability Radar Chart"
            }
          />
        </div>

        {/* Pillars Summary Cards */}
        <div className="uefa-pillar-list">
          <div
            className={`uefa-overall-banner uefa-status-${currentAnalysis.overallStatus}`}
          >
            <div>
              <div className="uefa-overall-title">
                {isPt
                  ? "ÍNDICE GLOBAL DE SUSTENTABILIDADE"
                  : "OVERALL SUSTAINABILITY INDEX"}
              </div>
              <div className="uefa-overall-score">
                {currentAnalysis.overallScore} / 100
              </div>
            </div>
            <span
              className={`uefa-pillar-badge status-${currentAnalysis.overallStatus}`}
              style={{ fontSize: "0.8rem", padding: "4px 10px" }}
            >
              {currentAnalysis.overallStatus === "green"
                ? isPt
                  ? "✅ Sólido & Conforme"
                  : "✅ Robust & Compliant"
                : currentAnalysis.overallStatus === "amber"
                  ? isPt
                    ? "⚠️ Sob Vigilância"
                    : "⚠️ Under Monitoring"
                  : isPt
                    ? "❌ Risco Estrutural"
                    : "❌ Structural Risk"}
            </span>
          </div>

          {currentAnalysis.pillars.map((pillar: RadarPillar) => (
            <div key={pillar.id} className="uefa-pillar-item">
              <div className="uefa-pillar-header">
                <div className="uefa-pillar-name">
                  {isPt ? pillar.namePt : pillar.name}
                </div>
                <div className="uefa-pillar-values">
                  <span className="uefa-pillar-actual">
                    {pillar.actualValueStr}
                  </span>
                  <span className={`uefa-pillar-badge status-${pillar.status}`}>
                    {isPt ? pillar.targetStrPt : pillar.targetStr}
                  </span>
                </div>
              </div>
              <div className="uefa-pillar-desc">
                {isPt ? pillar.analysisPt : pillar.analysis}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
