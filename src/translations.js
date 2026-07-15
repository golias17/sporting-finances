// src/translations.js
// All static UI strings keyed by data-i18n attribute value.
// Each entry: { en: "...", pt: "..." }
// For entries with inner HTML (em, strong, etc.) use innerHTML: true

// Not exported — only read internally by applyTranslations() below.
// Nothing outside this file imports it.
const TRANSLATIONS = {
  "era-all": { en: "All Time", pt: "Sempre" },
  "era-restruct": { en: "Restructuring", pt: "Reestruturação" },
  "era-varandas": { en: "Varandas Era", pt: "Era Varandas" },
  "era-amorim": { en: "Amorim Era", pt: "Era Amorim" },
  "auto-txt-button-5": { en: "← Prev", pt: "← Ant" },
  "auto-txt-button-6": { en: "Next →", pt: "Próx →" },
  "auto-txt-button-7": { en: "Exit", pt: "Sair" },
  "auto-txt-div-10": {
    en: '<span><span class="zone-dot g"></span> Below 35% — diversified</span> <span><span class="zone-dot a"></span> 35–50% — reliant</span> <span><span class="zone-dot r"></span> Above 50% — high risk</span>',
    pt: '<span><span class="zone-dot g"></span> Abaixo de 35% — diversificado</span> <span><span class="zone-dot a"></span> 35–50% — dependente</span> <span><span class="zone-dot r"></span> Acima de 50% — risco elevado</span>',
    innerHTML: true,
  },
  "auto-txt-div-12": {
    en: '<span><span class="zone-dot g"></span> Below 1× — manageable</span> <span><span class="zone-dot a"></span> 1–2× — elevated</span> <span><span class="zone-dot r"></span> Above 2× — heavy</span>',
    pt: '<span><span class="zone-dot g"></span> Abaixo de 1× — gerível</span> <span><span class="zone-dot a"></span> 1–2× — elevado</span> <span><span class="zone-dot r"></span> Acima de 2× — pesado</span>',
    innerHTML: true,
  },
  "auto-txt-div-13": {
    en: '<span><span class="zone-dot g"></span> Above 1.0 — can cover bills</span> <span><span class="zone-dot a"></span> 0.5–1.0 — tight</span> <span><span class="zone-dot r"></span> Below 0.5 — very stretched</span>',
    pt: '<span><span class="zone-dot g"></span> Acima de 1,0 — consegue cobrir contas</span> <span><span class="zone-dot a"></span> 0.5–1,0 — apertado</span> <span><span class="zone-dot r"></span> Abaixo de 0,5 — muito pressionado</span>',
    innerHTML: true,
  },
  "auto-txt-div-3": {
    en: '<span class="stat-from">−€119M</span> <span class="stat-arrow">→</span> <span class="stat-to">+€41M</span>',
    pt: '<span class="stat-from">−€119M</span> <span class="stat-arrow">→</span> <span class="stat-to">+€41M</span>',
    innerHTML: true,
  },
  "auto-txt-div-34": {
    en: '<span class="cmp-col-label" id="cmpHeadA"></span> <span></span> <span class="cmp-col-label" id="cmpHeadB"></span>',
    pt: '<span class="cmp-col-label" id="cmpHeadA"></span> <span></span> <span class="cmp-col-label" id="cmpHeadB"></span>',
    innerHTML: true,
  },
  "auto-txt-div-35": {
    en: '<button class="el-filter active" data-filter="all">All</button><button class="el-filter win" data-filter="win">Win / milestone</button><button class="el-filter crisis" data-filter="crisis">Crisis</button><button class="el-filter restructure" data-filter="restructure">Restructuring</button>',
    pt: '<button class="el-filter active" data-filter="all">Todos</button><button class="el-filter win" data-filter="win">Vitória / Marco</button><button class="el-filter crisis" data-filter="crisis">Crise</button><button class="el-filter restructure" data-filter="restructure">Reestruturação</button>',
    innerHTML: true,
  },
  "auto-txt-div-36": {
    en: '<span class="event-date">Nov 2014</span><span class="event-badge">Restructuring</span>',
    pt: '<span class="event-date">Nov 2014</span><span class="event-badge">Reestruturação</span>',
    innerHTML: true,
  },
  "auto-txt-div-37": {
    en: "Capital restructuring &amp; first VMOCs",
    pt: "Reestruturação de capital e primeiros VMOC",
    innerHTML: true,
  },
  "auto-txt-div-38": {
    en: "Bruno de Carvalho's AGM authorizes a major capital increase and the issuance of Mandatorily-Convertible Bonds (VMOCs), restructuring short-term debt into longer-dated obligations.",
    pt: "A Assembleia Geral convocada por Bruno de Carvalho autoriza um aumento de capital e emissão de Valores Mobiliários Obrigatoriamente Convertíveis (VMOC), alongando os prazos de vencimento da dívida bancária de curto prazo.",
  },
  "auto-txt-div-39": {
    en: '<span class="pitch"><strong>On the pitch —</strong> Stability returned — Sporting could plan ahead and invest in the squad again.</span> <span class="numbers"><strong>In the numbers —</strong> Equity flipped positive (+€7M) for the first time; short-term debt load nearly halved.</span>',
    pt: '<span class="pitch"><strong>No relvado —</strong> Regresso da estabilidade — o Sporting voltou a poder planear a época e investir no plantel.</span> <span class="numbers"><strong>Nos números —</strong> O capital próprio passou a positivo (+€7M) pela primeira vez; a dívida de curto prazo caiu para quase metade.</span>',
    innerHTML: true,
  },
  "auto-txt-div-40": {
    en: '<span class="event-date">Jun 2017</span><span class="event-badge">Milestone</span>',
    pt: '<span class="event-date">Jun 2017</span><span class="event-badge">Marco</span>',
    innerHTML: true,
  },
  "auto-txt-div-41": {
    en: "€30.5M net profit — pre-attack peak",
    pt: "Lucro recorde de €30,5M — pico pré-ataque",
  },
  "auto-txt-div-42": {
    en: "Powered by player sales (João Mário €40M to Inter, Slimani €30.5M to Leicester, and others) and Champions League qualification, the SAD posts the largest net result of the era so far.",
    pt: "Graças às vendas de jogadores (João Mário por €40M ao Inter, Slimani por €30,5M ao Leicester) e à qualificação para a Champions, a SAD atinge o maior lucro da época até então.",
  },
  "auto-txt-div-43": {
    en: '<span class="pitch"><strong>On the pitch —</strong> Champions League group stage reached; Jorge Jesus\'s era producing the best football in a decade.</span> <span class="numbers"><strong>In the numbers —</strong> €93M in transfer income — a new record at the time; equity at its best since 2014.</span>',
    pt: '<span class="pitch"><strong>No relvado —</strong> Fase de grupos da Liga dos Campeões garantida; o futebol da era de Jorge Jesus entusiasma os adeptos.</span> <span class="numbers"><strong>Nos números —</strong> €93M em receitas de transferências — recorde histórico da altura; capitais próprios no melhor nível desde 2014.</span>',
    innerHTML: true,
  },
  "auto-txt-div-44": {
    en: '<span class="event-date">15 May 2018</span><span class="event-badge">Crisis</span>',
    pt: '<span class="event-date">15 Mai 2018</span><span class="event-badge">Crise</span>',
    innerHTML: true,
  },
  "auto-txt-div-45": {
    en: "Alcochete attack",
    pt: "Invasão da Academia de Alcochete",
  },
  "auto-txt-div-46": {
    en: "A group of organized supporters attacks the training ground. Players activate just-cause termination clauses; key sales (Patrício, William Carvalho, Gelson Martins) follow. Bruno de Carvalho is impeached.",
    pt: "Um grupo de adeptos invade a Academia. Vários jogadores rescindem com justa causa; seguem-se vendas forçadas (Rui Patrício, William, Gelson). Bruno de Carvalho é destituído em AG.",
  },
  "auto-txt-div-47": {
    en: '<span class="pitch"><strong>On the pitch —</strong> The best squad in years was dismantled overnight. Sporting finished 3rd the following season.</span> <span class="numbers"><strong>In the numbers —</strong> Forced to sell at distressed prices; equity crashed back to -€13M; financial result hit -€10M from rising debt costs.</span>',
    pt: '<span class="pitch"><strong>No relvado —</strong> O melhor plantel em anos desmorona-se. O Sporting termina em 3º lugar na época seguinte.</span> <span class="numbers"><strong>Nos números —</strong> Vendas forçadas abaixo do valor de mercado; o capital próprio afunda para -€13M; custos financeiros disparam.</span>',
    innerHTML: true,
  },
  "auto-txt-div-48": {
    en: '<span class="event-date">2019</span><span class="event-badge">Restructuring</span>',
    pt: '<span class="event-date">2019</span><span class="event-badge">Reestruturação</span>',
    innerHTML: true,
  },
  "auto-txt-div-49": { en: "€65M securitization", pt: "Titularização de €65M" },
  "auto-txt-div-50": {
    en: "Sporting refinances player-receivable cash flows through a securitization vehicle, easing short-term liquidity pressure — while Rúben Amorim is identified as the new coach.",
    pt: "O Sporting refinancia recebíveis futuros de direitos televisivos através de uma titularização, aliviando a tesouraria no curto prazo. Rúben Amorim é contratado.",
  },
  "auto-txt-div-51": {
    en: '<span class="pitch"><strong>On the pitch —</strong> Freed up budget to bring in Rúben Amorim mid-season in 2019/20 — the hire that changed everything.</span> <span class="numbers"><strong>In the numbers —</strong> Non-current (long-term) liabilities jumped from €110M to €184M as short-term debt was pushed out; pressure eased.</span>',
    pt: '<span class="pitch"><strong>No relvado —</strong> Libertou orçamento para contratar Rúben Amorim a meio de 19/20 — a escolha que mudaria o rumo do futebol.</span> <span class="numbers"><strong>Nos números —</strong> O passivo não corrente cresce de €110M para €184M com o alongamento da dívida bancária; alívio da pressão de caixa.</span>',
    innerHTML: true,
  },
  "auto-txt-div-52": {
    en: '<span class="event-date">Mar–Jun 2020/21</span><span class="event-badge">Crisis</span>',
    pt: '<span class="event-date">Mar–Jun 2020/21</span><span class="event-badge">Crise</span>',
    innerHTML: true,
  },
  "auto-txt-div-53": {
    en: "COVID-19 stadium ban",
    pt: "Pandemia COVID-19: jogos à porta fechada",
  },
  "auto-txt-div-54": {
    en: "Empty stadiums, suspended ticketing, broadcasting deal renegotiations. The 20/21 season is played with no fans in the stands.",
    pt: "Estádios vazios, receitas de bilheteira a zero, renegociação de patrocínios. A época histórica de 20/21 é jogada sem público.",
  },
  "auto-txt-div-55": {
    en: '<span class="pitch"><strong>On the pitch —</strong> Sporting won the Liga anyway — first title in 19 years — in front of empty seats on 11 May 2021.</span> <span class="numbers"><strong>In the numbers —</strong> Revenue fell -16% vs prior year; worst net result in the dataset (-€33M); equity hit rock bottom at -€41M.</span>',
    pt: '<span class="pitch"><strong>No relvado —</strong> O Sporting sagra-se campeão nacional — 19 anos depois — a 11 de maio de 2021, com bancadas desertas.</span> <span class="numbers"><strong>Nos números —</strong> Receitas correntes caem 16% face ao ano anterior; pior prejuízo da série (-€33M); capital próprio bate mínimos históricos de -€41M.</span>',
    innerHTML: true,
  },
  "auto-txt-div-56": {
    en: '<span class="event-date">11 May 2021</span><span class="event-badge">Milestone</span>',
    pt: '<span class="event-date">11 Mai 2021</span><span class="event-badge">Marco</span>',
    innerHTML: true,
  },
  "auto-txt-div-57": {
    en: "First Liga title in 19 years",
    pt: "Campeão Nacional 19 anos depois",
  },
  "auto-txt-div-58": {
    en: "Rúben Amorim's squad ends the longest title drought in club history. The win comes despite the pandemic-affected season — in an empty Alvalade.",
    pt: "A equipa de Rúben Amorim quebra o maior jejum da história do clube. A festa faz-se num Alvalade despovoado devido à pandemia.",
  },
  "auto-txt-div-59": {
    en: '<span class="pitch"><strong>On the pitch —</strong> The drought is over. Amorim becomes a legend. The squad\'s togetherness carries through two more titles.</span> <span class="numbers"><strong>In the numbers —</strong> The full financial effect came in 21/22 — when fans returned and Champions League revenue flooded in (+€58M revenue jump in one year).</span>',
    pt: '<span class="pitch"><strong>No relvado —</strong> Fim do jejum. Amorim entra na lenda. O espírito de união do grupo sustenta as bases para futuros sucessos.</span> <span class="numbers"><strong>Nos números —</strong> O impacto financeiro total reflete-se em 21/22 — com o regresso do público e o prémio de entrada na Champions (+€58M de receitas num ano).</span>',
    innerHTML: true,
  },
  "auto-txt-div-60": {
    en: '<span class="event-date">Aug 2022</span><span class="event-badge">Restructuring</span>',
    pt: '<span class="event-date">Ago 2022</span><span class="event-badge">Reestruturação</span>',
    innerHTML: true,
  },
  "auto-txt-div-61": {
    en: "First VMOC conversion (€83.6M)",
    pt: "Primeira Conversão de VMOC (€83,6M)",
  },
  "auto-txt-div-62": {
    en: "€83,571,872 of the mandatorily-convertible bonds issued in 2014 are converted into share capital — wiping the equivalent debt from the balance sheet.",
    pt: "€83.571.872 dos títulos convertíveis emitidos in 2014 passam a ações, eliminando a respetiva dívida bancária do balanço.",
  },
  "auto-txt-div-63": {
    en: '<span class="pitch"><strong>On the pitch —</strong> Financial stability gave Frederico Varandas the runway to keep building the project — Ugarte signed, Gyökeres arrived the next year.</span> <span class="numbers"><strong>In the numbers —</strong> €83.6M of debt simply disappeared; equity crossed zero for the first time since 2017 (+€8.9M); financial expenses dropped and the balance sheet started to look like a normal business.</span>',
    pt: '<span class="pitch"><strong>No relvado —</strong> Estabilidade financeira deu a Frederico Varandas margem para sustentar o projeto desportivo — contratação de Ugarte, seguida de Gyökeres.</span> <span class="numbers"><strong>Nos números —</strong> €83,6M de passivo financeiro transformam-se em capital próprio; capitais próprios regressam a terreno positivo (+€8,9M); custos com juros diminuem.</span>',
    innerHTML: true,
  },
  "auto-txt-div-64": {
    en: '<span class="event-date">Dec 2023</span><span class="event-badge">Restructuring</span>',
    pt: '<span class="event-date">Dez 2023</span><span class="event-badge">Reestruturação</span>',
    innerHTML: true,
  },
  "auto-txt-div-65": {
    en: "Second VMOC conversion (€51.4M)",
    pt: "Segunda Conversão de VMOC (€51,4M)",
  },
  "auto-txt-div-66": {
    en: "A further €51,416,952 of VMOCs convert into equity. Combined with the August 2022 conversion, €135M of debt has been permanently erased.",
    pt: "Mais €51.416.952 de VMOC passam a capital próprio. No total das duas conversões, o Sporting extinguiu €135M de dívida financeira.",
  },
  "auto-txt-div-67": {
    en: '<span class="pitch"><strong>On the pitch —</strong> Back in Champions League regularly; squad value at €365M and rising.</span> <span class="numbers"><strong>In the numbers —</strong> The second conversion brought total debt erased to €135M; equity grew from +€8.9M to +€21M, with financial expenses structurally reduced. The balance sheet reinforced for the long term.</span>',
    pt: '<span class="pitch"><strong>No relvado —</strong> Regresso regular à Champions; valor de mercado do plantel ultrapassa €365M.</span> <span class="numbers"><strong>Nos números —</strong> Segunda conversão eleva a dívida extinta para €135M; capitais próprios sobem para +€21M; estrutura financeira consolidada a longo prazo.</span>',
    innerHTML: true,
  },
  "auto-txt-div-68": {
    en: '<span class="event-date">May 2024</span><span class="event-badge">Milestone</span>',
    pt: '<span class="event-date">Mai 2024</span><span class="event-badge">Marco</span>',
    innerHTML: true,
  },
  "auto-txt-div-69": {
    en: "Second Liga title in 4 years",
    pt: "Bicampeão em quatro anos",
  },
  "auto-txt-div-70": {
    en: "Rúben Amorim wins his second league before leaving for Manchester United in November 2024.",
    pt: "Rúben Amorim conquista o seu segundo campeonato pelo Sporting antes de rumar ao Manchester United em novembro de 2024.",
  },
  "auto-txt-div-71": {
    en: '<span class="pitch"><strong>On the pitch —</strong> Back-to-back domestic dominance. Ugarte (€60M to PSG) and others sold; Gyökeres already scoring at will.</span> <span class="numbers"><strong>In the numbers —</strong> Record €144M in transfer income — the highest single-season figure in the dataset; equity grew to €21M.</span>',
    pt: '<span class="pitch"><strong>No relvado —</strong> Consolidação da hegemonia nacional. Venda de Ugarte (€60M ao PSG); Gyökeres brilha com dezenas de golos.</span> <span class="numbers"><strong>Nos números —</strong> Recorde de €144M em receitas de trading de jogadores — valor mais alto de sempre da série; capital próprio atinge €21M.</span>',
    innerHTML: true,
  },
  "auto-txt-div-72": {
    en: '<span class="event-date">May 2025</span><span class="event-badge">Milestone</span>',
    pt: '<span class="event-date">Mai 2025</span><span class="event-badge">Marco</span>',
    innerHTML: true,
  },
  "auto-txt-div-73": {
    en: "Back-to-back Liga + Taça de Portugal",
    pt: "Dobradinha: Campeonato e Taça",
  },
  "auto-txt-div-74": {
    en: "Sporting wins both major domestic trophies under new coach Rui Borges. Gyökeres (€65.8M to Arsenal) departs in the summer.",
    pt: "O Sporting conquista campeonato e Taça de Portugal sob a liderança do técnico Rui Borges. Gyökeres (€65.8M ao Arsenal) sai no verão.",
  },
  "auto-txt-div-75": {
    en: '<span class="pitch"><strong>On the pitch —</strong> Three Liga titles in five years. Rui Borges\'s transition is seamless. Squad market value hits €511M.</span> <span class="numbers"><strong>In the numbers —</strong> Revenue reaches €148M — 130% up on 5 years prior; wage bill at 59%, the healthiest ratio in 13 years; equity +€41M.</span>',
    pt: '<span class="pitch"><strong>No relvado —</strong> Três campeonatos em cinco anos. Rui Borges assegura transição tranquila. Valor de mercado do plantel atinge €511M.</span> <span class="numbers"><strong>Nos números —</strong> Receitas operacionais atingem €148M (+130% em 5 anos); rácio salarial desce para 59% (mínimo de 13 anos); capitais próprios em +€41M.</span>',
    innerHTML: true,
  },
  "auto-txt-div-76": {
    en: '<span class="event-date">Oct 2025</span><span class="event-badge">Restructuring</span>',
    pt: '<span class="event-date">Out 2025</span><span class="event-badge">Reestruturação</span>',
    innerHTML: true,
  },
  "auto-txt-div-77": {
    en: "€225M USPP bond, investment grade &amp; Sporting Entertainment",
    pt: "USPP de €225M, Investment Grade e Sporting Entertainment",
    innerHTML: true,
  },
  "auto-txt-div-78": {
    en: "A landmark month. Sporting becomes the first Portuguese football club rated investment grade by both Fitch and DBRS — securing a €225M 28-year private placement at 5.75% that refinances all legacy short-term debt. Simultaneously, Sporting Entertainment is created as a commercial subsidiary, triggering the club's first-ever consolidated financial statements.",
    pt: 'Mês histórico. O Sporting torna-se o primeiro clube nacional a obter rating "Investment Grade" pela Fitch e DBRS, emitindo €225M a 28 anos (5,75%) para limpar a dívida bancária antiga. Criação da Sporting Entertainment e consolidação das contas da SAD.',
  },
  "auto-txt-div-79": {
    en: '<span class="pitch"><strong>On the pitch —</strong> The rating is a bigger structural advantage than most trophies — Benfica and Porto don\'t have it. The subsidiary unlocks new commercial revenue streams.</span> <span class="numbers"><strong>In the numbers —</strong> Nearly all debt pushed out to 28+ years at lower cost. First consolidated H1 shows working capital of €100M and a record H1 net result of €32M.</span>',
    pt: '<span class="pitch"><strong>No relvado —</strong> A classificação de investimento é uma vantagem competitiva ímpar perante os rivais. A nova subsidiária expande as receitas comerciais.</span> <span class="numbers"><strong>Nos números —</strong> Quase toda a dívida bancária alongada a 28 anos. Primeiro semestre consolidado revela fundo de maneio de €100M e lucro recorde no semestre de €32M.</span>',
    innerHTML: true,
  },
  "auto-txt-div-8": {
    en: "Club Financial Health — select a season",
    pt: "Saúde Financeira do Clube — selecione uma época",
  },
  "auto-txt-div-80": {
    en: "<strong>Sporting Clube de Portugal — Futebol, SAD.</strong> Built from the SAD's official annual and semester reports filed with the CMVM. Figures in EUR thousands; some 2023/24 numbers restated per the 2024/25 report. Compiled for editorial reference.",
    pt: "<strong>Sporting Clube de Portugal — Futebol, SAD.</strong> Elaborado com base nos relatórios anuais e semestrais oficiais da Sporting SAD apresentados à CMVM. Valores em milhares de euros; alguns valores de 2023/24 foram reexpressos de acordo com o relatório de 2024/25. Compilado para fins de referência informativa.",
    innerHTML: true,
  },
  "auto-txt-div-81": {
    en: "Dossier · 2012/13 → 2025/26 H1<br/> Period ended 31 Dec 2025<br/> Euronext Lisbon · SCP",
    pt: "Dossier · 2012/13 → 2025/26 H1<br/> Período findo em 31 de dezembro de 2025<br/> Euronext Lisbon · SCP",
    innerHTML: true,
  },
  "auto-txt-div-9": {
    en: '<span><span class="zone-dot g"></span> Below 60% — healthy</span> <span><span class="zone-dot a"></span> 60–70% — watch this</span> <span><span class="zone-dot r"></span> Above 70% — problem</span>',
    pt: '<span><span class="zone-dot g"></span> Abaixo de 60% — saudável</span> <span><span class="zone-dot a"></span> 60–70% — atenção</span> <span><span class="zone-dot r"></span> Acima de 70% — preocupante</span>',
    innerHTML: true,
  },
  "auto-txt-h1-2": {
    en: "From insolvency to <em>investment grade</em>.",
    pt: "Da insolvência ao <em>investment grade</em>.",
    innerHTML: true,
  },
  "auto-txt-h2-14": {
    en: "The instruments that <em>saved the club</em>.",
    pt: "Os instrumentos que <em>salvaram o clube</em>.",
    innerHTML: true,
  },
  "auto-txt-h3-18": {
    en: "Annual financing cost — across all instruments",
    pt: "Custo financeiro anual — todos os instrumentos",
  },
  "auto-txt-h3-24": {
    en: "Lion Finance — key facts",
    pt: "Lion Finance — dados principais",
  },
  "auto-txt-h3-30": {
    en: "USPP bond — key terms",
    pt: "Obrigação USPP — termos principais",
  },
  "auto-txt-h4-15": { en: "What is a VMOC?", pt: "O que é um VMOC?" },
  "auto-txt-h4-21": {
    en: "What is a securitization (titularização)?",
    pt: "O que é uma titularização?",
  },
  "auto-txt-h4-27": {
    en: "What is a USPP bond?",
    pt: "O que é uma obrigação USPP?",
  },
  "auto-txt-p-11": {
    en: "Net debt compared to a full year of revenue — the classic “can you afford what you owe?” question.",
    pt: 'Dívida líquida em comparação com um ano inteiro de receitas — a clássica questão: "consegue pagar o que deve?"',
  },
  "auto-txt-p-16": {
    en: "VMOC stands for <em>Valores Mobiliários Obrigatoriamente Convertíveis</em> — mandatorily convertible bonds. Unlike regular bonds, VMOCs do not pay back cash at maturity: they convert into shares. Sporting issued them in November 2014 as part of a capital restructuring designed to push short-term bank debt out by several years and give the club breathing room. Crucially, because conversion into equity was guaranteed, the VMOCs sat closer to equity than debt in economic terms — but were still classified as borrowings on the balance sheet until the conversion dates arrived.",
    pt: "VMOC significa <em>Valores Mobiliários Obrigatoriamente Convertíveis</em>. Ao contrário das obrigações normais, os VMOC não são reembolsados em dinheiro na maturidade: convertem-se em ações. O Sporting emitiu-os em novembro de 2014 no âmbito de uma reestruturação financeira para empurrar a dívida bancária de curto prazo por vários anos. Cruçalmente, como a conversão em capital próprio era garantida, os VMOC assemelhavam-se mais a capital do que a dívida em termos económicos — embora ficassem classificados como passivo financeiro até à data de conversão.",
    innerHTML: true,
  },
  "auto-txt-p-17": {
    en: "The two conversion events — €83.6M in August 2022 and €51.4M in December 2023 — did not involve any cash leaving the club. Debt simply became share capital. The €135M that had sat on the liabilities side of the balance sheet for eight years disappeared, and equity crossed zero for the first time since 2017.",
    pt: "Os dois eventos de conversão — €83,6M em agosto de 2022 e €51,4M em dezembro de 2023 — não envolveram qualquer saída de caixa do clube. A dívida tornou-se simplesmente capital social. Os €135M que constavam do passivo há oito anos desapareceram e o capital próprio subiu acima de zero pela primeira vez desde 2017.",
  },
  "auto-txt-p-20": {
    en: "The net financial result line from the income statement each year — interest paid across every debt instrument (VMOCs, securitization, public bonds, bank loans) minus any financial income. VMOCs were the dominant driver from 2014 to 2022, which is why the cost drops so sharply once they convert. This is <em>not</em> an isolated VMOC figure — it is the total annual financing cost of the club.",
    pt: "A linha de resultados financeiros da demonstração de resultados — juros pagos em todos os instrumentos de dívida (VMOC, titularização, obrigações públicas, empréstimos bancários) menos rendimentos financeiros. Os VMOC foram o principal motor de 2014 a 2022, razão pela qual o custo cai drasticamente após as conversões. Este valor reflete o custo financeiro anual total da SAD.",
    innerHTML: true,
  },
  "auto-txt-p-22": {
    en: "A securitization is a form of asset-backed financing: instead of borrowing money outright, the club assigns future revenue streams — in this case, TV broadcast payments due from NOS Lusomundo Audiovisuais — to a special purpose vehicle (Sagasta Finance STC, S.A.). That SPV then issues bonds backed by those receivables to institutional investors, and passes the cash on to Sporting. As NOS pays its instalments over the coming seasons, the money flows through the SPV to the bondholders. Sporting receives a large upfront lump sum; bondholders receive a stream of secured payments; and NOS keeps paying as normal.",
    pt: "Uma titularização é uma forma de financiamento garantido por ativos: em vez de pedir dinheiro emprestado, o clube cede fluxos de receita futuros — neste caso, pagamentos de transmissão televisiva da NOS — a um veículo financeiro (Sagasta Finance STC, S.A.). Esse veículo emite obrigações garantidas por esses recebíveis a investidores institucionais e entrega o dinheiro ao Sporting. À medida que a NOS paga as prestações, o dinheiro flui do veículo para os investidores. O Sporting recebe uma verba imediata e a NOS continua a pagar normalmente.",
  },
  "auto-txt-p-23": {
    en: "The technique let Sporting monetise future TV income immediately — without selling players or issuing new shares — and at rates competitive with bank loans. Lion Finance No. 1 (2019) was the original vehicle; Lion Finance No. 2 (2023) refinanced and expanded it, ultimately being repaid in full using USPP proceeds in October 2025.",
    pt: "Esta técnica permitiu ao Sporting monetizar receitas futuras de TV de imediato — sem vender jogadores ou emitir ações — a taxas competitivas. O veículo original foi o Lion Finance Nº 1 (2019); o Lion Finance Nº 2 (2023) refinanciou e expandiu-o, sendo totalmente pago com a emissão do USPP em outubro de 2025.",
  },
  "auto-txt-p-26": {
    en: "Two sequential securitizations of the same NOS TV-rights contract, managed through the SPV Sagasta Finance STC, S.A. Click the tabs to compare.",
    pt: "Duas titularizações sucessivas sobre o mesmo contrato de direitos de TV da NOS, geridas através do veículo Sagasta Finance STC, S.A. Clique nas abas para comparar.",
  },
  "auto-txt-p-28": {
    en: "USPP stands for US Private Placement — a form of long-term debt sold directly to institutional investors (primarily US insurance companies and pension funds) rather than issued on a public exchange. USPP bonds typically carry longer maturities than bank loans or public bonds, and require the issuer to obtain a credit rating. For Sporting, the October 2025 USPP was transformational: €225M raised over 28 years at 5.75%, refinancing all legacy short-term facilities in a single transaction.",
    pt: "USPP significa US Private Placement (Colocação Privada nos EUA) — uma forma de dívida de longo prazo vendida diretamente a investidores institucionais (sobretudo seguradoras e fundos de pensões norte-americanos) em vez de bolsa pública. Apresentam maturidades mais longas e requerem rating. Para o Sporting, o USPP de outubro de 2025 foi histórico: €225M emitidos a 28 anos com cupão de 5,75%, refinanciando todas as linhas de curto prazo numa só transação.",
  },
  "auto-txt-p-29": {
    en: "The ratings from Fitch (BBB−) and DBRS (BBB low) — both investment grade — make Sporting the first Portuguese football club to reach this threshold. Investment grade matters because it unlocks a class of institutional investors who are prohibited by mandate from holding sub-investment-grade debt, and because it signals to the market that the club's financials are structurally sound, not just cyclically good.",
    pt: 'Os ratings obtidos da Fitch (BBB−) e DBRS (BBB low) — ambos nível de investimento ("Investment Grade") — tornam o Sporting o primeiro clube em Portugal a atingir este patamar. Isto abre as portas a investidores institucionais que não podem deter dívida sem rating de investimento e assinala ao mercado que a estrutura financeira é sólida.',
  },
  "auto-txt-p-32": {
    en: "The defining financial transaction of the post-recovery era. Every term below is a milestone for Portuguese football.",
    pt: "A transação financeira que define a era pós-recuperação. Cada termo abaixo representa um marco histórico.",
  },
  "auto-txt-p-33": {
    en: "Since 2016/17 the club has generated between €34M and €144M in transfer income every season. The 2023/24 season set the all-time record at €144M. The 2025/26 H1 alone already reached €110M, anchored by the Gyökeres deal.",
    pt: "Desde 2016/17, a SAD gerou entre €34M e €144M em receitas de vendas por época. A época 2023/24 estabeleceu o recorde histórico com €144M. O primeiro semestre de 2025/26 já ultrapassou os €110M, ancorado na venda de Gyökeres.",
  },
  "auto-txt-p-4": {
    en: "From <em>−€119M</em> to <em>+€41M</em>.<br/>Thirteen fiscal years, told in one chart.",
    pt: "De <em>−€119M</em> a <em>+€41M</em>.<br/>Treze anos fiscais, contados num só gráfico.",
    innerHTML: true,
  },
  "auto-txt-span-1": { en: "Dark Mode", pt: "Modo Escuro" },
  "auto-txt-span-19": {
    en: "Net financial result · P&amp;L",
    pt: "Resultado financeiro líquido · P&amp;L",
    innerHTML: true,
  },
  "auto-txt-span-25": { en: "Sagasta Finance STC", pt: "Sagasta Finance STC" },
  "auto-txt-span-31": { en: "Oct 2025", pt: "Out 2025" },
  "auto-txt-title-0": {
    en: "Sporting CP — Financial Evolution Dashboard (2012/13 → 2025/26)",
    pt: "Sporting CP — Evolução Financeira (2012/13 → 2025/26)",
  },
  "ch01-equity-desc": {
    en: "From -€119M (insolvent in substance) to +€41M, with two debt-to-equity conversions along the way.",
    pt: "De -€119M (insolvente em substância) a +€41M, com duas conversões de dívida em capital pelo caminho.",
  },
  "ch01-equity-h3": {
    en: "Equity Evolution",
    pt: "Evolução do Capital Próprio",
  },
  "ch01-equity-tag": { en: "Balance sheet", pt: "Balanço" },
  "ch01-h2": {
    en: "The shape of <em>thirteen years</em>.",
    pt: "A forma de <em>treze anos</em>.",
    innerHTML: true,
  },
  "ch01-hero-desc": {
    en: "Operating revenue, net result and shareholders' equity — the three lines that tell the macro story of Sporting SAD's transformation.",
    pt: "Receitas operacionais, resultado líquido e capital próprio — as três linhas que contam a história macro da transformação da Sporting SAD.",
  },
  "ch01-hero-h3": {
    en: "The 13-year story in one chart",
    pt: "A história de 13 anos num só gráfico",
  },
  "ch01-hero-tag": { en: "Hero · 3 series", pt: "Visão geral · 3 séries" },
  "ch01-lede": {
    en: "Three lines tell the macro story: revenue, net result, and equity. Read them together and the inflection points appear — 2014, 2018, 2021, 2022 — each one a financial fork in the road.",
    pt: "Três linhas contam a história macro: receitas, resultado líquido e capital próprio. Lidas em conjunto, os pontos de inflexão surgem — 2014, 2018, 2021, 2022 — cada um uma bifurcação financeira.",
  },
  "ch01-narrative-h4": { en: "What you're looking at", pt: "O que está a ver" },
  "ch01-narrative-p1": {
    en: "In 2013, Sporting SAD was technically insolvent — negative equity of €119M, current liabilities at 7× current assets, cash of just €1.3M, and no European football. By 2025, the club has back-to-back league titles, a €474M squad market value, equity of +€41M, and just secured a €225M 28-year private bond at 5.75% with investment-grade ratings.",
    pt: "Em 2013, a Sporting SAD estava tecnicamente insolvente — capital próprio negativo de €119M, passivo corrente 7× o ativo corrente, caixa de apenas €1,3M e sem futebol europeu. Em 2025, o clube tem títulos consecutivos, valor de mercado do plantel de €474M, capital próprio de +€41M e uma emissão privada de €225M a 28 anos a 5,75% com notação de grau de investimento.",
  },
  "ch01-narrative-p2": {
    en: "The path was not linear. It runs through a 2014 capital restructuring (issuing convertible bonds), a 2018 staff-attack at Alcochete that triggered a wave of player exits, a COVID year with empty stadiums, and finally a 2022–2023 sequence of two convertible-bond conversions (€135M total) that flipped the balance sheet positive.",
    pt: "O caminho não foi linear. Passa por uma reestruturação de capital em 2014 (emissão de obrigações convertíveis), um ataque em 2018 na Academia de Alcochete que desencadeou uma vaga de saídas de jogadores, um ano COVID com estádios vazios e, finalmente, uma sequência de 2022-2023 com duas conversões de obrigações convertíveis (€135M no total) que tornaram o balanço positivo.",
  },
  "ch01-netresult-desc": {
    en: "Volatile but trending positive. 4 consecutive profitable years (21/22–24/25).",
    pt: "Volátil, mas com tendência positiva. 4 anos consecutivos com lucros (21/22–24/25).",
  },
  "ch01-netresult-h3": {
    en: "Net Result by Season",
    pt: "Resultado Líquido por Época",
  },
  "ch01-netresult-tag": { en: "P&L", pt: "P&L" },
  "ch01-num": { en: "Ch. 01 — Overview", pt: "Cap. 01 — Visão Geral" },
  "ch01-story-cite": {
    en: "A guided tour · Ten chapters · Press play",
    pt: "Uma visita guiada · Dez capítulos · Carregue em play",
  },
  "ch01-story-play": { en: "Play the story", pt: "Iniciar a história" },
  "ch01-story-quote": {
    en: "From <em>−€119M</em> to <em>+€41M</em>.<br />Thirteen fiscal years, told in one chart.",
    pt: "De <em>−€119M</em> a <em>+€41M</em>.<br />Treze exercícios fiscais, num só gráfico.",
    innerHTML: true,
  },
  "ch02-h2": {
    en: "The recurring engine, <em>finally</em> firing.",
    pt: "O motor recorrente, <em>finalmente</em> a funcionar.",
    innerHTML: true,
  },
  "ch02-lede": {
    en: "Revenue tripled in five seasons. Personnel cost growth held below it. The ratio that haunted Sporting for a decade is, for the first time, healthy.",
    pt: "As receitas triplicaram em frescos cinco anos. O crescimento dos custos com pessoal ficou abaixo. O rácio que assombrou o Sporting durante uma década é, pela primeira vez, saudável.",
  },
  "ch02-narrative-h4": {
    en: "The recurring-business problem",
    pt: "O problema do negócio recorrente",
  },
  "ch02-narrative-p1": {
    en: "Sporting's recurring operations (revenue minus payroll, supplies and ordinary D&A, before player trading) have been negative in 11 of the 13 seasons. Only 2014/15 (post-restructuring downsize) and 2021/22 (Champions League return + first full post-COVID stadium) produced positive recurring operating results. The model relies on player trading — which the club is exceptionally good at — to fund the rest.",
    pt: "As operações recorrentes do Sporting (receitas menos salários, fornecimentos e D&A ordinária, antes do trading de passes) foram negativas em 11 das 13 épocas. Apenas 2014/15 (redimensionamento pós-reestruturação) e 2021/22 (regresso à Champions League + primeiro estádio pós-COVID completo) produziram resultados operacionais recorrentes positivos. O modelo assenta no trading de passes — no qual o clube é excecionalmente bom — para financiar o resto.",
  },
  "ch02-narrative-p2": {
    en: "The encouraging news: revenue has more than doubled in 5 years (€64M in 20/21 → €148M in 24/25, a 2.3× increase), driven primarily by Champions League fixtures from 2021/22 onward and growing commercial income. Personnel cost growth has been more disciplined (€62M → €88M over the same period), so the gap is finally closing.",
    pt: "A boa notícia: as receitas mais do que duplicaram em 5 anos (€64M em 20/21 → €148M in 24/25, um aumento de 2,3×), impulsionadas principalmente pelos jogos da Champions League a partir de 21/22 e pelo crescimento comercial. O crescimento dos custos com pessoal foi mais disciplinado (€62M → €88M no mesmo período), pelo que o hiato está finalmente a fechar.",
  },
  "ch02-num": { en: "Ch. 02 — Revenue", pt: "Cap. 02 — Receitas" },
  "ch02-opresult-desc": {
    en: "Recurring operations rarely break even on their own. Player trading carries the P&L every year.",
    pt: "As operações recorrentes raramente cobrem os custos por si próprias. O trading de passes sustenta a demonstração de resultados todos os anos.",
  },
  "ch02-opresult-h3": {
    en: "Operating Result — Recurring vs Players",
    pt: "Resultado Operacional — Recorrente vs Jogadores",
  },
  "ch02-opresult-tag": { en: "Stacked", pt: "Empilhado" },
  "ch02-payroll-desc": {
    en: "For most of the decade, payroll absorbed 70–95% of recurring revenue. The 24/25 ratio (59%) is the healthiest in the dataset.",
    pt: "Durante a maior parte da década, o encargo salarial absorveu 70-95% das receitas recorrentes. O rácio de 24/25 (59%) é o mais saudável do conjunto de dados.",
  },
  "ch02-payroll-h3": {
    en: "Revenue vs Personnel Costs",
    pt: "Receitas vs Custos com Pessoal",
  },
  "ch02-payroll-tag": { en: "Wage ratio", pt: "Rácio salarial" },
  "ch02-rev-desc": {
    en: "Revenue (excluding player transfers) — the recurring engine of the business. Note the structural step-change from 2021/22 onward.",
    pt: "Receitas (excluindo transferências de jogadores) — o motor recorrente do negócio. Note a mudança estrutural a partir de 2021/22.",
  },
  "ch02-rev-h3": {
    en: "Operating Revenue Evolution",
    pt: "Evolução das Receitas Operacionais",
  },
  "ch02-rev-tag": { en: "Excl. transfers", pt: "Excl. transferências" },
  "ch02-streams-desc": {
    en: "Where does the money actually come from? Four streams covering 100% of operating revenue: broadcast & competition prize money (TV + UEFA), matchday (ticket office & season tickets), commercial (sponsorships, merchandising), and a small residual of other operating income (player loans, subsidies, national competition fees). The dominance of broadcast/UEFA in big European seasons is unmistakable.",
    pt: "De onde vem o dinheiro? Quatro fontes que cobrem 100% das receitas operacionais: televisão e prémios de competição (TV + UEFA), bilheteira (bilhetes avulso e passes), comercial (patrocínios, merchandising) e um pequeno residual de outros rendimentos operacionais (empréstimos de jogadores, subsídios, taxas de competições nacionais). O domínio da TV/UEFA nas grandes épocas europeias é inconfundível.",
  },
  "ch02-streams-h3": {
    en: "Revenue Streams Breakdown",
    pt: "Desagregação das Fontes de Receita",
  },
  "ch02-streams-tag": { en: "3 categories", pt: "3 categorias" },
  "ch03-brief-desc": {
    en: "No jargon. Each chart asks one question and shows you whether the answer has been healthy, concerning, or alarming — and how the trend is moving.",
    pt: "Sem jargão. Cada gráfico faz uma pergunta e mostra se a resposta foi saudável, preocupante ou alarmante — e como a tendência evolui.",
  },
  "ch03-brief-h3": {
    en: "Sporting's annual financial check-up",
    pt: "O check-up financeiro anual do Sporting",
  },
  "ch03-brief-h4": {
    en: "The short version (2024/25) — almost all green for the first time",
    pt: "A versão curta (2024/25) — quase tudo verde pela primeira vez",
  },
  "ch03-brief-p": {
    en: "Revenue has tripled in five years. The wage bill is the smallest share of income in 13 years. Net debt is — for the first time — below one year's revenue. Equity is positive for the third year running. The one honest caveat: Sporting still relies on selling players for nearly 44% of its total income. That's not a crisis — it's the model. Alcochete academy players cost €0 to produce and sell for tens of millions. But it means a bad transfer window still hurts.",
    pt: "As receitas triplicaram em frescos cinco anos. O encargo salarial é a menor fatia do rendimento em 13 anos. A dívida líquida está — pela primeira vez — abaixo de um ano de receitas. O capital próprio é positivo pelo terceiro ano consecutivo. Um aviso honesto: o Sporting ainda depende da venda de jogadores para cerca de 44% do seu rendimento total. Isso não é uma crise — é o modelo. Os jogadores da Academia de Alcochete custam €0 a produzir e vendem-se por dezenas de milhões. Mas significa que uma má janela de transferências ainda dói.",
  },
  "ch03-brief-tag": { en: "2024/25 brief", pt: "Resumo 2024/25" },
  "ch03-debt-desc": {
    en: 'Net debt compared to a full year of revenue — the classic "can you afford what you owe?" question.',
    pt: 'Dívida líquida comparada com um ano completo de receitas — a clássica questão "consegue pagar o que deve?"',
  },
  "ch03-debt-h3": { en: "Debt load", pt: "Carga de dívida" },
  "ch03-debt-tag": { en: "Net debt ÷ revenue", pt: "Dívida líquida ÷ receita" },
  "ch03-debt-z1": {
    en: "Below 1× — manageable",
    pt: "Abaixo de 1× — controlável",
  },
  "ch03-debt-z2": { en: "1–2× — elevated", pt: "1-2× — elevada" },
  "ch03-debt-z3": { en: "Above 2× — heavy", pt: "Acima de 2× — pesada" },
  "ch03-h2": {
    en: "An <em>annual check-up</em>, no jargon.",
    pt: "Um <em>check-up anual</em>, sem jargão.",
    innerHTML: true,
  },
  "ch03-hb-sub": { en: "Vital signs", pt: "Sinais vitais" },
  "ch03-lede": {
    en: "Four questions, four charts. Each one shows whether the answer was healthy, concerning, or alarming — and how the trend is moving.",
    pt: "Quatro perguntas, quatro gráficos. Cada um mostra se a resposta foi saudável, preocupante ou alarmante — e como a tendência evolui.",
  },
  "ch03-liq-desc": {
    en: "Can the club cover its bills due in the next 12 months? A ratio below 1.0 means short-term obligations exceed short-term assets.",
    pt: "O clube consegue pagar as suas dívidas de curto prazo? Um rácio abaixo de 1,0 significa que as obrigações de curto prazo excedem os ativos de curto prazo.",
  },
  "ch03-liq-h3": { en: "Short-term liquidity", pt: "Liquidez de curto prazo" },
  "ch03-liq-tag": { en: "Current ratio", pt: "Rácio corrente" },
  "ch03-liq-z1": {
    en: "Above 1.0 — can cover bills",
    pt: "Acima de 1,0 — consegue pagar",
  },
  "ch03-liq-z2": { en: "0.5–1.0 — tight", pt: "0,5-1,0 — apertado" },
  "ch03-liq-z3": {
    en: "Below 0.5 — very stretched",
    pt: "Abaixo de 0,5 — muito esticado",
  },
  "ch03-narrative-h4": {
    en: "Why selling players isn't a flaw — it's the engine",
    pt: "Porque a venda de jogadores não é um defeito — é o motor",
  },
  "ch03-narrative-p": {
    en: "Every year that Sporting's matchday and TV revenue doesn't cover wages, the gap is filled by the transfer market. That's been true in 11 of the last 13 seasons. But here's the twist: Alcochete academy graduates — Manuel Ugarte, Nuno Mendes, João Palhinha, Gonçalo Inácio — were developed internally at near-zero acquisition cost. Selling a player for €60M who cost nothing to produce is 100% margin. As long as Alcochete keeps producing elite talent, this model works. The question is whether commercial and matchday revenue can keep growing fast enough that Sporting needs to rely on it less.",
    pt: "Em cada ano em que as receitas de bilheteira e televisão do Sporting não cobrem os salários, o hiato é preenchido pelo mercado de transferências. Isso foi verdade em 11 das últimas 13 épocas. Mas há um twist: os formandos da Academia de Alcochete — Manuel Ugarte, Nuno Mendes, João Palhinha, Gonçalo Inácio — foram desenvolvidos internamente a custo de aquisição quase nulo. Vender um jogador por €60M que não custou nada a produzir é margem de 100%. Enquanto Alcochete continuar a produzir talentos de elite, este modelo funciona. A questão é se as receitas comerciais e de bilheteira conseguem crescer suficientemente depressa para que o Sporting precise de depender menos delas.",
  },
  "ch03-num": {
    en: "Ch. 03 — Health Check",
    pt: "Cap. 03 — Indicadores de Saúde",
  },
  "ch03-rel-desc": {
    en: "How much does Sporting depend on selling players to stay afloat?",
    pt: "Quanto depende o Sporting da venda de jogadores para se manter?",
  },
  "ch03-rel-h3": {
    en: "Transfer reliance",
    pt: "Dependência de transferências",
  },
  "ch03-rel-tag": {
    en: "Lower = self-sufficient",
    pt: "Menor = autossuficiente",
  },
  "ch03-rel-z1": {
    en: "Below 35% — diversified",
    pt: "Abaixo de 35% — diversificado",
  },
  "ch03-rel-z2": { en: "35–50% — reliant", pt: "35-50% — dependente" },
  "ch03-rel-z3": {
    en: "Above 50% — high risk",
    pt: "Acima de 50% — alto risco",
  },
  "ch03-wage-desc": {
    en: "What share of revenue goes straight to player & staff wages?",
    pt: "Que parte das receitas vai diretamente para salários de jogadores e staff?",
  },
  "ch03-wage-h3": { en: "Wage bill burden", pt: "Encargo salarial" },
  "ch03-wage-tag": { en: "Lower = healthier", pt: "Menor = mais saudável" },
  "ch03-wage-z1": { en: "Below 60% — healthy", pt: "Abaixo de 60% — saudável" },
  "ch03-wage-z2": { en: "60–70% — watch this", pt: "60-70% — atenção" },
  "ch03-wage-z3": { en: "Above 70% — problem", pt: "Acima de 70% — problema" },
  "ch04-assets-desc": {
    en: "Equity = the gap between the two stacked bars. The crossover happened in 2022/23 after the first VMOC conversion.",
    pt: "Capital próprio = a diferença entre as duas barras empilhadas. O cruzamento aconteceu em 2022/23 após a primeira conversão de VMOCs.",
  },
  "ch04-assets-h3": {
    en: "Total Assets vs Total Liabilities",
    pt: "Ativo Total vs Passivo Total",
  },
  "ch04-assets-tag": {
    en: "Equity = the gap",
    pt: "Capital próprio = a diferença",
  },
  "ch04-debt-desc": {
    en: "Borrowings (current + non-current) versus cash on hand. Total debt has stayed stable around €130–160M while the asset base has tripled.",
    pt: "Empréstimos (correntes + não correntes) versus caixa disponível. A dívida total manteve-se estável em €130-160M enquanto a base de ativos triplicou.",
  },
  "ch04-debt-h3": {
    en: "Total Debt & Cash Position",
    pt: "Dívida Total e Posição de Caixa",
  },
  "ch04-debt-tag": { en: "Stacked + cash", pt: "Empilhado + caixa" },
  "ch04-h2": {
    en: "From insolvent to <em>investment-grade</em>.",
    pt: "Da insolvência ao <em>grau de investimento</em>.",
    innerHTML: true,
  },
  "ch04-lede": {
    en: "Total borrowings barely moved across the decade. What changed is the asset base around them — and a €135M debt-to-equity conversion that flipped the balance sheet positive.",
    pt: "Os empréstimos totais mal se moveram ao longo da década. O que mudou foi a base de ativos em redor — e uma conversão de dívida em capital de €135M que tornou o balanço positivo.",
  },
  "ch04-maturity-desc": {
    en: "Current vs non-current borrowings. The 2025 USPP bond pushed nearly all debt out beyond one year.",
    pt: "Empréstimos correntes vs não correntes. A obrigação USPP de 2025 empurrou quase toda a dívida para além de um ano.",
  },
  "ch04-maturity-h3": {
    en: "Debt Maturity Profile",
    pt: "Perfil de Maturidade da Dívida",
  },
  "ch04-maturity-tag": { en: "Long-term share", pt: "Quota de longo prazo" },
  "ch04-narrative-h4": {
    en: "From insolvent to investment-grade in 12 years",
    pt: "Da insolvência ao grau de investimento em 12 anos",
  },
  "ch04-narrative-p1": {
    en: "In 2013, Sporting had €157M of borrowings against €1.3M of cash — a textbook liquidity crisis. The November 2014 capital restructuring (a fresh capital increase plus issuance of mandatorily-convertible bonds — VMOCs) was the lifeline that allowed the club to restructure short-term debt into long-term obligations.",
    pt: "Em 2013, o Sporting tinha €157M de empréstimos contra €1,3M de caixa — uma crise de liquidez de manual. A reestruturação de capital de novembro de 2014 (um aumento de capital mais a emissão de obrigações mandatoriamente convertíveis — VMOCs) foi a tábua de salvação que permitiu ao clube reestruturar a dívida de curto prazo em obrigações de longo prazo.",
  },
  "ch04-narrative-p2": {
    en: "Two conversion events were transformational: in August 2022, €83.6M of VMOCs converted into share capital; in December 2023 a further €51.4M followed. The combined €135M flipped equity from -€16M to +€21M and reduced financial expenses meaningfully.",
    pt: "Dois eventos de conversão foram transformadores: em agosto de 2022, €83,6M de VMOCs converteram-se em capital social; em dezembro de 2023 seguiram-se mais €51,4M. Os €135M combinados inverteram o capital próprio de -€16M para +€21M e reduziram significativamente as despesas financeiras.",
  },
  "ch04-narrative-p3": {
    en: "The October 2025 milestone: a €225M 28-year USPP (US Private Placement) bond at 5.75% — Sporting's first investment-grade rating from Fitch and DBRS. This refinanced legacy debt at lower cost and longer duration, and is likely the single biggest financial event of the period.",
    pt: "O marco de outubro de 2025: uma obrigação USPP (US Private Placement) de €225M a 28 anos a 5,75% — a primeira notação de grau de investimento do Sporting pela Fitch e DBRS. Refinanciou a dívida legada a menor custo e maior duração, sendo provavelmente o maior evento financeiro do período.",
  },
  "ch04-num": {
    en: "Ch. 04 — Debt & Balance",
    pt: "Cap. 04 — Dívida e Balanço",
  },
  "ch05-h2": {
    en: "Os instrumentos que <em>salvaram o clube</em>.",
    pt: "Os instrumentos que <em>salvaram o clube</em>.",
    innerHTML: true,
  },
  "ch05-lede": {
    en: "Three instruments, one decade of recovery. The VMOCs of 2014 bought time — converting €135M of debt into equity. Lion Finance securitizations (2019–2025) monetised TV rights to restructure the bank debt. The USPP of 2025 closed the chapter, locking in 28 years of investment-grade financing.",
    pt: "Três instrumentos, uma década de recuperação. As VMOCs de 2014 compraram tempo — convertendo €135M de dívida em capital. As titularizações Lion Finance (2019-2025) monetizaram os direitos de TV para reestruturar a dívida bancária. O USPP de 2025 fechou o capítulo, assegurando 28 anos de financiamento com grau de investimento.",
  },
  "ch05-num": {
    en: "Ch. 05 — Financing Instruments",
    pt: "Cap. 05 — Instrumentos de Financiamento",
  },
  "ch06-h2": {
    en: "Alcochete, the <em>perpetual cash machine</em>.",
    pt: "Alcochete, a <em>máquina perpétua de dinheiro</em>.",
    innerHTML: true,
  },
  "ch06-income-desc": {
    en: "Player sales — the financial engine that funded the recovery. Five seasons over €75M.",
    pt: "Vendas de jogadores — o motor financeiro que financiou a recuperação. Cinco épocas acima de €75M.",
  },
  "ch06-income-h3": {
    en: "Player Transfer Income",
    pt: "Receita de Transferências de Jogadores",
  },
  "ch06-income-tag": { en: "Sales", pt: "Vendas" },
  "ch06-lede": {
    en: "Alcochete graduates — and smart recruitment — have generated over €75M in five of the last nine seasons. The squad's market value has tripled since 2012/13, despite hundreds of millions in player sales along the way.",
    pt: "Os formandos de Alcochete — e um recrutamento inteligente — geraram mais de €75M em comissões em cinco das últimas nove épocas. O valor de mercado do plantel triplicou desde 2012/13, apesar de centenas de milhões em vendas de jogadores pelo caminho.",
  },
  "ch06-ledger-desc": {
    en: "Detailed view of permanent and temporary player acquisitions and sales for each season. All figures represent primary transfer fees in millions of Euros.",
    pt: "Visão detalhada das aquisições e vendas permanentes e temporárias de jogadores por época. Todos os valores representam taxas de transferência primárias em milhões de Euros.",
  },
  "ch06-ledger-h3": {
    en: "Detailed Transfer Ledger",
    pt: "Livro de Transferências Detalhado",
  },
  "ch06-ledger-tag": { en: "Season breakdown", pt: "Desagregação por época" },
  "ch06-narrative-h4": {
    en: "The transfer-trading machine",
    pt: "A máquina de trading de passes",
  },
  "ch06-narrative-p1": {
    en: "Sporting's youth academy (Alcochete) and scouting model is the most reliable cash generator on the income statement. The academy produces players at near-zero acquisition cost — Cristiano Ronaldo (2003, ~€18M to Man United), João Mário (2016, €40M to Inter), Manuel Ugarte (2023, €60M to PSG) and Nuno Mendes (2022, €38M to PSG) were all Alcochete graduates. Smart recruitment amplifies the model: Bruno Fernandes arrived from Italy and left for €55M (2020); Viktor Gyökeres was bought from Coventry for ~€20M and sold to Arsenal for €65.8M (2025).",
    pt: "A academia de jovens do Sporting (Alcochete) e o modelo de prospeção é o gerador de caixa mais fiável na demonstração de resultados. A academia de Alcochete produz jogadores a custo zero — Cristiano Ronaldo (2003, ~€18M para o Man United), João Mário (2016, €40M para o Inter), Manuel Ugarte (2023, €60M para o PSG) e Nuno Mendes (2022, €38M para o PSG) foram formados em Alcochete. O recrutamento inteligente amplifica o modelo: Bruno Fernandes chegou de Itália e saiu por €55M (2020); Viktor Gyökeres foi comprado ao Coventry por ~€20M e vendido ao Arsenal por €65,8M (2025).",
  },
  "ch06-narrative-p2": {
    en: "Desde 2016/17 o clube gerou entre €34M e €144M em receitas de transferências por época. A época 2023/24 estabeleceu o recorde histórico em €144M. Só o 1º semestre de 2025/26 já atingiu €110M, ancorado pelo negócio Gyökeres.",
    pt: "Desde 2016/17 o clube gerou entre €34M e €144M em receitas de transferências por época. A época 2023/24 estabeleceu o recorde histórico em €144M. Só o 1º semestre de 2025/26 já atingiu €110M, ancorado pelo negócio Gyökeres.",
  },
  "ch06-narrative-p3": {
    en: "The squad's market value (Transfermarkt, Dec 2025) stands at €474M — 3× the €151.9M estimate from 2012/13, despite the club having sold hundreds of millions in talent over the same period. The market-to-book gap is wide because Alcochete graduates carry zero acquisition cost on the balance sheet.",
    pt: "O valor de mercado do plantel (Transfermarkt, Dez 2025) situa-se em €474M — 3× a estimativa de €151,9M de 2012/13, apesar de o clube ter vendido centenas de milhões em talento no mesmo período. O hiato entre valor de mercado e contabilístico é grande porque os formandos de Alcochete têm custo de aquisição zero no balanço.",
  },
  "ch06-net-desc": {
    en: "Sales income minus acquisitions, amortization and impairments. Profitable in 11 of 13 seasons.",
    pt: "Receitas de vendas menos aquisições, amortizações e imparidades. Lucrativo em 11 das 13 épocas.",
  },
  "ch06-net-h3": {
    en: "Net Player Trading Result",
    pt: "Resultado Líquido do Trading de Passes",
  },
  "ch06-net-tag": { en: "After amortization", pt: "Após amortizações" },
  "ch06-num": {
    en: "Ch. 06 — Squad & Transfers",
    pt: "Cap. 06 — Plantel e Transferências",
  },
  "ch06-squad-desc": {
    en: "Book value (intangible asset on balance sheet — acquisition cost less amortization) vs market value (Transfermarkt estimate). Market value far exceeds book because home-grown academy players are recognised at zero acquisition cost on the balance sheet.",
    pt: "Valor contabilístico (ativo intangível no balanço — custo de aquisição menos amortizações) vs valor de mercado (estimativa Transfermarkt). O valor de mercado supera em muito o contabilístico porque os jogadores formados na Academia são reconhecidos a custo de aquisição zero no balanço.",
  },
  "ch06-squad-h3": {
    en: "Squad Book Value Evolution",
    pt: "Evolução do Valor Contabilístico do Plantel",
  },
  "ch06-squad-tag": { en: "Book vs market", pt: "Contabilístico vs mercado" },
  "ch07-cash-desc": {
    en: "Cash on hand at 30 June each year. Generally low — the club operates with thin liquidity buffers.",
    pt: "Caixa disponível a 30 de junho de cada ano. Geralmente baixo — o clube opera com margens de liquidez reduzidas.",
  },
  "ch07-cash-h3": {
    en: "Cash Position at Year-End",
    pt: "Posição de Caixa no Final do Ano",
  },
  "ch07-cash-tag": { en: "30 Jun snapshot", pt: "Fotografia de 30 Jun" },
  "ch07-cf-desc": {
    en: "Operating activities (typically negative), investing activities (player sales drive positive flow), financing activities (debt issuance & repayment).",
    pt: "Atividades operacionais (tipicamente negativas), atividades de investimento (vendas de jogadores geram fluxo positivo), atividades de financiamento (emissão e reembolso de dívida).",
  },
  "ch07-cf-h3": {
    en: "Cash Flow by Activity",
    pt: "Fluxos de Caixa por Atividade",
  },
  "ch07-cf-tag": { en: "3 streams", pt: "3 fluxos" },
  "ch07-h2": {
    en: "Tight rope, <em>every year</em>.",
    pt: "Corda bamba, <em>todos os anos</em>.",
    innerHTML: true,
  },
  "ch07-lede": {
    en: "Operating cash flow has been negative in 12 of 13 seasons — player sales are the structural offset that keeps the club solvent. The USPP bond restructures the debt profile and funds the stadium; it does not directly fix operating cash generation.",
    pt: "O fluxo de caixa operacional foi negativo em 12 de 13 épocas — as vendas de jogadores são a compensação estrutural que evita a rotura. A obrigação USPP reestrutura a maturidade da dívida e apoia obras no estádio, mas não resolve diretamente o défice operacional recorrente.",
  },
  "ch07-narrative-h4": {
    en: "Liquidity is structurally tight",
    pt: "A liquidez é estruturalmente apertada",
  },
  "ch07-narrative-p1": {
    en: "Sporting SAD has run negative cash from operating activities in 12 of the 13 seasons in the dataset. The sole exception is 2014/15 (+€29.2M), where the capital restructuring year produced unusually large inflows. In every other season — including 2023/24 at −€92.2M, the worst on record — wages, supplies and player-acquisition instalment payments absorb more cash than the business generates before transfers. Player sales (investing activities) are the structural offset that prevents the cash position from collapsing.",
    pt: "A Sporting SAD registou fluxo de caixa operacional negativo em 12 das 13 épocas do conjunto de dados. A única exceção é 2014/15 (+€29,2M), onde o ano de reestruturação de capital produziu entradas de caixa invulgarmente grandes. Em todas as outras épocas — incluindo 2023/24 em -€92,2M, o pior registo — salários, fornecimentos e prestações de aquisição de jogadores cobrem as saídas. As vendas de jogadores (atividades de investimento) são o contrapeso estrutural.",
  },
  "ch07-narrative-p2": {
    en: "Year-end cash has never exceeded €15.6M and fell below €4M in 5 of 13 seasons — including as low as €1.3M in 2012/13. The USPP bond (€225M, October 2025) refinances short-term facilities and extends the debt maturity profile; its primary purpose is the Estádio Alvalade transformation, not curing operating cash generation. At 5.75% on €225M, the annual coupon (~€12.9M) will increase financing outflows from 2025/26 onward.",
    pt: "A caixa no final do ano nunca excedeu €15,6M e caiu abaixo de €4M em 5 das 13 épocas — incluindo apenas €1,3M em 2012/13. A obrigação USPP (€225M, outubro de 2025) refinancia linhas de curto prazo e estende o perfil de maturidade da dívida; o seu objetivo principal é a transformação do Estádio José Alvalade, não curar a geração de caixa operacional. A 5,75% sobre €225M, o cupão anual (~€12,9M) aumentará as saídas de financiamento a partir de 2025/26.",
  },
  "ch07-net-desc": {
    en: "Full-year net result at 30 June each season. The two large spikes in 2022/23 and 2023/24 are driven by the VMOC conversion accounting gains (€83.6M and €51.4M respectively) — not recurring operating profit.",
    pt: "Resultado líquido anual a 30 de junho de cada época. Os dois grandes picos em 2022/23 e 2023/24 são impulsionados pelos ganhos contabilísticos da conversão de VMOCs (€83,6M e €51,4M respetivamente) — não por lucro operacional recorrente.",
  },
  "ch07-net-h3": { en: "Annual Net Result", pt: "Resultado Líquido Anual" },
  "ch07-net-tag": { en: "13 seasons", pt: "13 épocas" },
  "ch07-num": {
    en: "Ch. 07 — Cash & Liquidity",
    pt: "Cap. 07 — Fluxos de Caixa e Liquidez",
  },
  "ch08-cmp-desc": {
    en: "Pick two seasons and see exactly how every key metric shifted — how far the club has come, or how one turning point changed everything.",
    pt: "Escolha duas épocas e veja exatamente como cada métrica-chave mudou — até onde o clube chegou, ou como um ponto de viragem mudou tudo.",
  },
  "ch08-cmp-h3": {
    en: "Compare any two seasons",
    pt: "Comparar quaisquer duas épocas",
  },
  "ch08-cmp-tag": { en: "Interactive", pt: "Interativo" },
  "ch08-h2": {
    en: "Two seasons, <em>side by side</em>.",
    pt: "Duas épocas, <em>lado a lado</em>.",
    innerHTML: true,
  },
  "ch08-lede": {
    en: "Pick any two years and see exactly how every key metric shifted. The defaults compare the dataset's first season with its most recent.",
    pt: "Escolha quaisquer dois anos e veja exatamente como cada métrica-chave mudou. Os padrões comparam a primeira época do conjunto de dados com a mais recente.",
  },
  "ch08-num": { en: "Ch. 08 — Compare", pt: "Cap. 08 — Comparar" },
  "ch08-season-a": { en: "Season A", pt: "Época A" },
  "ch08-season-b": { en: "Season B", pt: "Época B" },
  "ch08-vs": { en: "vs", pt: "vs" },
  "ch09-h2": {
    en: "Inflection points, <em>2014 → 2025</em>.",
    pt: "Pontos de inflexão, <em>2014 → 2025</em>.",
    innerHTML: true,
  },
  "ch09-lede": {
    en: "The events that shaped the trajectory — some on the pitch, most off it. Each card pairs the sporting moment with what it did to the numbers.",
    pt: "Os eventos que moldaram a trajetória — alguns em campo, a maioria fora dele. Cada cartão associa o momento desportivo ao que fez com os números.",
  },
  "ch09-legend-crisis": { en: "Crisis", pt: "Crise" },
  "ch09-legend-restructure": { en: "Restructuring", pt: "Reestruturação" },
  "ch09-legend-win": { en: "Win / milestone", pt: "Vitória / marco" },
  "ch09-num": { en: "Ch. 09 — Key Events", pt: "Cap. 09 — Eventos-Chave" },
  "ch10-annual-desc": {
    en: "Negative cells in red indicate losses or negative balances. Source PDFs: Sporting SAD annual reports (CMVM).",
    pt: "Células negativas a vermelho indicam perdas ou saldos negativos. PDFs fonte: relatórios anuais da Sporting SAD (CMVM).",
  },
  "ch10-annual-h3": {
    en: "Annual data — all metrics in EUR thousands",
    pt: "Dados anuais — todas as métricas em milhares de EUR",
  },
  "ch10-annual-tag": { en: "13 seasons", pt: "13 épocas" },
  "ch10-h2": {
    en: "The numbers, <em>in full</em>.",
    pt: "Os números, <em>na íntegra</em>.",
    innerHTML: true,
  },
  "ch10-lede": {
    en: "Every metric across thirteen seasons. Negative cells in red indicate losses or negative balances. Source PDFs: Sporting SAD annual reports filed with the CMVM.",
    pt: "Cada métrica ao longo de treze épocas. Células negativas a vermelho indicam perdas ou saldos negativos. PDFs fonte: relatórios anuais da Sporting SAD depositados na CMVM.",
  },
  "ch10-ledger-desc": {
    en: "A consolidated, interactive table displaying the full details of all player arrivals and departures. Use the season filter to explore prior years.",
    pt: "Uma tabela consolidada e interativa com os detalhes completos de todas as chegadas e saídas de jogadores. Use o filtro de época para explorar anos anteriores.",
  },
  "ch10-ledger-h3": {
    en: "Full Transfer Details Ledger",
    pt: "Livro Completo de Detalhes de Transferências",
  },
  "ch10-num": { en: "Ch. 10 — Raw Data", pt: "Cap. 10 — Dados em Bruto" },
  "ch10-scroll-hint": {
    en: "Scroll horizontally to see all 13 seasons",
    pt: "Deslize horizontalmente para ver todas as 13 épocas",
  },
  "ch10-tf-col-bonus": { en: "Bonus", pt: "Bónus" },
  "ch10-tf-col-club": { en: "Club", pt: "Clube" },
  "ch10-tf-col-comm": { en: "Comm.", pt: "Comissão" },
  "ch10-tf-col-fee": { en: "Fee", pt: "Valor" },
  "ch10-tf-col-notes": { en: "Notes & Details", pt: "Notas e Detalhes" },
  "ch10-tf-col-player": { en: "Player", pt: "Jogador" },
  "ch10-tf-col-rights": { en: "Rights", pt: "Direitos" },
  "ch10-tf-col-season": { en: "Season", pt: "Época" },
  "ch10-tf-col-type": { en: "Type", pt: "Tipo" },
  "ch10-tf-col-window": { en: "Window", pt: "Janela" },
  "ch10-tf-search": {
    en: "Search player, club, or notes...",
    pt: "Pesquisar jogador, clube ou notas...",
  },
  "ch10-tf-season-all": { en: "All Seasons", pt: "Todas as Épocas" },
  "ch10-tf-season-label": { en: "Season:", pt: "Época:" },
  "ch10-tf-type-all": { en: "All Transfers", pt: "Todas as transferências" },
  "ch10-tf-type-in": {
    en: "Arrivals (Purchases/Loans In)",
    pt: "Chegadas (Compras/Empréstimos de entrada)",
  },
  "ch10-tf-type-label": { en: "Type:", pt: "Tipo:" },
  "ch10-tf-type-out": {
    en: "Departures (Sales/Loans Out/Terminations)",
    pt: "Saídas (Vendas/Empréstimos/Rescisões)",
  },
  "ch10-tf-window-all": { en: "All Windows", pt: "Todas as janelas" },
  "ch10-tf-window-label": { en: "Window:", pt: "Janela:" },
  "ch10-tf-window-summer": { en: "Summer Window", pt: "Mercado de Verão" },
  "ch10-tf-window-winter": { en: "Winter Window", pt: "Mercado de Inverno" },
  "hero-eyebrow": {
    en: "A Financial Dossier · 2012 → 2026",
    pt: "Um Dossier Financeiro · 2012 → 2026",
  },
  "hero-h1": {
    en: "From insolvency to <em>investment&nbsp;grade</em>.",
    pt: "Da insolvência ao <em>grau de&nbsp;investimento</em>.",
    innerHTML: true,
  },
  "hero-stat-eyebrow": {
    en: "Shareholders' equity · 2012/13 → 2024/25",
    pt: "Capitais próprios · 2012/13 → 2024/25",
  },
  "hero-stat-foot": {
    en: "<strong>Thirteen fiscal years.</strong> Annual data from Sporting SAD reports filed with CMVM.",
    pt: "<strong>Treze exercícios fiscais.</strong> Dados anuais dos relatórios da Sporting SAD depositados na CMVM.",
    innerHTML: true,
  },
  "hero-sub": {
    en: "A 13-year journey at Sporting Clube de Portugal — through a capital restructuring, a training-ground attack, an empty-stadium league title, two bond conversions, and a €225M investment-grade placement. Annual data drawn directly from official Sporting SAD reports.",
    pt: "Uma jornada de 13 anos no Sporting Clube de Portugal — através de uma reestruturação de capital, um ataque à Academia, um título em estádio vazio, duas conversões de obrigações e uma emissão de €225M com grau de investimento. Dados anuais extraídos diretamente dos relatórios oficiais da Sporting SAD.",
  },
  "tab-btn-bonds": {
    en: '<span class="tab-num">05</span>Instruments',
    pt: '<span class="tab-num">05</span>Instrumentos',
    innerHTML: true,
  },
  "tab-btn-cash": {
    en: '<span class="tab-num">07</span>Cash',
    pt: '<span class="tab-num">07</span>Fluxos Caixa',
    innerHTML: true,
  },
  "tab-btn-compare": {
    en: '<span class="tab-num">08</span>Compare',
    pt: '<span class="tab-num">08</span>Comparar',
    innerHTML: true,
  },
  "tab-btn-data": {
    en: '<span class="tab-num">10</span>Data',
    pt: '<span class="tab-num">10</span>Dados',
    innerHTML: true,
  },
  "tab-btn-debt": {
    en: '<span class="tab-num">04</span>Debt',
    pt: '<span class="tab-num">04</span>Dívida',
    innerHTML: true,
  },
  "tab-btn-events": {
    en: '<span class="tab-num">09</span>Events',
    pt: '<span class="tab-num">09</span>Eventos',
    innerHTML: true,
  },
  "tab-btn-healthcheck": {
    en: '<span class="tab-num">03</span>Health',
    pt: '<span class="tab-num">03</span>Saúde',
    innerHTML: true,
  },
  "tab-btn-overview": {
    en: '<span class="tab-num">01</span>Overview',
    pt: '<span class="tab-num">01</span>Visão Geral',
    innerHTML: true,
  },
  "tab-btn-revenue": {
    en: '<span class="tab-num">02</span>Revenue',
    pt: '<span class="tab-num">02</span>Receitas',
    innerHTML: true,
  },
  "tab-btn-squad": {
    en: '<span class="tab-num">06</span>Squad',
    pt: '<span class="tab-num">06</span>Plantel',
    innerHTML: true,
  },
  "topbar-export-pdf": {
    en: "Export PDF",
    pt: "Exportar PDF",
  },
  "topbar-listing": {
    en: "Sporting SAD · Euronext Lisbon",
    pt: "Sporting SAD · Euronext Lisboa",
  },
  "topbar-update": {
    en: "Last update · 25/26 H1",
    pt: "Última atualização · 1º Sem. 25/26",
  },
  "aria-chart-hero": {
    en: "Overview chart showing Sporting CP operating revenue, net result, and shareholders equity evolution over 13 fiscal years",
    pt: "Gráfico de visão geral mostrando a evolução da receita operacional, resultado líquido e capitais próprios do Sporting CP ao longo de 13 exercícios fiscais",
    isAria: true,
  },
  "aria-chart-net-result": {
    en: "Net result by season chart showing historical profit and loss values",
    pt: "Gráfico de resultado líquido por época mostrando os valores históricos de lucros e prejuízos",
    isAria: true,
  },
  "aria-chart-equity": {
    en: "Equity evolution chart showing assets-liabilities gap and historical capital conversions",
    pt: "Gráfico de evolução dos capitais próprios mostrando a diferença entre ativo e passivo e as conversões históricas de obrigações",
    isAria: true,
  },
  "aria-chart-revenue": {
    en: "Operating revenue evolution chart highlighting recurring revenues excluding player transfers",
    pt: "Gráfico de evolução da receita operacional destacando proveitos recorrentes excluindo vendas de jogadores",
    isAria: true,
  },
  "aria-chart-rev-streams": {
    en: "Stacked area chart of revenue streams breakdown into matchday, broadcasting, commercial, and other revenues",
    pt: "Gráfico de área empilhada detalhando receitas de bilheteira, transmissões, comercial e outras",
    isAria: true,
  },
  "aria-chart-rev-vs-payroll": {
    en: "Line and bar chart comparing total revenue against personnel costs and highlighting the wage ratio",
    pt: "Gráfico de linhas e barras comparando receita total com custos de pessoal e destacando a taxa salarial",
    isAria: true,
  },
  "aria-chart-op-result": {
    en: "Stacked operating results chart showing recurring business operations profit or loss vs player trading contribution",
    pt: "Gráfico de resultados operacionais empilhados mostrando ganhos/perdas recorrentes das operações vs a contribuição da venda de jogadores",
    isAria: true,
  },
  "aria-chart-payroll-burden": {
    en: "Personnel costs as percentage of recurring revenue chart showing fiscal safety zones",
    pt: "Gráfico de custos de pessoal em percentagem da receita recorrente mostrando as zonas de segurança financeira",
    isAria: true,
  },
  "aria-chart-transfer-reliance": {
    en: "Transfer reliance chart indicating dependence on player sales to balance the annual budget",
    pt: "Gráfico de dependência de transferências indicando a necessidade de venda de jogadores para equilibrar o orçamento anual",
    isAria: true,
  },
  "aria-chart-debt-load": {
    en: "Gross and net debt load relative to total revenue showing leverage trend",
    pt: "Gráfico de rácio de endividamento bruto e líquido em relação à receita total mostrando a tendência de alavancagem",
    isAria: true,
  },
  "aria-chart-current-ratio": {
    en: "Current liquidity ratio chart comparing short term assets against short term liabilities",
    pt: "Gráfico de rácio de liquidez corrente comparando ativos de curto prazo com passivos de curto prazo",
    isAria: true,
  },
  "aria-chart-debt": {
    en: "Debt structure chart separating VMOCs, bank borrowings, supplier liabilities, other debt, and cash offset",
    pt: "Gráfico de estrutura de endividamento separando VMOCs, empréstimos bancários, passivos com fornecedores, outras dívidas e compensação de tesouraria",
    isAria: true,
  },
  "aria-chart-assets-liab": {
    en: "Total assets versus total liabilities trend comparison chart",
    pt: "Gráfico de comparação de tendências entre ativo total e passivo total",
    isAria: true,
  },
  "aria-chart-debt-maturity": {
    en: "Debt maturity structure chart showing share of long term versus short term debt",
    pt: "Gráfico de vencimento de dívida mostrando a proporção de passivos de curto e longo prazo",
    isAria: true,
  },
  "aria-chart-squad-book": {
    en: "Squad value chart comparing player balance sheet book value against Transfermarkt estimated market value",
    pt: "Gráfico de valor do plantel comparando o valor contabilístico em balanço com a estimativa de valor de mercado do Transfermarkt",
    isAria: true,
  },
  "aria-chart-transfers": {
    en: "Player transfer historical spend and sales income chart",
    pt: "Gráfico histórico de despesas com contratações e proveitos com vendas de jogadores",
    isAria: true,
  },
  "aria-chart-net-trading": {
    en: "Net player trading result chart after amortization",
    pt: "Gráfico de resultado líquido de partilha de passes de jogadores após amortizações",
    isAria: true,
  },
  "aria-chart-cash-flow": {
    en: "Cash flow breakdown chart separating operating, investing, and financing cash flows",
    pt: "Gráfico detalhado de fluxos de caixa separando atividades operacionais, de investimento e de financiamento",
    isAria: true,
  },
  "aria-chart-cash": {
    en: "End-of-year cash and cash equivalents balances chart",
    pt: "Gráfico de saldos de tesouraria e equivalentes de caixa ao fim de cada exercício",
    isAria: true,
  },
  "aria-chart-annual-net": {
    en: "Annual net cash flow evolution showing net change in cash positions",
    pt: "Gráfico de evolução anual dos fluxos de caixa líquidos mostrando a variação líquida nas posições de tesouraria",
    isAria: true,
  },
  "aria-chart-compare": {
    en: "Comparison bar chart showing side-by-side selected financial indicators between two custom seasons",
    pt: "Gráfico de barras de comparação mostrando indicadores financeiros lado a lado entre duas épocas selecionadas",
    isAria: true,
  },
  "scroll-to-top-btn": {
    en: "Scroll to top",
    pt: "Voltar ao topo",
    isAria: true,
  },
  "filter-era": { en: "Explore Era:", pt: "Explorar Era:" },
  "filter-to": { en: "to", pt: "até" },
  "ch10-tf-search-label": {
    en: "Search transfers",
    pt: "Pesquisar transferências",
  },
  "story-prev": {
    en: "← Prev",
    pt: "← Ant",
  },
  "story-next": {
    en: "Next →",
    pt: "Próx →",
  },
  "ch10-download-csv": {
    en: "Download CSV",
    pt: "Descarregar CSV",
  },
  "ch10-tf-search-placeholder": {
    en: "Search player, club, or notes...",
    pt: "Pesquisar jogador, clube ou notas...",
  },
  "ch11-num": {
    en: "Ch. 11 — Club Assets & Identity",
    pt: "Cap. 11 — Património e Identidade",
  },
  "ch11-h2": {
    en: "Visual symbols, <em>physical heritage</em>.",
    pt: "Símbolos visuais, <em>património físico</em>.",
    innerHTML: true,
  },
  "ch11-lede": {
    en: "Sporting CP's identity is defined by its home and visual legacy. Explore the kits, the stadium, the sports hall, and the museum that connect the SAD to the fans.",
    pt: "A identidade do Sporting CP é definida pelo seu património físico e legado visual. Conheça os equipamentos, o estádio, o pavilhão e o museu que unem a SAD aos adeptos.",
  },
  "ch11-social-h3": {
    en: "Official Channels & Media",
    pt: "Canais Oficiais e Imprensa",
  },
  "ch11-jornal-btn": {
    en: "Jornal Sporting",
    pt: "Jornal Sporting",
  },
  "ch11-linkedin-btn": {
    en: "LinkedIn",
    pt: "LinkedIn",
  },
  "ch11-twitter-btn": {
    en: "Twitter / X",
    pt: "Twitter / X",
  },
  "ch11-instagram-btn": {
    en: "Instagram",
    pt: "Instagram",
  },
  "ch11-youtube-btn": {
    en: "YouTube",
    pt: "YouTube",
  },
  "ch11-disclaimer-p": {
    en: "<strong>Important Notice:</strong> None of the external media channels or official resources linked here are legally binding financial disclosures. For statutory financial metrics, refer only to official SAD filings.",
    pt: "<strong>Aviso Importante:</strong> Nenhum dos canais externos ou recursos oficiais aqui associados constituem divulgações financeiras legalmente vinculativas. Para métricas estatutárias, consulte apenas os relatórios oficiais da SAD.",
    innerHTML: true,
  },
  "ch11-stromp-unrevealed": {
    en: "Not Revealed",
    pt: "Por Revelar",
  },
  "ch11-exp-title": {
    en: "Sporting Experience — Tours & Tickets",
    pt: "Sporting Experience — Visitas e Bilhetes",
  },
  "ch11-exp-desc": {
    en: "Discover the heart of Alvalade. Experience pitch-side views, dressing rooms, the press room, and the Pavilhão João Rocha. Visit the Museu Sporting to walk through 119 years of glory.",
    pt: "Descubra o coração de Alvalade. Viva a experiência de estar junto ao relvado, balneários, sala de imprensa e Pavilhão João Rocha. Visite o Museu Sporting e percorra 119 anos de glória.",
  },
  "ch11-exp-btn": {
    en: "Book Your Tour",
    pt: "Reservar Visita",
  },
  "tab-btn-news": {
    en: '<span class="tab-num">12</span>News',
    pt: '<span class="tab-num">12</span>Notícias',
    innerHTML: true,
  },
  "tab-btn-club": {
    en: '<span class="tab-num">11</span>Club SAD',
    pt: '<span class="tab-num">11</span>Clube SAD',
    innerHTML: true,
  },
  "ch12-num": {
    en: "Ch. 12 — News",
    pt: "Cap. 12 — Notícias",
  },
  "ch12-h2": {
    en: "Live <em>Updates</em>.",
    pt: "<em>Atualizações</em> em direto.",
    innerHTML: true,
  },
  "ch12-lede": {
    en: "The latest financial and corporate news regarding Sporting CP, aggregated live from Portuguese media.",
    pt: "As últimas notícias financeiras e corporativas do Sporting CP, agregadas em direto dos meios de comunicação portugueses.",
  },
  "ch12-disclaimer-p": {
    en: "<strong>Important Notice:</strong> None of the external news feed items or media articles linked here are official, audited, or legally binding. They do not constitute financial advice or verified SAD communications. Official SAD and financial disclosures must be treated as the sole source of truth until formally filed with the CMVM.",
    pt: "<strong>Aviso Importante:</strong> Nenhuma das notícias externas ou artigos de imprensa aqui associados são oficiais, auditados ou legalmente vinculativos. Não constituem aconselhamento financeiro ou comunicações oficiais da SAD. As divulgações oficiais e financeiras da SAD devem ser consideradas a única fonte de verdade até serem formalmente comunicadas à CMVM.",
    innerHTML: true,
  },
  "ch12-loading": {
    en: "Loading live updates...",
    pt: "A carregar atualizações...",
  },
  "ch11-card-kits-title": {
    en: "Official Match Kits (2025/26)",
    pt: "Equipamentos Oficiais (2025/26)",
  },
  "ch11-card-kits-desc": {
    en: "The legendary green-and-white horizontal hoops (Home), the modern design (Away), and the half-green, half-white Stromp kit named in honour of founder Francisco Stromp.",
    pt: "As lendárias listras horizontais verdes e brancas (Principal), o design moderno (Alternativo) e o equipamento bipartido Stromp, em homenagem ao fundador Francisco Stromp.",
  },
  "ch11-card-stadium-title": {
    en: "Estádio José Alvalade",
    pt: "Estádio José Alvalade",
  },
  "ch11-card-stadium-desc": {
    en: "Inaugurated in 2003 and rated UEFA Category 4. Under the 2025 'Alvalade 2.0' modernization (partially funded by the USPP bond), the club closed the stadium moat to add 2,000 extra seats, raising capacity to 52,095. Upgrades include a Grassmax hybrid pitch, a 28-seat VIP Pitch Row, Loges equipped with individual tablet-TVs, and the Deluxe Emerald Lounge, alongside the classic Gamebox season tickets and Lion Seats.",
    pt: "Inaugurado em 2003 e classificado como Categoria 4 da UEFA. Com a remodelação 'Alvalade 2.0' de 2025 (financiada no âmbito da emissão USPP), foi fechado o fosso para criar mais 2.000 lugares, subindo a lotação para 52.095 espectadores. Destaca-se o relvado híbrido Grassmax, a VIP Pitch Row com 28 lugares premium, Loges com ecrãs individuais e o Deluxe Emerald Lounge, além dos anuais Gamebox e Lion Seats.",
  },
  "ch11-stadium-gamebox": {
    en: "Gamebox Season Tickets",
    pt: "Lugar Anual Gamebox",
  },
  "ch11-stadium-lionseats": {
    en: "Lion Seats (Premium VIP)",
    pt: "Lion Seats (Premium VIP)",
  },
  "ch11-card-hall-title": {
    en: "Pavilhão João Rocha",
    pt: "Pavilhão João Rocha",
  },
  "ch11-card-hall-desc": {
    en: "Located adjacent to the stadium, the 3,000-seat multi-sports arena houses Sporting CP's historic indoor sports (Futsal, Handball, Roller Hockey, and Basketball). Named after former president João Rocha.",
    pt: "Localizado junto ao estádio, a arena multi-desportiva com 3.000 lugares acolhe as modalidades de pavilhão do Sporting CP (Futsal, Andebol, Hóquei em Patins e Basquetebol). Homenageia o antigo presidente João Rocha.",
  },
  "ch11-card-museum-title": {
    en: "Museu Sporting",
    pt: "Museu Sporting",
  },
  "ch11-card-museum-desc": {
    en: "Housing over 16,000 historic trophies, the museum celebrates the golden eras of European triumphs and national dominance, showcasing the legacy of Lisbon's most decorated sports institution.",
    pt: "Alojando mais de 16.000 troféus históricos, o museu celebra as eras de ouro dos triunfos europeus e o domínio nacional, exibindo o legado da instituição mais eclética e titulada de Lisboa.",
  },
  "ch11-card-academy-title": {
    en: "Academia Cristiano Ronaldo",
    pt: "Academia Cristiano Ronaldo",
  },
  "ch11-card-academy-desc": {
    en: "Located in Alcochete over 250,000 m², it is the heart of Sporting CP's youth academy. The first in Europe to receive ISO 9001:2008 certification, and renamed in 2020 to honor Ballon d'Or winner Cristiano Ronaldo.",
    pt: "Situada em Alcochete com 250.000 m², é o coração da formação leonina. Primeira academia na Europa a obter a certificação ISO 9001:2008, foi rebatizada em 2020 para homenagear o lendário Cristiano Ronaldo.",
  },
};

/**
 * Apply translations to all elements with data-i18n attributes.
 * @param {"en"|"pt"} lang
 */
export function applyTranslations(lang) {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    const entry = TRANSLATIONS[key];
    if (!entry) return;
    const text = entry[lang] ?? entry["en"];
    if (entry.isAria) {
      el.setAttribute("aria-label", text);
      return;
    }
    if (entry.innerHTML) {
      el.innerHTML = text;
    } else {
      // For inputs use placeholder, for others use textContent
      if (el.tagName === "INPUT" && el.hasAttribute("placeholder")) {
        el.placeholder = text;
      } else if (el.tagName === "OPTION") {
        el.textContent = text;
      } else {
        el.innerHTML = text; // use innerHTML to handle &amp; etc.
      }
    }
  });
}
