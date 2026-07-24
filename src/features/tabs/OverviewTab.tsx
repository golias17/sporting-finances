import React from "react";
import { Story } from "../Story.js";
import { KPIBar } from "../KPIBar.js";
import { useTranslation } from "../../hooks/useTranslation.js";
import { ChartCard } from "../../components/ChartCard.js";
import { useOverviewCharts } from "./useOverviewCharts.js";

export function OverviewTab() {
  const { T } = useTranslation();
  const { heroData, heroOptions, netResult, equity } = useOverviewCharts();

  return (
    <>
      <div className="chapter">
        <T as="div" className="num" i18nKey="ch01-num" />
        <div>
          <T as="h2" i18nKey="ch01-h2" />
          <T as="p" className="lede" i18nKey="ch01-lede" />
        </div>
      </div>

      {/* Story launcher */}
      <Story />

      {/* HEADLINE KPIs */}
      <KPIBar />

      <ChartCard
        id="chartHero"
        title={<T as="h3" i18nKey="ch01-hero-h3" />}
        tag={<T as="span" className="tag" i18nKey="ch01-hero-tag" />}
        desc={<T as="p" className="desc" i18nKey="ch01-hero-desc" />}
        chartType="chart"
        data={heroData}
        options={heroOptions}
        chartClassName="tall"
        valueType="currency-thousands"
      />

      <div className="grid-2">
        <ChartCard
          id="chartNetResult"
          title={<T as="h3" i18nKey="ch01-netresult-h3" />}
          tag={<T as="span" className="tag" i18nKey="ch01-netresult-tag" />}
          desc={<T as="p" className="desc" i18nKey="ch01-netresult-desc" />}
          chartType="bar"
          data={netResult.data}
          options={netResult.options}
          valueType="currency-thousands"
        />

        <ChartCard
          id="chartEquity"
          title={<T as="h3" i18nKey="ch01-equity-h3" />}
          tag={<T as="span" className="tag" i18nKey="ch01-equity-tag" />}
          desc={<T as="p" className="desc" i18nKey="ch01-equity-desc" />}
          chartType="bar"
          data={equity.data}
          options={equity.options}
          valueType="currency-thousands"
        />
      </div>

      <div className="narrative">
        <T as="h4" i18nKey="ch01-narrative-h4" />
        <T as="p" i18nKey="ch01-narrative-p1" />
        <T as="p" i18nKey="ch01-narrative-p2" />
      </div>
    </>
  );
}
