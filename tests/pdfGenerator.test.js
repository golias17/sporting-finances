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
  const setLineWidthMock = vi.fn();
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
      setLineWidth: setLineWidthMock,
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
  let originalCreateElement;

  beforeEach(() => {
    // Mock global.Image to avoid hanging on relative file loading inside jsdom
    originalImage = global.Image;
    global.Image = class {
      constructor() {
        this.width = 100;
        this.height = 100;
        setTimeout(() => {
          if (this.onload) {
            this.onload();
          }
        }, 1);
      }
    };

    // Mock document.createElement for canvas support in jsdom
    originalCreateElement = document.createElement;
    document.createElement = vi.fn().mockImplementation((tagName) => {
      if (tagName === "canvas") {
        return {
          getContext: () => ({
            drawImage: () => {},
          }),
          toDataURL: () => "data:image/png;base64,fake",
          width: 0,
          height: 0,
        };
      }
      return originalCreateElement.call(document, tagName);
    });

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

    state.setIsPt(false);
  });

  afterEach(() => {
    vi.clearAllMocks();
    global.Image = originalImage;
    document.createElement = originalCreateElement;
  });

  it("should generate and save the PDF in English by default", async () => {
    state.setIsPt(false);
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
    state.setIsPt(true);
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

  // Page markers used below — one distinctive, English section title per
  // drawPage*() function (see pages[0..4] in generateCuratedPdf()).
  const PAGE_MARKERS = [
    "ANNUAL FINANCIAL ANALYSIS DOSSIER", // pages[0]: cover
    "I. Recurring Operating Revenues & Payroll Burden", // pages[1]: financial tables
    "III. Player Transfer Operations & Squad Appraisals", // pages[2]: trading/cash flow
    "V. Strategic Debt & Financing Instruments Profile", // pages[3]: financing timeline
    "VII-A. Landmark Player Transfers Ledger — Record Departures (Fee >= 10.0 M€)", // pages[4]: transfers ledger
  ];

  function textOf(docInstance) {
    // splitTextToSize-routed calls pass an array of lines as c[0] instead
    // of a plain string (see the splitTextToSizeMock above) — flatten both
    // shapes into one searchable string per call.
    return docInstance.text.mock.calls.map((c) =>
      Array.isArray(c[0]) ? c[0].join(" ") : c[0],
    );
  }

  it("only draws the selected pages when a partial `pages` array is passed", async () => {
    // Only the cover page (index 0) — every other page's marker should be
    // entirely absent from the output, not just "less prominent".
    await generateCuratedPdf({ pages: [true, false, false, false, false] });
    const docInstance = vi.mocked(jsPDF).mock.results[0].value;
    const calls = textOf(docInstance);

    expect(calls.some((t) => t === PAGE_MARKERS[0])).toBe(true);
    for (const marker of PAGE_MARKERS.slice(1)) {
      expect(calls.some((t) => t === marker)).toBe(false);
    }
    expect(docInstance.save).toHaveBeenCalled();
  });

  it("draws exactly the pages selected, in a non-default combination", async () => {
    // Financing timeline (index 3) and transfers ledger (index 4), but not
    // the cover, financial tables, or trading/cash-flow pages.
    await generateCuratedPdf({ pages: [false, false, false, true, true] });
    const docInstance = vi.mocked(jsPDF).mock.results[0].value;
    const calls = textOf(docInstance);

    expect(calls.some((t) => t === PAGE_MARKERS[0])).toBe(false);
    expect(calls.some((t) => t === PAGE_MARKERS[1])).toBe(false);
    expect(calls.some((t) => t === PAGE_MARKERS[2])).toBe(false);
    expect(calls.some((t) => t === PAGE_MARKERS[3])).toBe(true);
    expect(calls.some((t) => t === PAGE_MARKERS[4])).toBe(true);
  });

  // Regression test: drawTransfersLedgerPages() (pages[4]) iterates
  // state.TRANSFER_LEDGER unconditionally — with only state.DATASET
  // checked up front, requesting that page while the ledger is unset used
  // to throw partway through rendering instead of degrading gracefully.
  it("silently skips the transfers ledger page (without throwing) when TRANSFER_LEDGER is empty, but still draws the rest", async () => {
    state.TRANSFER_LEDGER = [];
    // If this still threw partway through, the missing `await` rejection
    // would fail the test on its own — no extra assertion needed for that.
    await generateCuratedPdf({ pages: [true, false, false, false, true] });

    const docInstance = vi.mocked(jsPDF).mock.results[0].value;
    const calls = textOf(docInstance);
    expect(calls.some((t) => t === PAGE_MARKERS[0])).toBe(true); // cover still drew
    expect(calls.some((t) => t === PAGE_MARKERS[4])).toBe(false); // ledger page skipped
    expect(docInstance.save).toHaveBeenCalled();
  });

  it("returns without saving a PDF when every page is deselected", async () => {
    await generateCuratedPdf({ pages: [false, false, false, false, false] });
    // jsPDF is still instantiated before the empty-selection check runs,
    // but nothing should ever get far enough to call .save().
    const docInstance = vi.mocked(jsPDF).mock.results[0].value;
    expect(docInstance.save).not.toHaveBeenCalled();
  });

  it("includes a custom executive note on the cover page when provided", async () => {
    await generateCuratedPdf({
      executiveNote: "Sold Ugarte for a club-record fee.",
    });
    const docInstance = vi.mocked(jsPDF).mock.results[0].value;
    const calls = textOf(docInstance);

    expect(
      calls.some(
        (t) =>
          t &&
          t.includes("Executive Annotation:") &&
          t.includes("Sold Ugarte for a club-record fee."),
      ),
    ).toBe(true);
  });

  it("omits the executive-note heading entirely when no note is provided", async () => {
    await generateCuratedPdf({ executiveNote: "" });
    const docInstance = vi.mocked(jsPDF).mock.results[0].value;
    const calls = textOf(docInstance);

    expect(calls.some((t) => t && t.includes("Executive Annotation:"))).toBe(
      false,
    );
  });

  it("localizes the executive note heading in Portuguese", async () => {
    state.setIsPt(true);
    await generateCuratedPdf({ executiveNote: "Nota de teste." });
    const docInstance = vi.mocked(jsPDF).mock.results[0].value;
    const calls = textOf(docInstance);

    expect(
      calls.some(
        (t) => t && t.includes("Nota Executiva:") && t.includes("Nota de teste."),
      ),
    ).toBe(true);
  });
});
