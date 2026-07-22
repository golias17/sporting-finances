import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { state } from "../../src/core/state.ts";
import { TransfersLedger } from "../../src/features/TransfersLedger.tsx";
import { TransfersDetailTable } from "../../src/features/TransfersDetailTable.tsx";

describe("transfers.test.ts", () => {
  beforeEach(() => {
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

  describe("Summary Ledger (TransfersLedger)", () => {
    it("should render season navigation pills", () => {
      render(
        React.createElement(TransfersLedger, {
          ledgerData: state.TRANSFER_LEDGER,
        }),
      );
      const seasonPills = screen.getAllByRole("button", { pressed: true });
      expect(
        seasonPills.find((p) => p.textContent === "2025/26"),
      ).toBeInTheDocument();
    });

    it("should render purchases and sales correctly in the body", () => {
      render(
        React.createElement(TransfersLedger, {
          ledgerData: state.TRANSFER_LEDGER,
        }),
      );
      expect(screen.getByText("Player A")).toBeInTheDocument();
      expect(screen.getByText("Player B")).toBeInTheDocument();
      expect(screen.getByText("Club X")).toBeInTheDocument();
      expect(screen.getByText("Club Y")).toBeInTheDocument();
      expect(screen.getAllByText("€10M").length).toBeGreaterThan(0);
      expect(screen.getAllByText("€20M").length).toBeGreaterThan(0);
    });

    it("should switch active season and re-render when a season pill is clicked", () => {
      state.TRANSFER_LEDGER.push({
        season: "2024/25",
        note: "Older season",
        purchases: [],
        sales: [],
      });
      render(
        React.createElement(TransfersLedger, {
          ledgerData: state.TRANSFER_LEDGER,
        }),
      );
      const olderPill = screen.getByText("2024/25");
      fireEvent.click(olderPill);
      expect(state.tlActiveSeason).toBe("2024/25");
      expect(olderPill).toHaveAttribute("aria-pressed", "true");
    });

    it("should switch active window and re-render when a window pill is clicked", () => {
      render(
        React.createElement(TransfersLedger, {
          ledgerData: state.TRANSFER_LEDGER,
        }),
      );
      const summerPill = screen.getByText("Summer Window");
      fireEvent.click(summerPill);
      expect(state.tlActiveWindow).toBe("summer");
      expect(summerPill).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByText("Player A")).toBeInTheDocument();
      expect(screen.queryByText("Player B")).not.toBeInTheDocument();
    });

    it("should filter the ledger body by window and mark free transfers", () => {
      state.TRANSFER_LEDGER[0].purchases.push({
        player: "Player Free",
        club: "Club Z",
        fee: 0,
        window: "winter",
      });
      state.setTlActiveWindow("winter");
      render(
        React.createElement(TransfersLedger, {
          ledgerData: state.TRANSFER_LEDGER,
        }),
      );
      expect(screen.getByText("Player Free")).toBeInTheDocument();
      expect(screen.getByText("Free")).toBeInTheDocument();
      expect(screen.queryByText("Player A")).not.toBeInTheDocument();
    });
  });

  describe("Detail Table (TransfersDetailTable)", () => {
    it("should initialize dropdowns and populate table", () => {
      render(
        React.createElement(TransfersDetailTable, {
          ledgerData: state.TRANSFER_LEDGER,
        }),
      );
      expect(screen.getByText("Player A")).toBeInTheDocument();
      expect(screen.getAllByText("↓ Arrival")[0]).toBeInTheDocument();
      expect(screen.getByText("Player B")).toBeInTheDocument();
      expect(screen.getAllByText("↑ Departure")[0]).toBeInTheDocument();
    });

    it("should filter the detail table when search input changes", () => {
      render(
        React.createElement(TransfersDetailTable, {
          ledgerData: state.TRANSFER_LEDGER,
        }),
      );
      const searchInput = screen.getByPlaceholderText(/Search player/i);
      fireEvent.change(searchInput, { target: { value: "Player B" } });

      expect(screen.getByText("Player B")).toBeInTheDocument();
      expect(screen.queryByText("Player A")).not.toBeInTheDocument();
    });

    it("should sort the table columns when headers are clicked", () => {
      render(
        React.createElement(TransfersDetailTable, {
          ledgerData: state.TRANSFER_LEDGER,
        }),
      );
      const playerHeader = screen.getByText("Player");

      fireEvent.click(playerHeader);
      expect(state.tfSortCol).toBe("player");
      expect(state.tfSortDir).toBe("asc");

      fireEvent.click(playerHeader);
      expect(state.tfSortDir).toBe("desc");
    });

    it("should render empty state message when search has zero matches", () => {
      render(
        React.createElement(TransfersDetailTable, {
          ledgerData: state.TRANSFER_LEDGER,
        }),
      );
      const searchInput = screen.getByPlaceholderText(/Search player/i);
      fireEvent.change(searchInput, {
        target: { value: "NonExistentPlayerXYZ" },
      });
      expect(screen.getByText("No results found")).toBeInTheDocument();
    });

    it("should sort correctly by numeric columns and rights percentages", () => {
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

      render(
        React.createElement(TransfersDetailTable, {
          ledgerData: state.TRANSFER_LEDGER,
        }),
      );
      const feeHeader = screen.getByText("Fee");

      fireEvent.click(feeHeader);
      expect(state.tfSortCol).toBe("fee");
      expect(state.tfSortDir).toBe("desc");

      let rows = screen.getAllByRole("row").slice(1);
      expect(rows[0]).toHaveTextContent("Player B");
      expect(rows[1]).toHaveTextContent("Player A");
      expect(rows[2]).toHaveTextContent("Player C");

      fireEvent.click(feeHeader);
      expect(state.tfSortDir).toBe("asc");
      rows = screen.getAllByRole("row").slice(1);
      expect(rows[0]).toHaveTextContent("Player C");
      expect(rows[1]).toHaveTextContent("Player A");
      expect(rows[2]).toHaveTextContent("Player B");
    });

    it("shows the 'All Seasons' tag and pools rows from every season when tfActiveSeason is 'all'", () => {
      state.TRANSFER_LEDGER.push({
        season: "2024/25",
        note: "",
        purchases: [{ player: "Old Signing", fee: 3, window: "summer" }],
        sales: [{ player: "Old Departure", fee: 7, window: "summer" }],
      });
      state.setTfActiveSeason("all");

      render(
        React.createElement(TransfersDetailTable, {
          ledgerData: state.TRANSFER_LEDGER,
        }),
      );

      expect(screen.getAllByText("All Seasons")[0]).toBeInTheDocument();
      expect(screen.getByText("Player A")).toBeInTheDocument();
      expect(screen.getByText("Player B")).toBeInTheDocument();
      expect(screen.getByText("Old Signing")).toBeInTheDocument();
      expect(screen.getByText("Old Departure")).toBeInTheDocument();
    });
  });
});
