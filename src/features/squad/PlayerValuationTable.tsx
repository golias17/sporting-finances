import React, { useState, useMemo } from "react";
import { useTranslation } from "../../hooks/useTranslation.js";
import { useAppState } from "../../core/state.js";
import {
  SQUAD_VALUATION_PROFILES,
  calculatePlayerSaleRoi,
  type PlayerValuationProfile,
} from "./playerValuationData.js";

interface PlayerValuationTableProps {
  onSelectPlayer?: (player: PlayerValuationProfile) => void;
  selectedPlayerId?: string;
}

export function PlayerValuationTable({
  onSelectPlayer,
  selectedPlayerId,
}: PlayerValuationTableProps) {
  const { t, T } = useTranslation();
  const isPt = useAppState((s) => s.isPt);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortField, setSortField] = useState<keyof PlayerValuationProfile>("marketValue");
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const filteredAndSorted = useMemo(() => {
    return SQUAD_VALUATION_PROFILES.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.nationality.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.position.toLowerCase().includes(searchTerm.toLowerCase());
      return matchSearch;
    }).sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (typeof valA === "number" && typeof valB === "number") {
        return sortAsc ? valA - valB : valB - valA;
      }
      return sortAsc
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [searchTerm, sortField, sortAsc]);

  const handleSort = (field: keyof PlayerValuationProfile) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="card" style={{ marginTop: "1.5rem" }}>
      <div className="card-head" style={{ marginBottom: "0.75rem" }}>
        <div>
          <T as="h3" i18nKey="player_roi_table_title" />
          <span className="tag">{filteredAndSorted.length} {isPt ? "Ativos" : "Assets"}</span>
        </div>
        <div style={{ maxWidth: "240px", width: "100%" }}>
          <input
            type="text"
            className="filter-input"
            placeholder={isPt ? "Pesquisar jogador..." : "Search player..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: "100%", padding: "6px 10px", fontSize: "0.82rem" }}
          />
        </div>
      </div>
      <T as="p" className="desc" i18nKey="player_roi_table_desc" style={{ marginBottom: "1rem" }} />

      <div className="table-wrap">
        <div className="scroll-x">
          <table className="data-table">
            <thead>
              <tr>
                <th
                  style={{ textAlign: "left", cursor: "pointer" }}
                  onClick={() => handleSort("name")}
                >
                  <T as="span" i18nKey="player_roi_col_player" /> {sortField === "name" ? (sortAsc ? "▲" : "▼") : ""}
                </th>
                <th
                  style={{ textAlign: "right", cursor: "pointer" }}
                  onClick={() => handleSort("acquisitionCost")}
                >
                  <T as="span" i18nKey="player_roi_col_cost" /> {sortField === "acquisitionCost" ? (sortAsc ? "▲" : "▼") : ""}
                </th>
                <th
                  style={{ textAlign: "right", cursor: "pointer" }}
                  onClick={() => handleSort("annualAmortization")}
                >
                  <T as="span" i18nKey="player_roi_col_amort_annual" /> {sortField === "annualAmortization" ? (sortAsc ? "▲" : "▼") : ""}
                </th>
                <th
                  style={{ textAlign: "right", cursor: "pointer" }}
                  onClick={() => handleSort("currentBookValue")}
                >
                  <T as="span" i18nKey="player_roi_col_book_value" /> {sortField === "currentBookValue" ? (sortAsc ? "▲" : "▼") : ""}
                </th>
                <th
                  style={{ textAlign: "right", cursor: "pointer" }}
                  onClick={() => handleSort("marketValue")}
                >
                  <T as="span" i18nKey="player_roi_col_market_val" /> {sortField === "marketValue" ? (sortAsc ? "▲" : "▼") : ""}
                </th>
                <th
                  style={{ textAlign: "right", cursor: "pointer" }}
                  onClick={() => handleSort("releaseClause")}
                >
                  <T as="span" i18nKey="player_roi_col_clause" /> {sortField === "releaseClause" ? (sortAsc ? "▲" : "▼") : ""}
                </th>
                <th
                  style={{ textAlign: "right" }}
                >
                  <T as="span" i18nKey="player_roi_col_potential_gain" />
                </th>
                <th
                  style={{ textAlign: "center", cursor: "pointer" }}
                  onClick={() => handleSort("contractExpiry")}
                >
                  <T as="span" i18nKey="player_roi_col_contract" /> {sortField === "contractExpiry" ? (sortAsc ? "▲" : "▼") : ""}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSorted.map((p) => {
                const isSelected = selectedPlayerId === p.id;
                const gainAtClause = calculatePlayerSaleRoi(p, p.releaseClause).netAccountingGain;

                return (
                  <tr
                    key={p.id}
                    onClick={() => onSelectPlayer && onSelectPlayer(p)}
                    style={{
                      cursor: "pointer",
                      background: isSelected ? "var(--accent-glow, rgba(10, 93, 58, 0.08))" : undefined,
                    }}
                  >
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontFamily: "var(--mono)", fontSize: "0.75rem", color: "var(--muted)", width: "18px" }}>
                          #{p.number}
                        </span>
                        <div>
                          <div style={{ fontWeight: 700, color: isSelected ? "var(--green)" : "var(--ink)" }}>
                            {p.name}
                          </div>
                          <div style={{ fontSize: "0.72rem", color: "var(--muted)" }}>
                            {p.nationality} • {p.isHomegrown ? "Formação" : `Contratado em ${p.joinYear}`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: "right", fontFamily: "var(--mono)" }}>
                      {p.isHomegrown ? (
                        <span className="uefa-pillar-badge status-green" style={{ fontSize: "0.68rem" }}>
                          €0.0M (Base)
                        </span>
                      ) : (
                        `€${p.acquisitionCost.toFixed(1)}M`
                      )}
                    </td>
                    <td style={{ textAlign: "right", fontFamily: "var(--mono)", color: "var(--muted)" }}>
                      €{p.annualAmortization.toFixed(2)}M/ano
                    </td>
                    <td style={{ textAlign: "right", fontFamily: "var(--mono)", fontWeight: 600 }}>
                      €{p.currentBookValue.toFixed(2)}M
                    </td>
                    <td style={{ textAlign: "right", fontFamily: "var(--mono)", fontWeight: 700, color: "var(--ink)" }}>
                      €{p.marketValue.toFixed(1)}M
                    </td>
                    <td style={{ textAlign: "right", fontFamily: "var(--mono)", color: "var(--gold)", fontWeight: 700 }}>
                      €{p.releaseClause.toFixed(0)}M
                    </td>
                    <td style={{ textAlign: "right", fontFamily: "var(--mono)", color: "var(--pos)", fontWeight: 700 }}>
                      +€{gainAtClause.toFixed(1)}M
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span className="pill-btn" style={{ fontSize: "0.7rem", padding: "2px 8px" }}>
                        {p.contractExpiry}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
