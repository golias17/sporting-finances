export interface PlayerValuationProfile {
  id: string;
  name: string;
  shortName: string;
  position: "forward" | "midfielder" | "defender" | "goalkeeper";
  number: number;
  nationality: string;
  joinYear: number;
  contractExpiry: number;
  contractYearsTotal: number;
  yearsElapsed: number;
  acquisitionCost: number; // in €M
  acquisitionAddons: number; // in €M
  annualAmortization: number; // in €M
  currentBookValue: number; // in €M (Net Book Value in 2025)
  releaseClause: number; // in €M
  marketValue: number; // in €M
  sellOnPercentage: number; // 0.0 to 1.0 (e.g. 0.10 for 10%)
  sellOnBasis: "profit" | "total";
  isHomegrown: boolean;
  annualSalaryEst: number; // in €M gross
}

export const SQUAD_VALUATION_PROFILES: PlayerValuationProfile[] = [
  {
    id: "suarez",
    name: "Luis Suárez",
    shortName: "L. Suárez",
    position: "forward",
    number: 9,
    nationality: "🇨🇴 Colômbia / Colombia",
    joinYear: 2025,
    contractExpiry: 2030,
    contractYearsTotal: 5,
    yearsElapsed: 1,
    acquisitionCost: 24.79, // €22.16M fixed + €2.63M addons realized (RC 25-26 Note 13.1)
    acquisitionAddons: 2.63,
    annualAmortization: 4.96,
    currentBookValue: 19.83,
    releaseClause: 80.0,
    marketValue: 45.0,
    sellOnPercentage: 0.10, // UD Almería (10% on capital gain)
    sellOnBasis: "profit",
    isHomegrown: false,
    annualSalaryEst: 3.2,
  },
  {
    id: "zalazar",
    name: "Rodrigo Zalazar",
    shortName: "Zalazar",
    position: "midfielder",
    number: 10,
    nationality: "🇺🇾 Uruguai / Uruguay",
    joinYear: 2026,
    contractExpiry: 2031,
    contractYearsTotal: 5,
    yearsElapsed: 0,
    acquisitionCost: 31.46, // €30.0M transfer fee to SC Braga + €1.46M transaction costs (RC 25-26 Note 13.1)
    acquisitionAddons: 0.0,
    annualAmortization: 6.29,
    currentBookValue: 31.46,
    releaseClause: 80.0,
    marketValue: 35.0,
    sellOnPercentage: 0.0,
    sellOnBasis: "profit",
    isHomegrown: false,
    annualSalaryEst: 2.8,
  },
  {
    id: "ioannidis",
    name: "Fotis Ioannidis",
    shortName: "Ioannidis",
    position: "forward",
    number: 89,
    nationality: "🇬🇷 Grécia / Greece",
    joinYear: 2025,
    contractExpiry: 2030,
    contractYearsTotal: 5,
    yearsElapsed: 1,
    acquisitionCost: 22.0, // €22.0M fixed to Panathinaikos (RC 25-26 Note 13.1)
    acquisitionAddons: 3.0,
    annualAmortization: 4.4,
    currentBookValue: 17.6,
    releaseClause: 100.0,
    marketValue: 35.0,
    sellOnPercentage: 0.25, // Panathinaikos (25% on capital gain)
    sellOnBasis: "profit",
    isHomegrown: false,
    annualSalaryEst: 2.6,
  },
  {
    id: "inacio",
    name: "Gonçalo Inácio",
    shortName: "Inácio",
    position: "defender",
    number: 25,
    nationality: "🇵🇹 Portugal",
    joinYear: 2020,
    contractExpiry: 2030,
    contractYearsTotal: 10,
    yearsElapsed: 6,
    acquisitionCost: 0.0,
    acquisitionAddons: 0.0,
    annualAmortization: 0.0,
    currentBookValue: 0.0,
    releaseClause: 60.0,
    marketValue: 45.0,
    sellOnPercentage: 0.0,
    sellOnBasis: "profit",
    isHomegrown: true,
    annualSalaryEst: 2.8,
  },
  {
    id: "debast",
    name: "Zeno Debast",
    shortName: "Debast",
    position: "defender",
    number: 6,
    nationality: "🇧🇪 Bélgica / Belgium",
    joinYear: 2024,
    contractExpiry: 2029,
    contractYearsTotal: 5,
    yearsElapsed: 2,
    acquisitionCost: 18.05, // €15.5M initial + €2.55M addons realized (RC 25-26 Note 13.1)
    acquisitionAddons: 2.95,
    annualAmortization: 3.61,
    currentBookValue: 10.83,
    releaseClause: 80.0,
    marketValue: 40.0,
    sellOnPercentage: 0.15, // RSC Anderlecht (15% on capital gain)
    sellOnBasis: "profit",
    isHomegrown: false,
    annualSalaryEst: 2.2,
  },
  {
    id: "doumbia",
    name: "Issa Doumbia",
    shortName: "Doumbia",
    position: "midfielder",
    number: 18,
    nationality: "🇮🇹 Itália / Italy",
    joinYear: 2026,
    contractExpiry: 2031,
    contractYearsTotal: 5,
    yearsElapsed: 0,
    acquisitionCost: 20.53, // €20.53M fixed to Venezia FC (RC 25-26 Note 13.1)
    acquisitionAddons: 6.32,
    annualAmortization: 4.11,
    currentBookValue: 20.53,
    releaseClause: 80.0,
    marketValue: 25.0,
    sellOnPercentage: 0.10, // Venezia FC (10% on capital gain)
    sellOnBasis: "profit",
    isHomegrown: false,
    annualSalaryEst: 2.0,
  },
  {
    id: "altimira",
    name: "Sergi Altimira",
    shortName: "Altimira",
    position: "midfielder",
    number: 16,
    nationality: "🇪🇸 Espanha / Spain",
    joinYear: 2026,
    contractExpiry: 2031,
    contractYearsTotal: 5,
    yearsElapsed: 0,
    acquisitionCost: 18.25, // €18.25M fixed to Real Betis (RC 25-26 Note 13.1)
    acquisitionAddons: 2.0,
    annualAmortization: 3.65,
    currentBookValue: 18.25,
    releaseClause: 80.0,
    marketValue: 24.0,
    sellOnPercentage: 0.15, // Real Betis (15% on capital gain, reducible to 10%)
    sellOnBasis: "profit",
    isHomegrown: false,
    annualSalaryEst: 2.2,
  },
  {
    id: "maxi_araujo",
    name: "Maximiliano Araújo",
    shortName: "Maxi Araújo",
    position: "forward",
    number: 20,
    nationality: "🇺🇾 Uruguai / Uruguay",
    joinYear: 2024,
    contractExpiry: 2029,
    contractYearsTotal: 5,
    yearsElapsed: 2,
    acquisitionCost: 13.73, // €13.6M initial + €0.13M realized (RC 25-26 Note 13.1)
    acquisitionAddons: 1.27,
    annualAmortization: 2.75,
    currentBookValue: 8.24,
    releaseClause: 80.0,
    marketValue: 28.0,
    sellOnPercentage: 0.0,
    sellOnBasis: "profit",
    isHomegrown: false,
    annualSalaryEst: 2.0,
  },
  {
    id: "catamo",
    name: "Geny Catamo",
    shortName: "Geny",
    position: "forward",
    number: 21,
    nationality: "🇲🇿 Moçambique / Mozambique",
    joinYear: 2020,
    contractExpiry: 2029,
    contractYearsTotal: 9,
    yearsElapsed: 6,
    acquisitionCost: 3.6, // 100% economic rights after €2.25M acquisition from Amora FC & Black Bulls (Jul 2025)
    acquisitionAddons: 0.4,
    annualAmortization: 0.9,
    currentBookValue: 2.7,
    releaseClause: 60.0,
    marketValue: 30.0,
    sellOnPercentage: 0.10, // Amora FC & Black Bulls (10% on capital gain)
    sellOnBasis: "profit",
    isHomegrown: false,
    annualSalaryEst: 1.8,
  },
  {
    id: "luis_guilherme",
    name: "Luís Guilherme",
    shortName: "L. Guilherme",
    position: "forward",
    number: 11,
    nationality: "🇧🇷 Brasil / Brazil",
    joinYear: 2026,
    contractExpiry: 2030,
    contractYearsTotal: 4.5,
    yearsElapsed: 0.5,
    acquisitionCost: 14.0, // €14.0M fixed from West Ham United (RC 25-26 Note 13.1)
    acquisitionAddons: 3.0,
    annualAmortization: 3.11,
    currentBookValue: 12.44,
    releaseClause: 80.0,
    marketValue: 22.0,
    sellOnPercentage: 0.15, // West Ham United (15% on capital gain)
    sellOnBasis: "profit",
    isHomegrown: false,
    annualSalaryEst: 1.8,
  },
  {
    id: "vagiannidis",
    name: "Georgios Vagiannidis",
    shortName: "Vagiannidis",
    position: "defender",
    number: 2,
    nationality: "🇬🇷 Grécia / Greece",
    joinYear: 2025,
    contractExpiry: 2030,
    contractYearsTotal: 5,
    yearsElapsed: 1,
    acquisitionCost: 12.0, // €12.0M fixed from Panathinaikos (RC 25-26 Note 13.1)
    acquisitionAddons: 2.5,
    annualAmortization: 2.4,
    currentBookValue: 9.6,
    releaseClause: 80.0,
    marketValue: 20.0,
    sellOnPercentage: 0.15, // Panathinaikos (15% on capital gain)
    sellOnBasis: "profit",
    isHomegrown: false,
    annualSalaryEst: 1.6,
  },
  {
    id: "quaresma",
    name: "Eduardo Quaresma",
    shortName: "Quaresma",
    position: "defender",
    number: 72,
    nationality: "🇵🇹 Portugal",
    joinYear: 2020,
    contractExpiry: 2029,
    contractYearsTotal: 9,
    yearsElapsed: 6,
    acquisitionCost: 0.0,
    acquisitionAddons: 0.0,
    annualAmortization: 0.0,
    currentBookValue: 0.0,
    releaseClause: 80.0,
    marketValue: 25.0,
    sellOnPercentage: 0.0,
    sellOnBasis: "profit",
    isHomegrown: true,
    annualSalaryEst: 1.6,
  },
  {
    id: "braganca",
    name: "Daniel Bragança",
    shortName: "Bragança",
    position: "midfielder",
    number: 23,
    nationality: "🇵🇹 Portugal",
    joinYear: 2020,
    contractExpiry: 2027,
    contractYearsTotal: 7,
    yearsElapsed: 6,
    acquisitionCost: 0.0,
    acquisitionAddons: 0.0,
    annualAmortization: 0.0,
    currentBookValue: 0.0,
    releaseClause: 60.0,
    marketValue: 18.0,
    sellOnPercentage: 0.0,
    sellOnBasis: "profit",
    isHomegrown: true,
    annualSalaryEst: 1.5,
  },
  {
    id: "rui_silva",
    name: "Rui Silva",
    shortName: "Rui Silva",
    position: "goalkeeper",
    number: 24,
    nationality: "🇵🇹 Portugal",
    joinYear: 2025,
    contractExpiry: 2029,
    contractYearsTotal: 4,
    yearsElapsed: 1,
    acquisitionCost: 4.5, // €4.5M fixed from Real Betis (RC 25-26 Note 13.1)
    acquisitionAddons: 1.0,
    annualAmortization: 1.13,
    currentBookValue: 3.38,
    releaseClause: 45.0,
    marketValue: 10.0,
    sellOnPercentage: 0.0,
    sellOnBasis: "profit",
    isHomegrown: false,
    annualSalaryEst: 1.8,
  },
];

export interface PlayerSaleSimulationResult {
  grossFee: number;
  bookValueDeduction: number;
  sellOnFee: number;
  fifaSolidarity: number;
  agentFee: number;
  netAccountingGain: number; // Capital Gain for P&L
  netCashInflow: number; // Actual cash for Treasury
  roiMultiple: number;
  annualAmortizationRelief: number;
  annualWageRelief: number;
  uefaSquadCostRelief: number;
}

export function calculatePlayerSaleRoi(
  player: PlayerValuationProfile,
  proposedFee: number,
  agentFeePct: number = 0.05,
): PlayerSaleSimulationResult {
  const grossFee = Math.max(0, proposedFee);
  const bookValueDeduction = player.currentBookValue;

  // Sell-on fee calculation
  let sellOnFee = 0;
  if (player.sellOnPercentage > 0) {
    if (player.sellOnBasis === "profit") {
      const grossProfit = Math.max(0, grossFee - player.acquisitionCost);
      sellOnFee = grossProfit * player.sellOnPercentage;
    } else {
      sellOnFee = grossFee * player.sellOnPercentage;
    }
  }

  // Solidarity mechanism: 5% of gross fee for clubs involved in training (0 if homegrown)
  const fifaSolidarity = player.isHomegrown ? 0 : grossFee * 0.05;

  // Intermediation / Agent commission
  const agentFee = grossFee * Math.max(0, agentFeePct);

  // Net Accounting Capital Gain = Gross Fee - Net Book Value - Retained Sell-On - Solidarity - Agent
  const netAccountingGain =
    grossFee - bookValueDeduction - sellOnFee - fifaSolidarity - agentFee;

  // Net Cash Inflow = Gross Fee - Retained Sell-On - Solidarity - Agent
  const netCashInflow = Math.max(
    0,
    grossFee - sellOnFee - fifaSolidarity - agentFee,
  );

  const roiMultiple =
    player.acquisitionCost > 0
      ? grossFee / player.acquisitionCost
      : grossFee > 0
        ? 999.0 // Homegrown infinite ROI
        : 0;

  const annualAmortizationRelief = player.annualAmortization;
  const annualWageRelief = player.annualSalaryEst;
  const uefaSquadCostRelief = annualAmortizationRelief + annualWageRelief;

  const round2 = (n: number) => Math.round(n * 100) / 100;

  return {
    grossFee: round2(grossFee),
    bookValueDeduction: round2(bookValueDeduction),
    sellOnFee: round2(sellOnFee),
    fifaSolidarity: round2(fifaSolidarity),
    agentFee: round2(agentFee),
    netAccountingGain: round2(netAccountingGain),
    netCashInflow: round2(netCashInflow),
    roiMultiple: round2(roiMultiple),
    annualAmortizationRelief: round2(annualAmortizationRelief),
    annualWageRelief: round2(annualWageRelief),
    uefaSquadCostRelief: round2(uefaSquadCostRelief),
  };
}
