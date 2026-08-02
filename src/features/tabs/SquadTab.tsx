import React, { useState } from "react";
import { ChartCard } from "../../components/ChartCard.js";
import { useSquadCharts } from "./useSquadCharts.js";
import { SquadAnalytics } from "../SquadAnalytics";
import { TransfersLedger } from "../TransfersLedger";
import { useTranslation } from "../../hooks/useTranslation.js";
import { useAppState } from "../../core/state.js";

export const SquadTab = React.memo(function SquadTab() {
  const { t, T } = useTranslation();
  const isPt = useAppState((s) => s.isPt);
  const annual = useAppState((s) => s.annual);
  const { squadBook, transfers, netTrading, transferDonut } = useSquadCharts();
  const ledgerData = useAppState((s) => s.TRANSFER_LEDGER);

  const [activeSubTab, setActiveSubTab] = useState<
    "financials" | "analytics" | "ledger"
  >("financials");

  return (
    <>
      <div className="chapter">
        <T as="div" className="num" i18nKey="ch06-num" />
        <div>
          <T as="h2" i18nKey="ch06-h2" />
          <T as="p" className="lede" i18nKey="ch06-lede" />
        </div>
      </div>
      {/* SUB-TABS NAVIGATION */}
      <div className="sub-tabs-container">
        <T
          as="button"
          className={`sub-tab-btn ${activeSubTab === "financials" ? "active" : ""}`}
          onClick={() => setActiveSubTab("financials")}
          i18nKey="squad_sub_financials"
        />
        <T
          as="button"
          className={`sub-tab-btn ${activeSubTab === "analytics" ? "active" : ""}`}
          onClick={() => setActiveSubTab("analytics")}
          i18nKey="squad_sub_analytics"
        />
        <T
          as="button"
          className={`sub-tab-btn ${activeSubTab === "ledger" ? "active" : ""}`}
          onClick={() => setActiveSubTab("ledger")}
          i18nKey="squad_sub_ledger"
        />
      </div>

      {activeSubTab === "financials" && (
        <div className="sub-panel-squad" id="squad-subpanel-financials">
          <ChartCard
            id="chartSquadBook"
            title={<T as="h3" i18nKey="ch06-squad-h3" />}
            tag={<T as="span" className="tag" i18nKey="ch06-squad-tag" />}
            desc={<T as="p" className="desc" i18nKey="ch06-squad-desc" />}
            chartType="bar"
            data={squadBook.data}
            options={squadBook.options}
            chartClassName="tall"
            valueType="currency-thousands"
          />
          <div className="grid-2">
            <ChartCard
              id="chartTransfers"
              title={<T as="h3" i18nKey="ch06-income-h3" />}
              tag={<T as="span" className="tag" i18nKey="ch06-income-tag" />}
              desc={<T as="p" className="desc" i18nKey="ch06-income-desc" />}
              chartType="bar"
              data={transfers.data}
              options={transfers.options}
              valueType="currency-thousands"
            />
            <ChartCard
              id="chartNetTrading"
              title={<T as="h3" i18nKey="ch06-net-h3" />}
              tag={<T as="span" className="tag" i18nKey="ch06-net-tag" />}
              desc={<T as="p" className="desc" i18nKey="ch06-net-desc" />}
              chartType="bar"
              data={netTrading.data}
              options={netTrading.options}
              valueType="currency-thousands"
            />
          </div>
          <ChartCard
            id="chartTransferBreakdown"
            title={<T as="h3" i18nKey="ch06-donut-h3" />}
            tag={<T as="span" className="tag" i18nKey="ch06-donut-tag" />}
            desc={<T as="p" className="desc" i18nKey="ch06-donut-desc" />}
            chartType="bar"
            data={transferDonut.data}
            options={transferDonut.options}
            chartClassName="tall"
            valueType="percentage"
            footer={
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
                </div>
                <span style={{ fontSize: "var(--fs-sm)", lineHeight: 1.5 }}>
                  {isPt
                    ? "Os valores não incluem retenções para mecanismos de solidariedade. O encargo com terceiros pode tratar-se de uma estimativa conservadora baseada na percentagem (passe ou mais-valia) detida."
                    : "Values do not include solidarity mechanism retentions. Third-party charges may be conservative estimates based on the held percentage (economic rights or capital gains)."}
                </span>
              </div>
            }
          />
        </div>
      )}

      {activeSubTab === "analytics" && (
        <div className="sub-panel-squad" id="squad-subpanel-analytics">
          <SquadAnalytics />
        </div>
      )}

      {activeSubTab === "ledger" && (
        <div className="sub-panel-squad" id="squad-subpanel-ledger">
          <div className="card">
            <div className="card-head">
              <T as="h3" i18nKey="ch06-ledger-h3" />
              <T as="span" className="tag" i18nKey="ch06-ledger-tag" />
            </div>
            <T as="p" className="desc" i18nKey="ch06-ledger-desc" />
            <TransfersLedger ledgerData={ledgerData} />
          </div>
        </div>
      )}
      <div className="narrative">
        <T as="h4" i18nKey="ch06-narrative-h4" />
        <T as="p" i18nKey="ch06-narrative-p1" />
        <T as="p" i18nKey="ch06-note" />
        <T as="p" i18nKey="ch06-narrative-p3" />
      </div>
    </>
  );
});
