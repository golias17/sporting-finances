import { describe, it, expect, vi } from "vitest";
import {
  fmtM,
  signColorCell,
  thresholdColorCell,
  combineCellColorers,
} from "../../src/ui/pdfGenerator.js";

// These four are pure helpers with no jsPDF/canvas dependency — exported
// from pdfGenerator.js specifically so they're testable in isolation from
// the page-drawing functions around them (which do need a mocked jsPDF
// instance, see pdfGenerator.test.js). Previously untested: pdfGenerator.js
// is the largest file in src/ but only had 2 tests, both exercising the
// full generateCuratedPdf() happy path.
describe("pdfGenerator.js — fmtM()", () => {
  it("formats a positive value in millions with an M€ suffix", () => {
    expect(fmtM(12345)).toBe("12.3 M€");
  });

  it("prefixes negative values with a plain hyphen (not fmtMillions' minus sign)", () => {
    expect(fmtM(-5000)).toBe("-5.0 M€");
  });

  it("returns an em dash for null/undefined", () => {
    expect(fmtM(null)).toBe("—");
    expect(fmtM(undefined)).toBe("—");
  });

  it("formats zero without a sign", () => {
    expect(fmtM(0)).toBe("0.0 M€");
  });
});

// Minimal fake of the shape jspdf-autotable's didParseCell callback
// receives — just enough for these colorers to read/write.
function fakeCell({ section = "body", colIndex = 0, text = "" } = {}) {
  return {
    section,
    column: { index: colIndex },
    cell: { text: [text], styles: {} },
  };
}

const colors = { positive: "#0a5d3a", negative: "#b8403a" };

describe("pdfGenerator.js — signColorCell()", () => {
  it("colors a '-'-prefixed value negative and bold", () => {
    const colorer = signColorCell(2, colors);
    const cellData = fakeCell({ colIndex: 2, text: "-5.0 M€" });
    colorer(cellData);
    expect(cellData.cell.styles.textColor).toBe(colors.negative);
    expect(cellData.cell.styles.fontStyle).toBe("bold");
  });

  it("colors a genuine positive non-zero value positive and bold", () => {
    const colorer = signColorCell(2, colors);
    const cellData = fakeCell({ colIndex: 2, text: "5.0 M€" });
    colorer(cellData);
    expect(cellData.cell.styles.textColor).toBe(colors.positive);
    expect(cellData.cell.styles.fontStyle).toBe("bold");
  });

  it("leaves zero and em-dash values unstyled", () => {
    for (const text of ["0.0 M€", "—"]) {
      const colorer = signColorCell(2, colors);
      const cellData = fakeCell({ colIndex: 2, text });
      colorer(cellData);
      expect(cellData.cell.styles.textColor).toBeUndefined();
    }
  });

  it("ignores cells outside the body section or in a different column", () => {
    const colorer = signColorCell(2, colors);

    const headerCell = fakeCell({
      section: "head",
      colIndex: 2,
      text: "-5.0 M€",
    });
    colorer(headerCell);
    expect(headerCell.cell.styles.textColor).toBeUndefined();

    const otherColCell = fakeCell({ colIndex: 3, text: "-5.0 M€" });
    colorer(otherColCell);
    expect(otherColCell.cell.styles.textColor).toBeUndefined();
  });
});

describe("pdfGenerator.js — thresholdColorCell()", () => {
  // Mirrors a "higher is worse" column, e.g. payroll ratio.
  const higherIsWorse = () =>
    thresholdColorCell(
      1,
      { negativeIf: (v) => v >= 70, positiveIf: (v) => v < 60 },
      colors,
    );

  it("colors negative when the value crosses the negativeIf threshold", () => {
    const colorer = higherIsWorse();
    const cellData = fakeCell({ colIndex: 1, text: "75%" });
    colorer(cellData);
    expect(cellData.cell.styles.textColor).toBe(colors.negative);
  });

  it("colors positive when the value crosses the positiveIf threshold", () => {
    const colorer = higherIsWorse();
    const cellData = fakeCell({ colIndex: 1, text: "45%" });
    colorer(cellData);
    expect(cellData.cell.styles.textColor).toBe(colors.positive);
  });

  it("leaves values in the neutral middle band unstyled", () => {
    const colorer = higherIsWorse();
    const cellData = fakeCell({ colIndex: 1, text: "65%" });
    colorer(cellData);
    expect(cellData.cell.styles.textColor).toBeUndefined();
  });

  it("does nothing for an em-dash or empty value", () => {
    const colorer = higherIsWorse();
    const cellData = fakeCell({ colIndex: 1, text: "—" });
    colorer(cellData);
    expect(cellData.cell.styles.textColor).toBeUndefined();
  });
});

describe("pdfGenerator.js — combineCellColorers()", () => {
  it("calls every colorer passed in, in order, against the same cell data", () => {
    const calls = [];
    const first = vi.fn(() => calls.push("first"));
    const second = vi.fn(() => calls.push("second"));
    const combined = combineCellColorers(first, second);

    const cellData = fakeCell();
    combined(cellData);

    expect(first).toHaveBeenCalledWith(cellData);
    expect(second).toHaveBeenCalledWith(cellData);
    expect(calls).toEqual(["first", "second"]);
  });

  it("lets a real signColorCell + thresholdColorCell pair color different columns independently", () => {
    const combined = combineCellColorers(
      signColorCell(0, colors),
      thresholdColorCell(
        1,
        { negativeIf: (v) => v >= 2, positiveIf: (v) => v < 1 },
        colors,
      ),
    );

    const feeCell = fakeCell({ colIndex: 0, text: "-10.0 M€" });
    combined(feeCell);
    expect(feeCell.cell.styles.textColor).toBe(colors.negative);

    const ratioCell = fakeCell({ colIndex: 1, text: "2x" });
    combined(ratioCell);
    expect(ratioCell.cell.styles.textColor).toBe(colors.negative);
  });
});
