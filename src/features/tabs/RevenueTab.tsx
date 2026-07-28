import React from "react";
import { ChartCard } from "../../components/ChartCard.js";
import { useTranslation } from "../../hooks/useTranslation.js";
import { useRevenueCharts } from "./useRevenueCharts.js";
import { useHealthcheckCharts } from "./useHealthcheckCharts.js";

export const RevenueTab = React.memo(function RevenueTab() {
  const { T } = useTranslation();
  const {
    revenueData,
    revenueOptions,
    revStreamsData,
    revStreamsOptions,
    revVsPayrollData,
    revVsPayrollOptions,
    opResultData,
    opResultOptions,
    costBreakdownData,
    costBreakdownOptions,
  } = useRevenueCharts();
  const { payrollBurdenData, payrollBurdenOptions } = useHealthcheckCharts();
  return (
    <>
      <div className="chapter">
        <T as="div" className="num" i18nKey="ch02-num" />
        <div>
          <T as="h2" i18nKey="ch02-h2" />
          <T as="p" className="lede" i18nKey="ch02-lede" />
        </div>
      </div>
      <ChartCard
        id="chartRevenue"
        title={<T as="h3" i18nKey="ch02-rev-h3" />}
        tag={<T as="span" className="tag" i18nKey="ch02-rev-tag" />}
        desc={<T as="p" className="desc" i18nKey="ch02-rev-desc" />}
        chartType="bar"
        data={revenueData}
        options={revenueOptions}
        chartClassName="tall"
        valueType="currency-thousands"
      />
      <ChartCard
        id="chartRevStreams"
        title={<T as="h3" i18nKey="ch02-streams-h3" />}
        tag={<T as="span" className="tag" i18nKey="ch02-streams-tag" />}
        desc={<T as="p" className="desc" i18nKey="ch02-streams-desc" />}
        chartType="bar"
        data={revStreamsData}
        options={revStreamsOptions}
        chartClassName="tall"
        valueType="currency-thousands"
      />
      <ChartCard
        id="chartOpResult"
        title={<T as="h3" i18nKey="ch02-opresult-h3" />}
        tag={<T as="span" className="tag" i18nKey="ch02-opresult-tag" />}
        desc={<T as="p" className="desc" i18nKey="ch02-opresult-desc" />}
        chartType="bar"
        data={opResultData}
        options={opResultOptions}
        chartClassName="tall"
        valueType="currency-thousands"
      />
      <div className="grid-2">
        <ChartCard
          id="chartPayrollBurden"
          title={<T as="h3" i18nKey="ch02-wage-h3" />}
          tag={<T as="span" className="tag" i18nKey="ch02-wage-tag" />}
          desc={
            <>
              <T as="p" className="desc" i18nKey="ch02-wage-desc" />
              <T as="div" className="zone-legend" i18nKey="ch02-zone-healthy" />
            </>
          }
          chartType="line"
          data={payrollBurdenData}
          options={payrollBurdenOptions}
          valueType="percentage"
        />
        <ChartCard
          id="chartRevVsPayroll"
          title={<T as="h3" i18nKey="ch02-payroll-h3" />}
          tag={<T as="span" className="tag" i18nKey="ch02-payroll-tag" />}
          desc={<T as="p" className="desc" i18nKey="ch02-payroll-desc" />}
          chartType="bar"
          data={revVsPayrollData}
          options={revVsPayrollOptions}
          valueType="percentage"
        />
      </div>
      <ChartCard
        id="chartCostBreakdown"
        title={<T as="h3" i18nKey="ch02-costs-h3" />}
        tag={<span className="tag">stacked area</span>}
        desc={<T as="p" className="desc" i18nKey="ch02-costs-desc" />}
        chartType="bar"
        data={costBreakdownData}
        options={costBreakdownOptions}
        chartClassName="tall"
      />
      <div className="narrative">
        <T as="h4" i18nKey="ch02-narrative-h4" />
        <T as="p" i18nKey="ch02-narrative-p1" />
        <T as="p" i18nKey="ch02-narrative-p2" />
      </div>
    </>
  );
});
