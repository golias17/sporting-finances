import React, { useMemo } from "react";
import { useAppState } from "../core/state.ts";
import { exportToCsv } from "../utils/exportCsv.js";
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
            let realizedFee = p.fee || 0;
            let realizedComm = p.commission || 0;
            let remainingBonus = p.bonus || 0;
            if (p.timeline) {
               p.timeline.forEach(e => {
                  if (e.type === "bonus") {
                      realizedFee += e.amount;
                      remainingBonus = Math.max(0, remainingBonus - e.amount);
                  }
                  if (e.type === "commission" || e.type === "other") realizedComm += e.amount;
               });
            }
            result.push({
              ...p,
              fee: realizedFee,
              bonus: remainingBonus > 0 ? remainingBonus : undefined,
              commission: realizedComm,
              season: s.season,
              type: "Arrival",
              typeCls: "rights",
              typeText: isPt ? "↓ Entrada" : "↓ Arrival",
            });
          });
        }
        if (activeType === "all" || activeType === "out") {
          s.sales.forEach((p) => {
            let realizedFee = p.fee || 0;
            let realizedComm = p.commission || 0;
            let remainingBonus = p.bonus || 0;
            if (p.timeline) {
               p.timeline.forEach(e => {
                  if (e.type === "bonus") {
                      realizedFee += e.amount;
                      remainingBonus = Math.max(0, remainingBonus - e.amount);
                  }
                  if (e.type === "commission" || e.type === "other") realizedComm += e.amount;
               });
            }
            result.push({
              ...p,
              fee: realizedFee,
              bonus: remainingBonus > 0 ? remainingBonus : undefined,
              commission: realizedComm,
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
            let realizedFee = p.fee || 0;
            let realizedComm = p.commission || 0;
            let remainingBonus = p.bonus || 0;
            if (p.timeline) {
               p.timeline.forEach(e => {
                  if (e.type === "bonus") {
                      realizedFee += e.amount;
                      remainingBonus = Math.max(0, remainingBonus - e.amount);
                  }
                  if (e.type === "commission" || e.type === "other") realizedComm += e.amount;
               });
            }
            result.push({
              ...p,
              fee: realizedFee,
              bonus: remainingBonus > 0 ? remainingBonus : undefined,
              commission: realizedComm,
              season: s.season,
              type: "Arrival",
              typeCls: "rights",
              typeText: isPt ? "↓ Entrada" : "↓ Arrival",
            });
          });
        }
        if (activeType === "all" || activeType === "out") {
          s.sales.forEach((p) => {
            let realizedFee = p.fee || 0;
            let realizedComm = p.commission || 0;
            let remainingBonus = p.bonus || 0;
            if (p.timeline) {
               p.timeline.forEach(e => {
                  if (e.type === "bonus") {
                      realizedFee += e.amount;
                      remainingBonus = Math.max(0, remainingBonus - e.amount);
                  }
                  if (e.type === "commission" || e.type === "other") realizedComm += e.amount;
               });
            }
            result.push({
              ...p,
              fee: realizedFee,
              bonus: remainingBonus > 0 ? remainingBonus : undefined,
              commission: realizedComm,
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
      result.sort((a: { date?: string; season?: string }, b: { date?: string; season?: string }) => {
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
        <div className="ledger-control-group">
          <button
            className="story-btn btn-small"
            onClick={() => {
              const delimiter = isPt ? ";" : ",";
              const headers = [
                isPt ? "Jogador" : "Player",
                isPt ? "Época" : "Season",
                isPt ? "Janela" : "Window",
                isPt ? "Tipo" : "Type",
                isPt ? "Clube" : "Club",
                isPt ? "Fixo (€M)" : "Fee (€M)",
                isPt ? "Passe" : "Rights",
                isPt ? "Bónus (€M)" : "Bonus (€M)",
                isPt ? "Comissão (€M)" : "Commission (€M)",
                isPt ? "Notas" : "Notes",
              ];
              const formatVal = (val: number | null | undefined) => {
                if (val === null || val === undefined) return "—";
                if (val === 0) return isPt ? "Custo Zero" : "Free";
                return val.toFixed(2).replace(/\.00$/, "");
              };

              const csvRows = rows.map((r) => {
                let winText = "—";
                if (r.window === "summer") winText = isPt ? "Verão" : "Summer";
                else if (r.window === "winter") winText = isPt ? "Inverno" : "Winter";

                const typeClean = r.type === "Arrival"
                  ? (isPt ? "Entrada" : "Arrival")
                  : (isPt ? "Saída" : "Departure");

                return [
                  r.player,
                  r.season,
                  winText,
                  typeClean,
                  r.club || "—",
                  formatVal(r.fee),
                  r.rights || "100%",
                  formatVal(r.bonus),
                  formatVal(r.commission),
                  localizedNote(r, isPt) ?? "—",
                ];
              });

              exportToCsv("sporting_transfers_ledger.csv", headers, csvRows, {
                delimiter,
              });
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="icon-small"
              aria-hidden="true"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>{isPt ? "Exportar CSV" : "Export CSV"}</span>
          </button>
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

      <div
        className="ledger-footer-note"
        style={{
          marginTop: "1.25rem",
          padding: "0.85rem 1.15rem",
          borderRadius: "10px",
          background: "var(--surface-soft, rgba(255, 255, 255, 0.03))",
          borderLeft: "3px solid var(--green)",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          color: "var(--muted)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "var(--fs-xs)", fontWeight: 600, color: "var(--ink)" }}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--green)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0 }}
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span>{isPt ? "Nota" : "Note"}</span>
          <span style={{ color: "var(--muted)", fontWeight: 400 }}>·</span>
          <span
            className="tf-season-tag"
            style={{
              padding: "0.1rem 0.45rem",
              borderRadius: "4px",
              background: "rgba(46, 158, 108, 0.12)",
              color: "var(--green-light, #2e9e6c)",
              fontWeight: 600,
              fontSize: "var(--fs-2xs)",
            }}
          >
            {activeSeason === "all"
              ? isPt
                ? "Todas as Épocas"
                : "All Seasons"
              : activeSeason}
          </span>
        </div>
        <span style={{ fontSize: "var(--fs-sm)", lineHeight: 1.5 }}>
          {isPt
            ? "Nesta tabela são apresentados os valores totais pagos pelo atleta (incluindo bónus ativados e parcelas recompradas). Na vista detalhada do plantel ('Detailed Transfer Ledger') podes consultar a compra original isolada dos eventos de consolidação."
            : "This table presents the total amount paid for the athlete (including triggered bonuses and repurchased rights). In the detailed squad view ('Detailed Transfer Ledger') you can consult the original purchase isolated from consolidation events."}
        </span>
        <span style={{ fontSize: "var(--fs-sm)", lineHeight: 1.5, marginTop: "0.25rem", color: "var(--muted-darker, #6b7280)" }}>
          {isPt
            ? "*Os valores não incluem comissões não divulgadas ou mecanismos de solidariedade."
            : "*Figures do not include undisclosed agent fees or solidarity payments."}
        </span>
      </div>
    </>
  );
}
