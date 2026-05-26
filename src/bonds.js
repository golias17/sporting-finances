import { state } from "./state.js";
import { fmtMillions } from "./charts.js";

// BONDS & DEBT ERA DETAILS
// =============================================================
export function renderVmocCost() {
  const rows = [
    {
      season: "2012/13",
      period: "pre",
      note: state.isPt
        ? "Dívida bancária de curto prazo (BCP, Novo Banco, BES) — linhas de crédito rotativo elevadas, sem estrutura de longo prazo"
        : "Short-term bank debt (BCP, Novo Banco, BES) — high revolving credit lines, no long-term structure",
    },
    {
      season: "2013/14",
      period: "pre",
      note: state.isPt
        ? "Último ano da estrutura antiga; clube à beira de uma crise de liquidez"
        : "Final year of the old structure; club on the brink of liquidity crisis",
    },
    {
      season: "2014/15",
      period: "vmoc",
      note: state.isPt
        ? "VMOCs emitidos em Nov 2014 (€135M nominais, ~8% cupão) — custo inferior aos anos anteriores devido à conversão da antiga dívida bancária na reestruturação"
        : "VMOCs issued Nov 2014 (€135M nominal, ~8% coupon) — cost lower than prior years because old bank debt was converted at restructuring",
    },
    {
      season: "2015/16",
      period: "vmoc",
      note: state.isPt
        ? "VMOCs + obrigações públicas Sporting 2010 e 2014 ativas; contrato NOS assinado em Dez 2015"
        : "VMOCs + Sporting 2010 and 2014 public bonds outstanding; NOS TV contract signed Dec 2015",
    },
    {
      season: "2016/17",
      period: "vmoc",
      note: state.isPt
        ? "VMOCs + obrigações públicas; época do ataque a Alcochete — sem eventos financeiros extraordinários"
        : "VMOCs + public bonds; Alcochete attack season — no unusual financial items",
    },
    {
      season: "2017/18",
      period: "vmoc",
      note: state.isPt
        ? "VMOCs + obrigações públicas; estrutura estável, sem novos instrumentos"
        : "VMOCs + public bonds; stable structure, no new instruments",
    },
    {
      season: "2018/19",
      period: "vmoc",
      note: state.isPt
        ? "Lançamento da Lion Finance Nº 1 em Mar 2019 (titularização de €64M) — adiciona custos de titularização aos juros das VMOCs nas últimas semanas do exercício"
        : "Lion Finance No. 1 launched Mar 2019 (€64M securitization) — adds securitization cost on top of VMOC interest in final weeks of FY",
    },
    {
      season: "2019/20",
      period: "vmoc",
      note: state.isPt
        ? "Ano de custo máximo — VMOCs (€135M) + titularização Lion Finance Nº 1 ativos em simultâneo em ano completo"
        : "Peak cost year — VMOCs (€135M) + Lion Finance No. 1 securitization in full force simultaneously",
    },
    {
      season: "2020/21",
      period: "vmoc",
      note: state.isPt
        ? "VMOCs + titularização; época COVID — sem novos instrumentos materiais"
        : "VMOCs + securitization; COVID season — no material new instruments",
    },
    {
      season: "2021/22",
      period: "vmoc",
      note: state.isPt
        ? "Aumento da LF Nº 1 em +€38,5M (Mar 2022) e depois +€11,5M; última época completa com os €135M de VMOCs em circulação"
        : "LF No. 1 topped up +€38.5M (Mar 2022) then +€11.5M; last full season with all €135M VMOCs outstanding",
    },
    {
      season: "2022/23",
      period: "conv1",
      note: state.isPt
        ? "Ago 2022: conversão de €83,6M de VMOCs em ações — os juros acumulados até à conversão inflamam o custo deste ano; LF Nº 1 ainda ativa"
        : "Aug 2022: €83.6M of VMOCs converted into shares — accrued interest at conversion inflates this year's cost; LF No. 1 still active",
    },
    {
      season: "2023/24",
      period: "conv2",
      note: state.isPt
        ? "Dez 2023: conversão dos restantes €51,4M de VMOCs + substituição da LF Nº 1 pela LF Nº 2 (€113,9M) no mesmo dia — VMOCs totalmente extintas; queda acentuada de custos reflete a ausência de juros de VMOCs"
        : "Dec 2023: remaining €51.4M VMOCs converted + LF No. 1 replaced by LF No. 2 (€113.9M) same day — VMOCs fully gone; sharp cost drop reflects absence of VMOC interest",
    },
    {
      season: "2024/25",
      period: "uspp",
      note: state.isPt
        ? "LF Nº 2 + obrigações públicas (2024-2027 e 2024-2028) — USPP emitido em Out 2025, após o fecho desta época; o custo anual do USPP (≈ €12,9M/ano) surgirá a partir de 2025/26"
        : "LF No. 2 + public bonds (2024-2027 and 2024-2028) — USPP issued Oct 2025, after this FY ended; USPP annual cost ≈ €12.9M/yr will appear from 2025/26 onward",
    },
  ];

  const vmocRows = rows.filter((r) => r.period === "vmoc");
  // Use fullAnnual so VMOC era totals are always computed across all seasons
  // regardless of any active date-range filter.
  const vmocTotal = vmocRows.reduce(
    (s, r) =>
      s +
      (state.fullAnnual.find((d) => d.label === r.season)?.financial_result ??
        0),
    0,
  );
  const vmocAvg = vmocTotal / vmocRows.length;

  const periodClass = {
    pre: "",
    vmoc: "period-vmoc",
    conv1: "period-conv1",
    conv2: "period-conv2",
    uspp: "period-uspp",
  };
  const periodLabel = {
    pre: state.isPt ? "Pré-VMOC" : "Pre-VMOC",
    vmoc: state.isPt ? "VMOC ativo" : "VMOC active",
    conv1: state.isPt ? "Conversão 1" : "Conversion 1",
    conv2: state.isPt ? "Conversão 2" : "Conversion 2",
    uspp: state.isPt ? "Era USPP" : "USPP era",
  };

  // KPI strip
  const postConvResult =
    state.fullAnnual.find((d) => d.label === "2023/24")?.financial_result ?? 0;
  document.getElementById("vmocCostKpis").innerHTML = `
    <div class="vmoc-kpi-strip">
      <div class="vmoc-kpi-item">
        <div class="vk-label">${state.isPt ? "Custo finan. líquido total · Era VMOC (2014/15–2021/22)" : "Total net financing cost · VMOC era (2014/15–2021/22)"}</div>
        <div class="vk-value neg">${fmtMillions(vmocTotal)}</div>
        <div class="vk-note">${state.isPt ? "Acumulado em 8 épocas — VMOCs como instrumento dominante, mas inclui também custos de titularização e obrigações públicas" : "Cumulative across 8 seasons — VMOCs the dominant instrument but also includes securitization and public bond costs"}</div>
      </div>
      <div class="vmoc-kpi-item">
        <div class="vk-label">${state.isPt ? "Custo médio anual de financiamento · Era VMOC" : "Average annual financing cost · VMOC era"}</div>
        <div class="vk-value neg">${fmtMillions(vmocAvg)}${state.isPt ? "/ano" : "/yr"}</div>
        <div class="vk-note">${state.isPt ? "Custo misto de todos os instrumentos ativos em cada ano" : "Blended cost across all instruments active in each year"}</div>
      </div>
      <div class="vmoc-kpi-item">
        <div class="vk-label">${state.isPt ? "Custo finan. líquido após conversão das VMOCs (2023/24)" : "Net financing cost after VMOC conversion (2023/24)"}</div>
        <div class="vk-value pos">${fmtMillions(postConvResult)}</div>
        <div class="vk-note">${state.isPt ? `Poupança de ~${fmtMillions(vmocAvg - postConvResult)}/ano face à média da era VMOC — antes do impacto do USPP` : `Saving of ~${fmtMillions(vmocAvg - postConvResult)}/yr vs the VMOC era average — before USPP kicks in`}</div>
      </div>
    </div>`;

  // Table
  const legend = `
    <div class="vmoc-table-legend">
      <span><span class="vtl-bar vtl-bar--info"></span> ${state.isPt ? "VMOC ativo" : "VMOC active"}</span>
      <span><span class="vtl-bar vtl-bar--gold"></span> ${state.isPt ? "Ano de conversão" : "Conversion year"}</span>
      <span><span class="vtl-bar vtl-bar--green"></span> ${state.isPt ? "Era USPP" : "USPP era"}</span>
    </div>`;

  // Compute the peak absolute financing cost dynamically so the bar scale stays
  // correct even if data changes in the future.
  const peakFinancingCost = Math.max(
    1,
    ...rows.map((r) => {
      const d = state.fullAnnual.find((fd) => fd.label === r.season);
      return d ? Math.abs(d.financial_result) : 0;
    }),
  );
  // Format as a positive cost figure (e.g. "€25.2M") for the tooltip label.
  const peakFmtLabel = fmtMillions(peakFinancingCost);

  let html =
    legend +
    `<div class="scroll-x"><table class="vmoc-cost"><thead><tr><th>${state.isPt ? "Época" : "Season"}</th><th>${state.isPt ? "Período" : "Period"}</th><th>${state.isPt ? "Custo de finan. líquido" : "Net financing cost"}</th><th>${state.isPt ? "Escala" : "Scale"}</th><th>${state.isPt ? "Composição deste valor" : "What's inside this number"}</th></tr></thead><tbody>`;
  rows.forEach((r) => {
    const d = state.annual.find((d) => d.label === r.season);
    if (!d) return;
    const val = d.financial_result;
    const cls = periodClass[r.period];
    const pct = Math.min(
      100,
      Math.max(0, (Math.abs(val) / peakFinancingCost) * 100),
    );
    html += `<tr class="${cls}">
      <td>${r.season}</td>
      <td>${periodLabel[r.period]}</td>
      <td class="cost-neg">
        <div class="vmoc-cost-cell">
          <span>${fmtMillions(val)}</span>
        </div>
      </td>
      <td>
        <div class="cost-bar-container" title="${state.isPt ? `Proporcional ao custo máximo de ${peakFmtLabel}` : `Proportional to peak cost of ${peakFmtLabel}`}">
          <div class="cost-bar ${r.period === "pre" ? "pre" : "period-" + r.period}" style="width: ${pct.toFixed(1)}%"></div>
        </div>
      </td>
      <td>${r.note}</td>
    </tr>`;
  });
  html += `<tr class="total-row">
    <td colspan="2">${state.isPt ? "Acumulado · Era VMOC (2014/15–2021/22)" : "Cumulative · VMOC era (2014/15–2021/22)"}</td>
    <td class="cost-neg">${fmtMillions(vmocTotal)}</td>
    <td></td>
    <td>${state.isPt ? `Média de ${fmtMillions(vmocAvg)}/ano · todos os instrumentos combinados` : `Avg ${fmtMillions(vmocAvg)}/yr · all instruments combined`}</td>
  </tr>`;
  html += "</tbody></table></div>";
  document.getElementById("vmocCostTable").innerHTML = html;
}

export function renderUsppTerms() {
  const terms = [
    {
      label: state.isPt ? "Instrumento" : "Instrument",
      value: "USPP Bond",
      note: state.isPt
        ? "US Private Placement — vendido a investidores institucionais, não cotado publicamente"
        : "US Private Placement — sold to institutional investors, not listed publicly",
      highlight: false,
    },
    {
      label: state.isPt ? "Emitente" : "Issuer",
      value: "Sporting Entertainment",
      note: state.isPt
        ? "Subsidiária detida a 100% pela SAD — isola a dívida do estádio das operações do futebol"
        : "Wholly-owned SAD subsidiary — ring-fences stadium debt from football operations",
      highlight: false,
    },
    {
      label: state.isPt ? "Montante" : "Amount",
      value: "€225M",
      note: state.isPt
        ? "Maior financiamento individual da história da Sporting SAD"
        : "Largest single financing in Sporting SAD history",
      highlight: true,
    },
    {
      label: state.isPt ? "Prazo" : "Tenor",
      value: state.isPt ? "28 anos" : "28 years",
      note: state.isPt
        ? "Vence em 2053. A maioria da dívida dos clubes tem maturidade de 3 a 7 anos"
        : "Matures circa 2053. Most football club debt runs 3–7 years",
      highlight: true,
    },
    {
      label: state.isPt ? "Cupão" : "Coupon",
      value: "5.75%",
      note: state.isPt
        ? "Taxa fixa; spread de 2,85% sobre as Mid-Swaps"
        : "Fixed rate; spread of 2.85% over Mid-Swaps",
      highlight: false,
    },
    {
      label: state.isPt ? "Custos de estrutura" : "Structure costs",
      value: "0.16%/yr",
      note: state.isPt
        ? "Custo total de comissões financeiras, legais e de estruturação sobre 225 M€"
        : "All-in cost of financial, legal and structuring fees on €225M",
      highlight: false,
    },
    {
      label: state.isPt ? "Rating Fitch" : "Fitch rating",
      value: "BBB−",
      note: state.isPt
        ? "Nível de entrada no grau de investimento — pioneiro para um clube de futebol português"
        : "Lowest investment-grade tier — first ever for a Portuguese football club",
      highlight: true,
    },
    {
      label: state.isPt ? "Rating DBRS" : "DBRS rating",
      value: "BBB (low)",
      note: state.isPt
        ? "Equivalente a grau de investimento pela DBRS Morningstar"
        : "Investment grade equivalent from DBRS Morningstar",
      highlight: true,
    },
    {
      label: state.isPt ? "Procura" : "Demand",
      value: "~€2bn (8.5×)",
      note: state.isPt
        ? "Procura 8,5 vezes superior à oferta — sinal de forte confiança institucional"
        : "Oversubscribed 8.5× — signals deep institutional confidence",
      highlight: true,
    },
    {
      label: state.isPt ? "Data de fecho" : "Closing date",
      value: state.isPt ? "22 Out 2025" : "Oct 22, 2025",
      note: state.isPt
        ? "Agendado após confirmação de capitais próprios de +41 M€ nos resultados anuais de 24/25"
        : "Timed after 24/25 annual results confirmed equity at +€41M",
      highlight: false,
    },
  ];

  const uses = [
    {
      icon: "🏟️",
      title: state.isPt
        ? "Transformação do Estádio Alvalade"
        : "Estádio Alvalade transformation",
      desc: state.isPt
        ? "Objetivo principal — financiar a remodelação completa do Estádio José Alvalade num hub global de entretenimento e lifestyle."
        : "Primary purpose — fund the full redevelopment of José Alvalade into a global entertainment and lifestyle hub.",
    },
    {
      icon: "↩️",
      title: state.isPt
        ? "Reembolso de Capex anterior à SAD"
        : "Reimburse SAD for prior capex",
      desc: state.isPt
        ? "Reembolsar a Sporting SAD pelos investimentos na renovação do estádio já realizados antes do fecho da emissão."
        : "Repay Sporting SAD for stadium renovation investment already spent before the bond closed.",
    },
    {
      icon: "⚙️",
      title: state.isPt
        ? "Operações da Sporting Entertainment"
        : "Sporting Entertainment operations",
      desc: state.isPt
        ? "Financiar os custos operacionais contínuos da Sporting Entertainment, S.A. na gestão do negócio do estádio."
        : "Finance the ongoing operational costs of Sporting Entertainment, S.A. as it manages the stadium business.",
    },
    {
      icon: "✅",
      title: state.isPt
        ? "Reembolso da Lion Finance Nº 2"
        : "Repay Lion Finance No. 2",
      desc: state.isPt
        ? "Liquidou a titularização de direitos de TV da NOS (€68.792.338,48), libertando as receitas — concluído a 23 de Out de 2025."
        : "Retire the NOS TV-rights securitization (€68,792,338.48), freeing the receivables — completed Oct 23, 2025.",
    },
  ];

  document.getElementById("usppTerms").innerHTML = `
    <div class="uspp-grid">
      ${terms
        .map((t) => {
          let valHtml = t.value;
          if (t.value === "BBB−" || t.value === "BBB (low)") {
            valHtml = `<span class="rating-badge investment-grade">${t.value}</span>`;
          }
          return `
            <div class="uspp-term">
              <div class="ut-label">${t.label}</div>
              <div class="ut-value${t.highlight && !t.value.includes("BBB") ? " highlight" : ""}">${valHtml}</div>
              <div class="ut-note">${t.note}</div>
            </div>
          `;
        })
        .join("")}
    </div>
    <div class="uspp-uses">
      <div class="uspp-uses-title">${state.isPt ? "Utilização dos fundos" : "Use of proceeds"}</div>
      ${uses
        .map(
          (u, i) => `
        <div class="uspp-use-row">
          <div class="uspp-use-num">${i + 1}</div>
          <div class="uspp-use-icon">${u.icon}</div>
          <div class="uspp-use-body">
            <div class="uspp-use-title">${u.title}</div>
            <div class="uspp-use-desc">${u.desc}</div>
          </div>
        </div>
      `,
        )
        .join("")}
    </div>`;
}

export function renderLionFinance() {
  function row(key, val, sub, accentClass) {
    return `<div class="lf-row">
      <span class="lf-key">${key}</span>
      <div class="lf-row-block">
        <span class="lf-val${accentClass ? " " + accentClass : ""}">${val}</span>
        ${sub ? `<span class="lf-sub">${sub}</span>` : ""}
      </div>
    </div>`;
  }

  const no1 = `
    <div class="lf-card">
      <div class="lf-card-head no1">
        <h4>Lion Finance No. 1</h4>
        <span class="lf-dates">${state.isPt ? "Mar 2019 → Dez 2023" : "Mar 2019 → Dec 2023"}</span>
      </div>
      ${row(state.isPt ? "Entidade Emitente (SPV)" : "SPV", "Sagasta Finance STC")}
      ${row(state.isPt ? "Garantia" : "Collateral", state.isPt ? "Contrato de TV da NOS" : "NOS TV contract", state.isPt ? "Direitos de TV, multimédia, Sporting TV, publicidade no estádio, direitos de patrocinador principal" : "TV, multimedia, Sporting TV, stadium ads, main sponsor rights")}
      ${row(state.isPt ? "Fundos originais" : "Original proceeds", "€64.0M", state.isPt ? "~52,9 M€ para a Sporting SAD; 11,1 M€ para a Sporting Comunicação e Plataformas" : "~€52.9M to Sporting SAD; €11.1M to Sporting Comunicação e Plataformas")}
      ${row(state.isPt ? "Aumento (Mar 2022)" : "Top-up (Mar 2022)", "+€38.5M", state.isPt ? "Mesmo contrato da NOS; eliminou a dívida bancária ao Millennium BCP" : "Same NOS contract; eliminated Millennium BCP bank debt")}
      ${row(state.isPt ? "Aumento adicional" : "Further increase", "+€11.5M", state.isPt ? "Preço de compra adicional para créditos de direitos de TV/multimédia" : "Additional purchase price for TV/multimedia rights credits")}
      ${row(state.isPt ? "Exposição bancária residual" : "Bank exposure after", "Sagasta + Novo Banco", state.isPt ? "Saída total do Millennium BCP" : "Millennium BCP fully exited")}
      ${row(state.isPt ? "Reembolsado" : "Repaid", state.isPt ? "22 Dez 2023" : "Dec 22, 2023", state.isPt ? "Voto unânime dos obrigacionistas; imediatamente substituído pela LF Nº 2" : "Unanimous bondholder vote; immediately replaced by LF No. 2", "warn")}
    </div>`;

  const no2 = `
    <div class="lf-card">
      <div class="lf-card-head no2">
        <h4>Lion Finance No. 2</h4>
        <span class="lf-dates">${state.isPt ? "Dez 2023 → Out 2025" : "Dec 2023 → Oct 2025"}</span>
      </div>
      ${row(state.isPt ? "Entidade Emitente (SPV)" : "SPV", "Sagasta Finance STC")}
      ${row(state.isPt ? "Garantia" : "Collateral", state.isPt ? "Contrato de TV da NOS" : "NOS TV contract", state.isPt ? "Mesmo contrato de Dez 2015 da LF Nº 1" : "Same Dec 2015 contract as LF No. 1")}
      ${row(state.isPt ? "Total emitido" : "Total issued", "€113.9M", state.isPt ? "Dividido entre a Sporting SAD e a Sporting Comunicação e Plataformas" : "Split between Sporting SAD and Sporting Comunicação e Plataformas")}
      ${row(state.isPt ? "Aumento líquido face à LF Nº 1" : "Net increase over LF No. 1", "~€50.1M", state.isPt ? "Maior montante libertado pelo melhor perfil de crédito e maior maturidade do contrato NOS" : "Larger pool unlocked by stronger credit profile and longer NOS contract runway")}
      ${row(state.isPt ? "Exposição bancária residual" : "Bank exposure after", state.isPt ? "Apenas Sagasta" : "Sagasta only", state.isPt ? 'Saída total do Novo Banco; fim de todos os "banking covenants"' : "Novo Banco fully exited; all banking covenants ended")}
      ${row(state.isPt ? "Reembolsado" : "Repaid", state.isPt ? "23 Out 2025" : "Oct 23, 2025", state.isPt ? "68.792.338,48 € — voto unânime dos obrigacionistas" : "€68,792,338.48 — unanimous bondholder vote", "warn")}
      ${row(state.isPt ? "Origem do reembolso" : "Source of repayment", state.isPt ? "Fundos obtidos com o USPP" : "USPP proceeds", state.isPt ? "Obrigações USPP emitidas a 22 Out 2025 — LF Nº 2 reembolsada no dia seguinte" : "USPP bond closed Oct 22, 2025 — repaid LF No. 2 the following day", "accent")}
    </div>`;

  const activeTab = state.activeLionTab;
  const switcher = `
    <div class="lf-switcher">
      <button class="lf-switch-btn${activeTab === "both" ? " active" : ""}" data-view="both">
        ${state.isPt ? "Comparar Ambas" : "Compare Both"}
      </button>
      <button class="lf-switch-btn${activeTab === "no1" ? " active" : ""}" data-view="no1">
        Lion Finance No. 1
      </button>
      <button class="lf-switch-btn${activeTab === "no2" ? " active" : ""}" data-view="no2">
        Lion Finance No. 2
      </button>
    </div>
  `;

  let gridClass = "lf-grid";
  if (activeTab === "no1") gridClass += " show-no1";
  if (activeTab === "no2") gridClass += " show-no2";

  const container = document.getElementById("lionFinanceCards");
  if (container) {
    container.innerHTML = `${switcher}<div class="${gridClass}">${no1}${no2}</div>`;

    // Toggle CSS classes without rebuilding the whole DOM on every click.
    container.querySelectorAll(".lf-switch-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const view = e.currentTarget.getAttribute("data-view");
        state.setActiveLionTab(view);
        // Update active button
        container.querySelectorAll(".lf-switch-btn").forEach((b) =>
          b.classList.toggle("active", b.getAttribute("data-view") === view),
        );
        // Update grid visibility class
        const grid = container.querySelector(".lf-grid");
        if (grid) {
          grid.className = "lf-grid";
          if (view === "no1") grid.classList.add("show-no1");
          if (view === "no2") grid.classList.add("show-no2");
        }
      });
    });
  }
}

// =============================================================
