import React from "react";
import { VmocCost, LionFinance, UsppTerms } from "../Bonds";
import { useTranslation } from "../../hooks/useTranslation.js";

export function BondsTab() {
  const { t, T } = useTranslation();
  return (
    <>
      <div className="chapter">
        <T as="div" className="num" i18nKey="ch05-num" />
        <div>
          <T as="h2" i18nKey="ch05-h2" />
          <T as="p" className="lede" i18nKey="ch05-lede" />
        </div>
      </div>
      {/* VMOC narrative */}
      <div className="narrative">
        <T as="h4" i18nKey="ch05-vmoc-h4" />
        <T as="p" i18nKey="ch05-vmoc-p1" />
        <T as="p" i18nKey="ch05-vmoc-p2" />
      </div>
      {/* VMOC cost breakdown */}
      <div className="card">
        <div className="card-head">
          <T as="h3" i18nKey="ch05-uspp-h3" />
          <T as="span" className="tag" i18nKey="ch05-uspp-tag" />
        </div>
        <T as="p" className="desc" i18nKey="ch05-uspp-desc" />
        <VmocCost />
      </div>
      {/* Lion Finance narrative */}
      <div className="narrative narrative--spaced">
        <T as="h4" i18nKey="ch05-timeline-h4" />
        <T as="p" i18nKey="ch05-timeline-p1" />
        <T as="p" i18nKey="ch05-timeline-p2" />
      </div>
      {/* Lion Finance cards */}
      <div className="card">
        <div className="card-head">
          <T as="h3" i18nKey="ch05-summary-h3" />
          <T as="span" className="tag" i18nKey="ch05-summary-tag" />
        </div>
        <T as="p" className="desc" i18nKey="ch05-summary-desc" />
        <LionFinance />
      </div>
      {/* USPP narrative + key terms */}
      <div className="narrative narrative--spaced">
        <T as="h4" i18nKey="ch05-impact-h4" />
        <T as="p" i18nKey="ch05-impact-p1" />
        <T as="p" i18nKey="ch05-impact-p2" />
      </div>
      {/* USPP key terms card */}
      <div className="card">
        <div className="card-head">
          <T as="h3" i18nKey="ch05-schedule-h3" />
          <T as="span" className="tag" i18nKey="ch05-schedule-tag" />
        </div>
        <T as="p" className="desc" i18nKey="ch05-schedule-p1" />
        <UsppTerms />
      </div>
    </>
  );
}
