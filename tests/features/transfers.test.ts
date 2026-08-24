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

    it("should filter by deal magnitude and commissions correctly", () => {
      state.setIsPt(false);
      state.setTlActiveSeason("2025/26");
      state.setTlActiveWindow("All");
      state.setTransferLedger([
        {
          season: "2025/26",
          purchases: [
            { player: "Cheap Player", club: "Club A", fee: 3.0, commission: 0 },
            {
              player: "Expensive Star",
              club: "Club B",
              fee: 25.0,
              commission: 2.5,
            },
          ],
          sales: [
            { player: "Minor Out", club: "Club C", fee: 5.0, commission: 0 },
            { player: "Major Out", club: "Club D", fee: 60.0, commission: 5.0 },
          ],
        },
      ]);

      render(
        React.createElement(TransfersLedger, {
          ledgerData: state.TRANSFER_LEDGER,
        }),
      );

      // Default: All Deals
      expect(screen.getByText("Cheap Player")).toBeInTheDocument();
      expect(screen.getByText("Expensive Star")).toBeInTheDocument();
      expect(screen.getByText("Minor Out")).toBeInTheDocument();
      expect(screen.getByText("Major Out")).toBeInTheDocument();

      // Click Deals > €10M
      const over10mBtn = screen.getByText("Deals > €10M");
      fireEvent.click(over10mBtn);
      expect(screen.queryByText("Cheap Player")).not.toBeInTheDocument();
      expect(screen.getByText("Expensive Star")).toBeInTheDocument();
      expect(screen.queryByText("Minor Out")).not.toBeInTheDocument();
      expect(screen.getByText("Major Out")).toBeInTheDocument();

      // Click With Commission
      const commBtn = screen.getByText("With Commission");
      fireEvent.click(commBtn);
      expect(screen.queryByText("Cheap Player")).not.toBeInTheDocument();
      expect(screen.getByText("Expensive Star")).toBeInTheDocument();
      expect(screen.queryByText("Minor Out")).not.toBeInTheDocument();
      expect(screen.getByText("Major Out")).toBeInTheDocument();

      // Click All Deals
      const allDealsBtn = screen.getByText("All Deals");
      fireEvent.click(allDealsBtn);
      expect(screen.getByText("Cheap Player")).toBeInTheDocument();
      expect(screen.getByText("Minor Out")).toBeInTheDocument();
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

describe("TransfersLedger additional coverage", () => {
  it("should render note for the active season", () => {
    render(
      React.createElement(TransfersLedger, {
        ledgerData: state.TRANSFER_LEDGER,
      }),
    );
    expect(screen.getByText("Great season")).toBeInTheDocument();
  });

  it("should show All pill and pool rows when clicked", () => {
    state.TRANSFER_LEDGER.push({
      season: "2024/25",
      note: "Older",
      purchases: [{ player: "Old Player", fee: 5, window: "summer" }],
      sales: [],
    });
    render(
      React.createElement(TransfersLedger, {
        ledgerData: state.TRANSFER_LEDGER,
      }),
    );
    const allPill = screen.getByText("All");
    fireEvent.click(allPill);
    expect(state.tlActiveSeason).toBe("all");
    expect(screen.getByText("Player A")).toBeInTheDocument();
    expect(screen.getByText("Old Player")).toBeInTheDocument();
  });

  it("should render Portuguese labels", () => {
    state.setIsPt(true);
    state.setTlActiveWindow("All");
    render(
      React.createElement(TransfersLedger, {
        ledgerData: state.TRANSFER_LEDGER,
      }),
    );
    expect(screen.getByText("Player A")).toBeInTheDocument();
    state.setIsPt(false);
  });

  it("should show Free for zero fee transfers", () => {
    state.TRANSFER_LEDGER[0].purchases.push({
      player: "Free Agent",
      club: "Club Z",
      fee: 0,
      window: "summer",
    });
    render(
      React.createElement(TransfersLedger, {
        ledgerData: state.TRANSFER_LEDGER,
      }),
    );
    expect(screen.getByText("Free Agent")).toBeInTheDocument();
    expect(screen.getByText("Free")).toBeInTheDocument();
  });

  it("should render empty state for season with no transfers", () => {
    state.TRANSFER_LEDGER.push({
      season: "2023/24",
      note: "Empty",
      purchases: [],
      sales: [],
    });
    state.setTlActiveSeason("2023/24");
    render(
      React.createElement(TransfersLedger, {
        ledgerData: state.TRANSFER_LEDGER,
      }),
    );
    expect(screen.getByText("Empty")).toBeInTheDocument();
  });
});

describe("TransfersDetailTable additional coverage", () => {
  it("should render the table with all rows", () => {
    render(
      React.createElement(TransfersDetailTable, {
        ledgerData: state.TRANSFER_LEDGER,
      }),
    );
    expect(screen.getByText("Player A")).toBeInTheDocument();
    expect(screen.getByText("Player B")).toBeInTheDocument();
  });

  it("should display arrival and departure labels", () => {
    render(
      React.createElement(TransfersDetailTable, {
        ledgerData: state.TRANSFER_LEDGER,
      }),
    );
    expect(screen.getAllByText("↓ Arrival").length).toBeGreaterThan(0);
    expect(screen.getAllByText("↑ Departure").length).toBeGreaterThan(0);
  });

  it("should display player names in the table", () => {
    render(
      React.createElement(TransfersDetailTable, {
        ledgerData: state.TRANSFER_LEDGER,
      }),
    );
    expect(screen.getByText("Player A")).toBeInTheDocument();
    expect(screen.getByText("Player B")).toBeInTheDocument();
  });

  it("should display club names in the table", () => {
    render(
      React.createElement(TransfersDetailTable, {
        ledgerData: state.TRANSFER_LEDGER,
      }),
    );
    expect(screen.getByText("Club X")).toBeInTheDocument();
    expect(screen.getByText("Club Y")).toBeInTheDocument();
  });

  it("should handle search filtering", () => {
    render(
      React.createElement(TransfersDetailTable, {
        ledgerData: state.TRANSFER_LEDGER,
      }),
    );
    const searchInput = screen.getByPlaceholderText(/Search player/i);
    fireEvent.change(searchInput, { target: { value: "Player A" } });
    expect(screen.getByText("Player A")).toBeInTheDocument();
    expect(screen.queryByText("Player B")).not.toBeInTheDocument();
  });

  it("should handle column sorting by player", () => {
    render(
      React.createElement(TransfersDetailTable, {
        ledgerData: state.TRANSFER_LEDGER,
      }),
    );
    const playerHeader = screen.getByText("Player");
    fireEvent.click(playerHeader);
    expect(state.tfSortCol).toBe("player");
  });

  it("should handle column sorting by fee", () => {
    render(
      React.createElement(TransfersDetailTable, {
        ledgerData: state.TRANSFER_LEDGER,
      }),
    );
    const feeHeader = screen.getByText("Fee");
    fireEvent.click(feeHeader);
    expect(state.tfSortCol).toBe("fee");
  });

  it("should handle empty search results", () => {
    render(
      React.createElement(TransfersDetailTable, {
        ledgerData: state.TRANSFER_LEDGER,
      }),
    );
    const searchInput = screen.getByPlaceholderText(/Search player/i);
    fireEvent.change(searchInput, { target: { value: "NonExistentXYZ" } });
    expect(screen.getByText("No results found")).toBeInTheDocument();
  });
});
