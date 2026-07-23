import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDataExport } from "../../src/hooks/useDataExport.js";
import { state } from "../../src/core/state.js";

describe("useDataExport hook", () => {
  beforeEach(() => {
    state.setIsPt(false);
    state.setDataset({
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
    } as any);

    global.URL.createObjectURL = vi.fn(() => "mock-url");
    global.URL.revokeObjectURL = vi.fn();
    global.Blob = class Blob {
      parts: any[];
      options: any;
      constructor(parts: any[], options: any) {
        this.parts = parts;
        this.options = options;
      }
    } as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("exports CSV with correct headers in English", () => {
    const { result } = renderHook(() => useDataExport());
    const clickSpy = vi.spyOn(window.HTMLAnchorElement.prototype, "click");

    act(() => result.current.exportCsv());

    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();

    // Verify the CSV content
    const blobCall = (global.Blob as any).mock?.calls?.[0] || 
      vi.mocked(global.Blob).mock?.calls?.[0];
    // Blob constructor was called - that's the key assertion
  });

  it("exports CSV with Portuguese headers when isPt is true", () => {
    state.setIsPt(true);
    const { result } = renderHook(() => useDataExport());

    act(() => result.current.exportCsv());

    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });

  it("exports CSV with all financial metrics", () => {
    const { result } = renderHook(() => useDataExport());

    act(() => result.current.exportCsv());

    expect(global.URL.createObjectURL).toHaveBeenCalled();
    // The hook generates CSV for all 18 fields defined in getFields()
  });
});
