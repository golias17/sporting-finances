export interface ExportCsvOptions {
  delimiter?: string;
}

/**
 * Converts headers and rows of data into a 100% MS Excel compatible CSV blob.
 * Uses UTF-8 BOM (\uFEFF), CRLF (\r\n) line endings, and full cell quoting for MS Excel (Windows & Mac).
 */
export function exportToCsv(
  filename: string,
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][],
  options: ExportCsvOptions = {},
): void {
  const delimiter = options.delimiter ?? ";";

  const sanitizeCell = (
    val: string | number | boolean | null | undefined,
  ): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val);
    return `"${str.replace(/"/g, '""')}"`;
  };

  const headerLine = headers.map(sanitizeCell).join(delimiter);
  const rowLines = rows.map((row) => row.map(sanitizeCell).join(delimiter));

  // Use Windows CRLF (\r\n) line endings for universal MS Excel compatibility
  const csvText = [headerLine, ...rowLines].join("\r\n");

  // \uFEFF (UTF-8 BOM) at byte 0 ensures accents (Época, Saída, Comissão) display correctly in Excel
  const csvContent = "\uFEFF" + csvText;
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });

  if (typeof window !== "undefined" && typeof document !== "undefined") {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      filename.endsWith(".csv") ? filename : `${filename}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
