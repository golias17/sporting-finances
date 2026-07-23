import React from "react";
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

function FmtFee({ fee }: { fee: number | null | undefined }) {
  const isPt = useAppState((s) => s.isPt);
  if (fee === null || fee === undefined)
    return <span className="tl-fee low">—</span>;
  if (fee === 0)
    return <span className="tl-fee low">{isPt ? "Custo Zero" : "Free"}</span>;
  const cls = fee >= 20 ? "sig" : fee >= 5 ? "mid" : "low";
  return <span className={`tl-fee ${cls}`}>€{fmtNumStr(fee)}M</span>;
}

export function TransfersLedger({
  ledgerData,
}: {
  ledgerData: TransferLedgerSeason[];
}) {
  const isPt = useAppState((s) => s.isPt);
  const activeSeason = useAppState((s) => s.tlActiveSeason);
  const setActiveSeason = useAppState((s) => s.setTlActiveSeason);
  const activeWindow = useAppState((s) => s.tlActiveWindow);
  const setActiveWindow = useAppState((s) => s.setTlActiveWindow);

  const seasonObj =
    ledgerData.find((x) => x.season === activeSeason) || ledgerData[0];
  if (!seasonObj) return null;

  let purchases = seasonObj.purchases;
  let sales = seasonObj.sales;

  if (activeWindow !== "All") {
    purchases = purchases.filter(
      (p) => p.window === activeWindow.toLowerCase(),
    );
    sales = sales.filter((p) => p.window === activeWindow.toLowerCase());
  }

  const renderRows = (arr: TransferTransaction[]) => {
    return arr.map((p, idx) => {
      const tags: React.ReactNode[] = [];
      if (activeWindow === "All" && p.window) {
        const winLabel =
          p.window === "summer"
            ? isPt
              ? "Verão"
              : "summer"
            : isPt
              ? "Inverno"
              : "winter";
        tags.push(
          <span
            key="win"
            className={`tl-tag ${p.window === "summer" ? "summer" : "winter"} text-capitalize`}
          >
            {winLabel}
          </span>,
        );
      }
      if (p.rights)
        tags.push(
          <span key="rights" className="tl-tag rights">
            {p.rights}
          </span>,
        );
      if (p.bonus)
        tags.push(
          <span key="bonus" className="tl-tag bonus">
            +€{fmtNumStr(p.bonus)}M {isPt ? "bónus" : "bonus"}
          </span>,
        );
      if (p.commission)
        tags.push(
          <span key="comm" className="tl-tag comm">
            €{fmtNumStr(p.commission)}M {isPt ? "comissão" : "commission"}
          </span>,
        );

      const displayedNote = localizedNote(p, isPt);

      return (
        <div className="tl-row" key={`${p.player}-${idx}`}>
          <div className="tl-details">
            <div className="tl-player">{p.player}</div>
            <div className="tl-club">{p.club ? p.club : "—"}</div>
            {tags.length > 0 && <div className="tl-tags">{tags}</div>}
            {displayedNote && <div className="tl-obs">{displayedNote}</div>}
          </div>
          <FmtFee fee={p.fee} />
        </div>
      );
    });
  };

  const totalIn = purchases.reduce((a, p) => a + (p.fee || 0), 0);
  const totalOut = sales.reduce((a, p) => a + (p.fee || 0), 0);
  const net = totalOut - totalIn;
  const netCls = net >= 0 ? "pos" : "neg";
  const netSign = net >= 0 ? "+" : "";
  const displayedNote = localizedNote(seasonObj, isPt);

  return (
    <>
      <div className="tl-season-nav">
        {ledgerData.map((s) => (
          <button
            key={s.season}
            className={`season-pill${s.season === activeSeason ? " active" : ""}`}
            aria-pressed={s.season === activeSeason}
            onClick={() => setActiveSeason(s.season)}
          >
            {s.season}
          </button>
        ))}
      </div>
      <div className="tl-window-nav">
        {[
          { value: "All", label: isPt ? "Todas as janelas" : "All Windows" },
          {
            value: "summer",
            label: isPt ? "Mercado de Verão" : "Summer Window",
          },
          {
            value: "winter",
            label: isPt ? "Mercado de Inverno" : "Winter Window",
          },
        ].map((w) => (
          <button
            key={w.value}
            className={`season-pill${w.value === activeWindow ? " active" : ""}`}
            aria-pressed={w.value === activeWindow}
            onClick={() => setActiveWindow(w.value)}
          >
            {w.label}
          </button>
        ))}
      </div>
      <div id="tlBody">
        {displayedNote && <div className="tl-season-note">{displayedNote}</div>}
        <div className="tl-cols">
          <div className="tl-col">
            <div className="tl-col-head in">
              <span className="tl-label">
                {isPt
                  ? "↓ Contratações (Valor Fixo)"
                  : "↓ Bought (Primary Fees)"}
              </span>
              <span className="tl-total">€{fmtNumStr(totalIn)}M</span>
            </div>
            {purchases.length > 0 ? (
              renderRows(purchases)
            ) : (
              <div className="tl-row">
                <div className="tl-club">
                  {isPt
                    ? "Sem contratações nesta janela"
                    : "No purchases in this window"}
                </div>
              </div>
            )}
          </div>
          <div className="tl-col">
            <div className="tl-col-head out">
              <span className="tl-label">
                {isPt ? "↑ Vendas (Valor Fixo)" : "↑ Sold (Primary Fees)"}
              </span>
              <span className="tl-total">€{fmtNumStr(totalOut)}M</span>
            </div>
            {sales.length > 0 ? (
              renderRows(sales)
            ) : (
              <div className="tl-row">
                <div className="tl-club">
                  {isPt ? "Sem vendas nesta janela" : "No sales in this window"}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="tl-summary">
          <div className="tl-sum-item">
            <span className="tl-sum-label">
              {isPt
                ? "Total investido (Valor Fixo)"
                : "Total spent (Primary Fees)"}
            </span>
            <span className="tl-sum-val neg">−€{fmtNumStr(totalIn)}M</span>
          </div>
          <div className="tl-net-box">
            <div className="tl-sum-label">
              {isPt ? "Saldo de transferências" : "Net trading (Primary Fees)"}
            </div>
            <div className={`tl-sum-val ${netCls}`}>
              {netSign}€{fmtNumStr(Math.abs(net))}M
            </div>
          </div>
          <div className="tl-sum-item">
            <span className="tl-sum-label">
              {isPt
                ? "Total recebido (Valor Fixo)"
                : "Total received (Primary Fees)"}
            </span>
            <span className="tl-sum-val pos">+€{fmtNumStr(totalOut)}M</span>
          </div>
        </div>
      </div>
    </>
  );
}
