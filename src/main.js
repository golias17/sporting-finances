import { state } from "./state.js";
import { applyTranslations } from "./translations.js";
import { initHealthBar } from "./health.js";
import { renderVmocCost, renderLionFinance, renderUsppTerms } from "./bonds.js";
import { renderTransferLedger, initTransfersDetailTable } from "./transfers.js";
import { renderTable, initDataExport } from "./data-table.js";
import { initNewsFeed } from "./news.js";
import {
  exitStory,
  updateStoryStep,
  initStoryMode,
} from "./story.js";
import { initComparison } from "./compare.js";
import { syncEventsFilter, initEventFilter } from "./events.js";
import {
  chartHero,
  chartNetResult,
  chartEquity,
  chartRevenue,
  chartRevStreams,
  chartRevVsPayroll,
  chartOpResult,
  chartPayrollBurden,
  chartTransferReliance,
  chartDebtLoad,
  chartCurrentRatio,
  chartDebt,
  chartAssetsLiab,
  chartDebtMaturity,
  chartSquadBook,
  chartTransfers,
  chartNetTrading,
  chartCashFlow,
  chartCash,
  chartAnnualNet,
  chartRegistry,
  fmtMillions,
} from "./charts.js";

async function initApp() {
  try {
    const finRes = await fetch("./data/financials.json");
    state.DATASET = await finRes.json();
    const trRes = await fetch("./data/transfers.json");
    state.TRANSFER_LEDGER = await trRes.json();
    state.annual = state.DATASET.annual_data;

    // Once data is loaded, populate KPIs and setup UI
    setupApp();
    initJornalModal();
  } catch (e) {
    console.error("Failed to load application data", e);
    document.body.innerHTML = `<div style="padding: 2rem; color: #ff4444; font-family: sans-serif; text-align: center;">
      <h2>Failed to load application data.</h2>
      <p>Please ensure you are running the application through a local web server, not opening the HTML file directly.</p>
    </div>`;
  }
}

function ordinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function renderKpis(idx) {
  if (idx === undefined || idx === null) {
    idx =
      state.healthBarIdx !== null
        ? state.healthBarIdx
        : state.annual.length - 1;
  }
  const isLatest = idx === state.annual.length - 1;
  const curr = state.annual[idx];
  const first = state.annual[0];
  const firstShort = first.label.slice(2);

  // Revenue growth vs ~5 years prior
  const compIdx = idx - 4;
  const comp = compIdx >= 0 ? state.annual[compIdx] : null;
  const revGrowthPct = comp
    ? (
        ((curr.revenue_operating - comp.revenue_operating) /
          comp.revenue_operating) *
        100
      ).toFixed(0)
    : null;

  // Consecutive profitable years (counting backwards from idx)
  let consecutiveProfitable = 0;
  for (let i = idx; i >= 0; i--) {
    if (state.annual[i].net_result > 0) consecutiveProfitable++;
    else break;
  }

  // Squad market value — use H1 data for the latest season only
  let sqMv, sqMvLabel;
  if (isLatest) {
    const h1 = state.DATASET.h1_2526;
    let h1PeriodLabel;
    if (state.isPt) {
      const monthsPt = {
        Jan: "Jan",
        Feb: "Fev",
        Mar: "Mar",
        Apr: "Abr",
        May: "Mai",
        Jun: "Jun",
        Jul: "Jul",
        Aug: "Ago",
        Sep: "Set",
        Oct: "Out",
        Nov: "Nov",
        Dec: "Dez",
      };
      const rawLabel = new Date(h1.period_end).toLocaleDateString("en-GB", {
        month: "short",
        year: "2-digit",
      });
      const [m, y] = rawLabel.split(" ");
      h1PeriodLabel = `${monthsPt[m] || m} ${y}`;
    } else {
      h1PeriodLabel = new Date(h1.period_end).toLocaleDateString("en-GB", {
        month: "short",
        year: "2-digit",
      });
    }
    sqMv = h1.squad_market_value;
    sqMvLabel = state.isPt
      ? `Valor de mercado do plantel (${h1PeriodLabel})`
      : `Squad market value (${h1PeriodLabel})`;
  } else {
    sqMv = curr.squad_market_value;
    sqMvLabel = state.isPt
      ? `Valor de mercado do plantel (${curr.label})`
      : `Squad market value (${curr.label})`;
  }
  const sqMvMultiple = (sqMv / first.squad_market_value).toFixed(1);

  const kpis = [
    {
      label: state.isPt
        ? `${isLatest ? "Última receita" : "Receita"} (${curr.label})`
        : `${isLatest ? "Latest revenue" : "Revenue"} (${curr.label})`,
      value: fmtMillions(curr.revenue_operating),
      change:
        revGrowthPct !== null
          ? state.isPt
            ? `${Number(revGrowthPct) >= 0 ? "+" : ""}${revGrowthPct}% vs há 5 anos`
            : `${Number(revGrowthPct) >= 0 ? "+" : ""}${revGrowthPct}% vs 5y ago`
          : state.isPt
            ? "Menos de 5 épocas de dados"
            : "Less than 5 seasons of data",
      cls:
        revGrowthPct !== null && Number(revGrowthPct) >= 0
          ? "pos"
          : revGrowthPct !== null
            ? "neg"
            : "",
    },
    {
      label: state.isPt
        ? `${isLatest ? "Último resultado líquido" : "Resultado líquido"} (${curr.label})`
        : `${isLatest ? "Latest net result" : "Net result"} (${curr.label})`,
      value: fmtMillions(curr.net_result),
      change:
        consecutiveProfitable > 1
          ? state.isPt
            ? `${consecutiveProfitable}º ano consecutivo com lucros`
            : `${ordinal(consecutiveProfitable)} profitable year in a row`
          : consecutiveProfitable === 1
            ? state.isPt
              ? "Ano com lucros"
              : "Profitable year"
            : state.isPt
              ? "Ano de prejuízo"
              : "Loss-making year",
      cls: curr.net_result > 0 ? "pos" : "neg",
    },
    {
      label: state.isPt
        ? `${isLatest ? "Últimos capitais próprios" : "Capitais próprios"} (${curr.label})`
        : `${isLatest ? "Latest equity" : "Equity"} (${curr.label})`,
      value: fmtMillions(curr.equity),
      change: state.isPt
        ? `vs ${fmtMillions(first.equity)} em ${firstShort}`
        : `vs ${fmtMillions(first.equity)} in ${firstShort}`,
      cls:
        curr.equity > first.equity
          ? "pos"
          : curr.equity < first.equity
            ? "neg"
            : "",
    },
    {
      label: sqMvLabel,
      value: fmtMillions(sqMv),
      change: state.isPt
        ? `${sqMvMultiple}× o valor de mercado de ${firstShort} (${fmtMillions(first.squad_market_value)})`
        : `${sqMvMultiple}× the ${firstShort} market value (${fmtMillions(first.squad_market_value)})`,
      cls: sqMv > first.squad_market_value ? "pos" : "",
    },
    {
      label: state.isPt
        ? `Dívida total (${curr.label})`
        : `Total debt (${curr.label})`,
      value: fmtMillions(curr.borrowings_nc + curr.borrowings_c),
      change: state.isPt
        ? `vs ${fmtMillions(first.borrowings_nc + first.borrowings_c)} em ${firstShort}`
        : `vs ${fmtMillions(first.borrowings_nc + first.borrowings_c)} in ${firstShort}`,
      cls: "",
    },
  ];

  // 6th card: H1 net result for latest season, cash on hand for historical
  if (isLatest) {
    const h1 = state.DATASET.h1_2526;
    kpis.push({
      label: state.isPt
        ? `Result. líquido 1º Sem. ${h1.label}`
        : `H1 ${h1.label} net result`,
      value: fmtMillions(h1.net_result),
      change: state.isPt
        ? "Após a venda de Gyökeres por 65,8 M€"
        : "After Gyökeres €65.8M sale",
      cls: "pos",
    });
  } else {
    kpis.push({
      label: state.isPt
        ? `Saldo de caixa (${curr.label})`
        : `Cash on hand (${curr.label})`,
      value: fmtMillions(curr.cash),
      change: state.isPt
        ? `vs ${fmtMillions(first.cash)} em ${firstShort}`
        : `vs ${fmtMillions(first.cash)} in ${firstShort}`,
      cls: curr.cash > first.cash ? "pos" : "neg",
    });
  }

  document.getElementById("kpiRow").innerHTML = kpis
    .map(
      (k) =>
        `<div class="kpi" tabindex="0" role="group" aria-label="${k.label}: ${k.value}. ${k.change}">
           <div class="label" aria-hidden="true">${k.label}</div>
           <div class="value" aria-hidden="true">${k.value}</div>
           <div class="change ${k.cls || "neutral"}" aria-hidden="true">${k.change}</div>
         </div>`,
    )
    .join("");
}

function setupApp() {
  renderKpis();
  initStoryMode();
  initEventFilter();
  initScrollAnimations();
  initDataExport();
  initNewsFeed();

  // =============================================================
  // TAB SWITCHING
  // =============================================================
  state.TAB_CHARTS = {
    overview: [chartHero, chartNetResult, chartEquity],
    revenue: [chartRevenue, chartRevStreams, chartRevVsPayroll, chartOpResult],
    healthcheck: [
      initHealthBar,
      chartPayrollBurden,
      chartTransferReliance,
      chartDebtLoad,
      chartCurrentRatio,
    ],
    debt: [chartDebt, chartAssetsLiab, chartDebtMaturity],
    bonds: [renderVmocCost, renderLionFinance, renderUsppTerms],
    squad: [
      chartSquadBook,
      chartTransfers,
      chartNetTrading,
      renderTransferLedger,
    ],
    cash: [chartCashFlow, chartCash, chartAnnualNet],
    compare: [initComparison],
    events: [],
    data: [renderTable, initTransfersDetailTable],
  };

  document.querySelectorAll("nav.tabs button").forEach((btn) => {
    btn.addEventListener("click", () => activateTab(btn.dataset.tab));
  });

  document.querySelector("nav.tabs").addEventListener("keydown", (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const tabs = [...document.querySelectorAll("nav.tabs button")];
    const idx = tabs.indexOf(document.activeElement);
    if (idx === -1) return;
    e.preventDefault();
    const next =
      e.key === "ArrowRight"
        ? tabs[(idx + 1) % tabs.length]
        : tabs[(idx - 1 + tabs.length) % tabs.length];
    next.focus();
    activateTab(next.dataset.tab);
  });

  // Language switcher — intercept EN/PT links, no page reload
  document.querySelectorAll(".lang-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const lang = link.dataset.lang;
      if ((lang === "pt") === state.isPt) return; // already active

      state.isPt = lang === "pt";
      document.documentElement.lang = lang;
      localStorage.setItem("lang", lang);

      // Update active link styling
      document
        .querySelectorAll(".lang-link")
        .forEach((l) => l.classList.toggle("active", l.dataset.lang === lang));

      // Update all static HTML strings
      applyTranslations(lang);

      // Clear all cached charts so they rebuild with new language
      state.renderedCharts.clear();
      chartRegistry.forEach((chart) => chart.destroy());
      chartRegistry.clear();

      // Re-render the currently active tab
      const activeTabBtn = document.querySelector("nav.tabs button.active");
      if (activeTabBtn) activateTab(activeTabBtn.dataset.tab, false);

      // Re-render KPI strip
      renderKpis();

      // Re-render active story step if open
      const storyCard = document.getElementById("storyCard");
      if (storyCard && !storyCard.classList.contains("hidden")) {
        updateStoryStep();
      }
    });
  });

  // Theme Toggle listener
  const themeBtn = document.getElementById("themeToggleBtn");
  if (themeBtn) {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    if (savedTheme === "dark" || (!savedTheme && systemPrefersDark)) {
      document.body.classList.add("dark");
      updateThemeUI(true);
    } else {
      document.body.classList.remove("dark");
      updateThemeUI(false);
    }

    themeBtn.addEventListener("click", () => {
      themeBtn.classList.add("animating");
      themeBtn.addEventListener(
        "animationend",
        () => {
          themeBtn.classList.remove("animating");
        },
        { once: true },
      );

      const isDark = document.body.classList.toggle("dark");
      localStorage.setItem("theme", isDark ? "dark" : "light");
      updateThemeUI(isDark);
      updateChartTheme();
      // Force re-rendering of active tab's charts
      state.renderedCharts.clear();
      const activeTabBtn = document.querySelector("nav.tabs button.active");
      if (activeTabBtn) {
        const tab = activeTabBtn.dataset.tab;
        if (state.TAB_CHARTS[tab]) {
          state.TAB_CHARTS[tab].forEach((fn) => {
            if (chartRegistry.has(fn.name)) {
              chartRegistry.get(fn.name).destroy();
              chartRegistry.delete(fn.name);
            }
            fn();
            state.renderedCharts.add(fn.name);
          });
        }
      }
    });
  }

  // Restore saved language preference
  const savedLang = localStorage.getItem("lang");
  if (savedLang && savedLang !== document.documentElement.lang) {
    state.isPt = savedLang === "pt";
    document.documentElement.lang = savedLang;
    document
      .querySelectorAll(".lang-link")
      .forEach((l) =>
        l.classList.toggle("active", l.dataset.lang === savedLang),
      );
  }

  // Apply translations for saved/initial language
  applyTranslations(state.isPt ? "pt" : "en");

  // Initial tab activation
  const initialTab = location.hash.replace("#", "") || "overview";
  activateTab(initialTab, false);

  window.addEventListener("resize", () => updateTabIndicator());

  // Initial chart theme setup on load
  updateChartTheme();

  // Floating Scroll to Top button logic
  const scrollToTopBtn = document.getElementById("scrollToTopBtn");
  if (scrollToTopBtn) {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 300) {
        scrollToTopBtn.classList.add("visible");
      } else {
        scrollToTopBtn.classList.remove("visible");
      }
    });

    scrollToTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
}

export function activateTab(tab, pushHash = true) {
  if (!state.VALID_TABS.includes(tab)) tab = "overview";
  if (tab !== "overview") {
    exitStory();
  }
  let activeBtn = null;
  document.querySelectorAll("nav.tabs button").forEach((b) => {
    const isActive = b.dataset.tab === tab;
    b.classList.toggle("active", isActive);
    b.setAttribute("aria-selected", isActive ? "true" : "false");
    if (isActive) activeBtn = b;
  });
  updateTabIndicator(activeBtn);

  document
    .querySelectorAll("section.tab-panel")
    .forEach((p) => p.classList.remove("active"));
  document.getElementById("tab-" + tab).classList.add("active");
  if (pushHash) history.replaceState(null, "", "#" + tab);

  if (state.TAB_CHARTS[tab]) {
    state.TAB_CHARTS[tab].forEach((fn) => {
      if (!state.renderedCharts.has(fn.name)) {
        fn();
        state.renderedCharts.add(fn.name);
      }
    });
  }

  if (tab === "events") {
    syncEventsFilter();
  }
}

function updateTabIndicator(activeBtn) {
  const tabsContainer = document.querySelector("nav.tabs");
  if (!tabsContainer) return;

  let indicator = tabsContainer.querySelector(".tab-indicator");
  if (!indicator) {
    indicator = document.createElement("div");
    indicator.className = "tab-indicator";
    tabsContainer.appendChild(indicator);
  }

  const btn = activeBtn || tabsContainer.querySelector("button.active");
  if (!btn) {
    indicator.style.width = "0px";
    return;
  }

  indicator.style.left = `${btn.offsetLeft}px`;
  indicator.style.width = `${btn.offsetWidth}px`;

  // Scroll active tab into horizontal view center smoothly inside the container
  const containerWidth = tabsContainer.offsetWidth;
  const btnLeft = btn.offsetLeft;
  const btnWidth = btn.offsetWidth;
  tabsContainer.scrollTo({
    left: btnLeft - containerWidth / 2 + btnWidth / 2,
    behavior: "smooth",
  });
}

function updateThemeUI(isDark) {
  const themeBtn = document.getElementById("themeToggleBtn");
  if (!themeBtn) return;
  const btnText = themeBtn.querySelector("span");
  const btnIcon = themeBtn.querySelector("svg");
  if (isDark) {
    if (btnText) btnText.textContent = state.isPt ? "Modo Claro" : "Light Mode";
    if (btnIcon)
      btnIcon.innerHTML =
        '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
  } else {
    if (btnText) btnText.textContent = state.isPt ? "Modo Escuro" : "Dark Mode";
    if (btnIcon)
      btnIcon.innerHTML =
        '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
  }
}

function updateChartTheme() {
  const isDark = document.body.classList.contains("dark");
  state.COLORS.ink = isDark ? "#eaeaea" : "#18221d";
  state.COLORS.muted = isDark ? "#8c938f" : "#5a6a62";
  state.baseOpts.scales.x.ticks.color = state.COLORS.muted;
  state.baseOpts.scales.y.ticks.color = state.COLORS.muted;
  if (state.baseOpts.scales.y.grid) {
    state.baseOpts.scales.y.grid.color = isDark
      ? "rgba(255,255,255,0.08)"
      : "rgba(0,0,0,0.05)";
  }
  if (state.baseOpts.plugins && state.baseOpts.plugins.tooltip) {
    state.baseOpts.plugins.tooltip.backgroundColor = isDark
      ? "rgba(24, 29, 26, 0.95)"
      : "rgba(250, 248, 243, 0.95)";
    state.baseOpts.plugins.tooltip.titleColor = isDark ? "#eaeaea" : "#14181a";
    state.baseOpts.plugins.tooltip.bodyColor = isDark ? "#cccccc" : "#2c3437";
    state.baseOpts.plugins.tooltip.borderColor = isDark ? "#2a332f" : "#e6e1d4";
  }
}

function initScrollAnimations() {
  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
  );

  const targets = document.querySelectorAll(
    ".card, .kpi, .health-bar, .event, .cmp-card, .lf-card, .hb-title, .disclaimer-banner, .social-hub, .news-grid"
  );
  targets.forEach((el) => {
    el.classList.add("anim-up");
    observer.observe(el);
  });
}

// Jornal Modal Logic
function initJornalModal() {
  const btnOpen = document.getElementById("btnJornalModal");
  const btnClose = document.getElementById("btnCloseJornal");
  const modal = document.getElementById("jornalModal");
  const container = document.getElementById("jornalIframeContainer");
  
  if (!btnOpen || !btnClose || !modal || !container) return;

  const iframeSrc = "https://e.issuu.com/embed.html?backgroundColor=%23008057&backgroundColorFullscreen=%23008057&d=jornal_sporting_n._4077&hideIssuuLogo=true&hideShareButton=true&showOtherPublicationsAsSuggestions=true&u=sporting-digitalpaper";

  function openModal() {
    // Inject iframe only on first open
    if (container.innerHTML === "") {
      container.innerHTML = `<iframe src="${iframeSrc}" allow="clipboard-write; autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen="true"></iframe>`;
    }
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden"; // Prevent background scrolling
  }

  function closeModal() {
    modal.classList.add("hidden");
    document.body.style.overflow = ""; // Restore background scrolling
  }

  btnOpen.addEventListener("click", openModal);
  btnClose.addEventListener("click", closeModal);
  
  // Close on outside click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
  
  // Close on escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) {
      closeModal();
    }
  });
}

// Start application
initApp();
