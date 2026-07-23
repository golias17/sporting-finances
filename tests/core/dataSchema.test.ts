// Schema guard for the two hand-edited data files. Both are updated manually
// every season, and a missing or misspelled field flows silently into the
// charts as NaN — this test turns that into a loud CI failure instead.
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const financials = JSON.parse(
  fs.readFileSync(
    path.resolve(__dirname, "../../public/data/financials.json"),
    "utf8",
  ),
);
const transfers = JSON.parse(
  fs.readFileSync(
    path.resolve(__dirname, "../../public/data/transfers.json"),
    "utf8",
  ),
);

// Every numeric field some chart, KPI, health signal or table reads.
const REQUIRED_SEASON_NUMBERS = [
  "revenue_operating",
  "player_transfer_income",
  "player_transfer_cost",
  "personnel_costs",
  "operating_result_total",
  "operating_result_excl_players",
  "operating_result_players",
  "financial_result",
  "net_result",
  "total_assets",
  "equity",
  "borrowings_nc",
  "borrowings_c",
  "cash",
  "squad_book_value",
  "squad_market_value",
  "squad_amortization_impairment",
  "cf_operating",
  "cf_investing",
  "cf_financing",
  "current_assets",
  "current_liabilities",
  "non_current_liabilities",
];

describe("financials.json schema", () => {
  it("has a non-empty annual_data array", () => {
    expect(Array.isArray(financials.annual_data)).toBe(true);
    expect(financials.annual_data.length).toBeGreaterThan(0);
  });

  it.each(financials.annual_data.map((d) => [d.label, d]))(
    "season %s has every required numeric field",
    (label, season) => {
      expect(typeof label).toBe("string");
      expect(label).toMatch(/^\d{4}\/\d{2}$/);
      for (const key of REQUIRED_SEASON_NUMBERS) {
        expect(
          typeof season[key],
          `${label}.${key} must be a number (got ${season[key]})`,
        ).toBe("number");
        expect(
          Number.isFinite(season[key]),
          `${label}.${key} is not finite`,
        ).toBe(true);
      }
    },
  );

  it("season labels are unique and chronologically ordered", () => {
    const labels = financials.annual_data.map((d) => d.label);
    expect(new Set(labels).size).toBe(labels.length);
    const sorted = [...labels].sort();
    expect(labels).toEqual(sorted);
  });

  it("h1 snapshot (if present) has the fields the KPI strip reads", () => {
    const h1Key = Object.keys(financials).find((k) => k.startsWith("h1_"));
    if (!h1Key) return; // optional
    const h1 = financials[h1Key];
    expect(typeof h1.label).toBe("string");
    expect(typeof h1.period_end).toBe("string");
    expect(Number.isFinite(h1.net_result)).toBe(true);
    expect(Number.isFinite(h1.squad_market_value)).toBe(true);
    // Data-driven KPI caption (see metrics.js) must exist in both languages.
    expect(typeof h1.kpi_note).toBe("string");
    expect(typeof h1.kpi_note_pt).toBe("string");
  });
});

describe("transfers.json schema", () => {
  it("has a non-empty season array", () => {
    expect(Array.isArray(transfers)).toBe(true);
    expect(transfers.length).toBeGreaterThan(0);
  });

  it.each(transfers.map((s) => [s.season, s]))(
    "season %s is well-formed",
    (label, season) => {
      expect(label).toMatch(/^\d{4}\/\d{2}$/);
      expect(Array.isArray(season.purchases)).toBe(true);
      expect(Array.isArray(season.sales)).toBe(true);
      // Season note must exist in both languages (renderer prefers note_pt).
      expect(typeof season.note).toBe("string");
      expect(typeof season.note_pt).toBe("string");

      for (const row of [...season.purchases, ...season.sales]) {
        expect(typeof row.player, `${label}: row without player name`).toBe(
          "string",
        );
        expect(
          ["summer", "winter"].includes(row.window),
          `${label} / ${row.player}: invalid window "${row.window}"`,
        ).toBe(true);
        if (row.fee !== null && row.fee !== undefined) {
          expect(
            Number.isFinite(row.fee),
            `${label} / ${row.player}: fee is not a number`,
          ).toBe(true);
        }
        // Every English note needs its hand-written Portuguese sibling —
        // the runtime regex-translation pipeline is gone.
        if (row.note) {
          expect(
            typeof row.note_pt,
            `${label} / ${row.player}: note is missing note_pt`,
          ).toBe("string");
        }
      }
    },
  );
});
