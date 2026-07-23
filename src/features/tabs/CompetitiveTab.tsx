import React from "react";
import { useTranslation } from "../../hooks/useTranslation";
import { ChartCard } from "../../components/ChartCard";
import { useCompetitiveCharts } from "./useCompetitiveCharts";

export function CompetitiveTab() {
  const { t, T } = useTranslation();
  const {
    labels,
    revenueBySource,
    personnelCostsRatio,
    personnelComparison,
    transferBalance,
    squadValueComparison,
    netResultComparison,
    equityComparison,
    totalLiabilitiesComparison,
    chartOptions,
    percentageOptions,
    competitorColors,
    cumulativeNetResults,
  } = useCompetitiveCharts();

  return (
    <>
      <div className="chapter">
        <T as="div" className="num" i18nKey="ch09-num" />
        <div>
          <T as="h2" i18nKey="ch09-h2" />
          <T as="p" className="lede" i18nKey="ch09-lede" />
        </div>
      </div>

      {/* Data Source & Legend Hero Banner */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div className="card-head">
          <T as="h3" i18nKey="ch09-data-source" />
        </div>
        <T as="p" className="desc" i18nKey="ch09-data-source-desc" />
        <div style={{ display: "flex", gap: "1.5rem", marginTop: "1rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: competitorColors.sporting }}></div>
            <T as="span" i18nKey="ch09-sporting" />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: competitorColors.benfica }}></div>
            <T as="span" i18nKey="ch09-benfica" />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: competitorColors.porto }}></div>
            <T as="span" i18nKey="ch09-porto" />
          </div>
        </div>
      </div>

      {/* Row 1: Revenue by Source (full width) */}
      <ChartCard
        id="competitiveRevenueSource"
        title={<T as="h3" i18nKey="ch09-revenue-source-h3" />}
        tag={<span className="tag">2010/11 → 2024/25</span>}
        desc={<T as="p" className="desc" i18nKey="ch09-revenue-source-desc" />}
        chartType="bar"
        data={revenueBySource}
        options={chartOptions}
        chartClassName="tall"
        valueType="currency-millions"
      />

      {/* Row 2: Personnel Costs Ratio & Absolute */}
      <div className="grid-2">
        <ChartCard
          id="competitivePersonnelRatio"
          title={<T as="h3" i18nKey="ch09-personnel-ratio-h3" />}
          tag={<span className="tag">2010/11 → 2024/25</span>}
          desc={<T as="p" className="desc" i18nKey="ch09-personnel-ratio-desc" />}
          chartType="line"
          data={personnelCostsRatio}
          options={percentageOptions}
          chartClassName="tall"
          valueType="percentage"
        />

        <ChartCard
          id="competitivePersonnel"
          title={<T as="h3" i18nKey="ch09-personnel-h3" />}
          tag={<span className="tag">2010/11 → 2024/25</span>}
          desc={<T as="p" className="desc" i18nKey="ch09-personnel-desc" />}
          chartType="line"
          data={personnelComparison}
          options={chartOptions}
          chartClassName="tall"
          valueType="currency-millions"
        />
      </div>

      {/* Row 3: Squad Value & Transfer Balance */}
      <div className="grid-2">
        <ChartCard
          id="competitiveSquad"
          title={<T as="h3" i18nKey="ch09-squad-h3" />}
          tag={<span className="tag">2010/11 → 2024/25</span>}
          desc={<T as="p" className="desc" i18nKey="ch09-squad-desc" />}
          chartType="line"
          data={squadValueComparison}
          options={chartOptions}
          chartClassName="tall"
          valueType="currency-millions"
        />

        <ChartCard
          id="competitiveTransferBalance"
          title={<T as="h3" i18nKey="ch09-transfer-balance-h3" />}
          tag={<span className="tag">2010/11 → 2024/25</span>}
          desc={<T as="p" className="desc" i18nKey="ch09-transfer-balance-desc" />}
          chartType="bar"
          data={transferBalance}
          options={chartOptions}
          chartClassName="tall"
          valueType="currency-millions"
        />
      </div>

      {/* Row 4: Net Result (full width) */}
      <ChartCard
        id="competitiveNetResult"
        title={<T as="h3" i18nKey="ch09-netresult-h3" />}
        tag={<span className="tag">2010/11 → 2024/25</span>}
        desc={<T as="p" className="desc" i18nKey="ch09-netresult-desc" />}
        chartType="bar"
        data={netResultComparison}
        options={chartOptions}
        chartClassName="tall"
        valueType="currency-millions"
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginTop: "0.5rem",
            marginBottom: "0.75rem",
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: "var(--fs-2xs)",
              fontFamily: "var(--mono)",
              fontWeight: 600,
              color: "var(--muted)",
              textTransform: "uppercase",
              letterSpacing: "0.03em",
            }}
          >
            {t("ch09-cumulative-label") || "Total Acumulado (15 Épocas):"}
          </span>
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: "var(--fs-2xs)",
                fontFamily: "var(--mono)",
                fontWeight: 700,
                padding: "2px 7px",
                borderRadius: "var(--radius-sm)",
                background: "rgba(10, 93, 58, 0.12)",
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
                background: "rgba(184, 64, 58, 0.12)",
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
                background: "rgba(44, 91, 138, 0.12)",
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

      {/* Row 5: Equity & Total Liabilities */}
      <div className="grid-2">
        <ChartCard
          id="competitiveEquity"
          title={<T as="h3" i18nKey="ch09-equity-h3" />}
          tag={<span className="tag">2010/11 → 2024/25</span>}
          desc={<T as="p" className="desc" i18nKey="ch09-equity-desc" />}
          chartType="line"
          data={equityComparison}
          options={chartOptions}
          chartClassName="tall"
          valueType="currency-millions"
        />

        <ChartCard
          id="competitiveLiabilities"
          title={<T as="h3" i18nKey="ch09-liabilities-h3" />}
          tag={<span className="tag">2010/11 → 2024/25</span>}
          desc={<T as="p" className="desc" i18nKey="ch09-liabilities-desc" />}
          chartType="line"
          data={totalLiabilitiesComparison}
          options={chartOptions}
          chartClassName="tall"
          valueType="currency-millions"
        />
      </div>

      <div className="narrative">
        <T as="h4" i18nKey="ch09-narrative-h4" />
        <T as="p" i18nKey="ch09-narrative-p1" />
        <T as="p" i18nKey="ch09-narrative-p2" />
        <T as="p" i18nKey="ch09-narrative-p3" />
        <T as="p" i18nKey="ch09-narrative-p4" />
      </div>
    </>
  );
}
