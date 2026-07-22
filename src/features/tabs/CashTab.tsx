import React from "react";
import { ChartCard } from "../../components/ChartCard.js";
import { useCashCharts } from "./useCashCharts.js";
import { useTranslation } from "../../hooks/useTranslation.js";

export function CashTab() {
  const { t, T } = useTranslation();
  const { cashFlow, cash, annualNet } = useCashCharts();
  return (
    <>
      <div className="chapter">
        <T as="div" className="num" i18nKey="ch07-num" />
        <div>
          <T as="h2" i18nKey="ch07-h2" />
          <T as="p" className="lede" i18nKey="ch07-lede" />
        </div>
      </div>
      <ChartCard
        id="chartCashFlow"
        title={<T as="h3" i18nKey="ch07-cf-h3" />}
        tag={<T as="span" className="tag" i18nKey="ch07-cf-tag" />}
        desc={<T as="p" className="desc" i18nKey="ch07-cf-desc" />}
        chartType="bar"
        data={cashFlow.data}
        options={cashFlow.options}
        chartClassName="tall"
      />
      <div className="grid-2">
        <ChartCard
          id="chartCash"
          title={<T as="h3" i18nKey="ch07-cash-h3" />}
          tag={<T as="span" className="tag" i18nKey="ch07-cash-tag" />}
          desc={<T as="p" className="desc" i18nKey="ch07-cash-desc" />}
          chartType="line"
          data={cash.data}
          options={cash.options}
        />
        <ChartCard
          id="chartAnnualNet"
          title={<T as="h3" i18nKey="ch07-net-h3" />}
          tag={<T as="span" className="tag" i18nKey="ch07-net-tag" />}
          desc={<T as="p" className="desc" i18nKey="ch07-net-desc" />}
          chartType="bar"
          data={annualNet.data}
          options={annualNet.options}
        />
      </div>
      <div className="narrative">
        <T as="h4" i18nKey="ch07-narrative-h4" />
        <T as="p" i18nKey="ch07-narrative-p1" />
        <T as="p" i18nKey="ch07-narrative-p2" />
      </div>
    </>
  );
}
