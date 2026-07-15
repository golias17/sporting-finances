import { state } from "./state.js";
import { translateNote } from "./localization.js";
function fmtNumStr(n) {
  if (n === null || n === undefined) return "—";
  return n.toLocaleString("de-DE", {
    minimumFractionDigits: n % 1 !== 0 ? 2 : 0,
  });
}

// TRANSFER LEDGER RENDERER
// =============================================================
export function renderTransferLedger() {
  const nav = document.getElementById("tlSeasonNav");
  const winNav = document.getElementById("tlWindowNav");
  const body = document.getElementById("tlBody");

  // Build season pills
  nav.innerHTML = state.TRANSFER_LEDGER.map(
    (s) =>
      `<button class="season-pill${s.season === state.tlActiveSeason ? " active" : ""}"
             aria-pressed="${s.season === state.tlActiveSeason ? "true" : "false"}"
             data-tl-season="${s.season}">${s.season}</button>`,
  ).join("");

  nav.querySelectorAll(".season-pill").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.setTlActiveSeason(btn.dataset.tlSeason);
      renderTransferLedger();
    });
  });

  // Build window pills
  if (winNav) {
    const windows = [
      { value: "All", label: state.isPt ? "Todas as janelas" : "All Windows" },
      {
        value: "summer",
        label: state.isPt ? "Mercado de Verão" : "Summer Window",
      },
      {
        value: "winter",
        label: state.isPt ? "Mercado de Inverno" : "Winter Window",
      },
    ];
    winNav.innerHTML = windows
      .map(
        (w) =>
          `<button class="season-pill${w.value === state.tlActiveWindow ? " active" : ""}"
               aria-pressed="${w.value === state.tlActiveWindow ? "true" : "false"}"
               data-tl-window="${w.value}">${w.label}</button>`,
      )
      .join("");

    winNav.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.setTlActiveWindow(btn.dataset.tlWindow);
        renderTransferLedger();
      });
    });
  }

  renderTlBody(body);
}

// Not exported — only called internally from renderTransferLedger().
function renderTlBody(container) {
  const s = state.TRANSFER_LEDGER.find(
    (x) => x.season === state.tlActiveSeason,
  );
  if (!s) return;

  let purchases = s.purchases;
  let sales = s.sales;

  if (state.tlActiveWindow !== "All") {
    purchases = purchases.filter(
      (p) => p.window === state.tlActiveWindow.toLowerCase(),
    );
    sales = sales.filter(
      (p) => p.window === state.tlActiveWindow.toLowerCase(),
    );
  }

  const fmtFee = (fee) => {
    if (fee === null || fee === undefined)
      return `<span class="tl-fee low">—</span>`;
    if (fee === 0)
      return `<span class="tl-fee low">${state.isPt ? "Custo Zero" : "Free"}</span>`;
    const cls = fee >= 20 ? "sig" : fee >= 5 ? "mid" : "low";
    return `<span class="tl-fee ${cls}">€${fmtNumStr(fee)}M</span>`;
  };

  const renderRows = (arr) =>
    arr
      .map((p) => {
        const tags = [];
        if (state.tlActiveWindow === "All" && p.window) {
          const winLabel =
            p.window === "summer"
              ? state.isPt
                ? "Verão"
                : "summer"
              : state.isPt
                ? "Inverno"
                : "winter";
          tags.push(
            `<span class="tl-tag ${p.window === "summer" ? "bonus" : "comm"} text-capitalize">${winLabel}</span>`,
          );
        }
        if (p.rights)
          tags.push(`<span class="tl-tag rights">${p.rights}</span>`);
        if (p.bonus)
          tags.push(
            `<span class="tl-tag bonus">+€${fmtNumStr(p.bonus)}M ${state.isPt ? "bónus" : "bonus"}</span>`,
          );
        if (p.commission)
          tags.push(
            `<span class="tl-tag comm">€${fmtNumStr(p.commission)}M ${state.isPt ? "comissão" : "commission"}</span>`,
          );
        return `
    <div class="tl-row">
      <div class="tl-details">
        <div class="tl-player">${p.player}</div>
        <div class="tl-club">${p.club ? p.club : "—"}</div>
        ${tags.length ? `<div class="tl-tags">${tags.join("")}</div>` : ""}
        ${p.note ? `<div class="tl-obs">${state.isPt ? translateNote(p.note) : p.note}</div>` : ""}
      </div>
      ${fmtFee(p.fee)}
    </div>`;
      })
      .join("");

  const totalIn = purchases.reduce((a, p) => a + (p.fee || 0), 0);
  const totalOut = sales.reduce((a, p) => a + (p.fee || 0), 0);
  const net = totalOut - totalIn;
  const netCls = net >= 0 ? "pos" : "neg";
  const netSign = net >= 0 ? "+" : "";

  // Localized season note dictionary
  const seasonNotesPt = {
    "2012/13":
      "Era de reestruturação financeira. Compra de Marcos Rojo (vendido no ano seguinte por 20 M€). Proveitos importantes oriundos do mecanismo de solidariedade de João Moutinho e da venda de Ricky van Wolfswinkel.",
    "2013/14":
      "Segunda época de reestruturação. Venda de Bruma, Tiago Ilori e Elias Trindade, com investimento modesto. Todas as aquisições incluíram bónus contingentes não refletidos nos valores fixos.",
    "2014/15":
      "Época recorde de vendas à data. Venda de Marcos Rojo ao Manchester United por 20 M€ um ano após a contratação. Eric Dier e Cédric Soares também saíram para a Premier League.",
    "2015/16":
      "Investimento desportivo significativo sob o comando de Jorge Jesus. Venda de Teo Gutiérrez e Fredy Montero no inverno. Aquisições de peso como Alberto Aquilani e Bryan Ruiz.",
    "2016/17":
      "Ano de ouro nas transferências. Venda de João Mário ao Inter de Milão por 40 M€ e Islam Slimani ao Leicester City por 30,5 M€. Compra de Bas Dost (€11,8M) que viria a ser o melhor marcador da Liga.",
    "2017/18":
      "Vendas importantes de Adrien Silva (€24,2M) no verão e de Jonathan Silva no inverno. Plantel reforçado com Marcos Acuña, Bruno Fernandes e Jérémy Mathieu.",
    "2018/19":
      "Época pós-ataque a Alcochete. Muitas saídas por justa causa resolvidas por acordo posterior (Gelson Martins €22,5M, Rui Patrício €18M, William Carvalho €16M). Compra de Raphinha (€6,5M).",
    "2019/20":
      "Venda histórica de Bruno Fernandes ao Manchester United em janeiro de 2020 (€55M fixos + bónus). Saídas de Raphinha (€21M), Thierry Correia (€12M) e Bas Dost (€7M).",
    "2020/21":
      "Época do título nacional. Investimento no treinador Rúben Amorim na época anterior continuado com a contratação de Pedro Gonçalves (€6,5M) e Nuno Santos (€3,75M). Venda de Wendel (€20,3M) e Marcos Acuña (€11,25M).",
    "2021/22":
      "Regresso à Champions League. Venda de Nuno Mendes ao PSG (€40M após empréstimo de €7M). Compra definitiva de Pedro Porro (€8,5M) e contratação de Manuel Ugarte (€6,5M).",
    "2022/23":
      "Vendas massivas de Matheus Nunes ao Wolverhampton (€45M + €5M) e João Palhinha ao Fulham (€20M + €2M) no verão. Manuel Ugarte vendido no fim da época.",
    "2023/24":
      "Venda recorde de Manuel Ugarte ao PSG por €60M e Pedro Porro ao Tottenham por €40M (€5M taxa de empréstimo anterior). Grande investimento na contratação de Viktor Gyökeres (€20M + €4M).",
    "2024/25":
      "Venda recorde de Viktor Gyökeres ao Arsenal por €65,8M de valor fixo. Saídas adicionais de Morten Hjulmand (€24,3M) e Ousmane Diomande (€19,7M). Compra de Conrad Harder por €19M.",
    "2025/26":
      "Início da nova época pós-títulos. Venda de Geovany Quenda ao PSG por €41M. Contratação de Maximiliano Araújo por €13,6M.",
  };

  const displayedNote = state.isPt
    ? seasonNotesPt[s.season] || translateNote(s.note)
    : s.note;

  const note = displayedNote
    ? `<div class="tl-season-note">${displayedNote}</div>`
    : "";

  container.innerHTML = `
    ${note}
    <div class="tl-cols">
      <div class="tl-col">
        <div class="tl-col-head in">
          <span class="tl-label">${state.isPt ? "↓ Contratações (Valor Fixo)" : "↓ Bought (Primary Fees)"}</span>
          <span class="tl-total">€${totalIn.toLocaleString("de-DE", { minimumFractionDigits: totalIn % 1 !== 0 ? 2 : 0 })}M</span>
        </div>
        ${purchases.length ? renderRows(purchases) : `<div class="tl-row"><div class="tl-club">${state.isPt ? "Sem contratações nesta janela" : "No purchases in this window"}</div></div>`}
      </div>
      <div class="tl-col">
        <div class="tl-col-head out">
          <span class="tl-label">${state.isPt ? "↑ Vendas (Valor Fixo)" : "↑ Sold (Primary Fees)"}</span>
          <span class="tl-total">€${totalOut.toLocaleString("de-DE", { minimumFractionDigits: totalOut % 1 !== 0 ? 2 : 0 })}M</span>
        </div>
        ${sales.length ? renderRows(sales) : `<div class="tl-row"><div class="tl-club">${state.isPt ? "Sem vendas nesta janela" : "No sales in this window"}</div></div>`}
      </div>
    </div>
    <div class="tl-summary">
      <div class="tl-sum-item">
        <span class="tl-sum-label">${state.isPt ? "Total investido (Valor Fixo)" : "Total spent (Primary Fees)"}</span>
        <span class="tl-sum-val neg">−€${totalIn.toLocaleString("de-DE", { minimumFractionDigits: totalIn % 1 !== 0 ? 2 : 0 })}M</span>
      </div>
      <div class="tl-net-box">
        <div class="tl-sum-label">${state.isPt ? "Saldo de transferências" : "Net trading (Primary Fees)"}</div>
        <div class="tl-sum-val ${netCls}">${netSign}€${Math.abs(net).toLocaleString("de-DE", { minimumFractionDigits: net % 1 !== 0 ? 2 : 0 })}M</div>
      </div>
      <div class="tl-sum-item">
        <span class="tl-sum-label">${state.isPt ? "Total recebido (Valor Fixo)" : "Total received (Primary Fees)"}</span>
        <span class="tl-sum-val pos">+€${totalOut.toLocaleString("de-DE", { minimumFractionDigits: totalOut % 1 !== 0 ? 2 : 0 })}M</span>
      </div>
    </div>`;
}

// =============================================================

// TRANSFERS DETAIL TABLE (Raw Data Tab)
// =============================================================

// AbortController lets us safely re-initialise the detail table (e.g. on
// language toggle) without accumulating duplicate event listeners.
let detailTableAbortController = null;

export function initTransfersDetailTable() {
  const seasonSelect = document.getElementById("tfSeasonSelect");
  const windowSelect = document.getElementById("tfWindowSelect");
  const typeSelect = document.getElementById("tfTypeSelect");
  const searchInput = document.getElementById("tfSearchInput");
  if (!seasonSelect) return;

  // Abort previous listeners before wiring new ones
  if (detailTableAbortController) detailTableAbortController.abort();
  detailTableAbortController = new AbortController();
  const { signal } = detailTableAbortController;

  // Populate season dropdown
  const allSeasonsOption = `<option value="all" data-i18n="ch10-tf-season-all"${state.tfActiveSeason === "all" ? " selected" : ""}>${state.isPt ? "Todas as Épocas" : "All Seasons"}</option>`;
  seasonSelect.innerHTML =
    allSeasonsOption +
    state.TRANSFER_LEDGER.map(
      (s) =>
        `<option value="${s.season}"${s.season === state.tfActiveSeason ? " selected" : ""}>${s.season}</option>`,
    ).join("");

  // Add listeners
  seasonSelect.addEventListener(
    "change",
    (e) => {
      state.setTfActiveSeason(e.target.value);
      renderTransfersDetailTable();
    },
    { signal },
  );

  if (windowSelect) {
    windowSelect.addEventListener(
      "change",
      (e) => {
        state.setTfActiveWindow(e.target.value);
        renderTransfersDetailTable();
      },
      { signal },
    );
  }

  typeSelect.addEventListener(
    "change",
    (e) => {
      state.setTfActiveType(e.target.value);
      renderTransfersDetailTable();
    },
    { signal },
  );

  searchInput.addEventListener(
    "input",
    (e) => {
      state.setTfQuery(e.target.value.toLowerCase());
      renderTransfersDetailTable();
    },
    { signal },
  );

  // Attach sorting click listeners to table headers
  const headers = document.querySelectorAll("#transfersDetailTable th");
  const sortKeys = [
    "player",
    "season",
    "window",
    "type",
    "club",
    "fee",
    "rights",
    "bonus",
    "commission",
    "note",
  ];

  headers.forEach((th, index) => {
    th.classList.add("sortable-header");
    th.addEventListener(
      "click",
      () => {
        const key = sortKeys[index];
        if (state.tfSortCol === key) {
          state.setTfSortDir(state.tfSortDir === "asc" ? "desc" : "asc");
        } else {
          state.setTfSortCol(key);
          state.setTfSortDir(
            ["fee", "bonus", "commission"].includes(key) ? "desc" : "asc",
          );
        }
        renderTransfersDetailTable();
      },
      { signal },
    );
  });

  renderTransfersDetailTable();
}

// Not exported — only called internally from initTransfersDetailTable()'s
// listeners and from within this function's own re-render calls.
function renderTransfersDetailTable() {
  const container = document.getElementById("transfersDetailTableBody");
  if (!container) return;

  // Update transfersTableSeasonTag text content
  const tag = document.getElementById("transfersTableSeasonTag");
  if (tag) {
    if (state.tfActiveSeason === "all") {
      tag.textContent = state.isPt ? "Todas as Épocas" : "All Seasons";
      tag.setAttribute("data-i18n", "ch10-tf-season-all");
    } else {
      tag.textContent = state.tfActiveSeason;
      tag.removeAttribute("data-i18n");
    }
  }

  // Build rows from purchases and sales
  let rows = [];

  if (state.tfActiveSeason === "all") {
    state.TRANSFER_LEDGER.forEach((seasonObj) => {
      if (state.tfActiveType === "all" || state.tfActiveType === "in") {
        seasonObj.purchases.forEach((p) => {
          rows.push({
            ...p,
            season: seasonObj.season,
            type: "Arrival",
            typeCls: "rights",
            typeText: state.isPt ? "↓ Entrada" : "↓ Arrival",
          });
        });
      }
      if (state.tfActiveType === "all" || state.tfActiveType === "out") {
        seasonObj.sales.forEach((s) => {
          rows.push({
            ...s,
            season: seasonObj.season,
            type: "Departure",
            typeCls: "comm",
            typeText: state.isPt ? "↑ Saída" : "↑ Departure",
          });
        });
      }
    });
  } else {
    const s = state.TRANSFER_LEDGER.find(
      (x) => x.season === state.tfActiveSeason,
    );
    if (!s) {
      container.innerHTML = `<tr><td colspan="10" class="ledger-empty-cell">${state.isPt ? "Época não encontrada" : "Season not found"}</td></tr>`;
      return;
    }
    if (state.tfActiveType === "all" || state.tfActiveType === "in") {
      s.purchases.forEach((p) => {
        rows.push({
          ...p,
          season: s.season,
          type: "Arrival",
          typeCls: "rights",
          typeText: state.isPt ? "↓ Entrada" : "↓ Arrival",
        });
      });
    }
    if (state.tfActiveType === "all" || state.tfActiveType === "out") {
      s.sales.forEach((p) => {
        rows.push({
          ...p,
          season: s.season,
          type: "Departure",
          typeCls: "comm",
          typeText: state.isPt ? "↑ Saída" : "↑ Departure",
        });
      });
    }
  }

  // Filter based on window
  if (state.tfActiveWindow !== "all") {
    rows = rows.filter((r) => r.window === state.tfActiveWindow);
  }

  // Filter based on search query
  if (state.tfQuery) {
    rows = rows.filter(
      (r) =>
        r.player.toLowerCase().includes(state.tfQuery) ||
        (r.club && r.club.toLowerCase().includes(state.tfQuery)) ||
        (r.note && r.note.toLowerCase().includes(state.tfQuery)),
    );
  }

  // Sort rows if tfSortCol is set
  if (state.tfSortCol) {
    rows.sort((a, b) => {
      let valA = a[state.tfSortCol];
      let valB = b[state.tfSortCol];

      if (valA === undefined || valA === null) valA = "";
      if (valB === undefined || valB === null) valB = "";

      if (["fee", "bonus", "commission"].includes(state.tfSortCol)) {
        const numA = typeof valA === "number" ? valA : 0;
        const numB = typeof valB === "number" ? valB : 0;
        return state.tfSortDir === "asc" ? numA - numB : numB - numA;
      }

      if (state.tfSortCol === "rights") {
        const parseRights = (r) => {
          if (!r) return 100;
          const match = r.match(/(\d+(?:\.\d+)?)/);
          return match ? parseFloat(match[1]) : 100;
        };
        const numA = parseRights(valA);
        const numB = parseRights(valB);
        return state.tfSortDir === "asc" ? numA - numB : numB - numA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      if (strA < strB) return state.tfSortDir === "asc" ? -1 : 1;
      if (strA > strB) return state.tfSortDir === "asc" ? 1 : -1;
      return 0;
    });
  }

  // Update header classes and indicators
  const headers = document.querySelectorAll("#transfersDetailTable th");
  const sortKeys = [
    "player",
    "season",
    "window",
    "type",
    "club",
    "fee",
    "rights",
    "bonus",
    "commission",
    "note",
  ];

  headers.forEach((th, index) => {
    const key = sortKeys[index];
    const existingIndicator = th.querySelector(".sort-indicator");
    if (existingIndicator) {
      existingIndicator.remove();
    }
    if (state.tfSortCol === key) {
      const indicator = document.createElement("span");
      indicator.className = "sort-indicator";
      indicator.innerHTML = state.tfSortDir === "asc" ? " ▲" : " ▼";
      th.appendChild(indicator);
      th.classList.add("sorted");
    } else {
      th.classList.remove("sorted");
    }
  });

  const fmtFeeDetail = (fee) => {
    if (fee === null || fee === undefined) return "—";
    if (fee === 0) return state.isPt ? "Custo Zero" : "Free";
    return `€${fmtNumStr(fee)}M`;
  };

  const fmtValDetail = (val) => {
    if (val === null || val === undefined || val === 0) return "—";
    return `€${fmtNumStr(val)}M`;
  };

  if (rows.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="10" class="ledger-empty-cell">
          <div class="ledger-empty-container">
            <div class="ledger-empty-icon-wrapper">
              <svg class="ledger-empty-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                <line x1="8" y1="11" x2="14" y2="11" stroke-dasharray="2 2"></line>
              </svg>
            </div>
            <h4 class="ledger-empty-title">${state.isPt ? "Nenhum resultado encontrado" : "No results found"}</h4>
            <p class="ledger-empty-sub">${state.isPt ? "Não encontrámos nenhuma transferência correspondente aos seus critérios de pesquisa. Tente ajustar os filtros ou a sua pesquisa." : "We couldn't find any transfers matching your search criteria. Try adjusting the filters or search term."}</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  container.innerHTML = rows
    .map((r) => {
      const isArrival = r.type === "Arrival";
      const typeLabel = `<span class="badge ${isArrival ? "arrival" : "departure"}">${r.typeText}</span>`;

      let displayWin = "—";
      if (r.window === "summer") displayWin = state.isPt ? "Verão" : "Summer";
      else if (r.window === "winter")
        displayWin = state.isPt ? "Inverno" : "Winter";
      const windowLabel = `<span class="badge ${r.window === "summer" ? "summer" : "winter"}">${displayWin}</span>`;

      const feeCls = isArrival ? "neg" : "pos";

      return `
      <tr>
        <td class="player-cell">${r.player}</td>
        <td class="align-center">${r.season || "—"}</td>
        <td class="align-center">${windowLabel}</td>
        <td>${typeLabel}</td>
        <td>${r.club || "—"}</td>
        <td class="num-cell align-right ${feeCls} text-bold">${fmtFeeDetail(r.fee)}</td>
        <td class="mono-cell align-center">${r.rights || "100%"}</td>
        <td class="num-cell align-right">${fmtValDetail(r.bonus)}</td>
        <td class="num-cell align-right">${fmtValDetail(r.commission)}</td>
        <td class="notes-cell">${state.isPt ? translateNote(r.note) || "—" : r.note || "—"}</td>
      </tr>
    `;
    })
    .join("");
}

// =============================================================
