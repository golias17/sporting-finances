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

const RAW_DEBT_SCHEDULE: Omit<
  DebtYearSchedule,
  "totalPrincipal" | "totalInterest" | "totalDebtService" | "dscr" | "status"
>[] = [
  {
    season: "2025/26",
    year: 2026,
    usppPrincipal: 0.0,
    usppInterest: 12.94,
    bankingPrincipal: 0.0,
    bankingInterest: 4.98, // Retail bonds coupons: €50M @ 5.75% (€2.88M) + €40M @ 5.25% (€2.10M) = €4.975M (audited Note 33: €4,975k)
    ebitda: 52.0,
  },
  {
    season: "2026/27",
    year: 2027,
    usppPrincipal: 0.0,
    usppInterest: 12.94,
    bankingPrincipal: 0.0,
    bankingInterest: 4.98,
    ebitda: 50.0,
  },
  {
    season: "2027/28",
    year: 2028,
    usppPrincipal: 0.0,
    usppInterest: 12.94,
    bankingPrincipal: 50.0, // Maturity of Retail Bond Sporting SAD 2024-2027 (Nov 2027)
    bankingInterest: 4.98,
    ebitda: 48.0,
    isBulletYear: true,
  },
  {
    season: "2028/29",
    year: 2029,
    usppPrincipal: 0.0,
    usppInterest: 12.94,
    bankingPrincipal: 40.0, // Maturity of Retail Bond Sporting SAD 2024-2028 (Nov 2028)
    bankingInterest: 2.1, // Remaining retail bond coupon: €40M @ 5.25% = €2.10M
    ebitda: 51.0,
    isBulletYear: true,
  },
  {
    season: "2029/30",
    year: 2030,
    usppPrincipal: 0.0,
    usppInterest: 12.94,
    bankingPrincipal: 0.0, // Post-retail maturities: only small bank facilities / leases
    bankingInterest: 0.8,
    ebitda: 53.0,
  },
  {
    season: "2030/31",
    year: 2031,
    usppPrincipal: 0.0,
    usppInterest: 12.94,
    bankingPrincipal: 0.0,
    bankingInterest: 0.6,
    ebitda: 55.0,
  },
  {
    season: "2031/32",
    year: 2032,
    usppPrincipal: 0.0,
    usppInterest: 12.94,
    bankingPrincipal: 0.0,
    bankingInterest: 0.5,
    ebitda: 56.0,
  },
  {
    season: "2032/33",
    year: 2033,
    usppPrincipal: 0.0,
    usppInterest: 12.94,
    bankingPrincipal: 0.0,
    bankingInterest: 0.4,
    ebitda: 57.0,
  },
  {
    season: "2033/34",
    year: 2034,
    usppPrincipal: 0.0,
    usppInterest: 12.94,
    bankingPrincipal: 0.0,
    bankingInterest: 0.3,
    ebitda: 58.0,
  },
  {
    season: "2034/35",
    year: 2035,
    usppPrincipal: 0.0, // USPP matures in June 2053 (28 years bullet)
    usppInterest: 12.94,
    bankingPrincipal: 0.0,
    bankingInterest: 0.2,
    ebitda: 60.0,
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
      ltShare: 71.4,
      estimatedAnnualSavings: 6.2,
      totalPrincipal: 0,
      totalInterest: 0,
      totalDebtService: 0,
      avgEbitda: 0,
      usppMaturityYear: 2053,
      usppMaturityAmount: 225.0,
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

  // Audited balance sheet: Total remunerated debt = €315M (€225M USPP + €90M Retail Bonds)
  // USPP has 28-yr maturity in 2053 (> 5 years) representing 71.4% of total nominal debt
  const totalDebtNominal = 315.0;
  const usppNominal = 225.0;
  const ltShare = (usppNominal / totalDebtNominal) * 100; // 71.4%

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
    usppMaturityYear: 2053,
    usppMaturityAmount: 225.0,
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
