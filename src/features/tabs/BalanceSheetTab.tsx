import React from "react";
import { ChartCard } from "../../components/ChartCard.js";
import { useTranslation } from "../../hooks/useTranslation.js";
import { useDebtCharts } from "./useDebtCharts.js";
import { useCashCharts } from "./useCashCharts.js";

export const BalanceSheetTab = React.memo(function BalanceSheetTab() {
  const { T } = useTranslation();
  const {
    debtData,
    debtOptions,
    assetsLiabData,
    assetsLiabOptions,
    debtMaturityData,
    debtMaturityOptions,
  } = useDebtCharts();
  const { cashFlow, cash, annualNet } = useCashCharts();

  return (
    <>
      <div className="chapter">
        <T as="div" className="num" i18nKey="ch04-num" />
        <div>
          <T as="h2" i18nKey="ch04-h2" />
          <T as="p" className="lede" i18nKey="ch04-lede" />
        </div>
      </div>

      {/* Debt Overview */}
      <ChartCard
        id="chartDebt"
        title={<T as="h3" i18nKey="ch04-debt-h3" />}
        tag={<T as="span" className="tag" i18nKey="ch04-debt-tag" />}
        desc={<T as="p" className="desc" i18nKey="ch04-debt-desc" />}
        chartType="bar"
        data={debtData}
        options={debtOptions}
        chartClassName="tall"
        valueType="currency-thousands"
      />

      {/* Cash Flow */}
      <ChartCard
        id="chartCashFlow"
        title={<T as="h3" i18nKey="ch04-cf-h3" />}
        tag={<T as="span" className="tag" i18nKey="ch04-cf-tag" />}
        desc={<T as="p" className="desc" i18nKey="ch04-cf-desc" />}
        chartType="bar"
        data={cashFlow.data}
        options={cashFlow.options}
        chartClassName="tall"
      />

      {/* Grid: Assets vs Liab + Cash Position */}
      <div className="grid-2">
        <ChartCard
          id="chartAssetsLiab"
          title={<T as="h3" i18nKey="ch04-assets-h3" />}
          tag={<T as="span" className="tag" i18nKey="ch04-assets-tag" />}
          desc={<T as="p" className="desc" i18nKey="ch04-assets-desc" />}
          chartType="bar"
          data={assetsLiabData}
          options={assetsLiabOptions}
          valueType="currency-thousands"
        />
        <ChartCard
          id="chartCash"
          title={<T as="h3" i18nKey="ch04-cash-h3" />}
          tag={<T as="span" className="tag" i18nKey="ch04-cash-tag" />}
          desc={<T as="p" className="desc" i18nKey="ch04-cash-desc" />}
          chartType="line"
          data={cash.data}
          options={cash.options}
        />
      </div>

      {/* Grid: Debt Maturity + Annual Net */}
      <div className="grid-2">
        <ChartCard
          id="chartDebtMaturity"
          title={<T as="h3" i18nKey="ch04-maturity-h3" />}
          tag={<T as="span" className="tag" i18nKey="ch04-maturity-tag" />}
          desc={<T as="p" className="desc" i18nKey="ch04-maturity-desc" />}
          chartType="line"
          data={debtMaturityData}
          options={debtMaturityOptions}
          valueType="percentage"
        />
        <ChartCard
          id="chartAnnualNet"
          title={<T as="h3" i18nKey="ch04-net-h3" />}
          tag={<T as="span" className="tag" i18nKey="ch04-net-tag" />}
          desc={<T as="p" className="desc" i18nKey="ch04-net-desc" />}
          chartType="bar"
          data={annualNet.data}
          options={annualNet.options}
        />
      </div>

      <div className="narrative">
        <T as="h4" i18nKey="ch04-narrative-h4" />
        <T as="p" i18nKey="ch04-narrative-p1" />
        <T as="p" i18nKey="ch04-narrative-p2" />
        <T as="p" i18nKey="ch04-narrative-p3" />
      </div>
    </>
  );
});
