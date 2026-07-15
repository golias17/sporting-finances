// =============================================================
// STATE & DOM DATA INITIALIZATION
// =============================================================

// translateNote() has no way to know if a brand-new English note (added to
// transfers.json without a matching directMaps/replacements entry) actually
// got translated — it just returns whatever the regex passes leave behind.
// This set + warnUntranslatedOnce() surfaces that gap in the dev console
// (once per distinct string, so repeated re-renders on filter/sort changes
// don't spam it) instead of silently shipping an English note under the PT
// locale. It's a stopgap, not a fix for the underlying fragility — see the
// NOTE below about why catch-all replacements aren't the answer either.
const warnedUntranslated = new Set();
function warnUntranslatedOnce(str) {
  if (warnedUntranslated.has(str)) return;
  warnedUntranslated.add(str);
  console.warn(
    `[localization] translateNote(): no direct or pattern match found — likely showing untranslated English text under the PT locale:\n  "${str}"`,
  );
}

export function translateNote(str) {
  if (!str) return str;
  let s = str;
  // Exact note translations or common phrases
  const directMaps = {
    "Financial restructuring era. Purchased Marcos Rojo (sold next year for €20M). Key incomings from João Moutinho solidarity payment and Ricky van Wolfswinkel sell.":
      "Era de reestruturação financeira. Compra de Marcos Rojo (vendido no ano seguinte por €20M). Proveitos importantes do mecanismo de solidariedade de João Moutinho e venda de Ricky van Wolfswinkel.",
    "Second season of restructuring. Sold Bruma, Tiago Ilori and Elias Trindade while investing modestly. All purchases included contingent add-ons not reflected in fixed fees.":
      "Segunda época de reestruturação. Venda de Bruma, Tiago Ilori e Elias Trindade, com investimento modesto. Todas as aquisições incluíram bónus contingentes não refletidos nos valores fixos.",
    "Record sales season at the time. Marcos Rojo sold to Manchester United for €20M just one year after signing. Eric Dier and Cedric Soares also departed for the Premier League.":
      "Época recorde de vendas à data. Venda de Marcos Rojo ao Manchester United por €20M um ano após a contratação. Eric Dier e Cédric Soares também saíram para a Premier League.",
    "Heavy investment cycle with Alan Ruiz and Teófilo Gutiérrez as marquee buys. Sales underwhelming — only Fredy Montero to China for €5M.":
      "Ciclo de forte investimento com Alan Ruiz e Teófilo Gutiérrez como contratações sonantes. Vendas modestas — apenas Fredy Montero para a China por €5M.",
    "Record season at the time. €95.7M from player sales (João Mário €40M, Slimani €30.5M, Semedo €14M). Heavy squad investment with Bas Dost, Bruno Fernandes, Doumbia.":
      "Época recorde à data. €95,7M em vendas de jogadores (João Mário €40M, Slimani €30,5M, Semedo €14M). Forte investimento no plantel com Bas Dost, Bruno Fernandes e Doumbia.",
    "Adrien Silva sold to Leicester for up to €29.5M (€20M fixed + €5M variables + €4.5M resign rights). Investment in Marcos Acuña, Raphinha and Wendel.":
      "Venda de Adrien Silva ao Leicester por um valor até €29,5M (€20M fixos + €5M variáveis + €4,5M por renúncia de direitos). Investimento em Marcos Acuña, Raphinha e Wendel.",
    "First full season of financial recovery. Nuno Mendes sold to PSG as a loan (€7M fee, option to buy). Rodrigo Fernandes to Porto for €11M. Marcus Edwards and Ugarte signed.":
      "Primeira época completa de recuperação financeira. Venda de Nuno Mendes ao PSG por empréstimo (taxa de €7M, com opção de compra). Rodrigo Fernandes para o Porto por €11M. Marcus Edwards e Ugarte contratados.",
    "Highest-grossing sales season ever until 2023/24. Matheus Nunes €45M (Wolves), Nuno Mendes €38M (PSG), João Palhinha €20M (Fulham). Acquired Gyökeres, Hjulmand, Trincão and others in summer 2023.":
      "Época de vendas com maior receita de sempre até 2023/24. Matheus Nunes €45M (Wolves), Nuno Mendes €38M (PSG), João Palhinha €20M (Fulham). Contratação de Gyökeres, Hjulmand, Trincão e outros no verão de 2023.",
    "All-time record income season. Pedro Porro €45M (Tottenham), Manuel Ugarte €60M (PSG), Gyökeres, Hjulmand and Trincão brought in for a new era. Added winter acquisitions Koba, Pontelo, Mauro Couto.":
      "Época de receitas recorde. Pedro Porro €45M (Tottenham), Manuel Ugarte €60M (PSG), entrada de Gyökeres, Hjulmand e Trincão para uma nova era. Adicionadas as contratações de inverno de Koba, Pontelo e Mauro Couto.",
    "Amorim departed to Manchester United. Added winter transactions: major arrivals Biel, Kochorashvili, and the block-buster sales of Geovany Quenda (€50.78M) and Dário Essugo (€22.27M) to Chelsea.":
      "Saída de Amorim para o Manchester United. Adicionadas as transações de inverno: entradas importantes de Biel e Kochorashvili, e vendas recorde de Geovany Quenda (€50,78M) e Dário Essugo (€22,27M) para o Chelsea.",
    "Combined Summer 2025 and Winter 2026 transfer windows. Includes the high-profile sale of Viktor Gyökeres to Arsenal for €55.76M (net share) and key acquisitions such as Luis Suárez, Fotios Ioannidis, and Luís Guilherme.":
      "Janelas de transferências combinadas de Verão 2025 e Inverno 2026. Inclui a venda de Viktor Gyökeres ao Arsenal por €55,76M (percentagem líquida) e aquisições importantes como Luis Suárez, Fotios Ioannidis e Luís Guilherme.",
  };

  if (directMaps[str]) return directMaps[str];

  // Apply sequential replacements for recurring phrases
  const replacements = [
    // 1. Specific multi-word phrases, windows, and rulings
    {
      rx: /Training compensation for Moutinho Porto→Monaco move/gi,
      rep: "Compensação de formação pela transferência de Moutinho Porto→Mónaco",
    },
    {
      rx: /Winter contract termination/gi,
      rep: "Rescisão contratual de inverno",
    },
    {
      rx: /Contract terminated by mutual agreement/gi,
      rep: "Contrato rescindido por mútuo acordo",
    },
    {
      rx: /Contract terminated by mutual consent/gi,
      rep: "Contrato rescindido por mútuo acordo",
    },
    {
      rx: /eliminating contingent liability/gi,
      rep: "eliminando o passivo contingente",
    },
    { rx: /liability extinctions/gi, rep: "extinções de passivos" },
    { rx: /retains right to first/gi, rep: "retém direito aos primeiros" },
    { rx: /Winter signing/gi, rep: "Contratação de inverno" },
    { rx: /winter signing/gi, rep: "contratação de inverno" },
    { rx: /Winter transfer/gi, rep: "Transferência de inverno" },
    { rx: /winter transfer/gi, rep: "transferência de inverno" },
    { rx: /Winter loan/gi, rep: "Empréstimo de inverno" },
    { rx: /winter loan/gi, rep: "empréstimo de inverno" },
    { rx: /Loan fee/gi, rep: "Taxa de empréstimo" },
    { rx: /loan fee/gi, rep: "taxa de empréstimo" },

    // 2. Transferred and Sold expressions
    {
      rx: /Later sold to ([A-Za-z0-9\s]+) for €(\d+(?:\.\d+)?)M/gi,
      rep: "Vendido mais tarde ao $1 por €$2M",
    },
    {
      rx: /Sold to ([A-Za-z0-9\s]+) for €(\d+(?:\.\d+)?)M/gi,
      rep: "Vendido ao $1 por €$2M",
    },
    { rx: /just one year later/gi, rep: "apenas um ano depois" },
    {
      rx: /later claimed (\d+(?:\.\d+)?)% of rights/gi,
      rep: "reclamou mais tarde $1% dos direitos",
    },
    {
      rx: /transferred (\d+(?:\.\d+)?)% of ([A-Za-z\s]+) rights to SCP/gi,
      rep: "transferiu $1% dos direitos de $2 para o SCP",
    },
    {
      rx: /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*'s\s*(\d+(?:\.\d+)?)%\s*sell-on/g,
      rep: "cláusula de $2% de mais-valia do $1",
    },
    {
      rx: /Net share received after/gi,
      rep: "Percentagem líquida recebida após",
    },

    // 3. Specific player signing/acquisition expressions
    {
      rx: /\b([A-Za-z]+(?:\s+[A-Za-z]+)*) signing/gi,
      rep: "contratação pelo $1",
    },
    { rx: /Acquired remaining/gi, rep: "Adquiriu os restantes" },
    { rx: /Partial acquisition only/gi, rep: "Apenas aquisição parcial" },
    { rx: /Partial acquisition/gi, rep: "Aquisição parcial" },
    { rx: /partial acquisition/gi, rep: "aquisição parcial" },
    { rx: /Contract renewal/gi, rep: "Renovação de contrato" },
    { rx: /contract renewal/gi, rep: "renovação de contrato" },
    { rx: /Short-term signing/gi, rep: "Contratação de curto prazo" },

    // 4. Specific retaining of rights / sell-ons
    {
      rx: /SCP held (\d+(?:\.\d+)?)% economic rights/gi,
      rep: "SCP detinha $1% dos direitos económicos",
    },
    {
      rx: /SCP retains a? ?(\d+(?:\.\d+)?)% future sell-on/gi,
      rep: "SCP retém $1% de mais-valia futura",
    },
    {
      rx: /SCP retains a? ?(\d+(?:\.\d+)?)% sell-on/gi,
      rep: "SCP retém $1% de mais-valia",
    },
    {
      rx: /SCP retains a? ?(\d+(?:\.\d+)?)% of future sale/gi,
      rep: "SCP retém $1% de futura venda",
    },
    {
      rx: /SCP retains a? ?(\d+(?:\.\d+)?)% of future capital gain/gi,
      rep: "SCP retém $1% de mais-valia futura",
    },
    {
      rx: /retains a? ?(\d+(?:\.\d+)?)% future capital gain sell-on clause/gi,
      rep: "mantém cláusula de $1% de mais-valia futura",
    },
    {
      rx: /retains a? ?(\d+(?:\.\d+)?)% future sell-on clause/gi,
      rep: "mantém cláusula de $1% de mais-valia futura",
    },
    {
      rx: /retains a? ?(\d+(?:\.\d+)?)% sell-on clause/gi,
      rep: "mantém cláusula de $1% de mais-valia",
    },
    {
      rx: /retains a? ?(\d+(?:\.\d+)?)% future sell-on/gi,
      rep: "mantém $1% de mais-valia futura",
    },
    {
      rx: /retains a? ?(\d+(?:\.\d+)?)% sell-on/gi,
      rep: "mantém $1% de mais-valia",
    },
    {
      rx: /retains a? ?(\d+(?:\.\d+)?)% of future capital gain/gi,
      rep: "mantém $1% de mais-valia futura",
    },
    {
      rx: /retains a? ?(\d+(?:\.\d+)?)% of future sale/gi,
      rep: "retém $1% de futura venda",
    },
    {
      rx: /retains a? ?(\d+(?:\.\d+)?)% future sale/gi,
      rep: "retém $1% de futura venda",
    },
    {
      rx: /retains a? ?(\d+(?:\.\d+)?)% future capital gain/gi,
      rep: "mantém $1% de mais-valia futura",
    },
    {
      rx: /retain (\d+(?:\.\d+)?)% of future capital gain/gi,
      rep: "retêm $1% de mais-valia futura",
    },

    // 5. Rights/Commissions/Clauses
    { rx: /Economic rights/gi, rep: "Direitos económicos" },
    { rx: /economic rights/gi, rep: "direitos económicos" },
    { rx: /Partial rights/gi, rep: "Direitos parciais" },
    { rx: /partial rights/gi, rep: "direitos parciais" },
    { rx: /sell-on rights/gi, rep: "direitos de mais-valia" },
    { rx: /solidarity payment/gi, rep: "pagamento de solidariedade" },
    { rx: /solidarity mechanism/gi, rep: "mecanismo de solidariedade" },
    { rx: /solidarity/gi, rep: "solidariedade" },
    { rx: /first refusal/gi, rep: "direito de preferência" },
    { rx: /buyback option/gi, rep: "opção de recompra" },
    { rx: /buyback/gi, rep: "recompra" },
    {
      rx: /€(\d+(?:\.\d+)?)M release clause/gi,
      rep: "cláusula de rescisão de €$1M",
    },
    { rx: /€(\d+(?:\.\d+)?)M clause/gi, rep: "cláusula de €$1M" },
    { rx: /release clause/gi, rep: "cláusula de rescisão" },
    { rx: /termination clause/gi, rep: "cláusula de rescisão" },
    { rx: /sell-on clause/gi, rep: "cláusula de mais-valia" },
    { rx: /Commission:/gi, rep: "Comissão:" },
    { rx: /commission/gi, rep: "comissão" },

    // 6. Performance add-ons
    {
      rx: /Individual sport performance add-on included/gi,
      rep: "Inclui bónus por objetivos desportivos individuais",
    },
    {
      rx: /Individual sport performance add-on matured/gi,
      rep: "Bónus por objetivos desportivos individuais concretizado",
    },
    { rx: /individual performance/gi, rep: "desempenho desportivo individual" },
    { rx: /contingent add-on/gi, rep: "bónus contingente" },
    { rx: /contingent add-ons/gi, rep: "bónus contingentes" },

    // 7. General terms
    { rx: /Free agent/gi, rep: "Agente livre" },
    { rx: /Free transfer/gi, rep: "Custo zero" },
    { rx: /free transfer/gi, rep: "custo zero" },
    { rx: /Contract terminated/gi, rep: "Contrato rescindido" },
    { rx: /contract termination/gi, rep: "rescisão contratual" },
    { rx: /sold to ([A-Za-z\s]+) fund/gi, rep: "vendidos ao fundo $1" },
    { rx: /\bFee\b/gi, rep: "Valor" },

    // 8. Options and Loans
    { rx: /Loan with buy option/gi, rep: "Empréstimo com opção de compra" },
    { rx: /Loan with option to buy/gi, rep: "Empréstimo com opção de compra" },
    { rx: /option to buy/gi, rep: "opção de compra" },
    { rx: /has buy option/gi, rep: "tem opção de compra" },
    { rx: /has purchase option/gi, rep: "tem opção de compra" },
    { rx: /purchase option/gi, rep: "opção de compra" },
    { rx: /buy option/gi, rep: "opção de compra" },
    { rx: /Loan until/gi, rep: "Empréstimo até" },
    { rx: /loan until/gi, rep: "empréstimo até" },
    { rx: /Dry loan/gi, rep: "Empréstimo simples (sem opção)" },
    { rx: /dry loan/gi, rep: "empréstimo simples (sem opção)" },

    // 9. Miscellaneous
    { rx: /materialised/gi, rep: "concretizado" },
    { rx: /materialized/gi, rep: "concretizado" },
    { rx: /court ruling/gi, rep: "decisão judicial" },
    { rx: /wins % of/gi, rep: "ganha percentagem de" },
    {
      rx: /Manager compensation clause/gi,
      rep: "Cláusula de compensação do treinador",
    },
    {
      rx: /Amorim departed to Manchester United/gi,
      rep: "Saída de Amorim para o Manchester United",
    },
    { rx: /Remains at SCP until/gi, rep: "Permanece no SCP até" },
    {
      rx: /Remains loaned at ([A-Za-z\s]+) until/gi,
      rep: "Permanece emprestado ao $1 até",
    },
    { rx: /end of season/gi, rep: "fim da época" },
    { rx: /undisclosed/gi, rep: "não revelado" },
    { rx: /Undisclosed/gi, rep: "Não revelado" },
    { rx: /reducible to/gi, rep: "reduzível para" },
    { rx: /may become mandatory/gi, rep: "pode tornar-se obrigatória" },
    {
      rx: /Highest-grossing sales season/gi,
      rep: "Época de vendas com maior receita de sempre",
    },
    { rx: /debt reversal/gi, rep: "reversão de dívida" },
    { rx: /reversal of/gi, rep: "reversão de" },
    { rx: /belonging to/gi, rep: "pertencente a" },
    { rx: /deducted for/gi, rep: "deduzidos de" },
    { rx: /third-party/gi, rep: "terceiros" },
    // Specific multi-word phrases safe to translate in isolation
    { rx: /\bin H1\b/gi, rep: "no 1º Semestre" },
    { rx: /\bin winter\b/gi, rep: "no inverno" },
    { rx: /\bin summer\b/gi, rep: "no verão" },
    { rx: /\blater sold to\b/gi, rep: "vendido mais tarde ao" },
    { rx: /\bsold to\b/gi, rep: "vendido ao" },
    { rx: /\bwith option\b/gi, rep: "com opção" },
    { rx: /\boptions\b/gi, rep: "opções" },
    { rx: /\boption\b/gi, rep: "opção" },
    { rx: /\bcosts incl\b/gi, rep: "custos incl" },
    { rx: /\bcosts include\b/gi, rep: "custos incluem" },
    { rx: /\bat purchase date\b/gi, rep: "na data de compra" },
    { rx: /\bat SCP\b/gi, rep: "no SCP" },
    { rx: /\buntil\b/gi, rep: "até" },
    { rx: /\bclause set\b/gi, rep: "cláusula fixada" },
  ];

  replacements.forEach((r) => {
    s = s.replace(r.rx, r.rep);
  });

  // NOTE: Do NOT add catch-all single-word replacements here (e.g. "from" → "de",
  // "for" → "por", "and" → "e", "to" → "para"). They break any note text that
  // wasn't in directMaps by mangling club names, player names, and clause wording
  // in unpredictable ways. Add specific phrases to the replacements array above instead.

  // Nothing in directMaps or replacements touched this string at all — most
  // likely a newly-added English note that nobody has translated yet.
  if (s === str) {
    warnUntranslatedOnce(str);
  }

  return s;
}
