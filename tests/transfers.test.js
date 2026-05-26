import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { state } from "../src/state.js";
import { renderTransferLedger, initTransfersDetailTable } from "../src/transfers.js";

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

    state.isPt = false;
    state.tlActiveSeason = "2025/26";
    state.tlActiveWindow = "All";

    state.TRANSFER_LEDGER = [
      {
        season: "2025/26",
        note: "Great season",
        purchases: [
          { player: "Player A", club: "Club X", fee: 10, window: "summer", rights: "100%", bonus: 2, commission: 1 }
        ],
        sales: [
          { player: "Player B", club: "Club Y", fee: 20, window: "winter", rights: "50%", bonus: 0, commission: 0 }
        ]
      }
    ];
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Summary Ledger (renderTransferLedger)", () => {
    it("should render season navigation pills", () => {
      renderTransferLedger();
      const seasonPills = document.querySelectorAll("#tlSeasonNav .season-pill");
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
      initTransfersDetailTable();
      
      const searchInput = document.getElementById("tfSearchInput");
      searchInput.value = "Player B";
      searchInput.dispatchEvent(new window.Event("input"));
      
      const rows = document.querySelectorAll("#transfersDetailTableBody tr");
      expect(rows.length).toBe(1);
      expect(rows[0].textContent).toContain("Player B");
    });

  });
});
