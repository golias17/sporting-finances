import { describe, it, expect } from "vitest";
import {
  calculateKpis,
  calculateHealthSignals,
  ordinal,
  netDebt,
  wageBillRatio,
} from "../../src/features/metrics.js";
import {
  fmtMillions,
  getEventAnnotations,
  eventBoxes,
} from "../../src/charts/chartUtils.js";
import { state } from "../../src/core/state.js";

// ---------------------------------------------------------------------------
// Minimal mock state factory
// ---------------------------------------------------------------------------

function makeState(overrides = {}) {
  const defaultSeason = {
    label: "2012/13",
    revenue_operating: 30000,
    net_result: -5000,
    equity: -119000,
    squad_market_value: 50000,
    borrowings_nc: 100000,
    borrowings_c: 20000,
    cash: 1300,
    personnel_costs: -18000,
    player_transfer_income: 10000,
    player_transfer_cost: -5000,
    squad_amortization_impairment: -8000,
    squad_book_value: 60000,
    operating_result_excl_players: -3000,
    current_assets: 5000,
    current_liabilities: 35000,
    total_assets: 200000,
    financial_result: -6000,
  };

  const seasons = overrides.seasons ?? [defaultSeason];
  return {
    isPt: overrides.isPt ?? false,
    healthBarIdx: null,
    DATASET: { annual_data: seasons },
    get annual() {
      return seasons;
    },
    get fullAnnual() {
      return seasons;
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// ordinal()
// ---------------------------------------------------------------------------

describe("ordinal()", () => {
  it("formats 1 as 1st", () => expect(ordinal(1)).toBe("1st"));
  it("formats 2 as 2nd", () => expect(ordinal(2)).toBe("2nd"));
  it("formats 3 as 3rd", () => expect(ordinal(3)).toBe("3rd"));
  it("formats 4 as 4th", () => expect(ordinal(4)).toBe("4th"));
  it("formats 11 as 11th", () => expect(ordinal(11)).toBe("11th"));
  it("formats 12 as 12th", () => expect(ordinal(12)).toBe("12th"));
  it("formats 21 as 21st", () => expect(ordinal(21)).toBe("21st"));
});

// ---------------------------------------------------------------------------
// netDebt() / wageBillRatio() — shared formula helpers extracted out of the
// six places (compare.js, charts.js, data-table.js, pdfGenerator.js, and
// twice within calculateHealthSignals() itself) that used to hand-compute
// these independently. Direct coverage here guards the formula itself,
// separate from any one caller's rendering/formatting around it.
// ---------------------------------------------------------------------------

describe("netDebt()", () => {
  it("sums non-current and current borrowings, minus cash", () => {
    expect(
      netDebt({ borrowings_nc: 100000, borrowings_c: 20000, cash: 1300 }),
    ).toBe(118700);
  });

  it("can go negative when cash exceeds total borrowings", () => {
    expect(
      netDebt({ borrowings_nc: 1000, borrowings_c: 500, cash: 5000 }),
    ).toBe(-3500);
  });
});

describe("wageBillRatio()", () => {
  it("returns personnel costs as a positive fraction of revenue", () => {
    expect(
      wageBillRatio({ personnel_costs: -18000, revenue_operating: 30000 }),
    ).toBeCloseTo(0.6, 5);
  });

  it("returns null when revenue is zero", () => {
    expect(
      wageBillRatio({ personnel_costs: -18000, revenue_operating: 0 }),
    ).toBeNull();
  });

  it("returns null when revenue is missing or non-finite", () => {
    expect(
      wageBillRatio({ personnel_costs: -18000, revenue_operating: undefined }),
    ).toBeNull();
    expect(
      wageBillRatio({ personnel_costs: -18000, revenue_operating: NaN }),
    ).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// fmtMillions()
// ---------------------------------------------------------------------------

describe("fmtMillions()", () => {
  it("formats positive thousands correctly", () => {
    expect(fmtMillions(100000)).toBe("€100.0M");
  });
  it("formats negative values with minus sign", () => {
    expect(fmtMillions(-50000)).toBe("€−50.0M");
  });
  it("returns em-dash for null", () => {
    expect(fmtMillions(null)).toBe("—");
  });
  it("returns em-dash for undefined", () => {
    expect(fmtMillions(undefined)).toBe("—");
  });
});

// ---------------------------------------------------------------------------
// getEventAnnotations() & eventBoxes()
// ---------------------------------------------------------------------------

describe("Event Annotations Utilities", () => {
  it("getEventAnnotations returns correct translations based on state.isPt", () => {
    state.COLORS.info = "#3a72b8";
    state.COLORS.neg = "#c6404f";
    state.COLORS.warn = "#d99c2b";
    state.COLORS.green = "#0a5d3a";

    // Test English
    state.isPt = false;
    let annos = getEventAnnotations();
    expect(annos.restructure14.label).toBe("2014 Capital Restructuring");
    expect(annos.alcochete.label).toBe("2018 Alcochete");

    // Test Portuguese
    state.isPt = true;
    annos = getEventAnnotations();
    expect(annos.restructure14.label).toBe("Reestruturação 2014");
    expect(annos.alcochete.label).toBe("Alcochete 2018");

    // Restore state
    state.isPt = false;
  });

  it("eventBoxes builds correct annotation object structure", () => {
    state.COLORS.info = "#3a72b8";
    state.COLORS.neg = "#c6404f";
    state.COLORS.warn = "#d99c2b";
    state.COLORS.green = "#0a5d3a";
    state.isPt = false;

    const annos = eventBoxes(["restructure14", "covid"]);
    expect(annos.e_restructure14).toBeDefined();
    expect(annos.e_restructure14.type).toBe("line");
    expect(annos.e_restructure14.xMin).toBe("2014/15");
    expect(annos.e_restructure14.borderColor).toBe("#3a72b8");
    expect(annos.e_restructure14.label.content).toBe(
      "2014 Capital Restructuring",
    );
    expect(annos.e_restructure14.label.display).toBe(true);

    expect(annos.e_covid).toBeDefined();
    expect(annos.e_covid.xMin).toBe("2020/21");
    expect(annos.e_covid.borderColor).toBe("#d99c2b");
    expect(annos.e_covid.label.content).toBe("COVID");
  });

  it("keeps all event markers when no dataset is loaded yet (defensive default)", () => {
    state.DATASET = null;
    const annos = eventBoxes(["restructure14", "covid"]);
    expect(annos.e_restructure14).toBeDefined();
    expect(annos.e_covid).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// calculateKpis()
// ---------------------------------------------------------------------------

describe("calculateKpis()", () => {
  it("returns an array of KPI objects", () => {
    const state = makeState();
    const kpis = calculateKpis(state, 0, fmtMillions);
    expect(Array.isArray(kpis)).toBe(true);
    expect(kpis.length).toBeGreaterThan(0);
  });

  it('marks net result as "neg" when the year is a loss', () => {
    const state = makeState(); // net_result: -5000
    const kpis = calculateKpis(state, 0, fmtMillions);
    const netKpi = kpis.find(
      (k) =>
        k.label.toLowerCase().includes("net result") ||
        k.label.toLowerCase().includes("resultado"),
    );
    expect(netKpi).toBeDefined();
    expect(netKpi.cls).toBe("neg");
  });

  it('marks net result as "pos" when the year is profitable', () => {
    const season = { ...makeState().annual[0], net_result: 12000 };
    const state = makeState({ seasons: [season] });
    const kpis = calculateKpis(state, 0, fmtMillions);
    const netKpi = kpis.find(
      (k) =>
        k.label.toLowerCase().includes("net result") ||
        k.label.toLowerCase().includes("resultado"),
    );
    expect(netKpi.cls).toBe("pos");
  });

  it("handles revGrowth gracefully when fewer than 5 seasons exist", () => {
    const state = makeState(); // only 1 season
    const kpis = calculateKpis(state, 0, fmtMillions);
    const revKpi = kpis[0];
    // change should contain a "less than 5" message (not crash)
    expect(typeof revKpi.change).toBe("string");
    expect(revKpi.change.length).toBeGreaterThan(0);
  });

  it("calculates 5-year revenue growth when sufficient data exists", () => {
    const seasons = Array.from({ length: 6 }, (_, i) => ({
      ...makeState().annual[0],
      label: `201${i}/1${i + 1}`,
      revenue_operating: 30000 + i * 5000, // growing
    }));
    const state = makeState({ seasons });
    const kpis = calculateKpis(state, 5, fmtMillions);
    const revKpi = kpis[0];
    expect(revKpi.cls).toBe("pos"); // revenue grew
    expect(revKpi.change).toContain("%");
  });

  it("counts consecutive profitable years correctly", () => {
    const seasons = [
      { ...makeState().annual[0], net_result: -1000 },
      { ...makeState().annual[0], net_result: 5000, label: "2013/14" },
      { ...makeState().annual[0], net_result: 8000, label: "2014/15" },
      { ...makeState().annual[0], net_result: 3000, label: "2015/16" },
    ];
    const state = makeState({ seasons });
    const kpis = calculateKpis(state, 3, fmtMillions); // idx=3, 3rd consecutive profit
    const netKpi = kpis[1];
    expect(netKpi.change).toContain("3");
  });

  it("returns PT labels when isPt is true", () => {
    const state = makeState({ isPt: true });
    const kpis = calculateKpis(state, 0, fmtMillions);
    // At least one label should contain Portuguese text
    const hasPt = kpis.some(
      (k) =>
        k.label.includes("Receita") ||
        k.label.includes("resultado") ||
        k.label.includes("capital") ||
        k.label.includes("Dívida") ||
        k.label.includes("Último"),
    );
    expect(hasPt).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// calculateHealthSignals()
// ---------------------------------------------------------------------------

describe("calculateHealthSignals()", () => {
  it("returns 8 signals", () => {
    const state = makeState();
    const signals = calculateHealthSignals(state, 0, fmtMillions);
    expect(signals.length).toBe(8);
  });

  it('marks payroll as "red" when wage bill exceeds 70% of revenue', () => {
    const season = {
      ...makeState().annual[0],
      personnel_costs: -25000, // 83% of 30000
      revenue_operating: 30000,
    };
    const state = makeState({ seasons: [season] });
    const signals = calculateHealthSignals(state, 0, fmtMillions);
    const wageSig = signals.find((s) => s.id === "sigWage");
    expect(wageSig.status).toBe("red");
  });

  it('marks payroll as "green" when wage bill is below 60% of revenue', () => {
    const season = {
      ...makeState().annual[0],
      personnel_costs: -15000, // 50%
      revenue_operating: 30000,
    };
    const state = makeState({ seasons: [season] });
    const signals = calculateHealthSignals(state, 0, fmtMillions);
    const wageSig = signals.find((s) => s.id === "sigWage");
    expect(wageSig.status).toBe("green");
  });

  it('marks equity as "green" when equity is strongly positive', () => {
    const season = { ...makeState().annual[0], equity: 50000 };
    const state = makeState({ seasons: [season] });
    const signals = calculateHealthSignals(state, 0, fmtMillions);
    const equitySig = signals.find((s) => s.id === "sigEquity");
    expect(equitySig.status).toBe("green");
  });

  it('marks equity as "red" when equity is negative', () => {
    const state = makeState(); // equity: -119000
    const signals = calculateHealthSignals(state, 0, fmtMillions);
    const equitySig = signals.find((s) => s.id === "sigEquity");
    expect(equitySig.status).toBe("red");
  });

  it('marks equity as "amber" (not "green") between the positive and strong thresholds, matching the "just turned positive" note', () => {
    // Regression test: status used to turn green above 10000 while the note
    // text still called anything below 20000 "just turned positive" — a
    // season at 15000 showed a green dot next to an amber-sounding note.
    const season = { ...makeState().annual[0], equity: 15000 };
    const state = makeState({ seasons: [season] });
    const signals = calculateHealthSignals(state, 0, fmtMillions);
    const equitySig = signals.find((s) => s.id === "sigEquity");
    expect(equitySig.status).toBe("amber");
    expect(equitySig.note).toBe("Just turned positive");
  });

  it('marks current ratio as "green" when >= 1.0', () => {
    const season = {
      ...makeState().annual[0],
      current_assets: 40000,
      current_liabilities: 30000,
    };
    const state = makeState({ seasons: [season] });
    const signals = calculateHealthSignals(state, 0, fmtMillions);
    const crSig = signals.find((s) => s.id === "sigCurrentRatio");
    expect(crSig.status).toBe("green");
  });

  it('marks current ratio as "red" when < 0.5', () => {
    const state = makeState(); // current_assets: 5000, current_liabilities: 35000 → 0.14×
    const signals = calculateHealthSignals(state, 0, fmtMillions);
    const crSig = signals.find((s) => s.id === "sigCurrentRatio");
    expect(crSig.status).toBe("red");
  });

  it("handles current ratio when current_liabilities is 0 (null case)", () => {
    const season = {
      ...makeState().annual[0],
      current_assets: 40000,
      current_liabilities: 0,
    };
    const stateObj = makeState({ seasons: [season] });

    // 1. English
    stateObj.isPt = false;
    let signals = calculateHealthSignals(stateObj, 0, fmtMillions);
    let crSig = signals.find((s) => s.id === "sigCurrentRatio");
    expect(crSig.status).toBe("amber");
    expect(crSig.value).toBe("—");
    expect(crSig.note).toBe("No current liabilities recorded");
    expect(crSig.history).toEqual([null]);

    // 2. Portuguese
    stateObj.isPt = true;
    signals = calculateHealthSignals(stateObj, 0, fmtMillions);
    crSig = signals.find((s) => s.id === "sigCurrentRatio");
    expect(crSig.note).toBe("Sem passivo corrente registado");
  });

  it("verifies note messages for current ratio in danger zone (< 0.5)", () => {
    const season = {
      ...makeState().annual[0],
      current_assets: 10000,
      current_liabilities: 40000, // 0.25x (danger zone)
    };
    const stateObj = makeState({ seasons: [season] });

    // 1. English
    stateObj.isPt = false;
    let signals = calculateHealthSignals(stateObj, 0, fmtMillions);
    let crSig = signals.find((s) => s.id === "sigCurrentRatio");
    expect(crSig.status).toBe("red");
    expect(crSig.note).toBe("High short-term liquidity risk");

    // 2. Portuguese
    stateObj.isPt = true;
    signals = calculateHealthSignals(stateObj, 0, fmtMillions);
    crSig = signals.find((s) => s.id === "sigCurrentRatio");
    expect(crSig.note).toBe("Risco de liquidez alto");
  });

  it("marks revenue growth as null/amber when fewer than 5 seasons", () => {
    const state = makeState(); // 1 season only
    const signals = calculateHealthSignals(state, 0, fmtMillions);
    const revSig = signals.find((s) => s.id === "sigRevGrowth");
    expect(revSig.status).toBe("amber"); // null case → amber
  });

  it("all signals have required fields", () => {
    const state = makeState();
    const signals = calculateHealthSignals(state, 0, fmtMillions);
    signals.forEach((s) => {
      expect(s).toHaveProperty("id");
      expect(s).toHaveProperty("label");
      expect(s).toHaveProperty("value");
      expect(s).toHaveProperty("status");
      expect(s).toHaveProperty("note");
      expect(s).toHaveProperty("history");
      expect(["green", "amber", "red"]).toContain(s.status);
    });
  });

  it("checks Portuguese translations and all threshold notes", () => {
    const season = {
      ...makeState().annual[0],
      operating_result_excl_players: -3000, // amber
      current_assets: 20000,
      current_liabilities: 30000, // 0.66 amber
      cash: 10000, // amber
    };
    const state = makeState({ seasons: [season], isPt: true });
    const signals = calculateHealthSignals(state, 0, fmtMillions);

    const opProfit = signals.find((s) => s.id === "sigOpProfit");
    expect(opProfit.status).toBe("amber");
    expect(opProfit.note).toBe("Pequeno défice estrutural");

    const cashSig = signals.find((s) => s.id === "sigCash");
    expect(cashSig.status).toBe("amber");
    expect(cashSig.note).toBe("Reduzido — risco mensal");

    const crSig = signals.find((s) => s.id === "sigCurrentRatio");
    expect(crSig.status).toBe("amber");
    expect(crSig.note).toBe("Atenção à liquidez");
  });

  it("checks deeply negative notes", () => {
    const season = {
      ...makeState().annual[0],
      operating_result_excl_players: -10000, // red
      current_assets: 10000,
      current_liabilities: 50000, // 0.20 red
      cash: 2000, // red
    };
    const state = makeState({ seasons: [season], isPt: false });
    const signals = calculateHealthSignals(state, 0, fmtMillions);

    const opProfit = signals.find((s) => s.id === "sigOpProfit");
    expect(opProfit.status).toBe("red");
    expect(opProfit.note).toBe("Deep structural deficit");

    const cashSig = signals.find((s) => s.id === "sigCash");
    expect(cashSig.status).toBe("red");
    expect(cashSig.note).toBe("Critically low");

    const crSig = signals.find((s) => s.id === "sigCurrentRatio");
    expect(crSig.status).toBe("red");
    expect(crSig.note).toBe("High short-term liquidity risk");
  });
});

describe("calculateKpis()", () => {
  it("should calculate base KPIs correctly", () => {
    const state = makeState();
    const kpis = calculateKpis(state, 0, fmtMillions);
    expect(kpis.length).toBe(6);
    expect(kpis[0].label).toMatch(/revenue/i);
    expect(kpis[1].label).toMatch(/net result/i);
  });

  it("should use H1 data if available and looking at the latest season", () => {
    const state = makeState();
    state.DATASET = {
      annual_data: state.annual,
      h1_25: {
        label: "25/26",
        period_end: "2025-12-31",
        net_result: 15000,
        squad_market_value: 65000,
        kpi_note: "After a big sale",
        kpi_note_pt: "Após uma grande venda",
      },
    };
    const kpis = calculateKpis(state, 0, fmtMillions);
    // H1 data replaces Cash with H1 net result and updates squad market value
    expect(kpis.length).toBe(6);
    const h1Kpi = kpis.find((k) => k.label.includes("H1"));
    expect(h1Kpi).toBeDefined();
    expect(h1Kpi.value).toBe(fmtMillions(15000));
    // The caption is data-driven (kpi_note / kpi_note_pt on the h1 snapshot)
    expect(h1Kpi.change).toBe("After a big sale");
    expect(h1Kpi.cls).toBe("pos");
  });

  it("formats the squad market value KPI's period from a valid H1 period_end", () => {
    const state = makeState();
    state.DATASET = {
      annual_data: state.annual,
      h1_25: {
        label: "25/26",
        period_end: "2025-12-31",
        net_result: 15000,
        squad_market_value: 65000,
      },
    };
    const kpis = calculateKpis(state, 0, fmtMillions);
    const sqMvKpi = kpis.find((k) => k.label.includes("market value"));
    expect(sqMvKpi.label).toContain("Dec 25");
  });

  // Regression test: h1Data.period_end used to be parsed with no validity
  // check — new Date(undefined) / new Date("not-a-date") is an Invalid
  // Date, and toLocaleDateString() on one silently returns the literal
  // string "Invalid Date", which flowed straight into this KPI's label
  // instead of failing loudly or falling back to something sensible.
  it("falls back to the H1 entry's own label when period_end is missing or malformed", () => {
    const state = makeState();
    state.DATASET = {
      annual_data: state.annual,
      h1_25: {
        label: "2025/26 H1",
        period_end: "not-a-real-date",
        net_result: 15000,
        squad_market_value: 65000,
      },
    };
    const kpis = calculateKpis(state, 0, fmtMillions);
    const sqMvKpi = kpis.find((k) => k.label.includes("market value"));
    expect(sqMvKpi.label).toContain("2025/26 H1");
    expect(sqMvKpi.label).not.toContain("Invalid Date");
  });

  it("falls back to a generic placeholder when period_end is malformed and the H1 entry has no label either", () => {
    const state = makeState();
    state.DATASET = {
      annual_data: state.annual,
      h1_25: {
        period_end: undefined,
        net_result: 15000,
        squad_market_value: 65000,
      },
    };
    const kpis = calculateKpis(state, 0, fmtMillions);
    const sqMvKpi = kpis.find((k) => k.label.includes("market value"));
    expect(sqMvKpi.label).toContain("current period");
    expect(sqMvKpi.label).not.toContain("Invalid Date");
  });

  it("computes the 5-year revenue growth against idx - 5, matching calculateHealthSignals", () => {
    const seasons = Array.from({ length: 7 }, (_, i) => ({
      ...makeState().annual[0],
      label: `201${i}/1${i + 1}`,
      revenue_operating: 30000 + i * 5000,
    }));
    const state = makeState({ seasons });
    const kpis = calculateKpis(state, 6, fmtMillions);
    // idx 6 vs idx 1: (60000 - 35000) / 35000 = 71%
    expect(kpis[0].change).toContain("71%");
    const signals = calculateHealthSignals(state, 6, fmtMillions);
    const revSignal = signals.find((s) => s.id === "sigRevGrowth");
    expect(revSignal.value).toContain("71%");
  });
});
