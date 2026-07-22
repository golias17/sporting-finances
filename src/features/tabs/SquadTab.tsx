import React, { useState } from "react";
import { ChartCard } from "../../components/ChartCard.js";
import { useSquadCharts } from "./useSquadCharts.js";
import { SquadAnalytics } from "../SquadAnalytics";
import { TransfersLedger } from "../TransfersLedger";
import { useTranslation } from "../../hooks/useTranslation.js";
import { useAppState } from "../../core/state.js";

export function SquadTab() {
  const { t, T } = useTranslation();
  const { squadBook, transfers, netTrading } = useSquadCharts();
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
            />
            <ChartCard
              id="chartNetTrading"
              title={<T as="h3" i18nKey="ch06-net-h3" />}
              tag={<T as="span" className="tag" i18nKey="ch06-net-tag" />}
              desc={<T as="p" className="desc" i18nKey="ch06-net-desc" />}
              chartType="bar"
              data={netTrading.data}
              options={netTrading.options}
            />
          </div>
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
        <T as="p" i18nKey="auto-txt-p-33" />
        <T as="p" i18nKey="ch06-narrative-p3" />
      </div>
    </>
  );
}
