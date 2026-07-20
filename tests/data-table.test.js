import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { state } from "../src/state.js";
import { renderTable, initDataExport } from "../src/data-table.js";

describe("data-table.js", () => {
  beforeEach(() => {
    // Setup basic DOM
    document.body.innerHTML = `
      <div id="dataTable"></div>
      <button id="btnDownloadLedger"></button>
    `;

    // Setup state
    state.isPt = false;
    state.DATASET = {
      annual_data: [
        {
          label: "2012/13",
          revenue_operating: 30000,
          player_transfer_income: 10000,
          player_transfer_cost: -5000,
          personnel_costs: -18000,
          operating_result_total: 7000,
          financial_result: -2000,
          net_result: 5000,
          total_assets: 200000,
          equity: -119000,
          borrowings_nc: 100000,
          borrowings_c: 20000,
          cash: 1300,
          squad_book_value: 60000,
          squad_market_value: 50000,
          cf_operating: 1000,
          cf_investing: -500,
          cf_financing: -200,
        },
      ],
    };
    state.startSeasonIndex = 0;
    state.endSeasonIndex = Infinity;

    // Mock URL and Blob for downloadLedgerCSV
    global.URL.createObjectURL = vi.fn(() => "mock-url");
    global.URL.revokeObjectURL = vi.fn();
    global.Blob = class Blob {
      constructor(parts, options) {
        this.parts = parts;
        this.options = options;
      }
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should render a table inside #dataTable with the correct headers and formatted data", () => {
    renderTable();

    const container = document.getElementById("dataTable");
    const table = container.querySelector("table");

    expect(table).not.toBeNull();
    expect(table.classList.contains("data")).toBe(true);

    const headers = table.querySelectorAll("th");
    expect(headers[0].textContent).toBe("Metric");
    expect(headers[1].textContent).toBe("2012/13");

    const rows = table.querySelectorAll("tbody tr");
    expect(rows.length).toBeGreaterThan(0);

    // Verify negative values get the "neg" class
    // 2012/13 personnel_costs is -18000
    // Personnel Costs is the 4th row (index 3)
    const personnelRow = rows[3];
    const personnelData = personnelRow.querySelectorAll("td")[1];
    expect(personnelData.classList.contains("neg")).toBe(true);
    expect(personnelData.textContent).toBe("€−18.0M");

    // Check computed Net Debt row
    // Net Debt = nc (100000) + c (20000) - cash (1300) = 118700
    // Net Debt is the 13th row (index 12)
    const netDebtRow = rows[12];
    const netDebtData = netDebtRow.querySelectorAll("td")[1];
    expect(netDebtData.classList.contains("neg")).toBe(false);
    expect(netDebtData.textContent).toBe("€118.7M");
  });

  it("should format table headers in Portuguese when state.isPt is true", () => {
    state.isPt = true;
    renderTable();

    const container = document.getElementById("dataTable");
    const table = container.querySelector("table");
    const headers = table.querySelectorAll("th");

    expect(headers[0].textContent).toBe("Métrica");

    const firstRowLabel = table.querySelector("tbody tr td").textContent;
    expect(firstRowLabel).toBe("Receita Operacional"); // Portuguese label
  });

  it("should generate a CSV download on export button click", () => {
    // Setup a mock anchor element click interceptor
    const clickSpy = vi.spyOn(window.HTMLAnchorElement.prototype, "click");

    initDataExport();
    document.getElementById("btnDownloadLedger").click();

    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
  });

  it("should do nothing on initDataExport if download button is missing", () => {
    document.getElementById("btnDownloadLedger").remove();
    expect(() => initDataExport()).not.toThrow();
    // With no button to wire a listener onto, nothing else in the page
    // should be touched — confirms this is a genuine no-op early return,
    // not a partially-applied side effect.
    expect(document.getElementById("dataTable").innerHTML).toBe("");
    expect(global.URL.createObjectURL).not.toHaveBeenCalled();
  });
});
