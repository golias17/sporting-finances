import React, { useRef, useState } from "react";
import { Chart as ReactChart, Bar } from "react-chartjs-2";
import { AccessibleTable } from "./AccessibleTable.js";
import type { ChartType, ChartData, ChartOptions } from "chart.js";

interface AppChartProps {
  id: string;
  type: ChartType | "chart";
  data: ChartData<any>;
  options?: ChartOptions<any>;
  className?: string;
  ariaLabel?: string;
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
  hideTable?: boolean;
  chartRef?: React.RefObject<any>;
  plugins?: Array<{ id: string; beforeDraw?: (chart: { ctx: CanvasRenderingContext2D }) => void }>;
}

export function AppChart({
  id,
  type,
  data,
  options,
  className = "",
  ariaLabel,
  valueType,
  datasetValueTypes,
  hideTable = false,
  chartRef: externalRef,
  plugins,
}: AppChartProps) {
  const internalRef = useRef<any>(null);
  const ref = externalRef || internalRef;
  const [isTableVisible, setIsTableVisible] = useState(false);

  return (
    <>
      <div
        className={`chart-box ${className} ${isTableVisible ? "hidden" : ""}`}
      >
        {type === "bar" ? (
          <Bar
            ref={ref}
            id={id}
            data={data}
            options={options as any}
            plugins={plugins}
            aria-label={ariaLabel}
            role="img"
          />
        ) : (
          <ReactChart
            ref={ref}
            id={id}
            type={type === "chart" ? "bar" : type} // fallback for combo charts
            data={data}
            options={options as any}
            plugins={plugins}
            aria-label={ariaLabel}
            role="img"
          />
        )}
      </div>
      {!hideTable && (
        <AccessibleTable
          chartId={id}
          data={data}
          valueType={valueType as any}
          datasetValueTypes={datasetValueTypes}
          onToggle={setIsTableVisible}
        />
      )}
    </>
  );
}
