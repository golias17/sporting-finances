import type { CellData, ColorPalette, ThresholdConfig } from "./pdfTypes.js";

// Format Helper: Millions with spaces before units. Shared by every page —
// a plain function (not a closure) so it doesn't need to be threaded
// through the page-drawing functions' context object. Exported (along with
// the three cell-colorer helpers below) purely so they are unit-testable in
// isolation — they are pure functions with no jsPDF/canvas dependency,
// unlike the page-drawing functions around them.
export function fmtM(val: number | null | undefined) {
  if (val === null || val === undefined) return "—";
  const sign = val < 0 ? "-" : "";
  return `${sign}${Math.abs(val / 1000).toFixed(1)} M€`;
}

// autoTable didParseCell helpers — each table below colors one or two
// "is this good or bad" columns red/green. These two shapes (fmtM's
// "-"-prefixed M€ strings, and parseInt'd percentage/multiple strings)
// used to be hand-copied at every call site (identically, in the "-"-prefix
// case) instead of shared, which is how the sign-based block ended up
// pasted verbatim at three different column indices.

// Colors a column red if its fmtM()-formatted value starts with "-",
// green if it is a genuine positive non-zero value, and leaves zero/"—"
// unstyled.
export function signColorCell(colIndex: number, colors: ColorPalette) {
  return (cellData: CellData) => {
    if (cellData.section !== "body" || cellData.column.index !== colIndex)
      return;
    const val = cellData.cell.text[0];
    if (val && val.startsWith("-")) {
      cellData.cell.styles.textColor = colors.negative;
      cellData.cell.styles.fontStyle = "bold";
    } else if (val && val !== "—" && val !== "0.0 M€" && !val.startsWith("0")) {
      cellData.cell.styles.textColor = colors.positive;
      cellData.cell.styles.fontStyle = "bold";
    }
  };
}

// Colors a column based on a parseInt'd numeric threshold (a percentage or
// a "2.0x"-style multiple) — the caller supplies the red/green predicates,
// since the thresholds and their direction (higher-is-worse vs
// higher-is-better) differ per column.
export function thresholdColorCell(
  colIndex: number,
  { negativeIf, positiveIf }: ThresholdConfig,
  colors: ColorPalette,
) {
  return (cellData: CellData) => {
    if (cellData.section !== "body" || cellData.column.index !== colIndex)
      return;
    const str = cellData.cell.text[0];
    if (!str || str === "—") return;
    const val = parseInt(str, 10);
    if (negativeIf(val)) {
      cellData.cell.styles.textColor = colors.negative;
      cellData.cell.styles.fontStyle = "bold";
    } else if (positiveIf(val)) {
      cellData.cell.styles.textColor = colors.positive;
      cellData.cell.styles.fontStyle = "bold";
    }
  };
}

// Combines several column-colorers (each already bound to a `colors`
// palette) into the single didParseCell callback autoTable expects.
export function combineCellColorers(...colorers: Array<(cellData: CellData) => void>) {
  return (cellData: CellData) => colorers.forEach((c) => c(cellData));
}

/**
 * Helper: Converts a relative image path to a Base64 data URL using a temporary canvas.
 */
export function getBase64ImageFromUrl(url: string) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL("image/png");
      resolve(dataURL);
    };
    img.onerror = (e) => reject(e);
    img.src = url;
  });
}
