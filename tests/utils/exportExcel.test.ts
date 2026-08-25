import { describe, it, expect, vi, beforeEach } from "vitest";
import { exportFinancialsExcel } from "../../src/utils/exportExcel.js";
import { useAppState } from "../../src/core/state.js";
import type { FinancialRecord } from "../../src/core/types.js";

const { mockToFile, mockWriteXlsx } = vi.hoisted(() => {
  const mockToFile = vi.fn().mockResolvedValue(undefined);
  const mockWriteXlsx = vi.fn().mockReturnValue({
    toFile: mockToFile,
  });
  return { mockToFile, mockWriteXlsx };
});

// Mock write-excel-file/browser
vi.mock("write-excel-file/browser", () => ({
  default: mockWriteXlsx,
}));

const mockRecord: FinancialRecord = {
  season: "2024/25",
  label: "2024/25",
  year_end: "2025-06-30",
  revenue_operating: 140000,
  player_transfer_income: 60000,
  player_transfer_cost: 30000,
  personnel_costs: -80000,
  external_supplies: -35000,
  da_excl_squad: -5000,
  operating_result_excl_players: 20000,
  squad_amortization_impairment: -25000,
  operating_result_total: 25000,
  financial_result: -12000,
  net_result: 15000,
  total_assets: 350000,
  non_current_assets: 230000,
  current_assets: 120000,
  current_liabilities: 110000,
  non_current_liabilities: 150000,
  equity: 90000,
  borrowings_nc: 100000,
  borrowings_c: 20000,
  cash: 30000,
  squad_book_value: 80000,
  squad_market_value: 400000,
  rev_tv_comp: 70000,
  rev_matchday: 35000,
  rev_commercial: 35000,
  cf_operating: 30000,
  cf_investing: -20000,
  cf_financing: -5000,
  ebitda_total: 55000,
  source: "CMVM",
};

describe("exportFinancialsExcel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppState.setState({
      annual: [mockRecord],
      BENFICA_DATASET: { annual_data: [mockRecord] } as any,
      PORTO_DATASET: { annual_data: [mockRecord] } as any,
      TRANSFER_LEDGER: [
        {
          season: "2023/24",
          income: 60,
          cost: 40,
          note: "Record",
          note_pt: "Recorde",
          purchases: [
            {
              player: "Viktor Gyökeres",
              club: "Coventry City",
              fee: 24.0,
              rights: "100%",
              window: "summer",
              commission: 0,
            },
          ],
          sales: [],
        },
      ],
    });
  });

  it("calls writeXlsx with 5 sheets and Portuguese filename by default", async () => {
    await exportFinancialsExcel(true);
    expect(mockWriteXlsx).toHaveBeenCalledTimes(1);

    const callArgs = mockWriteXlsx.mock.calls[0];
    const sheets = callArgs[0] as Array<{ name: string; data: unknown[] }>;

    expect(sheets).toHaveLength(5);
    expect(sheets.map((s) => s.name)).toEqual([
      "Resultados",
      "Balanço e Dívida",
      "Transferências",
      "Benchmark Rivais",
      "Instrumentos Dívida",
    ]);
    expect(mockToFile).toHaveBeenCalledWith("sporting_cp_financas_historico_2010_2025.xlsx");
  });

  it("calls writeXlsx with English sheet names and filename when isPt is false", async () => {
    await exportFinancialsExcel(false);
    expect(mockWriteXlsx).toHaveBeenCalledTimes(1);

    const callArgs = mockWriteXlsx.mock.calls[0];
    const sheets = callArgs[0] as Array<{ name: string; data: unknown[] }>;

    expect(sheets).toHaveLength(5);
    expect(sheets.map((s) => s.name)).toEqual([
      "Income Statement",
      "Balance Sheet",
      "Transfers Ledger",
      "Rivals Benchmark",
      "Debt Instruments",
    ]);
    expect(mockToFile).toHaveBeenCalledWith("sporting_cp_financials_2010_2025.xlsx");
  });
});
