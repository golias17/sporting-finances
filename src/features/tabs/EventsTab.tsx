import React from "react";
import { useTranslation } from "../../hooks/useTranslation";
import { useAppState } from "../../core/state.js";

export function EventsTab() {
  const { t, T } = useTranslation();
  const isPt = useAppState((s) => s.isPt);
  const filter = useAppState((s) => s.activeEventFilter);
  const setFilter = useAppState((s) => s.setActiveEventFilter);

  return (
    <>
      <div className="chapter">
        <T as="div" className="num" i18nKey="ch10-num" />
        <div>
          <T as="h2" i18nKey="ch10-h2" />
          <T as="p" className="lede" i18nKey="ch10-lede" />
        </div>
      </div>
      <div className="event-legend">
        <button
          className={`el-filter ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          {isPt ? "Todos" : "All"}
        </button>
        <button
          className={`el-filter win ${filter === "win" ? "active" : ""}`}
          onClick={() => setFilter("win")}
        >
          {isPt ? "Vitória / Marco" : "Win / milestone"}
        </button>
        <button
          className={`el-filter crisis ${filter === "crisis" ? "active" : ""}`}
          onClick={() => setFilter("crisis")}
        >
          {isPt ? "Crise" : "Crisis"}
        </button>
        <button
          className={`el-filter restructure ${filter === "restructure" ? "active" : ""}`}
          onClick={() => setFilter("restructure")}
        >
          {isPt ? "Reestruturação" : "Restructuring"}
        </button>
      </div>
      <div className="events" id="eventsList">
        <div
          className={`event restructure ${filter !== "all" && filter !== "restructure" ? "hidden" : ""}`}
        >
          <T as="div" className="event-header" i18nKey="ch10-event-restructure-header" />
          <T as="div" className="title" i18nKey="ch10-event-restructure-title" />
          <T as="div" className="body" i18nKey="ch10-event-restructure-body" />
          <T as="div" className="impact" i18nKey="ch10-event-alcochete-header" />
        </div>
        <div
          className={`event win ${filter !== "all" && filter !== "win" ? "hidden" : ""}`}
        >
          <T as="div" className="event-header" i18nKey="ch10-event-alcochete-title" />
          <T as="div" className="title" i18nKey="ch10-event-alcochete-body" />
          <T as="div" className="body" i18nKey="ch10-event-covid-header" />
          <T as="div" className="impact" i18nKey="ch10-event-covid-title" />
        </div>
        <div
          className={`event crisis ${filter !== "all" && filter !== "crisis" ? "hidden" : ""}`}
        >
          <T as="div" className="event-header" i18nKey="ch10-event-covid-body" />
          <T as="div" className="title" i18nKey="ch10-event-vmoc1-header" />
          <T as="div" className="body" i18nKey="ch10-event-vmoc1-title" />
          <T as="div" className="impact" i18nKey="ch10-event-vmoc1-body" />
        </div>
        <div
          className={`event restructure ${filter !== "all" && filter !== "restructure" ? "hidden" : ""}`}
        >
          <T as="div" className="event-header" i18nKey="ch10-event-vmoc2-header" />
          <T as="div" className="title" i18nKey="ch10-event-vmoc2-title" />
          <T as="div" className="body" i18nKey="ch10-event-vmoc2-body" />
          <T as="div" className="impact" i18nKey="ch10-event-uspp-header" />
        </div>
        <div
          className={`event crisis ${filter !== "all" && filter !== "crisis" ? "hidden" : ""}`}
        >
          <T as="div" className="event-header" i18nKey="ch10-event-uspp-title" />
          <T as="div" className="title" i18nKey="ch10-event-uspp-body" />
          <T as="div" className="body" i18nKey="ch10-event-champions-header" />
          <T as="div" className="impact" i18nKey="ch10-event-champions-title" />
        </div>
        <div
          className={`event win ${filter !== "all" && filter !== "win" ? "hidden" : ""}`}
        >
          <T as="div" className="event-header" i18nKey="ch10-event-champions-body" />
          <T as="div" className="title" i18nKey="ch10-event-academy-header" />
          <T as="div" className="body" i18nKey="ch10-event-academy-title" />
          <T as="div" className="impact" i18nKey="ch10-event-academy-body" />
        </div>
        <div
          className={`event restructure ${filter !== "all" && filter !== "restructure" ? "hidden" : ""}`}
        >
          <T as="div" className="event-header" i18nKey="ch10-event-stadium-header" />
          <T as="div" className="title" i18nKey="ch10-event-stadium-title" />
          <T as="div" className="body" i18nKey="ch10-event-stadium-body" />
          <T as="div" className="impact" i18nKey="ch10-event-sponsorship-header" />
        </div>
        <div
          className={`event restructure ${filter !== "all" && filter !== "restructure" ? "hidden" : ""}`}
        >
          <T as="div" className="event-header" i18nKey="ch10-event-sponsorship-title" />
          <T as="div" className="title" i18nKey="ch10-event-sponsorship-body" />
          <T as="div" className="body" i18nKey="ch10-event-transfer-record-header" />
          <T as="div" className="impact" i18nKey="ch10-event-transfer-record-title" />
        </div>
        <div
          className={`event win ${filter !== "all" && filter !== "win" ? "hidden" : ""}`}
        >
          <T as="div" className="event-header" i18nKey="ch10-event-transfer-record-body" />
          <T as="div" className="title" i18nKey="ch10-event-manager-header" />
          <T as="div" className="body" i18nKey="ch10-event-manager-title" />
          <T as="div" className="impact" i18nKey="ch10-event-manager-body" />
        </div>
        <div
          className={`event win ${filter !== "all" && filter !== "win" ? "hidden" : ""}`}
        >
          <T as="div" className="event-header" i18nKey="ch10-event-youth-header" />
          <T as="div" className="title" i18nKey="ch10-event-youth-title" />
          <T as="div" className="body" i18nKey="ch10-event-youth-body" />
          <T as="div" className="impact" i18nKey="ch10-event-community-header" />
        </div>
        <div
          className={`event restructure ${filter !== "all" && filter !== "restructure" ? "hidden" : ""}`}
        >
          <T as="div" className="event-header" i18nKey="ch10-event-community-title" />
          <T as="div" className="title" i18nKey="ch10-event-community-body" />
          <T as="div" className="body" i18nKey="ch10-event-digital-header" />
          <T as="div" className="impact" i18nKey="ch10-event-digital-title" />
        </div>
      </div>
    </>
  );
}
