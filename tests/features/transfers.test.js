import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { state } from "../../src/core/state.js";
import {
  renderTransferLedger,
  initTransfersDetailTable,
} from "../../src/features/transfers.js";

describe("transfers.js", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="tlSeasonNav"></div>
      <div id="tlWindowNav"></div>
      <div id="tlBody"></div>

      <select id="tfSeasonSelect"></select>
      <select id="tfWindowSelect"></select>
      <select id="tfTypeSelect">
        <option value="all">All</option>
        <option value="in">Arrivals</option>
        <option value="out">Departures</option>
      </select>
      <input id="tfSearchInput" type="text" />
      <span id="transfersTableSeasonTag"></span>
      <table id="transfersDetailTable">
        <thead>
          <tr>
            <th>Player</th>
            <th>Season</th>
            <th>Window</th>
            <th>Type</th>
            <th>Club</th>
            <th>Fee</th>
            <th>Rights</th>
            <th>Bonus</th>
            <th>Commission</th>
            <th>Note</th>
          </tr>
        </thead>
        <tbody id="transfersDetailTableBody"></tbody>
      </table>
    `;

    state.setIsPt(false);
    state.setTlActiveSeason("2025/26");
    state.setTlActiveWindow("All");

    // Reset transfer detail table filter state
    state.setTfActiveSeason("2025/26");
    state.setTfActiveType("all");
    state.setTfActiveWindow("all");
    state.setTfQuery("");
    state.setTfSortCol(null);
    state.setTfSortDir("asc");

    state.setTransferLedger([
      {
        season: "2025/26",
        note: "Great season",
        purchases: [
          {
            player: "Player A",
            club: "Club X",
            fee: 10,
            window: "summer",
            rights: "100%",
            bonus: 2,
            commission: 1,
          },
        ],
        sales: [
          {
            player: "Player B",
            club: "Club Y",
            fee: 20,
            window: "winter",
            rights: "50%",
            bonus: 0,
            commission: 0,
          },
        ],
      },
    ]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Summary Ledger (renderTransferLedger)", () => {
    it("should render season navigation pills", () => {
      renderTransferLedger();
      const seasonPills = document.querySelectorAll(
        "#tlSeasonNav .season-pill",
      );
      expect(seasonPills.length).toBe(1);
      expect(seasonPills[0].textContent).toBe("2025/26");
      expect(seasonPills[0].classList.contains("active")).toBe(true);
    });

    it("should render purchases and sales correctly in the body", () => {
      renderTransferLedger();
      const body = document.getElementById("tlBody").innerHTML;
      expect(body).toContain("Player A");
      expect(body).toContain("Player B");
      expect(body).toContain("Club X");
      expect(body).toContain("Club Y");

      // Values are formatted
      expect(body).toContain("€10M");
      expect(body).toContain("€20M");
    });

    it("should switch active season and re-render when a season pill is clicked", () => {
      state.TRANSFER_LEDGER.push({
        season: "2024/25",
        note: "Older season",
        purchases: [],
        sales: [],
      });

      renderTransferLedger();
      const pills = document.querySelectorAll("#tlSeasonNav .season-pill");
      const olderPill = [...pills].find((p) => p.textContent === "2024/25");

      olderPill.click();

      expect(state.tlActiveSeason).toBe("2024/25");
      const activePill = document.querySelector(
        "#tlSeasonNav .season-pill.active",
      );
      expect(activePill.textContent).toBe("2024/25");
    });

    it("should switch active window and re-render when a window pill is clicked", () => {
      renderTransferLedger();
      const summerPill = document.querySelector(
        '#tlWindowNav [data-tl-window="summer"]',
      );

      summerPill.click();

      // renderTransferLedger() rebuilds #tlWindowNav's innerHTML on click, so
      // the original summerPill node is now detached — re-query the fresh one.
      const refreshedSummerPill = document.querySelector(
        '#tlWindowNav [data-tl-window="summer"]',
      );
      expect(state.tlActiveWindow).toBe("summer");
      expect(refreshedSummerPill.classList.contains("active")).toBe(true);

      const body = document.getElementById("tlBody").innerHTML;
      // Only the summer purchase (Player A) should remain; the winter sale
      // (Player B) is filtered out.
      expect(body).toContain("Player A");
      expect(body).not.toContain("Player B");
    });

    it("should filter the ledger body by window and mark free transfers", () => {
      state.TRANSFER_LEDGER[0].purchases.push({
        player: "Player Free",
        club: "Club Z",
        fee: 0,
        window: "winter",
      });
      state.setTlActiveWindow("winter");

      renderTransferLedger();
      const body = document.getElementById("tlBody").innerHTML;

      expect(body).toContain("Player Free");
      expect(body).toContain("Free");
      expect(body).not.toContain("Player A"); // summer purchase filtered out
    });

    it("does nothing (no throw) when the active season is missing from the ledger", () => {
      state.setTlActiveSeason("not-a-real-season");
      expect(() => renderTransferLedger()).not.toThrow();
      expect(document.getElementById("tlBody").innerHTML).toBe("");
    });
  });

  describe("Detail Table (initTransfersDetailTable)", () => {
    it("should initialize dropdowns and populate table", () => {
      initTransfersDetailTable();

      const select = document.getElementById("tfSeasonSelect");
      expect(select.options.length).toBe(2); // "All Seasons" + "2025/26"

      const rows = document.querySelectorAll("#transfersDetailTableBody tr");
      expect(rows.length).toBe(2); // 1 purchase + 1 sale

      // First row should be Player A (since it's a purchase and purchases come first in "all" logic)
      expect(rows[0].textContent).toContain("Player A");
      expect(rows[0].textContent).toContain("Arrival");
      expect(rows[1].textContent).toContain("Player B");
      expect(rows[1].textContent).toContain("Departure");
    });

    it("should filter the detail table when search input changes", () => {
      // The search box's re-render is debounced (see transfers.js) so typing
      // a name doesn't rebuild the whole table on every keystroke — advance
      // fake timers past the debounce delay to let it fire.
      vi.useFakeTimers();
      initTransfersDetailTable();

      const searchInput = document.getElementById("tfSearchInput");
      searchInput.value = "Player B";
      searchInput.dispatchEvent(new window.Event("input"));
      vi.runAllTimers();
      vi.useRealTimers();

      const rows = document.querySelectorAll("#transfersDetailTableBody tr");
      expect(rows.length).toBe(1);
      expect(rows[0].textContent).toContain("Player B");
    });

    it("updates state.tfQuery synchronously even though the re-render is debounced", () => {
      vi.useFakeTimers();
      initTransfersDetailTable();

      const searchInput = document.getElementById("tfSearchInput");
      searchInput.value = "Player B";
      searchInput.dispatchEvent(new window.Event("input"));

      // No timers advanced yet — the query itself should already be set...
      expect(state.tfQuery).toBe("player b");
      // ...but the table hasn't re-rendered around it yet.
      expect(
        document.querySelectorAll("#transfersDetailTableBody tr").length,
      ).toBeGreaterThan(1);

      vi.runAllTimers();
      vi.useRealTimers();
      expect(
        document.querySelectorAll("#transfersDetailTableBody tr").length,
      ).toBe(1);
    });

    it("should sort the table columns when headers are clicked", () => {
      initTransfersDetailTable();

      const headers = document.querySelectorAll("#transfersDetailTable th");
      const playerHeader = headers[0]; // Player column

      // Click to sort by player
      playerHeader.click();
      expect(state.tfSortCol).toBe("player");
      expect(state.tfSortDir).toBe("asc");

      // Verify the sort-indicator was added
      const indicator = playerHeader.querySelector(".sort-indicator");
      expect(indicator).not.toBeNull();
      expect(indicator.textContent).toContain("▲");

      // Click again to toggle direction
      playerHeader.click();
      expect(state.tfSortDir).toBe("desc");
      expect(
        playerHeader.querySelector(".sort-indicator").textContent,
      ).toContain("▼");
    });

    it("should render empty state message when search has zero matches", () => {
      vi.useFakeTimers();
      initTransfersDetailTable();

      const searchInput = document.getElementById("tfSearchInput");
      searchInput.value = "NonExistentPlayerXYZ";
      searchInput.dispatchEvent(new window.Event("input"));
      vi.runAllTimers();
      vi.useRealTimers();

      const rows = document.querySelectorAll("#transfersDetailTableBody tr");
      expect(rows.length).toBe(1);
      expect(rows[0].textContent).toContain("No results found");
    });

    it("should sort correctly by numeric columns and rights percentages", () => {
      // Add custom items with varying numeric values
      state.TRANSFER_LEDGER[0].purchases = [
        {
          player: "Player A",
          fee: 10,
          bonus: 2,
          commission: 1,
          window: "summer",
          rights: "100%",
        },
        {
          player: "Player C",
          fee: 5,
          bonus: 4,
          commission: 0.5,
          window: "summer",
          rights: "80%",
        },
      ];
      state.TRANSFER_LEDGER[0].sales = [
        {
          player: "Player B",
          fee: 20,
          bonus: 0,
          commission: 0,
          window: "winter",
          rights: "50%",
        },
      ];

      initTransfersDetailTable();
      const headers = document.querySelectorAll("#transfersDetailTable th");

      const feeHeader = headers[5]; // Fee column
      const rightsHeader = headers[6]; // Rights column

      // 1. Sort by fee (descending initially since it is numeric)
      feeHeader.click();
      expect(state.tfSortCol).toBe("fee");
      expect(state.tfSortDir).toBe("desc");

      let rows = document.querySelectorAll("#transfersDetailTableBody tr");
      expect(rows[0].textContent).toContain("Player B"); // 20M
      expect(rows[1].textContent).toContain("Player A"); // 10M
      expect(rows[2].textContent).toContain("Player C"); // 5M

      // Toggle fee to ascending
      feeHeader.click();
      expect(state.tfSortDir).toBe("asc");
      rows = document.querySelectorAll("#transfersDetailTableBody tr");
      expect(rows[0].textContent).toContain("Player C"); // 5M
      expect(rows[1].textContent).toContain("Player A"); // 10M
      expect(rows[2].textContent).toContain("Player B"); // 20M

      // 2. Sort by rights percentage (custom parser)
      rightsHeader.click();
      expect(state.tfSortCol).toBe("rights");
      expect(state.tfSortDir).toBe("asc");
      rows = document.querySelectorAll("#transfersDetailTableBody tr");
      expect(rows[0].textContent).toContain("Player B"); // 50%
      expect(rows[1].textContent).toContain("Player C"); // 80%
      expect(rows[2].textContent).toContain("Player A"); // 100%
    });

    it("should display error message when season is not found in ledger", () => {
      state.setTfActiveSeason("invalid-season");
      initTransfersDetailTable();
      const body = document.getElementById("transfersDetailTableBody");
      expect(body.textContent).toContain("Season not found");

      state.setIsPt(true);
      initTransfersDetailTable();
      expect(body.textContent).toContain("Época não encontrada");
    });

    it("should filter transfer rows by winter/summer window", () => {
      state.setTfActiveWindow("winter");
      initTransfersDetailTable();
      const rows = document.querySelectorAll("#transfersDetailTableBody tr");
      expect(rows.length).toBe(1);
      expect(rows[0].textContent).toContain("Player B"); // only winter sale
    });

    it("initTransfersDetailTable is a no-op when the season select is missing", () => {
      document.getElementById("tfSeasonSelect").remove();
      expect(() => initTransfersDetailTable()).not.toThrow();
      // A genuine early return: no listeners get wired on the other
      // controls, so the table body is never populated and a change on a
      // still-present control (e.g. the type select) has no effect.
      expect(
        document.getElementById("transfersDetailTableBody").innerHTML,
      ).toBe("");
      const typeSelect = document.getElementById("tfTypeSelect");
      typeSelect.value = "in";
      typeSelect.dispatchEvent(new window.Event("change"));
      expect(state.tfActiveType).toBe("all"); // unchanged — no listener wired
    });

    it("re-renders when the season, window, and type dropdowns change", () => {
      document.getElementById("tfWindowSelect").innerHTML = `
        <option value="all">All</option>
        <option value="winter">Winter</option>
      `;
      state.TRANSFER_LEDGER.push({
        season: "2024/25",
        note: "",
        purchases: [{ player: "Old Signing", fee: 3, window: "summer" }],
        sales: [],
      });

      initTransfersDetailTable();

      const seasonSelect = document.getElementById("tfSeasonSelect");
      seasonSelect.value = "2024/25";
      seasonSelect.dispatchEvent(new window.Event("change"));
      expect(state.tfActiveSeason).toBe("2024/25");
      expect(
        document.getElementById("transfersDetailTableBody").textContent,
      ).toContain("Old Signing");

      const windowSelect = document.getElementById("tfWindowSelect");
      windowSelect.value = "winter";
      windowSelect.dispatchEvent(new window.Event("change"));
      expect(state.tfActiveWindow).toBe("winter");

      const typeSelect = document.getElementById("tfTypeSelect");
      typeSelect.value = "out";
      typeSelect.dispatchEvent(new window.Event("change"));
      expect(state.tfActiveType).toBe("out");
    });

    it("renders nothing when the table body container is missing", () => {
      document.getElementById("transfersDetailTableBody").remove();
      expect(() => initTransfersDetailTable()).not.toThrow();
      // The missing container only short-circuits the render step
      // (renderTransfersDetailTable's own `if (!container) return`) — the
      // rest of init still runs safely, e.g. the season dropdown is still
      // populated from the ledger.
      const select = document.getElementById("tfSeasonSelect");
      expect(select.options.length).toBe(2); // "All Seasons" + "2025/26"
    });

    it("shows the 'All Seasons' tag and pools rows from every season when tfActiveSeason is 'all'", () => {
      state.TRANSFER_LEDGER.push({
        season: "2024/25",
        note: "",
        purchases: [{ player: "Old Signing", fee: 3, window: "summer" }],
        sales: [{ player: "Old Departure", fee: 7, window: "summer" }],
      });
      state.setTfActiveSeason("all");

      initTransfersDetailTable();

      const tag = document.getElementById("transfersTableSeasonTag");
      expect(tag.textContent).toBe("All Seasons");

      const body = document.getElementById("transfersDetailTableBody");
      expect(body.textContent).toContain("Player A");
      expect(body.textContent).toContain("Player B");
      expect(body.textContent).toContain("Old Signing");
      expect(body.textContent).toContain("Old Departure");
    });

    it("defaults missing sort values and 100% rights, and orders descending string columns", () => {
      state.TRANSFER_LEDGER[0].purchases = [
        { player: "Zeta", club: "Club X", fee: 10, window: "summer" }, // no `rights`, no `bonus`
        {
          player: "Alpha",
          club: "Club Y",
          fee: 15,
          window: "summer",
          rights: "80%",
        },
      ];
      state.TRANSFER_LEDGER[0].sales = [];

      initTransfersDetailTable();
      const headers = document.querySelectorAll("#transfersDetailTable th");

      // Sort by rights: "Zeta" has no rights (defaults to 100), "Alpha" has 80.
      headers[6].click(); // Rights column, ascending
      let rows = document.querySelectorAll("#transfersDetailTableBody tr");
      expect(rows[0].textContent).toContain("Alpha"); // 80 < 100
      expect(rows[1].textContent).toContain("Zeta");
      expect(rows[0].querySelector(".mono-cell").textContent).toBe("80%");
      expect(rows[1].querySelector(".mono-cell").textContent).toBe("100%");

      // Sort by player descending (string comparison strA > strB path)
      const playerHeader = headers[0];
      playerHeader.click(); // asc
      playerHeader.click(); // desc
      rows = document.querySelectorAll("#transfersDetailTableBody tr");
      expect(rows[0].textContent).toContain("Zeta");
      expect(rows[1].textContent).toContain("Alpha");
    });

    it("shows 'Free' for zero-fee rows in the detail table", () => {
      state.TRANSFER_LEDGER[0].purchases = [
        { player: "Free Signing", club: "Club Z", fee: 0, window: "summer" },
      ];
      state.TRANSFER_LEDGER[0].sales = [];

      initTransfersDetailTable();
      const body = document.getElementById("transfersDetailTableBody");
      expect(body.textContent).toContain("Free");
    });

    it("should handle identical values when sorting string columns", () => {
      state.TRANSFER_LEDGER[0].purchases = [
        {
          player: "Player A",
          club: "Club Y",
          fee: 10,
          window: "summer",
        },
        {
          player: "Player A",
          club: "Club X",
          fee: 15,
          window: "summer",
        },
      ];
      state.TRANSFER_LEDGER[0].sales = [];
      initTransfersDetailTable();

      const headers = document.querySelectorAll("#transfersDetailTable th");
      const playerHeader = headers[0]; // Player column

      playerHeader.click();
      expect(state.tfSortCol).toBe("player");

      const rows = document.querySelectorAll("#transfersDetailTableBody tr");
      expect(rows.length).toBe(2);
    });
  });
});
