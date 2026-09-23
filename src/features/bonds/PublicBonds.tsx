import React, { useState, useMemo } from "react";
import { useAppState } from "../../core/state.js";
import { useTranslation } from "../../hooks/useTranslation.js";

export interface RetailBond {
  id: string;
  name: string;
  nominalAmount: number; // in millions
  couponRate: number; // percentage
  issueDatePt: string;
  issueDateEn: string;
  maturityDatePt: string;
  maturityDateEn: string;
  status: "active" | "repaid";
  isin?: string;
  purposePt: string;
  purposeEn: string;
  detailsPt: string;
  detailsEn: string;
}

export const RETAIL_BONDS: RetailBond[] = [
  {
    id: "sad_2024_2028",
    name: "Sporting SAD 2024-2028",
    nominalAmount: 40.0,
    couponRate: 5.25,
    issueDatePt: "Novembro 2024",
    issueDateEn: "November 2024",
    maturityDatePt: "6 de Novembro de 2028",
    maturityDateEn: "November 6, 2028",
    status: "active",
    isin: "PTSPUCOE0007",
    purposePt: "Apoio aos investimentos correntes de modernização do Estádio José Alvalade, da Academia e reforço de liquidez.",
    purposeEn: "Support for ongoing modernization of José Alvalade stadium, the Academy and general liquidity reinforcement.",
    detailsPt: "Emissão de €40,0M subscrita por 2.690 investidores. Cupão fixo de 5,25% pago semestralmente.",
    detailsEn: "Issue of €40.0M placed among 2,690 investors. Fixed 5.25% coupon payable semi-annually.",
  },
  {
    id: "sad_2024_2027",
    name: "Sporting SAD 2024-2027",
    nominalAmount: 50.0,
    couponRate: 5.75,
    issueDatePt: "Março 2024",
    issueDateEn: "March 2024",
    maturityDatePt: "26 de Novembro de 2027",
    maturityDateEn: "November 26, 2027",
    status: "active",
    isin: "PTSPUDOE0008",
    purposePt: "Refinanciamento integral do empréstimo obrigacionista Sporting SAD 2021-2024 via oferta de troca e subscrição.",
    purposeEn: "Full refinancing of the Sporting SAD 2021-2024 bond loan via combined exchange offer and public subscription.",
    detailsPt: "Montante de €50,0M (€30M novas obrigações + €20M troca da 2021-2024) subscrito por 4.242 investidores. Cupão fixo de 5,75% pago semestralmente.",
    detailsEn: "Total €50.0M (€30M new + €20M exchange from 2021-2024) placed among 4,242 investors. Fixed 5.75% coupon payable semi-annually.",
  },
  {
    id: "sad_2021_2024",
    name: "Sporting SAD 2021-2024",
    nominalAmount: 40.0,
    couponRate: 5.25,
    issueDatePt: "Março 2021",
    issueDateEn: "March 2021",
    maturityDatePt: "Março 2024 (Reembolsado)",
    maturityDateEn: "March 2024 (Repaid)",
    status: "repaid",
    purposePt: "Financiamento de curto e médio prazo durante o período de retração de receitas provocada pela pandemia COVID-19.",
    purposeEn: "Short and medium-term funding during the revenue slump induced by the COVID-19 pandemic.",
    detailsPt: "Emissão inicial de €30M aumentada para €40M após forte procura. 100% reembolsada e permutada na maturidade.",
    detailsEn: "Initial €30M tranche upsized to €40M on strong demand. 100% repaid and rolled over at maturity.",
  },
  {
    id: "sad_2018_2021",
    name: "Sporting SAD 2018-2021",
    nominalAmount: 26.4,
    couponRate: 5.25,
    issueDatePt: "Novembro 2018",
    issueDateEn: "November 2018",
    maturityDatePt: "Novembro 2021 (Reembolsado)",
    maturityDateEn: "November 2021 (Repaid)",
    status: "repaid",
    purposePt: "Estabilização da tesouraria da SAD após a crise de governança de 2018 e refinanciamento de papel comercial.",
    purposeEn: "Treasury stabilization following the 2018 governance crisis and commercial paper rollover.",
    detailsPt: "Reembolsado integralmente no prazo em novembro de 2021 sem quaisquer incidentes de liquidez.",
    detailsEn: "Fully repaid on schedule in November 2021 without any liquidity incidents.",
  },
  {
    id: "sad_2014_2017",
    name: "Sporting SAD 2014-2017",
    nominalAmount: 30.0,
    couponRate: 6.25,
    issueDatePt: "Novembro 2014",
    issueDateEn: "November 2014",
    maturityDatePt: "Novembro 2017 (Reembolsado)",
    maturityDateEn: "November 2017 (Repaid)",
    status: "repaid",
    purposePt: "Instrumento complementar de liquidez emitido no mesmo mês da reestruturação financeira das VMOCs.",
    purposeEn: "Complementary liquidity instrument launched concurrently with the landmark VMOC restructuring.",
    detailsPt: "Emissão de retalho a 3 anos totalmente liquidada a 100% do valor nominal em novembro de 2017.",
    detailsEn: "3-year retail issue redeemed at 100% nominal par value in November 2017.",
  },
];

export function PublicBonds() {
  const { t, T } = useTranslation();
  const isPt = useAppState((s) => s.isPt);
  const [filter, setFilter] = useState<"all" | "active" | "repaid">("active");

  const filteredBonds = useMemo(() => {
    if (filter === "all") return RETAIL_BONDS;
    return RETAIL_BONDS.filter((b) => b.status === filter);
  }, [filter]);

  const activeBonds = useMemo(
    () => RETAIL_BONDS.filter((b) => b.status === "active"),
    [],
  );
  const repaidBonds = useMemo(
    () => RETAIL_BONDS.filter((b) => b.status === "repaid"),
    [],
  );

  const totalActiveAmount = useMemo(
    () => activeBonds.reduce((acc, b) => acc + b.nominalAmount, 0),
    [activeBonds],
  );

  const weightedCoupon = useMemo(() => {
    if (totalActiveAmount === 0) return 0;
    const weightedSum = activeBonds.reduce(
      (acc, b) => acc + b.couponRate * b.nominalAmount,
      0,
    );
    return weightedSum / totalActiveAmount;
  }, [activeBonds, totalActiveAmount]);

  const totalRepaidAmount = useMemo(
    () => repaidBonds.reduce((acc, b) => acc + b.nominalAmount, 0),
    [repaidBonds],
  );

  return (
    <div className="card card--spaced" id="publicRetailBondsCard">
      <div className="card-head">
        <div>
          <T as="h3" i18nKey="bonds_retail_h3" />
          <T as="span" className="tag" i18nKey="bonds_retail_tag" />
        </div>
      </div>
      <T as="p" className="desc" i18nKey="bonds_retail_desc" />

      {/* KPI Cards Grid */}
      <div className="dmt-kpis" style={{ marginTop: "1rem" }}>
        <div className="dmt-kpi-card accent-pos">
          <T as="div" className="dmt-kpi-label" i18nKey="bonds_kpi_active_total" />
          <div className="dmt-kpi-value" style={{ color: "var(--pos)" }}>
            €{totalActiveAmount.toFixed(1)}M
          </div>
          <div className="dmt-kpi-sub">
            {isPt ? "2 Linhas Ativas (2024-2027 & 2024-2028)" : "2 Active Lines (2024-2027 & 2024-2028)"}
          </div>
        </div>

        <div className="dmt-kpi-card accent-green">
          <T as="div" className="dmt-kpi-label" i18nKey="bonds_kpi_avg_coupon" />
          <div className="dmt-kpi-value" style={{ color: "var(--green)" }}>
            {weightedCoupon.toFixed(2)}%
          </div>
          <div className="dmt-kpi-sub">
            {isPt ? "Encargo: €4,98M/ano em cupões" : "Service: €4.98M/yr in coupons"}
          </div>
        </div>

        <div className="dmt-kpi-card accent-gold">
          <T as="div" className="dmt-kpi-label" i18nKey="bonds_kpi_next_maturity" />
          <div className="dmt-kpi-value" style={{ color: "var(--gold)" }}>
            {isPt ? "Nov 2027" : "Nov 2027"}
          </div>
          <div className="dmt-kpi-sub">
            {isPt ? "€50,0M (Sporting SAD 2024-2027)" : "€50.0M (Sporting SAD 2024-2027)"}
          </div>
        </div>

        <div className="dmt-kpi-card accent-info">
          <T as="div" className="dmt-kpi-label" i18nKey="bonds_kpi_track_record" />
          <div className="dmt-kpi-value" style={{ color: "var(--info)" }}>
            100%
          </div>
          <div className="dmt-kpi-sub">
            {isPt
              ? `€${totalRepaidAmount.toFixed(1)}M reembolsados a tempo`
              : `€${totalRepaidAmount.toFixed(1)}M repaid on time`}
          </div>
        </div>
      </div>

      {/* Filter preset switcher */}
      <div className="filter-toolbar" style={{ marginTop: "1.25rem", marginBottom: "1rem" }}>
        <div className="filter-toolbar-group">
          <button
            type="button"
            className={`btn-preset ${filter === "active" ? "active" : ""}`}
            onClick={() => setFilter("active")}
          >
            {isPt ? `Emissões Ativas (€${totalActiveAmount.toFixed(1)}M)` : `Active Issues (€${totalActiveAmount.toFixed(1)}M)`}
          </button>
          <button
            type="button"
            className={`btn-preset ${filter === "repaid" ? "active" : ""}`}
            onClick={() => setFilter("repaid")}
          >
            {isPt ? `Emissões Reembolsadas (€${totalRepaidAmount.toFixed(1)}M)` : `Repaid Issues (€${totalRepaidAmount.toFixed(1)}M)`}
          </button>
          <button
            type="button"
            className={`btn-preset ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            {isPt ? "Todas as Emissões (Histórico)" : "All Issues (Historical)"}
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="uspp-grid" style={{ marginBottom: "1.25rem" }}>
        {filteredBonds.map((bond) => {
          const isActive = bond.status === "active";
          return (
            <div
              className="uspp-term"
              key={bond.id}
              style={{
                borderLeft: `4px solid ${isActive ? "var(--green)" : "var(--muted)"}`,
                position: "relative",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "6px",
                }}
              >
                <span className="ut-label" style={{ fontWeight: 700, color: "var(--ink)" }}>
                  {bond.name}
                </span>
                <span
                  className={`uefa-pillar-badge ${isActive ? "status-green" : "status-amber"}`}
                  style={{ fontSize: "0.68rem" }}
                >
                  {isActive
                    ? isPt
                      ? "Ativa"
                      : "Active"
                    : isPt
                      ? "100% Reembolsada"
                      : "Fully Repaid"}
                </span>
              </div>

              <div
                className="ut-value highlight"
                style={{ fontSize: "1.35rem", marginBottom: "4px" }}
              >
                €{bond.nominalAmount.toFixed(1)}M
                <span
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    marginLeft: "8px",
                    color: "var(--gold)",
                  }}
                >
                  {bond.couponRate.toFixed(2)}% TANB
                </span>
              </div>

              <div className="ut-note" style={{ marginBottom: "6px" }}>
                <strong>{isPt ? "Maturidade:" : "Maturity:"}</strong>{" "}
                {isPt ? bond.maturityDatePt : bond.maturityDateEn}
              </div>

              <div
                className="ut-note"
                style={{
                  fontSize: "0.76rem",
                  color: "var(--ink)",
                  lineHeight: 1.45,
                  paddingTop: "6px",
                  borderTop: "1px dashed var(--rule-2)",
                }}
              >
                {isPt ? bond.detailsPt : bond.detailsEn}
              </div>
            </div>
          );
        })}
      </div>

      {/* Strategic Callout Box */}
      <div
        className="dmt-guide-box"
        style={{
          background: "var(--surface-soft, rgba(0,0,0,0.02))",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-sm)",
          padding: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
          <span style={{ fontSize: "1.2rem" }}>🤝</span>
          <T
            as="h4"
            i18nKey="bonds_retail_vs_uspp_title"
            style={{ margin: 0, fontSize: "0.88rem", fontWeight: 700 }}
          />
        </div>
        <T
          as="p"
          i18nKey="bonds_retail_vs_uspp_desc"
          style={{
            fontSize: "0.8rem",
            color: "var(--ink)",
            margin: 0,
            lineHeight: 1.55,
          }}
        />
      </div>
    </div>
  );
}
