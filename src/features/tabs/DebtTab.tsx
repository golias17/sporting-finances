import React from "react";
import { ChartCard } from "../../components/ChartCard.js";
import { useTranslation } from "../../hooks/useTranslation.js";
import { useDebtCharts } from "./useDebtCharts.js";

export function DebtTab() {
  const { T } = useTranslation();
  const {
    debtData,
    debtOptions,
    assetsLiabData,
    assetsLiabOptions,
    debtMaturityData,
    debtMaturityOptions,
  } = useDebtCharts();
  return (
    <>
      <div className="chapter">
        <T as="div" className="num" i18nKey="ch04-num" />
        <div>
          <T as="h2" i18nKey="ch04-h2" />
          <T as="p" className="lede" i18nKey="ch04-lede" />
        </div>
      </div>
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
          id="chartDebtMaturity"
          title={<T as="h3" i18nKey="ch04-maturity-h3" />}
          tag={<T as="span" className="tag" i18nKey="ch04-maturity-tag" />}
          desc={<T as="p" className="desc" i18nKey="ch04-maturity-desc" />}
          chartType="line"
          data={debtMaturityData}
          options={debtMaturityOptions}
          valueType="percentage"
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
}
