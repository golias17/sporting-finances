import React from "react";
import { ChartCard } from "../../components/ChartCard.js";
import { HealthSignals } from "../HealthSignals";
import { useTranslation } from "../../hooks/useTranslation.js";
import { useHealthcheckCharts } from "./useHealthcheckCharts.js";

export function HealthcheckTab() {
  const { T } = useTranslation();
  const {
    payrollBurdenData,
    payrollBurdenOptions,
    transferRelianceData,
    transferRelianceOptions,
    debtLoadData,
    debtLoadOptions,
    currentRatioData,
    currentRatioOptions,
    transferDebtData,
    transferDebtOptions,
    ebitdaData,
    ebitdaOptions,
  } = useHealthcheckCharts();
  return (
    <>
      <div className="chapter">
        <T as="div" className="num" i18nKey="ch03-num" />
        <div>
          <T as="h2" i18nKey="ch03-h2" />
          <T as="p" className="lede" i18nKey="ch03-lede" />
        </div>
      </div>
      {/* VITAL SIGNS — moved here from above tabs */}
      <HealthSignals />
      <div className="card">
        <div className="card-head">
          <T as="h3" i18nKey="ch03-brief-h3" />
          <T as="span" className="tag" i18nKey="ch03-brief-tag" />
        </div>
        <T as="p" className="desc" i18nKey="ch03-brief-desc" />
        <div className="narrative">
          <T as="h4" i18nKey="ch03-brief-h4" />
          <T as="p" i18nKey="ch03-brief-p" />
        </div>
      </div>
      <div className="grid-2">
        <ChartCard
          id="chartPayrollBurden"
          title={<T as="h3" i18nKey="ch03-wage-h3" />}
          tag={<T as="span" className="tag" i18nKey="ch03-wage-tag" />}
          desc={
            <>
              <T as="p" className="desc" i18nKey="ch03-wage-desc" />
              <T as="div" className="zone-legend" i18nKey="ch03-zone-healthy" />
            </>
          }
          chartType="line"
          data={payrollBurdenData}
          options={payrollBurdenOptions}
          valueType="percentage"
        />
        <ChartCard
          id="chartTransferReliance"
          title={<T as="h3" i18nKey="ch03-rel-h3" />}
          tag={<T as="span" className="tag" i18nKey="ch03-rel-tag" />}
          desc={
            <>
              <T as="p" className="desc" i18nKey="ch03-rel-desc" />
              <T as="div" className="zone-legend" i18nKey="ch03-zone-caution" />
            </>
          }
          chartType="line"
          data={transferRelianceData}
          options={transferRelianceOptions}
          valueType="percentage"
        />
      </div>
      <div className="grid-2">
        <ChartCard
          id="chartDebtLoad"
          title={<T as="h3" i18nKey="ch03-debt-h3" />}
          tag={<T as="span" className="tag" i18nKey="ch03-debt-tag" />}
          desc={
            <>
              <T as="p" className="desc" i18nKey="ch03-zone-warning-desc" />
              <T as="div" className="zone-legend" i18nKey="ch03-zone-warning" />
            </>
          }
          chartType="line"
          data={debtLoadData}
          options={debtLoadOptions}
          valueType="ratio"
        />
        <ChartCard
          id="chartCurrentRatio"
          title={<T as="h3" i18nKey="ch03-liq-h3" />}
          tag={<T as="span" className="tag" i18nKey="ch03-liq-tag" />}
          desc={
            <>
              <T as="p" className="desc" i18nKey="ch03-liq-desc" />
              <T as="div" className="zone-legend" i18nKey="ch03-zone-danger" />
            </>
          }
          chartType="line"
          data={currentRatioData}
          options={currentRatioOptions}
          valueType="ratio"
        />
      </div>
      <div className="grid-2">
        <ChartCard
          id="chartTransferDebt"
          title={<T as="h3" i18nKey="ch03-transfer-debt-h3" />}
          tag={<span className="tag">2010/11 → 2024/25</span>}
          desc={<T as="p" className="desc" i18nKey="ch03-transfer-debt-desc" />}
          chartType="bar"
          data={transferDebtData}
          options={transferDebtOptions}
          valueType="currency-thousands"
        />
        <ChartCard
          id="chartEbitda"
          title={<T as="h3" i18nKey="ch03-ebitda-h3" />}
          tag={<span className="tag">2010/11 → 2024/25</span>}
          desc={<T as="p" className="desc" i18nKey="ch03-ebitda-desc" />}
          chartType="line"
          data={ebitdaData}
          options={ebitdaOptions}
          valueType="currency-thousands"
        />
      </div>
      <div className="narrative">
        <T as="h4" i18nKey="ch03-narrative-h4" />
        <T as="p" i18nKey="ch03-narrative-p" />
      </div>
    </>
  );
}
