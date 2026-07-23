import React from "react";
import { TransfersDetailTable } from "../TransfersDetailTable";
import { DataTable } from "../DataTable";
import { useTranslation } from "../../hooks/useTranslation";
import { useAppState } from "../../core/state.js";

interface DataTabProps {
  onExportCsv?: () => void;
}

export function DataTab({ onExportCsv }: DataTabProps) {
  const { t, T } = useTranslation();
  const ledgerData = useAppState((s) => s.TRANSFER_LEDGER);
  const annualData = useAppState((s) => s.annual);
  return (
    <>
      <div className="chapter">
        <T as="div" className="num" i18nKey="ch11-num" />
        <div>
          <T as="h2" i18nKey="ch11-h2" />
          <T as="p" className="lede" i18nKey="ch11-lede" />
        </div>
      </div>
      <div className="card">
        <div className="card-head card-head-center">
          <div className="card-actions-row">
            <T as="h3" i18nKey="ch11-annual-h3" />
            <T as="span" className="tag" i18nKey="ch11-annual-tag" />
          </div>
          <button
            className="story-btn btn-small"
            onClick={onExportCsv}
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
            <T as="span" i18nKey="ch11-download-csv" />
          </button>
        </div>
        <T as="p" className="desc" i18nKey="ch11-annual-desc" />
        <T as="p" className="scroll-hint" i18nKey="ch11-scroll-hint" />
        <div className="table-wrap">
          <div className="scroll-x">
            <DataTable data={annualData} />
          </div>
        </div>
      </div>
      <div className="card card--spaced">
        <div className="card-head">
          <T as="h3" i18nKey="ch11-ledger-h3" />
          <span className="tag" id="transfersTableSeasonTag">
            2025/26
          </span>
        </div>
        <T as="p" className="desc" i18nKey="ch11-ledger-desc" />
        <TransfersDetailTable ledgerData={ledgerData} />
      </div>
    </>
  );
}
