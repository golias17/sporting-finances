import React from "react";
import { Playground } from "../Playground";
import { useTranslation } from "../../hooks/useTranslation";

export function PlaygroundTab() {
  const { t, T } = useTranslation();
  return (
    <>
      <div className="chapter">
        <T as="div" className="num" i18nKey="ch13-num" />
        <div>
          <T as="h2" i18nKey="ch13-h2" />
          <T as="p" className="lede" i18nKey="ch13-lede" />
        </div>
      </div>
      <Playground />
    </>
  );
}
