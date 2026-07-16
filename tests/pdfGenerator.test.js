import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { state } from "../src/state.js";
import { generateCuratedPdf } from "../src/pdfGenerator.js";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Mock jspdf
vi.mock("jspdf", () => {
  const saveMock = vi.fn();
  const textMock = vi.fn();
  const addPageMock = vi.fn();
  const lineMock = vi.fn();
  const rectMock = vi.fn();
  const setFillColorMock = vi.fn();
  const setTextColorMock = vi.fn();
  const setDrawColorMock = vi.fn();
  const setFontMock = vi.fn();
  const setFontSizeMock = vi.fn();
  const addImageMock = vi.fn();
  const splitTextToSizeMock = vi.fn().mockImplementation((text) => [text]);

  const jsPDFMock = vi.fn().mockImplementation(function () {
    return {
      save: saveMock,
      text: textMock,
      addPage: addPageMock,
      line: lineMock,
      rect: rectMock,
      setFillColor: setFillColorMock,
      setTextColor: setTextColorMock,
      setDrawColor: setDrawColorMock,
      setFont: setFontMock,
      setFontSize: setFontSizeMock,
      addImage: addImageMock,
      splitTextToSize: splitTextToSizeMock,
    };
  });

  return { jsPDF: jsPDFMock };
});

// Mock jspdf-autotable
vi.mock("jspdf-autotable", () => {
  return {
    default: vi.fn().mockImplementation((doc) => {
      doc.lastAutoTable = { finalY: 150 };
    }),
  };
});

describe("pdfGenerator.js", () => {
  let originalImage;

  beforeEach(() => {
    // Mock global.Image to avoid hanging on relative file loading inside jsdom
    originalImage = global.Image;
    global.Image = class {
      constructor() {
        setTimeout(() => {
          if (this.onerror) {
            this.onerror(new Error("Mock image load fail"));
          }
        }, 1);
      }
    };

    // Populate minimal mock dataset
    state.DATASET = {
      annual_data: [
        {
          label: "2012/13",
          revenue_operating: 30000,
          personnel_costs: -15000,
          equity: -119000,
          borrowings_nc: 100000,
          borrowings_c: 20000,
          cash: 1300,
          cf_operating: 10000,
          cf_investing: -5000,
          cf_financing: 2000,
          total_assets: 80000,
          non_current_liabilities: 90000,
          current_liabilities: 30000,
          player_transfer_income: 10000,
          player_transfer_cost: -5000,
          squad_book_value: 30000,
          squad_market_value: 50000,
        },
        {
          label: "2024/25",
          revenue_operating: 148000,
          personnel_costs: -88000,
          equity: 40900,
          borrowings_nc: 123000,
          borrowings_c: 25000,
          cash: 15000,
          cf_operating: 25000,
          cf_investing: -10000,
          cf_financing: -5000,
          total_assets: 190000,
          non_current_liabilities: 110000,
          current_liabilities: 40000,
          player_transfer_income: 40000,
          player_transfer_cost: -15000,
          squad_book_value: 80000,
          squad_market_value: 120000,
        },
      ],
      h1_2526: {
        label: "2025/26 H1",
        squad_market_value: 125000,
        cash: 20000,
      },
    };

    state.TRANSFER_LEDGER = [
      {
        season: "2024/25",
        transfers: [
          {
            player: "Morten Hjulmand",
            type: "in",
            fee: 18.0,
            club: "Lecce",
            note: "Standard buy",
          },
          {
            player: "Manuel Ugarte",
            type: "out",
            fee: 60.0,
            club: "PSG",
            note: "Record sell",
          },
        ],
      },
    ];

    state.isPt = false;
  });

  afterEach(() => {
    vi.clearAllMocks();
    global.Image = originalImage;
  });

  it("should generate and save the PDF in English by default", async () => {
    state.isPt = false;
    await generateCuratedPdf();

    // Verify jsPDF instantiation
    expect(jsPDF).toHaveBeenCalled();

    // Capture the mock instance
    const docInstance = vi.mocked(jsPDF).mock.results[0].value;

    // Verify save was called with default file name
    expect(docInstance.save).toHaveBeenCalledWith(
      "Sporting_SAD_Financial_Dossier.pdf",
    );

    // Verify that autotable was invoked to build P&L and Balance Sheet tables
    expect(autoTable).toHaveBeenCalled();

    // Verify some English content calls
    const textCalls = docInstance.text.mock.calls.map((c) => c[0]);
    expect(
      textCalls.some(
        (t) => t && t.includes("ANNUAL FINANCIAL ANALYSIS DOSSIER"),
      ),
    ).toBe(true);
    expect(
      textCalls.some(
        (t) => t && t.includes("Chronological Turnaround Milestones"),
      ),
    ).toBe(true);
  });

  it("should generate the PDF in Portuguese when state.isPt is true", async () => {
    state.isPt = true;
    await generateCuratedPdf();

    const docInstance = vi.mocked(jsPDF).mock.results[0].value;

    // Verify save was called
    expect(docInstance.save).toHaveBeenCalled();

    // Verify some Portuguese content calls
    const textCalls = docInstance.text.mock.calls.map((c) => c[0]);
    expect(
      textCalls.some(
        (t) => t && t.includes("DOSSIER ANUAL DE ANÁLISE FINANCEIRA"),
      ),
    ).toBe(true);
    expect(
      textCalls.some((t) => t && t.includes("Marcos Financeiros Cronológicos")),
    ).toBe(true);
  });
});
