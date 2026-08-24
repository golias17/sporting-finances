import autoTable from "jspdf-autotable";
import { state } from "../core/state.js";
import type { PdfContext } from "./pdfTypes.js";

export function drawCompetitiveBenchmarkPage(ctx: PdfContext) {
  const { doc, isPt, colors, startNewPage } = ctx;
  startNewPage();

  const sportingData = state.fullAnnual || [];
  const benficaData = state.BENFICA_DATASET?.annual_data || [];
  const portoData = state.PORTO_DATASET?.annual_data || [];

  const calcClub = (data: any[]) => {
    const rev =
      data.reduce((acc, d) => acc + (d.revenue_operating || 0), 0) / 1000;
    const tf =
      data.reduce((acc, d) => acc + (d.player_transfer_income || 0), 0) / 1000;
    const wages =
      data.reduce((acc, d) => acc + Math.abs(d.personnel_costs || 0), 0) / 1000;
    const comm =
      data.reduce((acc, d) => acc + (d.agent_commissions || 0), 0) / 1000;
    const net = data.reduce((acc, d) => acc + (d.net_result || 0), 0) / 1000;
    const count = Math.max(1, data.length);
    const avgRev = rev / count;
    const avgWages = wages / count;
    const wageRatio = rev > 0 ? Math.round((wages / rev) * 100) : 0;
    const commRatio = tf > 0 ? (comm / tf) * 100 : 0;

    const last = data.length > 0 ? data[data.length - 1] : {};
    const eq = (last.equity || 0) / 1000;
    const nd = (last.net_debt || 0) / 1000;
    const td = (last.transfer_debt_net_total || 0) / 1000;

    return {
      rev,
      avgRev,
      tf,
      wages,
      avgWages,
      wageRatio,
      comm,
      commRatio,
      net,
      eq,
      nd,
      td,
      count,
    };
  };

  const fmtCurrency = (val: number, plusSign = false) => {
    if (val < 0) return `-€${Math.abs(val).toFixed(1)}M`;
    return `${plusSign ? "+" : ""}€${val.toFixed(1)}M`;
  };

  const scp = calcClub(sportingData);
  const slb = calcClub(benficaData);
  const fcp = calcClub(portoData);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...colors.green);
  doc.text(
    isPt
      ? "Benchmark Consolidado — Três Grandes (15 Épocas · 2010/11 a 2024/25)"
      : "Consolidated Benchmark — Big Three (15 Seasons · 2010/11 to 2024/25)",
    15,
    44,
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...colors.mutedText);
  doc.text(
    isPt
      ? "Comparativo exaustivo de agregados acumulados, médias estruturais e posição patrimonial auditada (CMVM)."
      : "Exhaustive comparative analysis of cumulative aggregates, structural averages and audited balance sheets (CMVM).",
    15,
    49,
  );

  // 3 Hero KPI Cards in PDF
  const cardW = 56;
  const cardH = 26;
  const startY = 53;

  const clubs = [
    {
      name: "Sporting CP",
      tag: isPt ? "Menor Dívida Líquida" : "Lowest Net Debt",
      color: colors.green,
      metrics: scp,
    },
    {
      name: "SL Benfica",
      tag: isPt ? "Maior Volume de Receita" : "Top Revenue Volume",
      color: colors.negative,
      metrics: slb,
    },
    {
      name: "FC Porto",
      tag: isPt ? "Alta Alavancagem" : "High Leverage",
      color: [44, 91, 138],
      metrics: fcp,
    },
  ];

  clubs.forEach((c, idx) => {
    const x = 15 + idx * (cardW + 6);

    // Background fill
    doc.setFillColor(250, 251, 252);
    doc.rect(x, startY, cardW, cardH, "F");

    // Top border line
    doc.setFillColor(...(c.color as [number, number, number]));
    doc.rect(x, startY, cardW, 1.8, "F");

    // Card border
    doc.setDrawColor(220, 224, 228);
    doc.rect(x, startY, cardW, cardH, "S");

    // Club Name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...colors.darkInk);
    doc.text(c.name, x + 4, startY + 6.5);

    // Tag
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...colors.mutedText);
    doc.text(c.tag, x + 4, startY + 10.5);

    // Metrics rows
    doc.setFontSize(7);
    doc.setTextColor(...colors.mutedText);
    doc.text(isPt ? "Receitas Totais:" : "Total Revenue:", x + 4, startY + 15);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.darkInk);
    doc.text(`€${c.metrics.rev.toFixed(1)}M`, x + 34, startY + 15);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.mutedText);
    doc.text(isPt ? "Média Salários:" : "Avg Wage Cost:", x + 4, startY + 19.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.darkInk);
    doc.text(
      `€${c.metrics.avgWages.toFixed(1)}M/${isPt ? "a" : "yr"}`,
      x + 34,
      startY + 19.5,
    );

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.mutedText);
    doc.text(isPt ? "Cap. Próprio:" : "Equity 24/25:", x + 4, startY + 24);
    doc.setFont("helvetica", "bold");
    if (c.metrics.eq >= 0) {
      doc.setTextColor(...colors.positive);
      doc.text(`+€${c.metrics.eq.toFixed(1)}M`, x + 34, startY + 24);
    } else {
      doc.setTextColor(...colors.negative);
      doc.text(`-€${Math.abs(c.metrics.eq).toFixed(1)}M`, x + 34, startY + 24);
    }
  });

  // Table Structure
  const headers = [
    isPt ? "Indicador Financeiro" : "Financial Indicator",
    "Sporting CP",
    "SL Benfica",
    "FC Porto",
  ];

  const rows = [
    // Section I
    [
      {
        content: isPt
          ? "I. AGREGADOS ACUMULADOS & MÉDIAS ESTRUTURAIS (15 ÉPOCAS · 2010/11 A 2024/25)"
          : "I. CUMULATIVE AGGREGATES & STRUCTURAL AVERAGES (15 SEASONS · 2010/11 TO 2024/25)",
        colSpan: 4,
        styles: {
          fontStyle: "bold",
          fillColor: [240, 244, 248],
          textColor: colors.darkInk,
        },
      },
    ],
    [
      isPt
        ? "Receitas Operacionais Acumuladas"
        : "Cumulative Operating Revenue",
      `€${scp.rev.toFixed(1)}M`,
      `€${slb.rev.toFixed(1)}M`,
      `€${fcp.rev.toFixed(1)}M`,
    ],
    [
      isPt
        ? "Média Anual de Receitas Operacionais"
        : "Average Annual Operating Revenue",
      `€${scp.avgRev.toFixed(1)}M/${isPt ? "ano" : "yr"}`,
      `€${slb.avgRev.toFixed(1)}M/${isPt ? "ano" : "yr"}`,
      `€${fcp.avgRev.toFixed(1)}M/${isPt ? "ano" : "yr"}`,
    ],
    [
      isPt
        ? "Rendimentos de Passes de Jogadores"
        : "Cumulative Player Transfer Income",
      `€${scp.tf.toFixed(1)}M`,
      `€${slb.tf.toFixed(1)}M`,
      `€${fcp.tf.toFixed(1)}M`,
    ],
    [
      isPt
        ? "Gastos com Pessoal / Salários Totais"
        : "Cumulative Personnel / Wage Costs",
      `€${scp.wages.toFixed(1)}M`,
      `€${slb.wages.toFixed(1)}M`,
      `€${fcp.wages.toFixed(1)}M`,
    ],
    [
      isPt
        ? "Média Anual de Salários (Gastos Pessoal)"
        : "Average Annual Wage Costs",
      `€${scp.avgWages.toFixed(1)}M/${isPt ? "ano" : "yr"}`,
      `€${slb.avgWages.toFixed(1)}M/${isPt ? "ano" : "yr"}`,
      `€${fcp.avgWages.toFixed(1)}M/${isPt ? "ano" : "yr"}`,
    ],
    [
      isPt
        ? "Rácio Médio Salários / Receitas"
        : "Average Wage / Operating Revenue %",
      `${scp.wageRatio}%`,
      `${slb.wageRatio}%`,
      `${fcp.wageRatio}%`,
    ],
    [
      isPt
        ? "Comissões Totais a Intermediários"
        : "Cumulative Agent & Broker Commissions",
      `€${scp.comm.toFixed(1)}M`,
      `€${slb.comm.toFixed(1)}M`,
      `€${fcp.comm.toFixed(1)}M`,
    ],
    [
      isPt
        ? "Resultado Líquido Acumulado (15 Épocas)"
        : "Cumulative Net Result (15 Seasons)",
      fmtCurrency(scp.net, true),
      fmtCurrency(slb.net, true),
      fmtCurrency(fcp.net, true),
    ],

    // Section II
    [
      {
        content: isPt
          ? "II. POSIÇÃO PATRIMONIAL & ENDIVIDAMENTO (30 DE JUNHO DE 2025)"
          : "II. BALANCE SHEET & DEBT POSITION (JUNE 30, 2025)",
        colSpan: 4,
        styles: {
          fontStyle: "bold",
          fillColor: [240, 244, 248],
          textColor: colors.darkInk,
        },
      },
    ],
    [
      isPt
        ? "Capitais Próprios (Solvência)"
        : "Shareholders' Equity (Solvency)",
      fmtCurrency(scp.eq, true),
      fmtCurrency(slb.eq, true),
      fmtCurrency(fcp.eq, true),
    ],
    [
      isPt ? "Dívida Financeira Líquida" : "Net Financial Debt",
      `€${scp.nd.toFixed(1)}M`,
      `€${slb.nd.toFixed(1)}M`,
      `€${fcp.nd.toFixed(1)}M`,
    ],
    [
      isPt ? "Dívida Líquida de Passes a Clubes" : "Net Transfer Debt to Clubs",
      scp.td > 0
        ? `€${scp.td.toFixed(1)}M ` + (isPt ? "(a pagar)" : "(payable)")
        : `€${Math.abs(scp.td).toFixed(1)}M ` +
          (isPt ? "(a receber)" : "(receivable)"),
      slb.td > 0
        ? `€${slb.td.toFixed(1)}M ` + (isPt ? "(a pagar)" : "(payable)")
        : `€${Math.abs(slb.td).toFixed(1)}M ` +
          (isPt ? "(a receber)" : "(receivable)"),
      fcp.td > 0
        ? `€${fcp.td.toFixed(1)}M ` + (isPt ? "(a pagar)" : "(payable)")
        : `€${Math.abs(fcp.td).toFixed(1)}M ` +
          (isPt ? "(a receber)" : "(receivable)"),
    ],
  ];

  autoTable(doc, {
    startY: startY + cardH + 4,
    head: [headers],
    body: rows as any,
    theme: "plain",
    styles: {
      fontSize: 7.5,
      cellPadding: 2.6,
      textColor: colors.darkInk,
      lineWidth: 0.1,
      lineColor: [230, 234, 238],
    },
    headStyles: {
      fillColor: colors.green,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "right",
    },
    columnStyles: {
      0: { halign: "left", cellWidth: 70, fontStyle: "normal" },
      1: { halign: "right", cellWidth: 36 },
      2: { halign: "right", cellWidth: 36 },
      3: { halign: "right", cellWidth: 36 },
    },
    didParseCell: (data) => {
      if (data.section === "head" && data.column.index === 0) {
        data.cell.styles.halign = "left";
      }
      if (data.section === "body") {
        const rawText = data.cell.text?.[0] || "";
        if (rawText.startsWith("+")) {
          data.cell.styles.textColor = colors.positive;
          data.cell.styles.fontStyle = "bold";
        } else if (
          rawText.startsWith("-") ||
          (rawText.includes("€") && rawText.startsWith("-€"))
        ) {
          data.cell.styles.textColor = colors.negative;
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 6;

  // Executive Insights Callout Box
  const boxH = 26;
  doc.setFillColor(245, 248, 246);
  doc.rect(15, finalY, 180, boxH, "F");

  doc.setFillColor(...colors.green);
  doc.rect(15, finalY, 2, boxH, "F");

  doc.setDrawColor(220, 226, 222);
  doc.rect(15, finalY, 180, boxH, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...colors.green);
  doc.text(
    isPt
      ? "CONCLUSÕES E DESTAQUES ESTRATÉGICOS:"
      : "STRATEGIC TAKEAWAYS & CONCLUSIONS:",
    20,
    finalY + 5.5,
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...colors.darkInk);

  const bullet1 = isPt
    ? `• Sporting CP: Menor dívida líquida dos 3 Grandes (€${scp.nd.toFixed(1)}M) e recuperação total de capitais próprios (+€${scp.eq.toFixed(1)}M), com foco em sustentabilidade salarial (${scp.wageRatio}% da receita).`
    : `• Sporting CP: Lowest net debt among the Big 3 (€${scp.nd.toFixed(1)}M) and full equity recovery (+€${scp.eq.toFixed(1)}M), keeping wage burden sustainable (${scp.wageRatio}% of revenue).`;

  const bullet2 = isPt
    ? `• SL Benfica: Líder em volume acumulado (€${slb.rev.toFixed(1)}M receitas e €${slb.tf.toFixed(1)}M de vendas), suportando a maior massa salarial (€${slb.avgWages.toFixed(1)}M/ano).`
    : `• SL Benfica: Leads in cumulative volumes (€${slb.rev.toFixed(1)}M revenue & €${slb.tf.toFixed(1)}M player sales), supporting the highest wage bill (€${slb.avgWages.toFixed(1)}M/yr).`;

  const bullet3 = isPt
    ? `• FC Porto: Forte volume desportivo e de vendas (€${fcp.tf.toFixed(1)}M), mas condicionado por dívida líquida de €${fcp.nd.toFixed(1)}M e capitais próprios em terreno negativo (€${fcp.eq.toFixed(1)}M).`
    : `• FC Porto: High sports & trading volumes (€${fcp.tf.toFixed(1)}M), yet constrained by €${fcp.nd.toFixed(1)}M net debt and negative equity (€${fcp.eq.toFixed(1)}M).`;

  doc.text(bullet1, 20, finalY + 11.5);
  doc.text(bullet2, 20, finalY + 16.5);
  doc.text(bullet3, 20, finalY + 21.5);
}
