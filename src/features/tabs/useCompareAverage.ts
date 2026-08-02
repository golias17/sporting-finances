import { useMemo } from "react";
import { netDebt, wageBillRatio } from "../financialMetrics.js";

interface CompareData {
  revenue_operating: number;
  player_transfer_income: number;
  net_result: number;
  equity: number;
  cash: number;
  total_assets: number;
  current_assets: number;
  current_liabilities: number;
  personnel_costs: number;
  borrowings_nc: number;
  borrowings_c: number;
  operating_result_excl_players: number;
  financial_result: number;
  squad_book_value: number;
  squad_amortization_impairment: number;
  player_transfer_cost: number;
  label: string;
}

export function useCompareAverage(
  data: CompareData[] | null,
  idxA: number,
  avgWindow: string,
  isPt: boolean,
) {
  const avgData = useMemo(() => {
    if (!data || data.length === 0) return null;
    const currentIdx = idxA;
    let windowData = data;
    if (avgWindow === "last3" && data.length >= 3) {
      windowData = data.slice(-3);
    } else if (avgWindow === "last5" && data.length >= 5) {
      windowData = data.slice(-5);
    }
    const filtered = windowData.filter((_: any, i: number) => {
      const globalIdx = data.indexOf(windowData[i]);
      return globalIdx !== currentIdx;
    });
    if (filtered.length === 0) return null;
    const count = filtered.length;
    const avg = (field: string) => filtered.reduce((s: number, d: any) => s + (d[field] || 0), 0) / count;
    return {
      revenue_operating: avg("revenue_operating"),
      player_transfer_income: avg("player_transfer_income"),
      net_result: avg("net_result"),
      equity: avg("equity"),
      cash: avg("cash"),
      operating_result_excl_players: avg("operating_result_excl_players"),
      financial_result: avg("financial_result"),
      squad_book_value: avg("squad_book_value"),
      squad_amortization_impairment: avg("squad_amortization_impairment"),
      player_transfer_cost: avg("player_transfer_cost"),
      total_assets: avg("total_assets"),
      current_assets: avg("current_assets"),
      current_liabilities: avg("current_liabilities"),
      personnel_costs: avg("personnel_costs"),
      borrowings_nc: avg("borrowings_nc"),
      borrowings_c: avg("borrowings_c"),
      count,
      label: isPt ? "Média" : "Average",
    };
  }, [data, isPt, idxA, avgWindow]);

  return avgData;
}

export function useCompareRatios(a: CompareData, seasonB: CompareData) {
  const netDebtA = netDebt(a);
  const netDebtB = netDebt(seasonB);
  const wageRatioA = wageBillRatio(a);
  const wageRatioB = wageBillRatio(seasonB);
  return { netDebtA, netDebtB, wageRatioA, wageRatioB };
}
