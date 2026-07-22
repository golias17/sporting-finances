import React, { useMemo } from "react";
import { useAppState } from "../core/state.ts";
import type {
  TransferLedgerSeason,
  TransferTransaction,
} from "../core/types.ts";

function localizedNote(
  row: { note?: string; note_pt?: string },
  isPt: boolean,
): string | undefined {
  return isPt ? row.note_pt || row.note : row.note;
}

function fmtNumStr(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return n.toLocaleString("de-DE", {
    minimumFractionDigits: n % 1 !== 0 ? 2 : 0,
  });
}

function fmtFeeDetail(fee: number | null | undefined, isPt: boolean): string {
  if (fee === null || fee === undefined) return "—";
  if (fee === 0) return isPt ? "Custo Zero" : "Free";
  return `€${fmtNumStr(fee)}M`;
}

function fmtValDetail(val: number | null | undefined): string {
  if (val === null || val === undefined || val === 0) return "—";
  return `€${fmtNumStr(val)}M`;
}

type ExtendedTransfer = TransferTransaction & {
  season: string;
  type: string;
  typeCls: string;
  typeText: string;
};

export function TransfersDetailTable({
  ledgerData,
}: {
  ledgerData: TransferLedgerSeason[];
}) {
  const isPt = useAppState((s) => s.isPt);
  const activeSeason = useAppState((s) => s.tfActiveSeason);
  const setActiveSeason = useAppState((s) => s.setTfActiveSeason);
  const activeWindow = useAppState((s) => s.tfActiveWindow);
  const setActiveWindow = useAppState((s) => s.setTfActiveWindow);
  const activeType = useAppState((s) => s.tfActiveType);
  const setActiveType = useAppState((s) => s.setTfActiveType);
  const query = useAppState((s) => s.tfQuery);
  const setQuery = useAppState((s) => s.setTfQuery);
  const sortCol = useAppState((s) => s.tfSortCol);
  const setSortCol = useAppState((s) => s.setTfSortCol);
  const sortDir = useAppState((s) => s.tfSortDir);
  const setSortDir = useAppState((s) => s.setTfSortDir);

  const rows = useMemo(() => {
    let result: ExtendedTransfer[] = [];

    if (activeSeason === "all") {
      ledgerData.forEach((s) => {
        if (activeType === "all" || activeType === "in") {
          s.purchases.forEach((p) => {
            result.push({
              ...p,
              season: s.season,
              type: "Arrival",
              typeCls: "rights",
              typeText: isPt ? "↓ Entrada" : "↓ Arrival",
            });
          });
        }
        if (activeType === "all" || activeType === "out") {
          s.sales.forEach((p) => {
            result.push({
              ...p,
              season: s.season,
              type: "Departure",
              typeCls: "comm",
              typeText: isPt ? "↑ Saída" : "↑ Departure",
            });
          });
        }
      });
    } else {
      const s = ledgerData.find((x) => x.season === activeSeason);
      if (s) {
        if (activeType === "all" || activeType === "in") {
          s.purchases.forEach((p) => {
            result.push({
              ...p,
              season: s.season,
              type: "Arrival",
              typeCls: "rights",
              typeText: isPt ? "↓ Entrada" : "↓ Arrival",
            });
          });
        }
        if (activeType === "all" || activeType === "out") {
          s.sales.forEach((p) => {
            result.push({
              ...p,
              season: s.season,
              type: "Departure",
              typeCls: "comm",
              typeText: isPt ? "↑ Saída" : "↑ Departure",
            });
          });
        }
      }
    }

    if (activeWindow !== "all") {
      result = result.filter((r) => r.window === activeWindow);
    }

    if (query) {
      const q = query.toLowerCase();
      result = result.filter((r) => {
        const note = localizedNote(r, isPt);
        return (
          r.player.toLowerCase().includes(q) ||
          (r.club && r.club.toLowerCase().includes(q)) ||
          (note && note.toLowerCase().includes(q))
        );
      });
    }

    if (sortCol) {
      result.sort((a: any, b: any) => {
        let valA = a[sortCol];
        let valB = b[sortCol];

        if (valA === undefined || valA === null) valA = "";
        if (valB === undefined || valB === null) valB = "";

        if (["fee", "bonus", "commission"].includes(sortCol)) {
          const numA = typeof valA === "number" ? valA : 0;
          const numB = typeof valB === "number" ? valB : 0;
          return sortDir === "asc" ? numA - numB : numB - numA;
        }

        if (sortCol === "rights") {
          const parseRights = (r: string) => {
            if (!r) return 100;
            const match = r.match(/(\d+(?:\.\d+)?)/);
            return match ? parseFloat(match[1]) : 100;
          };
          const numA = parseRights(valA);
          const numB = parseRights(valB);
          return sortDir === "asc" ? numA - numB : numB - numA;
        }

        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();
        if (strA < strB) return sortDir === "asc" ? -1 : 1;
        if (strA > strB) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [
    ledgerData,
    activeSeason,
    activeWindow,
    activeType,
    query,
    sortCol,
    sortDir,
    isPt,
  ]);

  const handleSort = (key: string) => {
    if (sortCol === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortCol(key);
      setSortDir(["fee", "bonus", "commission"].includes(key) ? "desc" : "asc");
    }
  };

  const headers = [
    { key: "player", labelEn: "Player", labelPt: "Jogador" },
    { key: "season", labelEn: "Season", labelPt: "Época" },
    { key: "window", labelEn: "Window", labelPt: "Janela" },
    { key: "type", labelEn: "Type", labelPt: "Tipo" },
    { key: "club", labelEn: "Club", labelPt: "Clube" },
    { key: "fee", labelEn: "Fee", labelPt: "Fixo" },
    { key: "rights", labelEn: "Rights", labelPt: "Passe" },
    { key: "bonus", labelEn: "Bonus", labelPt: "Bónus" },
    { key: "commission", labelEn: "Comm.", labelPt: "Comissão" },
    { key: "note", labelEn: "Notes", labelPt: "Notas" },
  ];

  return (
    <>
      <div className="ledger-controls">
        <div className="ledger-control-group">
          <label className="ledger-label" htmlFor="seasonFilter">Season:</label>
          <select
            id="seasonFilter"
            className="ledger-select"
            value={activeSeason}
            onChange={(e) => setActiveSeason(e.target.value)}
          >
            <option value="all">
              {isPt ? "Todas as Épocas" : "All Seasons"}
            </option>
            {ledgerData.map((s) => (
              <option key={s.season} value={s.season}>
                {s.season}
              </option>
            ))}
          </select>
        </div>
        <div className="ledger-control-group">
          <label className="ledger-label" htmlFor="windowFilter">Window:</label>
          <select
            id="windowFilter"
            className="ledger-select"
            value={activeWindow}
            onChange={(e) => setActiveWindow(e.target.value)}
          >
            <option value="all">All Windows</option>
            <option value="summer">Summer Window</option>
            <option value="winter">Winter Window</option>
          </select>
        </div>
        <div className="ledger-control-group">
          <label className="ledger-label" htmlFor="typeFilter">Type:</label>
          <select
            id="typeFilter"
            className="ledger-select"
            value={activeType}
            onChange={(e) => setActiveType(e.target.value)}
          >
            <option value="all">All Transfers</option>
            <option value="in">Arrivals</option>
            <option value="out">Departures</option>
          </select>
        </div>
        <div className="ledger-control-group ledger-control-group--grow">
          <label className="sr-only" htmlFor="searchInput">Search transfers</label>
          <input
            id="searchInput"
            className="ledger-input"
            type="text"
            placeholder="Search player, club, or notes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="scroll-x">
        <table className="ledger">
          <thead>
            <tr>
              {headers.map((h) => (
                <th
                  key={h.key}
                  className={
                    sortCol === h.key
                      ? "sortable-header sorted"
                      : "sortable-header"
                  }
                  onClick={() => handleSort(h.key)}
                >
                  {isPt ? h.labelPt : h.labelEn}
                  {sortCol === h.key && (
                    <span className="sort-indicator">
                      {sortDir === "asc" ? " ▲" : " ▼"}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={10} className="ledger-empty-cell">
                  <div className="ledger-empty-container">
                    <h4 className="ledger-empty-title">
                      {isPt
                        ? "Nenhum resultado encontrado"
                        : "No results found"}
                    </h4>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((r, idx) => {
                const isArrival = r.type === "Arrival";
                let displayWin = "—";
                if (r.window === "summer")
                  displayWin = isPt ? "Verão" : "Summer";
                else if (r.window === "winter")
                  displayWin = isPt ? "Inverno" : "Winter";

                return (
                  <tr key={`${r.player}-${idx}`}>
                    <td className="player-cell">{r.player}</td>
                    <td className="align-center">{r.season || "—"}</td>
                    <td className="align-center">
                      <span
                        className={`badge ${r.window === "summer" ? "summer" : "winter"}`}
                      >
                        {displayWin}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${isArrival ? "arrival" : "departure"}`}
                      >
                        {r.typeText}
                      </span>
                    </td>
                    <td>{r.club ? r.club : "—"}</td>
                    <td
                      className={`num-cell align-right ${isArrival ? "neg" : "pos"} text-bold`}
                    >
                      {fmtFeeDetail(r.fee, isPt)}
                    </td>
                    <td className="mono-cell align-center">
                      {r.rights || "100%"}
                    </td>
                    <td className="num-cell align-right">
                      {fmtValDetail(r.bonus)}
                    </td>
                    <td className="num-cell align-right">
                      {fmtValDetail(r.commission)}
                    </td>
                    <td className="notes-cell">
                      {localizedNote(r, isPt) || "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="ledger-footer-note">
        <strong>Note:</strong>
        <span className="tf-season-tag">
          {activeSeason === "all"
            ? isPt
              ? "Todas as Épocas"
              : "All Seasons"
            : activeSeason}
        </span>
        <span>
          {" "}
          figures do not include undisclosed agent fees, solidarity payments, or
          training compensation.
        </span>
      </div>
    </>
  );
}
