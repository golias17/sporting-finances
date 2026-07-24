import React, { useRef } from "react";
import { ChartDownloadButton } from "./ChartDownloadButton.js";
import { AppChart } from "./AppChart.js";
import type { ChartType, ChartData, ChartOptions } from "chart.js";

interface ChartCardProps {
  id: string;
  title: React.ReactNode;
  tag?: React.ReactNode;
  desc?: React.ReactNode;

  chartType: ChartType | "chart";
  data: ChartData<any>;
  options?: ChartOptions<any>;

  className?: string; // Appended to .card
  chartClassName?: string; // Appended to .chart-box

  valueType?:
"currency-thousands"
    | "currency-millions"
   
    | "ratio"
    | "percentage"
    | "auto";
  datasetValueTypes?: Record<
    number,
    "currency-thousands" | "currency-millions" | "ratio" | "percentage"
  >;

  children?: React.ReactNode;
}

export function ChartCard({
  id,
  title,
  tag,
  desc,
  chartType,
  data,
  options,
  className = "",
  chartClassName = "",
  valueType,
  datasetValueTypes,
  children,
}: ChartCardProps) {
  const chartRef = useRef<any>(null);

  return (
    <div className={`card ${className}`}>
      <div className="card-head">
        {title}
        {tag}
        <ChartDownloadButton chartRef={chartRef} fileName={id} />
      </div>
      {desc}
      {children}
      <AppChart
        id={id}
        type={chartType}
        data={data}
        options={options}
        className={chartClassName}
        valueType={valueType}
        datasetValueTypes={datasetValueTypes}
        chartRef={chartRef}
      />
    </div>
  );
}
