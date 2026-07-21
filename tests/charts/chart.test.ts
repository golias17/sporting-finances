/* eslint-disable no-console */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { state } from "../../src/core/state.js";
import {
  initChartDefaults,
  generateAccessibleTable,
  externalTooltipHandler,
  addChartDownloadButton,
  getPitchMilestone,
} from "../../src/charts/chartUtils.js";
import {
  chartHero,
  chartNetResult,
  chartEquity,
  chartRevenue,
  chartRevStreams,
  chartRevVsPayroll,
  chartOpResult,
  chartPayrollBurden,
  chartTransferReliance,
  chartDebtLoad,
  chartCurrentRatio,
  chartDebt,
  chartAssetsLiab,
  chartDebtMaturity,
  chartSquadBook,
  chartTransfers,
  chartNetTrading,
  chartCashFlow,
  chartCash,
  chartAnnualNet,
} from "../../src/charts/charts.js";
import { chartRegistry } from "../../src/charts/chartUtils.js";
import { mockChartEnvironment } from "./chartTestUtils.js";

describe("Chart.js and Annotation Plugin integration", () => {
  beforeAll(() => {
    mockChartEnvironment();

    // Create mock canvas elements on the DOM
    document.body.innerHTML = `
      <canvas id="chartHero"></canvas>
      <canvas id="chartNetResult"></canvas>
      <canvas id="chartEquity"></canvas>
      <canvas id="chartRevenue"></canvas>
      <canvas id="chartRevStreams"></canvas>
      <canvas id="chartRevVsPayroll"></canvas>
      <canvas id="chartOpResult"></canvas>
      <canvas id="chartPayrollBurden"></canvas>
      <canvas id="chartTransferReliance"></canvas>
      <canvas id="chartDebtLoad"></canvas>
      <canvas id="chartCurrentRatio"></canvas>
      <canvas id="chartDebt"></canvas>
      <canvas id="chartAssetsLiab"></canvas>
      <canvas id="chartDebtMaturity"></canvas>
      <canvas id="chartSquadBook"></canvas>
      <canvas id="chartTransfers"></canvas>
      <canvas id="chartNetTrading"></canvas>
      <canvas id="chartCashFlow"></canvas>
      <canvas id="chartCash"></canvas>
      <canvas id="chartAnnualNet"></canvas>
    `;

    // Mock the annual data dataset
    state.setDataset({
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
      h1_2526: {
        squad_market_value: 125000,
        cash: 20000,
      },
    });
    initChartDefaults();
  });

  afterAll(() => {
    chartRegistry.forEach((chart) => {
      chart.destroy();
    });
    chartRegistry.clear();
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

  it("builds all other charts without crashing", () => {
    const errors = [];
    const origError = console.error;
    console.error = (...args) => errors.push(args.join(" "));

    try {
      chartNetResult();
      chartEquity();
      chartRevenue();
      chartRevStreams();
      chartRevVsPayroll();
      chartOpResult();
      chartPayrollBurden();
      chartTransferReliance();
      chartDebtLoad();
      chartCurrentRatio();
      chartDebt();
      chartAssetsLiab();
      chartDebtMaturity();
      chartSquadBook();
      chartTransfers();
      chartNetTrading();
      chartCashFlow();
      chartCash();
      chartAnnualNet();

      const netChart = chartRegistry.get("chartNetResult");
      expect(netChart).toBeDefined();
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

    state.setIsPt(true);
    generateAccessibleTable("chartHero", config);
    expect(btn.textContent).toBe("Ver dados em tabela");

    btn.click();
    expect(btn.textContent).toBe("Ocultar tabela");

    state.setIsPt(false);
  });

  it("generateAccessibleTable formats chartDebtLoad and chartCurrentRatio as '×' ratios, not % or €M", () => {
    const ratioConfig = {
      data: {
        labels: ["2012/13", "2013/14"],
        datasets: [{ label: "Net debt / revenue", data: [1.5, -0.85] }],
      },
    };

    generateAccessibleTable("chartDebtLoad", ratioConfig);
    const dlTable = document.getElementById("chartDebtLoad-a11y-table");
    const dlCells = [...dlTable.querySelectorAll("tbody td:nth-child(2)")].map(
      (td) => td.textContent,
    );
    expect(dlCells).toEqual(["1.5×", "−0.8×"]);

    generateAccessibleTable("chartCurrentRatio", ratioConfig);
    const crTable = document.getElementById("chartCurrentRatio-a11y-table");
    const crCells = [...crTable.querySelectorAll("tbody td:nth-child(2)")].map(
      (td) => td.textContent,
    );
    expect(crCells).toEqual(["1.5×", "−0.8×"]);
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

    const expectedX = 100 + window.scrollX + 50;
    const expectedY = 200 + window.scrollY + 80;

    expect(tooltipEl.style.left).toBe(expectedX + "px");
    expect(tooltipEl.style.top).toBe(expectedY - 12 + "px");

    externalTooltipHandler({
      chart: mockChart,
      tooltip: { opacity: 0 },
    });
    expect(tooltipEl.classList.contains("hidden")).toBe(true);
  });

  it("addChartDownloadButton attaches a button to the card-head that triggers download on click", () => {
    const canvas = document.getElementById("chartHero");
    const card = document.createElement("div");
    card.className = "card";
    const cardHead = document.createElement("div");
    cardHead.className = "card-head";
    const tag = document.createElement("span");
    tag.className = "tag";
    cardHead.appendChild(tag);
    card.appendChild(cardHead);
    card.appendChild(canvas);
    document.body.appendChild(card);

    addChartDownloadButton("chartHero");

    const btn = document.getElementById("chartHero-download-btn");
    expect(btn).toBeDefined();
    expect(btn.className).toBe("chart-download-btn");
    expect(btn.title).toBe("Download chart as PNG image");

    // Mock HTMLCanvasElement.toDataURL and HTMLAnchorElement.prototype.click
    const origToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = () => "data:image/png;base64,mock";

    let clicked = false;
    const origClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      clicked = true;
      expect(this.download).toBe("chartHero.png");
      expect(this.href).toBe("data:image/png;base64,mock");
    };

    btn.click();
    expect(clicked).toBe(true);

    // Restore mocks
    HTMLCanvasElement.prototype.toDataURL = origToDataURL;
    HTMLAnchorElement.prototype.click = origClick;
  });

  it("addChartDownloadButton updates labels on language changes if button already exists", () => {
    // Setup elements
    const canvas = document.getElementById("chartNetResult");
    const card = document.createElement("div");
    card.className = "card";
    const cardHead = document.createElement("div");
    cardHead.className = "card-head";
    const tag = document.createElement("span");
    tag.className = "tag";
    cardHead.appendChild(tag);
    card.appendChild(cardHead);
    card.appendChild(canvas);
    document.body.appendChild(card);

    state.setIsPt(false);
    addChartDownloadButton("chartNetResult");

    const btn = document.getElementById("chartNetResult-download-btn");
    expect(btn).not.toBeNull();
    expect(btn.title).toBe("Download chart as PNG image");

    // Call again with isPt = true
    state.setIsPt(true);
    addChartDownloadButton("chartNetResult");

    expect(btn.title).toBe("Descarregar gráfico como imagem PNG");
    state.setIsPt(false);
  });

  it("addChartDownloadButton appends to cardHead directly when tag element is missing", () => {
    const canvas = document.getElementById("chartEquity");
    const card = document.createElement("div");
    card.className = "card";
    const cardHead = document.createElement("div");
    cardHead.className = "card-head";
    card.appendChild(cardHead);
    card.appendChild(canvas);
    document.body.appendChild(card);

    addChartDownloadButton("chartEquity");

    const btn = document.getElementById("chartEquity-download-btn");
    expect(btn).not.toBeNull();
    expect(cardHead.contains(btn)).toBe(true);
  });

  it("should format tooltips correctly via callbacks", () => {
    chartRevStreams();
    chartPayrollBurden();
    chartSquadBook();
    chartTransferReliance();
    chartDebtLoad();
    chartCurrentRatio();
    chartRevVsPayroll();
    chartDebtMaturity();

    // 1. chartRevStreams
    const revStreamsChart = chartRegistry.get("chartRevStreams");
    const revStreamsLabel =
      revStreamsChart.config.options.plugins.tooltip.callbacks.label({
        parsed: { y: 25000 },
        dataset: { label: "TV" },
      });
    expect(revStreamsLabel).toContain("TV: €25.0M");
    // Its footer callback sums every dataset's y value shown in the
    // tooltip's item list (one per stacked segment for the hovered season)
    // into a single "Total: €XM" line.
    const revStreamsFooter =
      revStreamsChart.config.options.plugins.tooltip.callbacks.footer([
        { parsed: { y: 25000 } },
        { parsed: { y: 15000 } },
        { parsed: { y: 10000 } },
      ]);
    expect(revStreamsFooter).toBe("Total: €50.0M");

    // chartRevVsPayroll
    const rvpChart = chartRegistry.get("chartRevVsPayroll");
    const rvpLabel = rvpChart.config.options.plugins.tooltip.callbacks.label({
      parsed: { y: 65 },
    });
    expect(rvpLabel).toBe("Ratio: 65%");

    // chartDebtMaturity
    const dmChart = chartRegistry.get("chartDebtMaturity");
    const dmLabel = dmChart.config.options.plugins.tooltip.callbacks.label({
      parsed: { y: 42 },
    });
    expect(dmLabel).toBe("Long-term: 42%");

    // 2. chartPayrollBurden
    const pbChart = chartRegistry.get("chartPayrollBurden");
    const pbLabel = pbChart.config.options.plugins.tooltip.callbacks.label({
      parsed: { y: 65 },
    });
    expect(pbLabel).toContain("Wage bill: 65% of revenue");

    // 3. chartSquadBook
    const squadChart = chartRegistry.get("chartSquadBook");
    const squadLabel =
      squadChart.config.options.plugins.tooltip.callbacks.label({
        parsed: { y: 120000 },
        dataset: { label: "Valor contabilístico" },
      });
    expect(squadLabel).toBe("Valor contabilístico: €120.0M");
    // test null y
    const squadLabelNull =
      squadChart.config.options.plugins.tooltip.callbacks.label({
        parsed: { y: null },
      });
    expect(squadLabelNull).toBeNull();

    // 4. chartTransferReliance
    const trChart = chartRegistry.get("chartTransferReliance");
    const trLabel = trChart.config.options.plugins.tooltip.callbacks.label({
      parsed: { y: 80 },
    });
    expect(trLabel).toContain("Transfer reliance: 80%");

    // 5. chartDebtLoad
    const dlChart = chartRegistry.get("chartDebtLoad");
    const dlLabel = dlChart.config.options.plugins.tooltip.callbacks.label({
      parsed: { y: 1.5 },
    });
    expect(dlLabel).toContain("Net debt: 1.5× annual revenue");

    // 6. chartCurrentRatio
    const crChart = chartRegistry.get("chartCurrentRatio");
    const crLabel = crChart.config.options.plugins.tooltip.callbacks.label({
      parsed: { y: 0.85 },
    });
    expect(crLabel).toContain("Current ratio: 0.85×");
  });

  it("should format tooltips in Portuguese correctly", () => {
    state.setIsPt(true);
    chartPayrollBurden();
    chartTransferReliance();
    chartDebtLoad();
    chartCurrentRatio();
    chartRevVsPayroll();
    chartDebtMaturity();

    const pbChart = chartRegistry.get("chartPayrollBurden");
    const pbLabel = pbChart.config.options.plugins.tooltip.callbacks.label({
      parsed: { y: 65 },
    });
    expect(pbLabel).toContain("Custos com pessoal: 65% da receita");

    const trChart = chartRegistry.get("chartTransferReliance");
    const trLabel = trChart.config.options.plugins.tooltip.callbacks.label({
      parsed: { y: 80 },
    });
    expect(trLabel).toContain("Dependência de passes: 80%");

    const dlChart = chartRegistry.get("chartDebtLoad");
    const dlLabel = dlChart.config.options.plugins.tooltip.callbacks.label({
      parsed: { y: 1.5 },
    });
    expect(dlLabel).toContain("Dívida líquida: 1.5× receita anual");

    const crChart = chartRegistry.get("chartCurrentRatio");
    const crLabel = crChart.config.options.plugins.tooltip.callbacks.label({
      parsed: { y: 0.85 },
    });
    expect(crLabel).toContain("Rácio de solvência: 0.85×");

    const rvpChart = chartRegistry.get("chartRevVsPayroll");
    const rvpLabel = rvpChart.config.options.plugins.tooltip.callbacks.label({
      parsed: { y: 65 },
    });
    expect(rvpLabel).toBe("Rácio: 65%");

    const dmChart = chartRegistry.get("chartDebtMaturity");
    const dmLabel = dmChart.config.options.plugins.tooltip.callbacks.label({
      parsed: { y: 42 },
    });
    expect(dmLabel).toBe("Longo prazo: 42%");

    state.setIsPt(false); // restore
  });

  it("renders null (not Infinity/NaN) for ratio charts when a season's denominator is zero", () => {
    const originalDataset = state.DATASET;
    const zeroSeason = {
      label: "9999/00",
      revenue_operating: 0,
      player_transfer_income: 0,
      net_result: 0,
      equity: 0,
      squad_market_value: 0,
      personnel_costs: -1000,
      borrowings_nc: 0,
      borrowings_c: 0,
      current_assets: 5000,
      current_liabilities: 0,
      cash: 0,
    };
    state.setDataset({
      ...originalDataset,
      annual_data: [...originalDataset.annual_data, zeroSeason],
    });
    const lastIdx = state.DATASET.annual_data.length - 1;

    try {
      chartRevVsPayroll();
      chartPayrollBurden();
      chartTransferReliance();
      chartDebtLoad();
      chartCurrentRatio();
      chartDebtMaturity();

      const checks = [
        "chartRevVsPayroll",
        "chartPayrollBurden",
        "chartTransferReliance",
        "chartDebtLoad",
        "chartCurrentRatio",
        "chartDebtMaturity",
      ];

      checks.forEach((id) => {
        const chart = chartRegistry.get(id);
        const value = chart.config.data.datasets[0].data[lastIdx];
        expect(value, `${id} should be null, not Infinity/NaN`).toBeNull();
      });
    } finally {
      state.setDataset(originalDataset);
    }
  });

  // chartRevStreams() derives a 4th "other operating income" series as the
  // gap between total revenue and the three named streams — but only for
  // seasons that actually report rev_tv_comp/rev_matchday/rev_commercial
  // (older seasons in the real dataset predate that breakdown and are
  // skipped via the `d.rev_tv_comp == null` guard, which every season in
  // this file's shared mock DATASET hits — none of them set those fields).
  // These two seasons add the breakdown fields to exercise the actual gap
  // computation, covering both its outcomes: a real gap worth showing, and
  // a rounding-noise gap small enough to suppress as null.
  it("computes the 'other operating income' gap only for seasons with a revenue breakdown, suppressing negligible gaps", () => {
    const originalDataset = state.DATASET;
    const withGap = {
      label: "9997/98",
      revenue_operating: 100000,
      rev_tv_comp: 40000,
      rev_matchday: 20000,
      rev_commercial: 30000, // gap = 10000 — a real "other" segment
    };
    const negligibleGap = {
      label: "9998/99",
      revenue_operating: 90000,
      rev_tv_comp: 40000,
      rev_matchday: 20000,
      rev_commercial: 30000, // gap = 0 — suppressed to null, not plotted
    };
    state.setDataset({
      ...originalDataset,
      annual_data: [...originalDataset.annual_data, withGap, negligibleGap],
    });

    try {
      chartRevStreams();
      const other =
        chartRegistry.get("chartRevStreams").config.data.datasets[3].data;
      expect(other[other.length - 2]).toBe(10000);
      expect(other[other.length - 1]).toBeNull();
    } finally {
      state.setDataset(originalDataset);
    }
  });

  describe("getPitchMilestone", () => {
    it("returns correct English milestone text for championships and manager changes", () => {
      state.setIsPt(false);
      expect(getPitchMilestone("2020/21")).toContain(
        "Champions! First Primeira Liga title in 19 years.",
      );
      expect(getPitchMilestone("2019/20")).toContain(
        "Rúben Amorim appointed in March",
      );
      expect(getPitchMilestone("2025/26 H1")).toContain(
        "Title contention under João Pereira.",
      );
    });

    it("returns correct Portuguese milestone text on isPt = true", () => {
      state.setIsPt(true);
      expect(getPitchMilestone("2020/21")).toContain(
        "Campeões! 1º título da Primeira Liga em 19 anos.",
      );
      expect(getPitchMilestone("2019/20")).toContain(
        "Rúben Amorim contratado em Março",
      );
      state.setIsPt(false); // restore
    });
  });
});
