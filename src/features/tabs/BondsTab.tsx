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
          <T as="h2" i18nKey="auto-txt-h2-14" />
          <T as="p" className="lede" i18nKey="ch05-lede" />
        </div>
      </div>
      {/* VMOC narrative */}
      <div className="narrative">
        <T as="h4" i18nKey="auto-txt-h4-15" />
        <T as="p" i18nKey="auto-txt-p-16" />
        <T as="p" i18nKey="auto-txt-p-17" />
      </div>
      {/* VMOC cost breakdown */}
      <div className="card">
        <div className="card-head">
          <T as="h3" i18nKey="auto-txt-h3-18" />
          <T as="span" className="tag" i18nKey="auto-txt-span-19" />
        </div>
        <T as="p" className="desc" i18nKey="auto-txt-p-20" />
        <VmocCost />
      </div>
      {/* Lion Finance narrative */}
      <div className="narrative narrative--spaced">
        <T as="h4" i18nKey="auto-txt-h4-21" />
        <T as="p" i18nKey="auto-txt-p-22" />
        <T as="p" i18nKey="auto-txt-p-23" />
      </div>
      {/* Lion Finance cards */}
      <div className="card">
        <div className="card-head">
          <T as="h3" i18nKey="auto-txt-h3-24" />
          <T as="span" className="tag" i18nKey="auto-txt-span-25" />
        </div>
        <T as="p" className="desc" i18nKey="auto-txt-p-26" />
        <LionFinance />
      </div>
      {/* USPP narrative + key terms */}
      <div className="narrative narrative--spaced">
        <T as="h4" i18nKey="auto-txt-h4-27" />
        <T as="p" i18nKey="auto-txt-p-28" />
        <T as="p" i18nKey="auto-txt-p-29" />
      </div>
      {/* USPP key terms card */}
      <div className="card">
        <div className="card-head">
          <T as="h3" i18nKey="auto-txt-h3-30" />
          <T as="span" className="tag" i18nKey="auto-txt-span-31" />
        </div>
        <T as="p" className="desc" i18nKey="auto-txt-p-32" />
        <UsppTerms />
      </div>
    </>
  );
}
