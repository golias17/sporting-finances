import React from "react";
import { useTranslation } from "../../hooks/useTranslation.js";
import { useAppState } from "../../core/state.js";
import { ChartCard } from "../../components/ChartCard.js";
import {
  CompetitiveTimeWindow,
  useCompetitiveCharts,
} from "./useCompetitiveCharts.js";
import { FinancialEfficiencyModule } from "../efficiency/FinancialEfficiencyModule.js";

export const CompetitiveTab = React.memo(function CompetitiveTab() {
  const { T } = useTranslation();
  const isPt = useAppState((s) => s.isPt);
  const [timeWindow, setTimeWindow] =
    React.useState<CompetitiveTimeWindow>("all");

  const {
    labels,
    revenueBySource,
    revenueBySourceOptions,
    personnelCostsRatio,
    personnelComparison,
    transferBalance,
    transferDebtComparison,
    squadCostRatioComparison,
    agentCommissionsComparison,
    squadValueComparison,
    netResultComparison,
    equityComparison,
    totalLiabilitiesComparison,
    chartOptions,
    percentageOptions,
    competitorColors,
    cumulativeNetResults,
    benchmarkMetrics,
  } = useCompetitiveCharts(timeWindow);

  const periodTag =
    timeWindow === "all"
      ? "2010/11 → 2024/25"
      : timeWindow === "last5"
        ? isPt
          ? "Ciclo 2020-2025 (5 Épocas)"
          : "2020-2025 Cycle (5 Seasons)"
        : isPt
          ? "Últimas 3 Épocas"
          : "Last 3 Seasons";

  const periodLabel =
    timeWindow === "all"
      ? isPt
        ? "15 Anos"
        : "15-Yr"
      : timeWindow === "last5"
        ? isPt
          ? "5 Anos"
          : "5-Yr"
        : isPt
          ? "3 Anos"
          : "3-Yr";

  const sportingHeroTag =
    benchmarkMetrics.sporting.net > benchmarkMetrics.benfica.net &&
    benchmarkMetrics.sporting.net > benchmarkMetrics.porto.net
      ? isPt
        ? "Maior Lucro do Ciclo"
        : "Top Cycle Profit"
      : isPt
        ? "Menor Dívida"
        : "Lowest Net Debt";

  const benficaHeroTag = isPt ? "Maior Volume" : "Top Revenue";

  const portoHeroTag =
    benchmarkMetrics.porto.eq < 0
      ? isPt
        ? "Passivo Descoberto"
        : "Negative Equity"
      : isPt
        ? "Alta Alavancagem"
        : "High Leverage";

  return (
    <>
      <div className="chapter">
        <T as="div" className="num" i18nKey="ch08-num" />
        <div>
          <T as="h2" i18nKey="ch08-h2" />
          <T as="p" className="lede" i18nKey="ch08-lede" />
        </div>
      </div>

      {/* Data Source, Legend & Time Horizon Filter Banner */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div className="card-head">
          <T as="h3" i18nKey="ch08-data-source" />
          <span className="tag">{periodTag}</span>
        </div>
        <T as="p" className="desc" i18nKey="ch08-data-source-desc" />

        {/* Time Horizon Preset Buttons */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            marginTop: "1.25rem",
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: "var(--fs-sm)",
              fontWeight: 600,
              color: "var(--muted)",
            }}
          >
            <T as="span" i18nKey="ch08-filter-label" />
          </span>
          <div
            style={{ display: "inline-flex", gap: "0.5rem", flexWrap: "wrap" }}
          >
            <button
              type="button"
              className={`btn-preset ${timeWindow === "all" ? "active" : ""}`}
              onClick={() => setTimeWindow("all")}
            >
              <T as="span" i18nKey="ch08-filter-all" />
            </button>
            <button
              type="button"
              className={`btn-preset ${timeWindow === "last5" ? "active" : ""}`}
              onClick={() => setTimeWindow("last5")}
            >
              <T as="span" i18nKey="ch08-filter-last5" />
            </button>
            <button
              type="button"
              className={`btn-preset ${timeWindow === "last3" ? "active" : ""}`}
              onClick={() => setTimeWindow("last3")}
            >
              <T as="span" i18nKey="ch08-filter-last3" />
            </button>
          </div>
        </div>

        {/* Club Color Legend */}
        <div
          style={{
            display: "flex",
            gap: "1.5rem",
            marginTop: "1rem",
            flexWrap: "wrap",
            paddingTop: "0.75rem",
            borderTop: "1px dashed var(--rule-2)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div
              style={{
                width: "14px",
                height: "14px",
                borderRadius: "50%",
                background: competitorColors.sporting,
              }}
            ></div>
            <T as="span" i18nKey="ch08-sporting" />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div
              style={{
                width: "14px",
                height: "14px",
                borderRadius: "50%",
                background: competitorColors.benfica,
              }}
            ></div>
            <T as="span" i18nKey="ch08-benfica" />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div
              style={{
                width: "14px",
                height: "14px",
                borderRadius: "50%",
                background: competitorColors.porto,
              }}
            ></div>
            <T as="span" i18nKey="ch08-porto" />
          </div>
        </div>
      </div>

      {/* Row 1: Revenue by Source (full width) */}
      <ChartCard
        id="competitiveRevenueSource"
        title={<T as="h3" i18nKey="ch08-revenue-source-h3" />}
        tag={<span className="tag">{periodTag}</span>}
        desc={<T as="p" className="desc" i18nKey="ch08-revenue-source-desc" />}
        chartType="bar"
        data={revenueBySource}
        options={revenueBySourceOptions}
        chartClassName="tall"
        valueType="currency-thousands"
      />

      {/* Row 2: Personnel Costs Ratio & Absolute */}
      <div className="grid-2">
        <ChartCard
          id="competitivePersonnelRatio"
          title={<T as="h3" i18nKey="ch08-personnel-ratio-h3" />}
          tag={<span className="tag">{periodTag}</span>}
          desc={
            <T as="p" className="desc" i18nKey="ch08-personnel-ratio-desc" />
          }
          chartType="line"
          data={personnelCostsRatio}
          options={percentageOptions}
          chartClassName="tall"
          valueType="percentage"
        />

        <ChartCard
          id="competitivePersonnel"
          title={<T as="h3" i18nKey="ch08-personnel-h3" />}
          tag={<span className="tag">{periodTag}</span>}
          desc={<T as="p" className="desc" i18nKey="ch08-personnel-desc" />}
          chartType="line"
          data={personnelComparison}
          options={chartOptions}
          chartClassName="tall"
          valueType="currency-thousands"
        />
      </div>

      {/* Row 3: Squad Value & Transfer Balance */}
      <div className="grid-2">
        <ChartCard
          id="competitiveSquad"
          title={<T as="h3" i18nKey="ch08-squad-h3" />}
          tag={<span className="tag">{periodTag}</span>}
          desc={<T as="p" className="desc" i18nKey="ch08-squad-desc" />}
          chartType="line"
          data={squadValueComparison}
          options={chartOptions}
          chartClassName="tall"
          valueType="currency-thousands"
        />

        <ChartCard
          id="competitiveTransferBalance"
          title={<T as="h3" i18nKey="ch08-transfers-h3" />}
          tag={<span className="tag">{periodTag}</span>}
          desc={<T as="p" className="desc" i18nKey="ch08-transfers-desc" />}
          chartType="bar"
          data={transferBalance}
          options={chartOptions}
          chartClassName="tall"
          valueType="currency-thousands"
        />
      </div>

      {/* Row 4: Net Transfer Debt & UEFA Squad Cost Ratio */}
      <div className="grid-2">
        <ChartCard
          id="competitiveTransferDebt"
          title={<T as="h3" i18nKey="ch08-transfer-debt-h3" />}
          tag={<span className="tag">{periodTag}</span>}
          desc={<T as="p" className="desc" i18nKey="ch08-transfer-debt-desc" />}
          chartType="line"
          data={transferDebtComparison}
          options={chartOptions}
          chartClassName="tall"
          valueType="currency-thousands"
        />

        <ChartCard
          id="competitiveSquadCostRatio"
          title={<T as="h3" i18nKey="ch08-squad-cost-ratio-h3" />}
          tag={<span className="tag">{periodTag}</span>}
          desc={
            <T as="p" className="desc" i18nKey="ch08-squad-cost-ratio-desc" />
          }
          chartType="line"
          data={squadCostRatioComparison}
          options={percentageOptions}
          chartClassName="tall"
          valueType="percentage"
        />
      </div>

      {/* Row 5: Agent Commissions & Net Result */}
      <div className="grid-2">
        <ChartCard
          id="competitiveAgentCommissions"
          title={<T as="h3" i18nKey="ch08-agent-commissions-h3" />}
          tag={<span className="tag">{periodTag}</span>}
          desc={
            <T as="p" className="desc" i18nKey="ch08-agent-commissions-desc" />
          }
          chartType="line"
          data={agentCommissionsComparison}
          options={chartOptions}
          chartClassName="tall"
          valueType="currency-thousands"
        />

        <ChartCard
          id="competitiveNetResult"
          title={<T as="h3" i18nKey="ch08-netresult-h3" />}
          tag={<span className="tag">{periodTag}</span>}
          desc={<T as="p" className="desc" i18nKey="ch08-netresult-desc" />}
          chartType="bar"
          data={netResultComparison}
          options={chartOptions}
          chartClassName="tall"
          valueType="currency-thousands"
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "0.5rem",
              marginTop: "0.75rem",
              padding: "0.6rem 0.9rem",
              borderRadius: "var(--radius-sm)",
              background: "var(--surface-soft, rgba(255,255,255,0.03))",
              border: "1px solid var(--border)",
            }}
          >
            <span
              style={{
                fontSize: "var(--fs-xs)",
                fontWeight: 600,
                color: "var(--muted)",
              }}
            >
              {isPt
                ? `Total Acumulado (${periodLabel}):`
                : `Cumulative Total (${periodLabel}):`}
            </span>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <span
                style={{
                  fontSize: "var(--fs-2xs)",
                  fontFamily: "var(--mono)",
                  fontWeight: 700,
                  padding: "2px 7px",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--green-bg, rgba(0, 168, 90, 0.12))",
                  color: competitorColors.sporting,
                  border: `1px solid ${competitorColors.sporting}33`,
                }}
              >
                Sporting: {cumulativeNetResults.sporting >= 0 ? "+" : ""}
                {cumulativeNetResults.sporting.toFixed(1)}M€
              </span>
              <span
                style={{
                  fontSize: "var(--fs-2xs)",
                  fontFamily: "var(--mono)",
                  fontWeight: 700,
                  padding: "2px 7px",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--benfica-bg, rgba(184, 64, 58, 0.12))",
                  color: competitorColors.benfica,
                  border: `1px solid ${competitorColors.benfica}33`,
                }}
              >
                Benfica: {cumulativeNetResults.benfica >= 0 ? "+" : ""}
                {cumulativeNetResults.benfica.toFixed(1)}M€
              </span>
              <span
                style={{
                  fontSize: "var(--fs-2xs)",
                  fontFamily: "var(--mono)",
                  fontWeight: 700,
                  padding: "2px 7px",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--porto-bg, rgba(44, 91, 138, 0.12))",
                  color: competitorColors.porto,
                  border: `1px solid ${competitorColors.porto}33`,
                }}
              >
                Porto: {cumulativeNetResults.porto >= 0 ? "+" : ""}
                {cumulativeNetResults.porto.toFixed(1)}M€
              </span>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Row 6: Equity & Total Liabilities */}
      <div className="grid-2">
        <ChartCard
          id="competitiveEquity"
          title={<T as="h3" i18nKey="ch08-equity-h3" />}
          tag={<span className="tag">{periodTag}</span>}
          desc={<T as="p" className="desc" i18nKey="ch08-equity-desc" />}
          chartType="line"
          data={equityComparison}
          options={chartOptions}
          chartClassName="tall"
          valueType="currency-thousands"
        />

        <ChartCard
          id="competitiveLiabilities"
          title={<T as="h3" i18nKey="ch08-liabilities-h3" />}
          tag={<span className="tag">{periodTag}</span>}
          desc={<T as="p" className="desc" i18nKey="ch08-liabilities-desc" />}
          chartType="line"
          data={totalLiabilitiesComparison}
          options={chartOptions}
          chartClassName="tall"
          valueType="currency-thousands"
        />
      </div>

      {/* Row 7: Consolidated Benchmark Executive Section */}
      <div className="card" style={{ marginTop: "1rem" }}>
        <div className="card-head">
          <h3>
            {isPt
              ? `Benchmark Consolidado dos Três Grandes (${timeWindow === "all" ? "15 Épocas" : timeWindow === "last5" ? "5 Épocas · Ciclo Amorim" : "Últimas 3 Épocas"})`
              : `Consolidated Benchmark — Big Three (${timeWindow === "all" ? "15 Seasons" : timeWindow === "last5" ? "5 Seasons · Amorim Cycle" : "Last 3 Seasons"})`}
          </h3>
          <span className="tag">{periodTag}</span>
        </div>
        <p className="desc">
          {isPt
            ? `Comparação dos grandes agregados acumulados no período selecionado (${periodTag}) e da posição patrimonial à data do último relatório anual auditado.`
            : `Comparison of cumulative financial aggregates for the selected period (${periodTag}) and balance sheet position at the latest audited annual report.`}
        </p>

        {/* 3 Grandes Executive KPI Summary Grid */}
        <div className="benchmark-kpi-grid">
          {/* Sporting CP */}
          <div className="benchmark-club-hero benchmark-club-hero--sporting">
            <div className="benchmark-club-hero__header">
              <div className="benchmark-club-hero__name">
                <span
                  className="benchmark-club-hero__dot"
                  style={{ background: competitorColors.sporting }}
                />
                Sporting CP
              </div>
              <span
                className="tag"
                style={{
                  color: "var(--pos)",
                  borderColor: "rgba(42, 127, 78, 0.3)",
                  background: "rgba(42, 127, 78, 0.08)",
                }}
              >
                {sportingHeroTag}
              </span>
            </div>
            <div className="benchmark-club-hero__stat-row">
              <span>
                {isPt
                  ? `Receitas Operacionais (${periodLabel})`
                  : `${periodLabel} Operating Revenue`}
              </span>
              <span className="benchmark-club-hero__stat-val">
                €{benchmarkMetrics.sporting.rev.toFixed(1)}M
              </span>
            </div>
            <div className="benchmark-club-hero__stat-row">
              <span>
                {isPt
                  ? `Vendas de Passes (${periodLabel})`
                  : `${periodLabel} Transfer Income`}
              </span>
              <span className="benchmark-club-hero__stat-val">
                €{benchmarkMetrics.sporting.tf.toFixed(1)}M
              </span>
            </div>
            <div className="benchmark-club-hero__stat-row">
              <span>
                {isPt
                  ? `Resultado Líquido (${periodLabel})`
                  : `${periodLabel} Net Result`}
              </span>
              <span
                className="benchmark-club-hero__stat-val"
                style={{
                  color:
                    benchmarkMetrics.sporting.net >= 0
                      ? "var(--pos)"
                      : "var(--neg)",
                }}
              >
                {benchmarkMetrics.sporting.net >= 0 ? "+" : ""}€
                {benchmarkMetrics.sporting.net.toFixed(1)}M
              </span>
            </div>
            <div
              className="benchmark-club-hero__stat-row"
              style={{ borderBottom: "none", paddingBottom: 0 }}
            >
              <span>
                {isPt ? "Dívida Financeira Líquida" : "2024/25 Net Debt"}
              </span>
              <span className="benchmark-club-hero__stat-val">
                €{benchmarkMetrics.sporting.nd.toFixed(1)}M
              </span>
            </div>
          </div>

          {/* SL Benfica */}
          <div className="benchmark-club-hero benchmark-club-hero--benfica">
            <div className="benchmark-club-hero__header">
              <div className="benchmark-club-hero__name">
                <span
                  className="benchmark-club-hero__dot"
                  style={{ background: competitorColors.benfica }}
                />
                SL Benfica
              </div>
              <span
                className="tag"
                style={{
                  color: "var(--pos)",
                  borderColor: "rgba(42, 127, 78, 0.3)",
                  background: "rgba(42, 127, 78, 0.08)",
                }}
              >
                {benficaHeroTag}
              </span>
            </div>
            <div className="benchmark-club-hero__stat-row">
              <span>
                {isPt
                  ? `Receitas Operacionais (${periodLabel})`
                  : `${periodLabel} Operating Revenue`}
              </span>
              <span className="benchmark-club-hero__stat-val">
                €{benchmarkMetrics.benfica.rev.toFixed(1)}M
              </span>
            </div>
            <div className="benchmark-club-hero__stat-row">
              <span>
                {isPt
                  ? `Vendas de Passes (${periodLabel})`
                  : `${periodLabel} Transfer Income`}
              </span>
              <span className="benchmark-club-hero__stat-val">
                €{benchmarkMetrics.benfica.tf.toFixed(1)}M
              </span>
            </div>
            <div className="benchmark-club-hero__stat-row">
              <span>
                {isPt
                  ? `Resultado Líquido (${periodLabel})`
                  : `${periodLabel} Net Result`}
              </span>
              <span
                className="benchmark-club-hero__stat-val"
                style={{
                  color:
                    benchmarkMetrics.benfica.net >= 0
                      ? "var(--pos)"
                      : "var(--neg)",
                }}
              >
                {benchmarkMetrics.benfica.net >= 0 ? "+" : ""}€
                {benchmarkMetrics.benfica.net.toFixed(1)}M
              </span>
            </div>
            <div
              className="benchmark-club-hero__stat-row"
              style={{ borderBottom: "none", paddingBottom: 0 }}
            >
              <span>
                {isPt ? "Dívida Financeira Líquida" : "2024/25 Net Debt"}
              </span>
              <span className="benchmark-club-hero__stat-val">
                €{benchmarkMetrics.benfica.nd.toFixed(1)}M
              </span>
            </div>
          </div>

          {/* FC Porto */}
          <div className="benchmark-club-hero benchmark-club-hero--porto">
            <div className="benchmark-club-hero__header">
              <div className="benchmark-club-hero__name">
                <span
                  className="benchmark-club-hero__dot"
                  style={{ background: competitorColors.porto }}
                />
                FC Porto
              </div>
              <span
                className="tag"
                style={{
                  color:
                    benchmarkMetrics.porto.eq < 0
                      ? "var(--neg)"
                      : "var(--muted)",
                  borderColor:
                    benchmarkMetrics.porto.eq < 0
                      ? "rgba(184, 64, 58, 0.3)"
                      : "var(--rule-2)",
                  background:
                    benchmarkMetrics.porto.eq < 0
                      ? "rgba(184, 64, 58, 0.08)"
                      : "var(--bg)",
                }}
              >
                {portoHeroTag}
              </span>
            </div>
            <div className="benchmark-club-hero__stat-row">
              <span>
                {isPt
                  ? `Receitas Operacionais (${periodLabel})`
                  : `${periodLabel} Operating Revenue`}
              </span>
              <span className="benchmark-club-hero__stat-val">
                €{benchmarkMetrics.porto.rev.toFixed(1)}M
              </span>
            </div>
            <div className="benchmark-club-hero__stat-row">
              <span>
                {isPt
                  ? `Vendas de Passes (${periodLabel})`
                  : `${periodLabel} Transfer Income`}
              </span>
              <span className="benchmark-club-hero__stat-val">
                €{benchmarkMetrics.porto.tf.toFixed(1)}M
              </span>
            </div>
            <div className="benchmark-club-hero__stat-row">
              <span>
                {isPt
                  ? `Resultado Líquido (${periodLabel})`
                  : `${periodLabel} Net Result`}
              </span>
              <span
                className="benchmark-club-hero__stat-val"
                style={{
                  color:
                    benchmarkMetrics.porto.net >= 0
                      ? "var(--pos)"
                      : "var(--neg)",
                }}
              >
                {benchmarkMetrics.porto.net >= 0 ? "+" : ""}€
                {benchmarkMetrics.porto.net.toFixed(1)}M
              </span>
            </div>
            <div
              className="benchmark-club-hero__stat-row"
              style={{ borderBottom: "none", paddingBottom: 0 }}
            >
              <span>
                {isPt ? "Dívida Financeira Líquida" : "2024/25 Net Debt"}
              </span>
              <span className="benchmark-club-hero__stat-val">
                €{benchmarkMetrics.porto.nd.toFixed(1)}M
              </span>
            </div>
          </div>
        </div>

        {/* Executive Benchmark Table */}
        <div className="benchmark-table-wrapper">
          <table className="benchmark-table">
            <thead>
              <tr>
                <th className="col-metric">
                  {isPt ? "Indicador Financeiro" : "Financial Indicator"}
                </th>
                <th
                  className="col-club"
                  style={{ color: competitorColors.sporting }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: competitorColors.sporting,
                      }}
                    />
                    Sporting CP
                  </span>
                </th>
                <th
                  className="col-club"
                  style={{ color: competitorColors.benfica }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: competitorColors.benfica,
                      }}
                    />
                    SL Benfica
                  </span>
                </th>
                <th
                  className="col-club"
                  style={{ color: competitorColors.porto }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: competitorColors.porto,
                      }}
                    />
                    FC Porto
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {/* SECTION I: Cumulative of selected window */}
              <tr className="benchmark-section-header">
                <td colSpan={4}>
                  {isPt
                    ? `I. Agregados Acumulados (${periodTag})`
                    : `I. Cumulative Financial Aggregates (${periodTag})`}
                </td>
              </tr>
              <tr>
                <td className="col-metric">
                  {isPt
                    ? "Receitas Operacionais Acumuladas"
                    : "Cumulative Operating Revenue"}
                </td>
                <td className="col-val">
                  €{benchmarkMetrics.sporting.rev.toFixed(1)}M
                </td>
                <td className="col-val">
                  €{benchmarkMetrics.benfica.rev.toFixed(1)}M
                </td>
                <td className="col-val">
                  €{benchmarkMetrics.porto.rev.toFixed(1)}M
                </td>
              </tr>
              <tr>
                <td className="col-metric">
                  {isPt
                    ? "Média Anual de Receitas Operacionais"
                    : "Average Annual Operating Revenue"}
                </td>
                <td className="col-val">
                  €{benchmarkMetrics.sporting.avgRev.toFixed(1)}M/ano
                </td>
                <td className="col-val">
                  €{benchmarkMetrics.benfica.avgRev.toFixed(1)}M/ano
                </td>
                <td className="col-val">
                  €{benchmarkMetrics.porto.avgRev.toFixed(1)}M/ano
                </td>
              </tr>
              <tr>
                <td className="col-metric">
                  {isPt
                    ? "Rendimentos de Passes de Jogadores"
                    : "Cumulative Player Transfer Income"}
                </td>
                <td className="col-val">
                  €{benchmarkMetrics.sporting.tf.toFixed(1)}M
                </td>
                <td className="col-val">
                  €{benchmarkMetrics.benfica.tf.toFixed(1)}M
                </td>
                <td className="col-val">
                  €{benchmarkMetrics.porto.tf.toFixed(1)}M
                </td>
              </tr>
              <tr>
                <td className="col-metric">
                  {isPt
                    ? "Gastos com Pessoal / Salários Totais"
                    : "Cumulative Personnel / Wage Costs"}
                </td>
                <td className="col-val">
                  €{benchmarkMetrics.sporting.wages.toFixed(1)}M
                </td>
                <td className="col-val">
                  €{benchmarkMetrics.benfica.wages.toFixed(1)}M
                </td>
                <td className="col-val">
                  €{benchmarkMetrics.porto.wages.toFixed(1)}M
                </td>
              </tr>
              <tr>
                <td className="col-metric">
                  {isPt
                    ? "Média Anual de Salários (Gastos com Pessoal)"
                    : "Average Annual Wage Costs"}
                </td>
                <td className="col-val">
                  €{benchmarkMetrics.sporting.avgWages.toFixed(1)}M/ano
                </td>
                <td className="col-val">
                  €{benchmarkMetrics.benfica.avgWages.toFixed(1)}M/ano
                </td>
                <td className="col-val">
                  €{benchmarkMetrics.porto.avgWages.toFixed(1)}M/ano
                </td>
              </tr>
              <tr>
                <td className="col-metric">
                  {isPt
                    ? "Comissões Totais a Intermediários"
                    : "Cumulative Agent & Broker Commissions"}
                </td>
                <td className="col-val">
                  €{benchmarkMetrics.sporting.comm.toFixed(1)}M
                </td>
                <td className="col-val">
                  €{benchmarkMetrics.benfica.comm.toFixed(1)}M
                </td>
                <td className="col-val">
                  €{benchmarkMetrics.porto.comm.toFixed(1)}M
                </td>
              </tr>
              <tr>
                <td className="col-metric" style={{ fontWeight: 600 }}>
                  {isPt
                    ? `Resultado Líquido Acumulado (${periodLabel})`
                    : `Cumulative Net Result (${periodLabel})`}
                </td>
                <td className="col-val">
                  <span
                    className={`benchmark-pill ${benchmarkMetrics.sporting.net >= 0 ? "benchmark-pill--pos" : "benchmark-pill--neg"}`}
                  >
                    {benchmarkMetrics.sporting.net >= 0 ? "+" : ""}€
                    {benchmarkMetrics.sporting.net.toFixed(1)}M
                  </span>
                </td>
                <td className="col-val">
                  <span
                    className={`benchmark-pill ${benchmarkMetrics.benfica.net >= 0 ? "benchmark-pill--pos" : "benchmark-pill--neg"}`}
                  >
                    {benchmarkMetrics.benfica.net >= 0 ? "+" : ""}€
                    {benchmarkMetrics.benfica.net.toFixed(1)}M
                  </span>
                </td>
                <td className="col-val">
                  <span
                    className={`benchmark-pill ${benchmarkMetrics.porto.net >= 0 ? "benchmark-pill--pos" : "benchmark-pill--neg"}`}
                  >
                    {benchmarkMetrics.porto.net >= 0 ? "+" : ""}€
                    {benchmarkMetrics.porto.net.toFixed(1)}M
                  </span>
                </td>
              </tr>

              {/* SECTION II: Current Balance Sheet 2024/25 */}
              <tr className="benchmark-section-header">
                <td colSpan={4}>
                  {isPt
                    ? "II. Posição Patrimonial & Endividamento (30 de Junho de 2025)"
                    : "II. Balance Sheet & Debt Position (June 30, 2025)"}
                </td>
              </tr>
              <tr>
                <td className="col-metric" style={{ fontWeight: 600 }}>
                  {isPt
                    ? "Capitais Próprios (Solvência)"
                    : "Shareholders' Equity (Solvency)"}
                </td>
                <td className="col-val">
                  <span
                    className={`benchmark-pill ${benchmarkMetrics.sporting.eq >= 0 ? "benchmark-pill--pos" : "benchmark-pill--neg"}`}
                  >
                    {benchmarkMetrics.sporting.eq >= 0 ? "+" : ""}€
                    {benchmarkMetrics.sporting.eq.toFixed(1)}M
                  </span>
                </td>
                <td className="col-val">
                  <span
                    className={`benchmark-pill ${benchmarkMetrics.benfica.eq >= 0 ? "benchmark-pill--pos" : "benchmark-pill--neg"}`}
                  >
                    {benchmarkMetrics.benfica.eq >= 0 ? "+" : ""}€
                    {benchmarkMetrics.benfica.eq.toFixed(1)}M
                  </span>
                </td>
                <td className="col-val">
                  <span
                    className={`benchmark-pill ${benchmarkMetrics.porto.eq >= 0 ? "benchmark-pill--pos" : "benchmark-pill--neg"}`}
                  >
                    {benchmarkMetrics.porto.eq >= 0 ? "+" : ""}€
                    {benchmarkMetrics.porto.eq.toFixed(1)}M
                  </span>
                </td>
              </tr>
              <tr>
                <td className="col-metric">
                  {isPt ? "Dívida Financeira Líquida" : "Net Financial Debt"}
                </td>
                <td className="col-val">
                  €{benchmarkMetrics.sporting.nd.toFixed(1)}M
                </td>
                <td className="col-val">
                  €{benchmarkMetrics.benfica.nd.toFixed(1)}M
                </td>
                <td className="col-val">
                  €{benchmarkMetrics.porto.nd.toFixed(1)}M
                </td>
              </tr>
              <tr>
                <td className="col-metric">
                  {isPt
                    ? "Dívida Líquida de Passes a Clubes"
                    : "Net Transfer Debt to Clubs"}
                </td>
                <td className="col-val">
                  <span
                    className={`benchmark-pill ${benchmarkMetrics.sporting.td > 0 ? "benchmark-pill--neg" : "benchmark-pill--pos"}`}
                  >
                    €{Math.abs(benchmarkMetrics.sporting.td).toFixed(1)}M{" "}
                    {benchmarkMetrics.sporting.td > 0
                      ? isPt
                        ? "a pagar"
                        : "payable"
                      : isPt
                        ? "a receber"
                        : "receivable"}
                  </span>
                </td>
                <td className="col-val">
                  <span
                    className={`benchmark-pill ${benchmarkMetrics.benfica.td > 0 ? "benchmark-pill--neg" : "benchmark-pill--pos"}`}
                  >
                    €{Math.abs(benchmarkMetrics.benfica.td).toFixed(1)}M{" "}
                    {benchmarkMetrics.benfica.td > 0
                      ? isPt
                        ? "a pagar"
                        : "payable"
                      : isPt
                        ? "a receber"
                        : "receivable"}
                  </span>
                </td>
                <td className="col-val">
                  <span
                    className={`benchmark-pill ${benchmarkMetrics.porto.td > 0 ? "benchmark-pill--neg" : "benchmark-pill--pos"}`}
                  >
                    €{Math.abs(benchmarkMetrics.porto.td).toFixed(1)}M{" "}
                    {benchmarkMetrics.porto.td > 0
                      ? isPt
                        ? "a pagar"
                        : "payable"
                      : isPt
                        ? "a receber"
                        : "receivable"}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Financial & Sporting Efficiency Module */}
      <FinancialEfficiencyModule timeWindow={timeWindow} />

      <div className="narrative" style={{ marginTop: "1.5rem" }}>
        <T as="h4" i18nKey="ch08-narrative-h4" />
        <T as="p" i18nKey="ch08-narrative-p1" />
        <T as="p" i18nKey="ch08-narrative-p2" />
        <T as="p" i18nKey="ch08-narrative-p3" />
        <T as="p" i18nKey="ch08-narrative-p4" />
      </div>
    </>
  );
});
