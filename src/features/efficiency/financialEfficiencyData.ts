import type { FinancialRecord } from "../../core/types.js";

export interface SportingRecord {
  season: string;
  points: number;
  position: number;
  leagues: number;
  tacaPortugal: number;
  tacaLiga: number;
  supertaca: number;
  european: number;
  totalTitles: number;
}

export const SPORTING_PERFORMANCE: Record<"sporting" | "benfica" | "porto", SportingRecord[]> = {
  sporting: [
    { season: "2010/11", points: 48, position: 3, leagues: 0, tacaPortugal: 0, tacaLiga: 0, supertaca: 0, european: 0, totalTitles: 0 },
    { season: "2011/12", points: 59, position: 4, leagues: 0, tacaPortugal: 0, tacaLiga: 0, supertaca: 0, european: 0, totalTitles: 0 },
    { season: "2012/13", points: 42, position: 7, leagues: 0, tacaPortugal: 0, tacaLiga: 0, supertaca: 0, european: 0, totalTitles: 0 },
    { season: "2013/14", points: 67, position: 2, leagues: 0, tacaPortugal: 0, tacaLiga: 0, supertaca: 0, european: 0, totalTitles: 0 },
    { season: "2014/15", points: 76, position: 3, leagues: 0, tacaPortugal: 1, tacaLiga: 0, supertaca: 0, european: 0, totalTitles: 1 },
    { season: "2015/16", points: 86, position: 2, leagues: 0, tacaPortugal: 0, tacaLiga: 0, supertaca: 1, european: 0, totalTitles: 1 },
    { season: "2016/17", points: 70, position: 3, leagues: 0, tacaPortugal: 0, tacaLiga: 0, supertaca: 0, european: 0, totalTitles: 0 },
    { season: "2017/18", points: 78, position: 3, leagues: 0, tacaPortugal: 0, tacaLiga: 1, supertaca: 0, european: 0, totalTitles: 1 },
    { season: "2018/19", points: 74, position: 3, leagues: 0, tacaPortugal: 1, tacaLiga: 1, supertaca: 0, european: 0, totalTitles: 2 },
    { season: "2019/20", points: 60, position: 4, leagues: 0, tacaPortugal: 0, tacaLiga: 0, supertaca: 0, european: 0, totalTitles: 0 },
    { season: "2020/21", points: 85, position: 1, leagues: 1, tacaPortugal: 0, tacaLiga: 1, supertaca: 0, european: 0, totalTitles: 2 },
    { season: "2021/22", points: 85, position: 2, leagues: 0, tacaPortugal: 0, tacaLiga: 1, supertaca: 1, european: 0, totalTitles: 2 },
    { season: "2022/23", points: 74, position: 4, leagues: 0, tacaPortugal: 0, tacaLiga: 0, supertaca: 0, european: 0, totalTitles: 0 },
    { season: "2023/24", points: 90, position: 1, leagues: 1, tacaPortugal: 0, tacaLiga: 0, supertaca: 0, european: 0, totalTitles: 1 },
    { season: "2024/25", points: 82, position: 1, leagues: 1, tacaPortugal: 0, tacaLiga: 0, supertaca: 0, european: 0, totalTitles: 1 },
  ],
  benfica: [
    { season: "2010/11", points: 63, position: 2, leagues: 0, tacaPortugal: 0, tacaLiga: 1, supertaca: 0, european: 0, totalTitles: 1 },
    { season: "2011/12", points: 69, position: 2, leagues: 0, tacaPortugal: 0, tacaLiga: 1, supertaca: 0, european: 0, totalTitles: 1 },
    { season: "2012/13", points: 77, position: 2, leagues: 0, tacaPortugal: 0, tacaLiga: 0, supertaca: 0, european: 0, totalTitles: 0 },
    { season: "2013/14", points: 74, position: 1, leagues: 1, tacaPortugal: 1, tacaLiga: 1, supertaca: 0, european: 0, totalTitles: 3 },
    { season: "2014/15", points: 85, position: 1, leagues: 1, tacaPortugal: 0, tacaLiga: 1, supertaca: 1, european: 0, totalTitles: 3 },
    { season: "2015/16", points: 88, position: 1, leagues: 1, tacaPortugal: 0, tacaLiga: 1, supertaca: 0, european: 0, totalTitles: 2 },
    { season: "2016/17", points: 82, position: 1, leagues: 1, tacaPortugal: 1, tacaLiga: 0, supertaca: 1, european: 0, totalTitles: 3 },
    { season: "2017/18", points: 80, position: 2, leagues: 0, tacaPortugal: 0, tacaLiga: 0, supertaca: 1, european: 0, totalTitles: 1 },
    { season: "2018/19", points: 87, position: 1, leagues: 1, tacaPortugal: 0, tacaLiga: 0, supertaca: 0, european: 0, totalTitles: 1 },
    { season: "2019/20", points: 77, position: 2, leagues: 0, tacaPortugal: 0, tacaLiga: 0, supertaca: 1, european: 0, totalTitles: 1 },
    { season: "2020/21", points: 76, position: 3, leagues: 0, tacaPortugal: 0, tacaLiga: 0, supertaca: 0, european: 0, totalTitles: 0 },
    { season: "2021/22", points: 74, position: 3, leagues: 0, tacaPortugal: 0, tacaLiga: 0, supertaca: 0, european: 0, totalTitles: 0 },
    { season: "2022/23", points: 87, position: 1, leagues: 1, tacaPortugal: 0, tacaLiga: 0, supertaca: 0, european: 0, totalTitles: 1 },
    { season: "2023/24", points: 80, position: 2, leagues: 0, tacaPortugal: 0, tacaLiga: 0, supertaca: 1, european: 0, totalTitles: 1 },
    { season: "2024/25", points: 78, position: 2, leagues: 0, tacaPortugal: 0, tacaLiga: 0, supertaca: 0, european: 0, totalTitles: 0 },
  ],
  porto: [
    { season: "2010/11", points: 84, position: 1, leagues: 1, tacaPortugal: 1, tacaLiga: 0, supertaca: 1, european: 1, totalTitles: 4 },
    { season: "2011/12", points: 75, position: 1, leagues: 1, tacaPortugal: 0, tacaLiga: 0, supertaca: 1, european: 0, totalTitles: 2 },
    { season: "2012/13", points: 78, position: 1, leagues: 1, tacaPortugal: 0, tacaLiga: 0, supertaca: 1, european: 0, totalTitles: 2 },
    { season: "2013/14", points: 61, position: 3, leagues: 0, tacaPortugal: 0, tacaLiga: 0, supertaca: 1, european: 0, totalTitles: 1 },
    { season: "2014/15", points: 82, position: 2, leagues: 0, tacaPortugal: 0, tacaLiga: 0, supertaca: 0, european: 0, totalTitles: 0 },
    { season: "2015/16", points: 73, position: 3, leagues: 0, tacaPortugal: 0, tacaLiga: 0, supertaca: 0, european: 0, totalTitles: 0 },
    { season: "2016/17", points: 76, position: 2, leagues: 0, tacaPortugal: 0, tacaLiga: 0, supertaca: 0, european: 0, totalTitles: 0 },
    { season: "2017/18", points: 88, position: 1, leagues: 1, tacaPortugal: 0, tacaLiga: 0, supertaca: 0, european: 0, totalTitles: 1 },
    { season: "2018/19", points: 85, position: 2, leagues: 0, tacaPortugal: 0, tacaLiga: 0, supertaca: 1, european: 0, totalTitles: 1 },
    { season: "2019/20", points: 82, position: 1, leagues: 1, tacaPortugal: 1, tacaLiga: 0, supertaca: 0, european: 0, totalTitles: 2 },
    { season: "2020/21", points: 80, position: 2, leagues: 0, tacaPortugal: 0, tacaLiga: 0, supertaca: 1, european: 0, totalTitles: 1 },
    { season: "2021/22", points: 91, position: 1, leagues: 1, tacaPortugal: 1, tacaLiga: 0, supertaca: 0, european: 0, totalTitles: 2 },
    { season: "2022/23", points: 85, position: 2, leagues: 0, tacaPortugal: 1, tacaLiga: 1, supertaca: 1, european: 0, totalTitles: 3 },
    { season: "2023/24", points: 72, position: 3, leagues: 0, tacaPortugal: 1, tacaLiga: 0, supertaca: 0, european: 0, totalTitles: 1 },
    { season: "2024/25", points: 71, position: 3, leagues: 0, tacaPortugal: 0, tacaLiga: 0, supertaca: 1, european: 0, totalTitles: 1 },
  ],
};

export interface SeasonEfficiency {
  season: string;
  sportingSpend: number;
  sportingPoints: number;
  sportingCpp: number; // €k / point
  benficaSpend: number;
  benficaPoints: number;
  benficaCpp: number;
  portoSpend: number;
  portoPoints: number;
  portoCpp: number;
}

export interface ClubCycleSummary {
  clubKey: "sporting" | "benfica" | "porto";
  name: string;
  totalPoints: number;
  totalSpend: number;
  totalLeagues: number;
  totalCups: number;
  totalTitles: number;
  costPerPoint: number; // €k / point
  costPerTitle: number; // €M / title
}

export function computeFootballSpending(record?: FinancialRecord): number {
  if (!record) return 0;
  const wages = Math.abs(record.personnel_costs || 0);
  const amort = Math.abs(record.squad_amortization_impairment || 0);
  const commissions = Math.abs(record.agent_commissions || 0);
  return wages + amort + commissions;
}

export function computeEfficiencySeries(
  sportingFin: FinancialRecord[],
  benficaFin: FinancialRecord[],
  portoFin: FinancialRecord[],
): SeasonEfficiency[] {
  const result: SeasonEfficiency[] = [];

  for (let i = 0; i < sportingFin.length; i++) {
    const scpFin = sportingFin[i];
    const slbFin = benficaFin[i] || scpFin;
    const fcpFin = portoFin[i] || scpFin;

    const season = scpFin.season;
    const scpPerf = SPORTING_PERFORMANCE.sporting.find((p) => p.season === season || p.season.includes(season.slice(-2))) || SPORTING_PERFORMANCE.sporting[i];
    const slbPerf = SPORTING_PERFORMANCE.benfica.find((p) => p.season === season || p.season.includes(season.slice(-2))) || SPORTING_PERFORMANCE.benfica[i];
    const fcpPerf = SPORTING_PERFORMANCE.porto.find((p) => p.season === season || p.season.includes(season.slice(-2))) || SPORTING_PERFORMANCE.porto[i];

    const scpSpend = computeFootballSpending(scpFin) / 1000; // in €M
    const slbSpend = computeFootballSpending(slbFin) / 1000;
    const fcpSpend = computeFootballSpending(fcpFin) / 1000;

    const scpPoints = scpPerf?.points || 75;
    const slbPoints = slbPerf?.points || 75;
    const fcpPoints = fcpPerf?.points || 75;

    result.push({
      season,
      sportingSpend: scpSpend,
      sportingPoints: scpPoints,
      sportingCpp: scpPoints > 0 ? (scpSpend * 1000) / scpPoints : 0,
      benficaSpend: slbSpend,
      benficaPoints: slbPoints,
      benficaCpp: slbPoints > 0 ? (slbSpend * 1000) / slbPoints : 0,
      portoSpend: fcpSpend,
      portoPoints: fcpPoints,
      portoCpp: fcpPoints > 0 ? (fcpSpend * 1000) / fcpPoints : 0,
    });
  }

  return result;
}

export function computeCycleEfficiencySummary(
  sportingFin: FinancialRecord[],
  benficaFin: FinancialRecord[],
  portoFin: FinancialRecord[],
  window: "all" | "last5" | "last3" = "all",
): Record<"sporting" | "benfica" | "porto", ClubCycleSummary> {
  const count = window === "last3" ? 3 : window === "last5" ? 5 : 15;

  const scpSlice = sportingFin.slice(-count);
  const slbSlice = benficaFin.slice(-count);
  const fcpSlice = portoFin.slice(-count);

  const scpPerfSlice = SPORTING_PERFORMANCE.sporting.slice(-count);
  const slbPerfSlice = SPORTING_PERFORMANCE.benfica.slice(-count);
  const fcpPerfSlice = SPORTING_PERFORMANCE.porto.slice(-count);

  const calcClub = (
    clubKey: "sporting" | "benfica" | "porto",
    name: string,
    finSlice: FinancialRecord[],
    perfSlice: SportingRecord[],
  ): ClubCycleSummary => {
    const totalSpend = finSlice.reduce((acc, f) => acc + computeFootballSpending(f) / 1000, 0);
    const totalPoints = perfSlice.reduce((acc, p) => acc + p.points, 0);
    const totalLeagues = perfSlice.reduce((acc, p) => acc + p.leagues, 0);
    const totalCups = perfSlice.reduce(
      (acc, p) => acc + p.tacaPortugal + p.tacaLiga + p.supertaca + p.european,
      0,
    );
    const totalTitles = perfSlice.reduce((acc, p) => acc + p.totalTitles, 0);

    const costPerPoint = totalPoints > 0 ? (totalSpend * 1000) / totalPoints : 0;
    const costPerTitle = totalTitles > 0 ? totalSpend / totalTitles : totalSpend;

    return {
      clubKey,
      name,
      totalPoints,
      totalSpend,
      totalLeagues,
      totalCups,
      totalTitles,
      costPerPoint,
      costPerTitle,
    };
  };

  return {
    sporting: calcClub("sporting", "Sporting CP", scpSlice, scpPerfSlice),
    benfica: calcClub("benfica", "SL Benfica", slbSlice, slbPerfSlice),
    porto: calcClub("porto", "FC Porto", fcpSlice, fcpPerfSlice),
  };
}
