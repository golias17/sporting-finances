import { describe, it, expect, beforeAll } from "vitest";
import { state } from "../src/state.js";
import {
  initChartDefaults,
  generateAccessibleTable,
  externalTooltipHandler,
} from "../src/chartUtils.js";
import {
  chartHero,
  chartNetResult,
  chartEquity,
  chartRevenue,
} from "../src/charts.js";
import { chartRegistry } from "../src/chartUtils.js";

describe("Chart.js and Annotation Plugin integration", () => {
  beforeAll(() => {
    // Mock ResizeObserver
    global.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };

    // Mock getContext for canvas to return an object that acts as CanvasRenderingContext2D
    const mockContext = {
      beginPath: () => {},
      arc: () => {},
      fill: () => {},
      stroke: () => {},
      closePath: () => {},
      clearRect: () => {},
      fillRect: () => {},
      strokeRect: () => {},
      fillText: () => {},
      strokeText: () => {},
      measureText: () => ({ width: 0, height: 0 }),
      setTransform: () => {},
      resetTransform: () => {},
      drawImage: () => {},
      save: () => {},
      restore: () => {},
      createLinearGradient: () => ({ addColorStop: () => {} }),
      createPattern: () => {},
      createRadialGradient: () => {},
      canvas: null, // will be set per element
    };

    if (global.CanvasRenderingContext2D) {
      Object.setPrototypeOf(
        mockContext,
        global.CanvasRenderingContext2D.prototype,
      );
    }

    HTMLCanvasElement.prototype.getContext = function () {
      mockContext.canvas = this;
      return mockContext;
    };

    // Create mock canvas elements on the DOM
    document.body.innerHTML = `
      <canvas id="chartHero"></canvas>
      <canvas id="chartNetResult"></canvas>
      <canvas id="chartEquity"></canvas>
      <canvas id="chartRevenue"></canvas>
    `;

    // Mock the annual data dataset
    state.DATASET = {
      annual_data: [
        {
          label: "2012/13",
          revenue_operating: 30000,
          net_result: -5000,
          equity: -119000,
          squad_market_value: 50000,
          borrowings_nc: 100000,
          borrowings_c: 20000,
          cash: 1300,
        },
        {
          label: "2013/14",
          revenue_operating: 35000,
          net_result: 300,
          equity: -118000,
          squad_market_value: 52000,
          borrowings_nc: 90000,
          borrowings_c: 25000,
          cash: 1500,
        },
        {
          label: "2014/15",
          revenue_operating: 58000,
          net_result: 19000,
          equity: 7000,
          squad_market_value: 60000,
          borrowings_nc: 80000,
          borrowings_c: 20000,
          cash: 10000,
        },
        {
          label: "2015/16",
          revenue_operating: 68000,
          net_result: -31000,
          equity: -24000,
          squad_market_value: 65000,
          borrowings_nc: 88000,
          borrowings_c: 43000,
          cash: 3300,
        },
        {
          label: "2016/17",
          revenue_operating: 80000,
          net_result: 30000,
          equity: 5000,
          squad_market_value: 70000,
          borrowings_nc: 36000,
          borrowings_c: 91000,
          cash: 6300,
        },
        {
          label: "2017/18",
          revenue_operating: 91000,
          net_result: -19000,
          equity: -13000,
          squad_market_value: 75000,
          borrowings_nc: 36000,
          borrowings_c: 74000,
          cash: 1700,
        },
        {
          label: "2018/19",
          revenue_operating: 75000,
          net_result: -7000,
          equity: -23000,
          squad_market_value: 80000,
          borrowings_nc: 109000,
          borrowings_c: 40000,
          cash: 3500,
        },
        {
          label: "2019/20",
          revenue_operating: 68000,
          net_result: 12000,
          equity: -9000,
          squad_market_value: 85000,
          borrowings_nc: 88000,
          borrowings_c: 37000,
          cash: 15000,
        },
        {
          label: "2020/21",
          revenue_operating: 64000,
          net_result: -32000,
          equity: -41000,
          squad_market_value: 90000,
          borrowings_nc: 39000,
          borrowings_c: 90000,
          cash: 9600,
        },
        {
          label: "2021/22",
          revenue_operating: 122000,
          net_result: 25000,
          equity: -16000,
          squad_market_value: 95000,
          borrowings_nc: 101000,
          borrowings_c: 56000,
          cash: 4800,
        },
        {
          label: "2022/23",
          revenue_operating: 125000,
          net_result: 25000,
          equity: 8000,
          squad_market_value: 100000,
          borrowings_nc: 78000,
          borrowings_c: 60000,
          cash: 8600,
        },
        {
          label: "2023/24",
          revenue_operating: 102000,
          net_result: 12000,
          equity: 20000,
          squad_market_value: 110000,
          borrowings_nc: 108000,
          borrowings_c: 41000,
          cash: 7000,
        },
        {
          label: "2024/25",
          revenue_operating: 148000,
          net_result: 20000,
          equity: 40000,
          squad_market_value: 120000,
          borrowings_nc: 123000,
          borrowings_c: 25000,
          cash: 15000,
        },
      ],
    };
    state.setEndSeasonIndex(state.DATASET.annual_data.length - 1);
    initChartDefaults();
  });

  it("builds chartHero without crashing and includes annotations", () => {
    // Intercept console warnings or errors
    const warnings = [];
    const errors = [];
    const origWarn = console.warn;
    const origError = console.error;
    console.warn = (...args) => warnings.push(args.join(" "));
    console.error = (...args) => errors.push(args.join(" "));

    try {
      chartHero();
      const chart = chartRegistry.get("chartHero");

      console.log("Warnings emitted during chart build:", warnings);
      console.log("Errors emitted during chart build:", errors);

      expect(chart).toBeDefined();
      expect(errors.length).toBe(0);

      // Check if annotations are present in the options config
      const annotationConfig = chart.config.options.plugins.annotation;
      expect(annotationConfig).toBeDefined();
      expect(annotationConfig.annotations).toBeDefined();

      // Check restructure14 annotation details
      const restructuringAnno = annotationConfig.annotations.e_restructure14;
      expect(restructuringAnno).toBeDefined();
      expect(restructuringAnno.type).toBe("line");
      expect(restructuringAnno.xMin).toBe("2014/15");
      expect(restructuringAnno.xMax).toBe("2014/15");
    } finally {
      console.warn = origWarn;
      console.error = origError;
    }
  });

  it("builds chartNetResult, chartEquity, and chartRevenue without crashing", () => {
    const errors = [];
    const origError = console.error;
    console.error = (...args) => errors.push(args.join(" "));

    try {
      chartNetResult();
      chartEquity();
      chartRevenue();

      const netChart = chartRegistry.get("chartNetResult");
      const eqChart = chartRegistry.get("chartEquity");
      const revChart = chartRegistry.get("chartRevenue");

      expect(netChart).toBeDefined();
      expect(eqChart).toBeDefined();
      expect(revChart).toBeDefined();
      expect(errors.length).toBe(0);
    } finally {
      console.error = origError;
    }
  });

  it("generateAccessibleTable creates a table and a toggle button that toggles accessibility classes", () => {
    const config = {
      data: {
        labels: ["2012/13", "2013/14"],
        datasets: [{ label: "Revenue", data: [100000, 120000] }],
      },
    };

    generateAccessibleTable("chartHero", config);

    const table = document.querySelector("table");
    expect(table).toBeDefined();
    expect(table.className).toBe("data");
    expect(table.caption.textContent).toBe("Data table for chart chartHero");

    const wrapper = document.getElementById("chartHero-a11y-table-wrap");
    expect(wrapper).toBeDefined();
    expect(wrapper.classList.contains("sr-only")).toBe(true);

    const canvas = document.getElementById("chartHero");
    expect(canvas.classList.contains("hidden")).toBe(false);

    const btn = document.getElementById("chartHero-table-toggle");
    expect(btn).toBeDefined();
    expect(btn.textContent).toBe("View raw table data");
    expect(btn.getAttribute("aria-expanded")).toBe("false");

    btn.click();
    expect(wrapper.classList.contains("sr-only")).toBe(false);
    expect(canvas.classList.contains("hidden")).toBe(true);
    expect(btn.textContent).toBe("Hide table data");
    expect(btn.getAttribute("aria-expanded")).toBe("true");

    btn.click();
    expect(wrapper.classList.contains("sr-only")).toBe(true);
    expect(canvas.classList.contains("hidden")).toBe(false);
    expect(btn.textContent).toBe("View raw table data");
    expect(btn.getAttribute("aria-expanded")).toBe("false");

    state.isPt = true;
    generateAccessibleTable("chartHero", config);
    expect(btn.textContent).toBe("Ver dados em tabela");

    btn.click();
    expect(btn.textContent).toBe("Ocultar tabela");

    state.isPt = false;
  });

  it("externalTooltipHandler creates, positions and formats the custom HTML tooltip", () => {
    const canvas = document.getElementById("chartHero");
    canvas.getBoundingClientRect = () => ({
      left: 100,
      top: 200,
      width: 400,
      height: 300,
      right: 500,
      bottom: 500,
    });

    const mockChart = {
      canvas: canvas,
    };

    const mockTooltip = {
      opacity: 1,
      title: ["Year 2023/24"],
      body: [{ lines: ["Receitas: 125.0M€"] }, { lines: ["Custos: 98.0M€"] }],
      labelColors: [
        { backgroundColor: "green", borderColor: "darkgreen" },
        { backgroundColor: "red", borderColor: "darkred" },
      ],
      footer: ["Total Profit: 27.0M€"],
      caretX: 50,
      caretY: 80,
    };

    const context = {
      chart: mockChart,
      tooltip: mockTooltip,
    };

    externalTooltipHandler(context);

    const tooltipEl = document.getElementById("chartjs-tooltip");
    expect(tooltipEl).toBeDefined();
    expect(tooltipEl.classList.contains("hidden")).toBe(false);

    const titleEl = tooltipEl.querySelector(".glass-tooltip-title");
    expect(titleEl.textContent).toBe("Year 2023/24");

    const rows = tooltipEl.querySelectorAll(".glass-tooltip-row");
    expect(rows.length).toBe(2);

    const colorSpan1 = rows[0].querySelector(".glass-tooltip-color");
    expect(colorSpan1.style.backgroundColor).toBe("green");
    const textSpan1 = rows[0].querySelector(".glass-tooltip-text");
    expect(textSpan1.innerHTML).toContain("Receitas: <strong>125.0M€</strong>");

    const colorSpan2 = rows[1].querySelector(".glass-tooltip-color");
    expect(colorSpan2.style.backgroundColor).toBe("red");
    const textSpan2 = rows[1].querySelector(".glass-tooltip-text");
    expect(textSpan2.innerHTML).toContain("Custos: <strong>98.0M€</strong>");

    const footerEl = tooltipEl.querySelector(".glass-tooltip-footer");
    expect(footerEl).toBeDefined();
    expect(
      footerEl.querySelector(".glass-tooltip-footer-line").textContent,
    ).toBe("Total Profit: 27.0M€");

    const expectedX = 100 + window.pageXOffset + 50;
    const expectedY = 200 + window.pageYOffset + 80;

    expect(tooltipEl.style.left).toBe(expectedX + "px");
    expect(tooltipEl.style.top).toBe(expectedY - 12 + "px");

    externalTooltipHandler({
      chart: mockChart,
      tooltip: { opacity: 0 },
    });
    expect(tooltipEl.classList.contains("hidden")).toBe(true);
  });
});
