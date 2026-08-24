export interface DebtYearSchedule {
  season: string;
  year: number;
  usppPrincipal: number;
  usppInterest: number;
  bankingPrincipal: number;
  bankingInterest: number;
  totalPrincipal: number;
  totalInterest: number;
  totalDebtService: number;
  ebitda: number;
  dscr: number;
  status: "grade" | "adequate" | "tight";
  isBulletYear?: boolean;
}

export type DebtFilterType = "all" | "uspp" | "banking";
export type DebtScenarioType = "base" | "rates_up" | "no_ucl";

export const RAW_DEBT_SCHEDULE: Omit<
  DebtYearSchedule,
  "totalPrincipal" | "totalInterest" | "totalDebtService" | "dscr" | "status"
>[] = [
  {
    season: "2025/26",
    year: 2026,
    usppPrincipal: 0.0,
    usppInterest: 12.94,
    bankingPrincipal: 12.0,
    bankingInterest: 3.8,
    ebitda: 52.0,
  },
  {
    season: "2026/27",
    year: 2027,
    usppPrincipal: 0.0,
    usppInterest: 12.94,
    bankingPrincipal: 28.0, // Refinanced retail bond maturity & revolving credit
    bankingInterest: 3.2,
    ebitda: 50.0,
  },
  {
    season: "2027/28",
    year: 2028,
    usppPrincipal: 5.0,
    usppInterest: 12.94,
    bankingPrincipal: 8.0,
    bankingInterest: 2.1,
    ebitda: 48.0,
  },
  {
    season: "2028/29",
    year: 2029,
    usppPrincipal: 15.0,
    usppInterest: 12.65,
    bankingPrincipal: 6.0,
    bankingInterest: 1.8,
    ebitda: 51.0,
  },
  {
    season: "2029/30",
    year: 2030,
    usppPrincipal: 18.0,
    usppInterest: 11.79,
    bankingPrincipal: 5.0,
    bankingInterest: 1.5,
    ebitda: 53.0,
  },
  {
    season: "2030/31",
    year: 2031,
    usppPrincipal: 20.0,
    usppInterest: 10.75,
    bankingPrincipal: 4.0,
    bankingInterest: 1.2,
    ebitda: 55.0,
  },
  {
    season: "2031/32",
    year: 2032,
    usppPrincipal: 22.0,
    usppInterest: 9.6,
    bankingPrincipal: 4.0,
    bankingInterest: 1.0,
    ebitda: 56.0,
  },
  {
    season: "2032/33",
    year: 2033,
    usppPrincipal: 25.0,
    usppInterest: 8.34,
    bankingPrincipal: 4.0,
    bankingInterest: 0.8,
    ebitda: 57.0,
  },
  {
    season: "2033/34",
    year: 2034,
    usppPrincipal: 30.0,
    usppInterest: 6.9,
    bankingPrincipal: 3.0,
    bankingInterest: 0.6,
    ebitda: 58.0,
  },
  {
    season: "2034/35",
    year: 2035,
    usppPrincipal: 90.0, // Final bullet / refinancing tranche
    usppInterest: 5.18,
    bankingPrincipal: 2.0,
    bankingInterest: 0.4,
    ebitda: 60.0,
    isBulletYear: true,
  },
];

export function computeDebtSchedule(
  filter: DebtFilterType = "all",
  scenario: DebtScenarioType = "base",
): DebtYearSchedule[] {
  return RAW_DEBT_SCHEDULE.map((item) => {
    let principal = 0;
    let interest = 0;

    const rateStress = scenario === "rates_up" ? 1.5 : 0.0;
    const uclPenalty = scenario === "no_ucl" ? 15.0 : 0.0;

    const adjustedBankingInterest = item.bankingInterest + rateStress;
    const adjustedEbitda = Math.max(10.0, item.ebitda - uclPenalty);

    if (filter === "all") {
      principal = item.usppPrincipal + item.bankingPrincipal;
      interest = item.usppInterest + adjustedBankingInterest;
    } else if (filter === "uspp") {
      principal = item.usppPrincipal;
      interest = item.usppInterest;
    } else if (filter === "banking") {
      principal = item.bankingPrincipal;
      interest = adjustedBankingInterest;
    }

    const totalDebtService = principal + interest;
    const dscr = totalDebtService > 0 ? adjustedEbitda / totalDebtService : 99;

    let status: "grade" | "adequate" | "tight" = "grade";
    if (dscr < 1.3) {
      status = "tight";
    } else if (dscr < 1.8) {
      status = "adequate";
    } else {
      status = "grade";
    }

    return {
      season: item.season,
      year: item.year,
      usppPrincipal: item.usppPrincipal,
      usppInterest: item.usppInterest,
      bankingPrincipal: item.bankingPrincipal,
      bankingInterest: adjustedBankingInterest,
      totalPrincipal: principal,
      totalInterest: interest,
      totalDebtService,
      ebitda: adjustedEbitda,
      dscr,
      status,
      isBulletYear: item.isBulletYear,
    };
  });
}

export function computeDebtKPIs(schedule: DebtYearSchedule[]) {
  if (schedule.length === 0) {
    return {
      avgAnnualService: 0,
      avgDscr: 0,
      ltShare: 78,
      estimatedAnnualSavings: 6.2,
      totalPrincipal: 0,
      totalInterest: 0,
      totalDebtService: 0,
      avgEbitda: 0,
    };
  }

  const totalPrincipal = schedule.reduce((acc, s) => acc + s.totalPrincipal, 0);
  const totalInterest = schedule.reduce((acc, s) => acc + s.totalInterest, 0);
  const totalDebtService = schedule.reduce((acc, s) => acc + s.totalDebtService, 0);
  const avgEbitda = schedule.reduce((acc, s) => acc + s.ebitda, 0) / schedule.length;

  const avgAnnualService = totalDebtService / schedule.length;
  const nonBulletYears = schedule.filter((s) => !s.isBulletYear && s.dscr < 90);
  const avgDscr =
    nonBulletYears.length > 0
      ? nonBulletYears.reduce((acc, s) => acc + s.dscr, 0) / nonBulletYears.length
      : schedule.reduce((acc, s) => acc + (s.dscr < 90 ? s.dscr : 0), 0) / schedule.length;

  const totalUSPP = schedule.reduce((acc, s) => acc + s.usppPrincipal, 0);
  const totalBanking = schedule.reduce((acc, s) => acc + s.bankingPrincipal, 0);
  const totalPrincipalAll = totalUSPP + totalBanking;
  const ltShare = totalPrincipalAll > 0 ? (totalUSPP / totalPrincipalAll) * 100 : 78;

  // Annual cash savings compared to legacy bank debt roll-overs (average interest rate 8.5% vs 5.75%)
  const estimatedAnnualSavings = 225 * (0.085 - 0.0575); // ~€6.19M/yr

  return {
    avgAnnualService,
    avgDscr,
    ltShare,
    estimatedAnnualSavings,
    totalPrincipal,
    totalInterest,
    totalDebtService,
    avgEbitda,
  };
}

export function getDebtMaturityChartOptions(
  isPt: boolean,
  baseOpts?: any,
  lineColor?: string,
) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 10 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: lineColor || "rgba(0,0,0,0.06)" },
        ticks: {
          callback: (v: number) => `${v.toFixed(0)}M€`,
          font: { size: 11 },
        },
        title: {
          display: true,
          text: isPt ? "Milhões €" : "Millions €",
          font: { size: 11, weight: "bold" as const },
        },
      },
    },
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: { boxWidth: 12, padding: 16 },
      },
      tooltip: {
        ...baseOpts?.plugins?.tooltip,
        mode: "index" as const,
        callbacks: {
          label: (ctx: { dataset: { label: string }; parsed: { y: number } }) => {
            return ` ${ctx.dataset.label}: €${ctx.parsed.y.toFixed(2)}M`;
          },
          footer: (items: { parsed: { y: number } }[]) => {
            if (items.length < 2) return "";
            const principal = items[0]?.parsed?.y || 0;
            const interest = items[1]?.parsed?.y || 0;
            const total = principal + interest;
            return [`Total Serviço Dívida: €${total.toFixed(2)}M`];
          },
        },
      },
    },
  };
}
