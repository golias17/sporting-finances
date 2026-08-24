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

  let purchases: TransferTransaction[] = [];
  let sales: TransferTransaction[] = [];
  let displayedNote: string | undefined = undefined;

  if (activeSeason === "all") {
    ledgerData.forEach((s) => {
      purchases.push(...s.purchases);
      sales.push(...s.sales);
    });
  } else {
    const seasonObj =
      ledgerData.find((x) => x.season === activeSeason) || ledgerData[0];
    if (seasonObj) {
      purchases = seasonObj.purchases;
      sales = seasonObj.sales;
      displayedNote = localizedNote(seasonObj, isPt);
    }
  }

  if (activeWindow !== "All") {
    purchases = purchases.filter(
      (p) => p.window === activeWindow.toLowerCase(),
    );
    sales = sales.filter((p) => p.window === activeWindow.toLowerCase());
  }

  // Sort by fee descending for consistency when showing all seasons
  if (activeSeason === "all") {
    purchases.sort((a, b) => (b.fee || 0) - (a.fee || 0));
    sales.sort((a, b) => (b.fee || 0) - (a.fee || 0));
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
      let remainingBonus = p.bonus || 0;
      if (p.timeline) {
        p.timeline.forEach((e) => {
          if (e.type === "bonus") {
            remainingBonus = Math.max(0, remainingBonus - e.amount);
          }
        });
      }

      if (remainingBonus > 0)
        tags.push(
          <span key="bonus" className="tl-tag bonus">
            +€{fmtNumStr(remainingBonus)}M{" "}
            {isPt ? "bónus restantes" : "bonus remaining"}
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
            {p.timeline && p.timeline.length > 0 && (
              <div
                className="tl-obs"
                style={{ color: "var(--color-gold)", marginTop: "4px" }}
              >
                {isPt ? "Eventos consolidados:" : "Consolidated events:"}{" "}
                {p.timeline.map((e, i) => (
                  <span key={i}>
                    [{e.season}] {e.desc_pt || e.desc}: €{e.amount}M
                    {i < p.timeline!.length - 1 ? ", " : ""}
                  </span>
                ))}
              </div>
            )}
          </div>
          <FmtFee fee={p.fee} />
        </div>
      );
    });
  };

  const [dealFilter, setDealFilter] = React.useState<
    "all" | "over10m" | "commissions"
  >("all");

  // Filter by magnitude or commission
  let displayPurchases = purchases;
  let displaySales = sales;
  if (dealFilter === "over10m") {
    displayPurchases = displayPurchases.filter((p) => (p.fee || 0) >= 10);
    displaySales = displaySales.filter((p) => (p.fee || 0) >= 10);
  } else if (dealFilter === "commissions") {
    displayPurchases = displayPurchases.filter((p) => (p.commission || 0) > 0);
    displaySales = displaySales.filter((p) => (p.commission || 0) > 0);
  }

  const calculateTotal = (txs: TransferTransaction[]) => {
    return txs.reduce((a, p) => a + (p.fee || 0), 0);
  };

  const totalIn = calculateTotal(displayPurchases);
  const totalOut = calculateTotal(displaySales);
  const net = totalOut - totalIn;
  const netCls = net >= 0 ? "pos" : "neg";
  const netSign = net >= 0 ? "+" : "";

  const totalRealizedIn = displayPurchases.reduce((sum, p) => {
    let cost = (p.fee || 0) + (p.commission || 0);
    if (p.timeline) {
      p.timeline.forEach((e) => {
        cost += e.amount;
      });
    }
    return sum + cost;
  }, 0);

  const totalRealizedOut = displaySales.reduce((sum, p) => {
    let fee = p.fee || 0;
    let comm = p.commission || 0;
    if (p.timeline) {
      p.timeline.forEach((e: any) => {
        if (e.type === "bonus") fee += e.amount;
        if (e.type === "commission" || e.type === "other") comm += e.amount;
      });
    }

    let tpTotal = 0;
    if (p.sell_on_gain_pct !== undefined && p.purchase_fee !== undefined) {
      const gain = Math.max(0, fee - p.purchase_fee);
      tpTotal = gain * (p.sell_on_gain_pct / 100);
    } else {
      const rights = parseFloat((p.rights || "100%").replace("%", "")) / 100;
      tpTotal = fee * (1 - rights);
    }

    return sum + (fee - comm - tpTotal);
  }, 0);

  const netRealized = totalRealizedOut - totalRealizedIn;
  const netRealizedCls = netRealized >= 0 ? "pos" : "neg";
  const netRealizedSign = netRealized >= 0 ? "+" : "";

  return (
    <>
      <div className="tl-season-nav">
        <button
          className={`season-pill${activeSeason === "all" ? " active" : ""}`}
          aria-pressed={activeSeason === "all"}
          onClick={() => setActiveSeason("all")}
        >
          {isPt ? "Todas" : "All"}
        </button>
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
      <div
        className="tl-window-nav"
        style={{
          display: "flex",
          gap: "0.5rem",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
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

        {/* Deal magnitude / commission quick filters */}
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          <button
            type="button"
            className={`season-pill${dealFilter === "all" ? " active" : ""}`}
            onClick={() => setDealFilter("all")}
          >
            {isPt ? "Todos os Negócios" : "All Deals"}
          </button>
          <button
            type="button"
            className={`season-pill${dealFilter === "over10m" ? " active" : ""}`}
            onClick={() => setDealFilter("over10m")}
          >
            {isPt ? "Negócios > 10 M€" : "Deals > €10M"}
          </button>
          <button
            type="button"
            className={`season-pill${dealFilter === "commissions" ? " active" : ""}`}
            onClick={() => setDealFilter("commissions")}
          >
            {isPt ? "Com Intermediação" : "With Commission"}
          </button>
        </div>
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
            {displayPurchases.length > 0 ? (
              renderRows(displayPurchases)
            ) : (
              <div className="tl-row">
                <div className="tl-club">
                  {isPt
                    ? "Sem contratações correspondentes"
                    : "No matching purchases"}
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
            {displaySales.length > 0 ? (
              renderRows(displaySales)
            ) : (
              <div className="tl-row">
                <div className="tl-club">
                  {isPt ? "Sem vendas correspondentes" : "No matching sales"}
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
        <div
          className="tl-summary"
          style={{
            marginTop: "1rem",
            borderTop: "1px dashed var(--border)",
            paddingTop: "1rem",
          }}
        >
          <div className="tl-sum-item">
            <span className="tl-sum-label">
              {isPt
                ? "Total consolidado (Custo base + Comissões + Eventos)"
                : "Consolidated spent (Fee + Comm + Events)"}
            </span>
            <span className="tl-sum-val neg">
              −€{fmtNumStr(totalRealizedIn)}M
            </span>
          </div>
          <div className="tl-net-box">
            <div className="tl-sum-label">
              {isPt ? "Saldo consolidado (SAD)" : "Consolidated net (SAD)"}
            </div>
            <div className={`tl-sum-val ${netRealizedCls}`}>
              {netRealizedSign}€{fmtNumStr(Math.abs(netRealized))}M
            </div>
          </div>
          <div className="tl-sum-item">
            <span className="tl-sum-label">
              {isPt
                ? "Líquido SAD (Receitas - Comissões - Terceiros)"
                : "Net Proceeds (Fee - Comm - 3rd Party)"}
            </span>
            <span className="tl-sum-val pos">
              +€{fmtNumStr(totalRealizedOut)}M
            </span>
          </div>
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "var(--fs-xs)",
              fontWeight: 600,
              color: "var(--ink)",
            }}
          >
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
          </div>
          <span style={{ fontSize: "var(--fs-sm)", lineHeight: 1.5 }}>
            {isPt
              ? "Os valores não incluem retenções para mecanismos de solidariedade. O encargo com terceiros pode tratar-se de uma estimativa conservadora baseada na percentagem (passe ou mais-valia) detida."
              : "Values do not include solidarity mechanism retentions. Third-party charges may be conservative estimates based on the held percentage (economic rights or capital gains)."}
          </span>
        </div>
      </div>
    </>
  );
}
