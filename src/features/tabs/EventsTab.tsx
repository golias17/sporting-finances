import React from "react";
import { useTranslation } from "../../hooks/useTranslation";
import { useAppState } from "../../core/state.js";

export const EventsTab = React.memo(function EventsTab() {
  const { t, T } = useTranslation();
  const isPt = useAppState((s) => s.isPt);
  const filter = useAppState((s) => s.activeEventFilter);
  const setFilter = useAppState((s) => s.setActiveEventFilter);

  return (
    <>
      <div className="chapter">
        <T as="div" className="num" i18nKey="ch09-num" />
        <div>
          <T as="h2" i18nKey="ch09-h2" />
          <T as="p" className="lede" i18nKey="ch09-lede" />
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
          <T
            as="div"
            className="event-header"
            i18nKey="ch09-event-restructure-header"
          />
          <T
            as="div"
            className="title"
            i18nKey="ch09-event-restructure-title"
          />
          <T as="div" className="body" i18nKey="ch09-event-restructure-body" />
          <T
            as="div"
            className="impact"
            i18nKey="ch09-event-restructure-impact"
          />
        </div>
        <div
          className={`event win ${filter !== "all" && filter !== "win" ? "hidden" : ""}`}
        >
          <T
            as="div"
            className="event-header"
            i18nKey="ch09-event-peak-header"
          />
          <T as="div" className="title" i18nKey="ch09-event-peak-title" />
          <T as="div" className="body" i18nKey="ch09-event-peak-body" />
          <T as="div" className="impact" i18nKey="ch09-event-peak-impact" />
        </div>
        <div
          className={`event crisis ${filter !== "all" && filter !== "crisis" ? "hidden" : ""}`}
        >
          <T
            as="div"
            className="event-header"
            i18nKey="ch09-event-alcochete-header"
          />
          <T as="div" className="title" i18nKey="ch09-event-alcochete-title" />
          <T as="div" className="body" i18nKey="ch09-event-alcochete-body" />
          <T as="div" className="impact" i18nKey="ch09-event-alcochete-impact" />
        </div>
        <div
          className={`event restructure ${filter !== "all" && filter !== "restructure" ? "hidden" : ""}`}
        >
          <T
            as="div"
            className="event-header"
            i18nKey="ch09-event-securitization-header"
          />
          <T
            as="div"
            className="title"
            i18nKey="ch09-event-securitization-title"
          />
          <T
            as="div"
            className="body"
            i18nKey="ch09-event-securitization-body"
          />
          <T
            as="div"
            className="impact"
            i18nKey="ch09-event-securitization-impact"
          />
        </div>
        <div
          className={`event crisis ${filter !== "all" && filter !== "crisis" ? "hidden" : ""}`}
        >
          <T
            as="div"
            className="event-header"
            i18nKey="ch09-event-covid-header"
          />
          <T as="div" className="title" i18nKey="ch09-event-covid-title" />
          <T as="div" className="body" i18nKey="ch09-event-covid-body" />
          <T as="div" className="impact" i18nKey="ch09-event-covid-impact" />
        </div>
        <div
          className={`event win ${filter !== "all" && filter !== "win" ? "hidden" : ""}`}
        >
          <T
            as="div"
            className="event-header"
            i18nKey="ch09-event-champions-header"
          />
          <T as="div" className="title" i18nKey="ch09-event-champions-title" />
          <T as="div" className="body" i18nKey="ch09-event-champions-body" />
          <T
            as="div"
            className="impact"
            i18nKey="ch09-event-champions-impact"
          />
        </div>
        <div
          className={`event restructure ${filter !== "all" && filter !== "restructure" ? "hidden" : ""}`}
        >
          <T
            as="div"
            className="event-header"
            i18nKey="ch09-event-vmoc1-header"
          />
          <T as="div" className="title" i18nKey="ch09-event-vmoc1-title" />
          <T as="div" className="body" i18nKey="ch09-event-vmoc1-body" />
          <T as="div" className="impact" i18nKey="ch09-event-vmoc1-impact" />
        </div>
        <div
          className={`event restructure ${filter !== "all" && filter !== "restructure" ? "hidden" : ""}`}
        >
          <T
            as="div"
            className="event-header"
            i18nKey="ch09-event-vmoc2-header"
          />
          <T as="div" className="title" i18nKey="ch09-event-vmoc2-title" />
          <T as="div" className="body" i18nKey="ch09-event-vmoc2-body" />
          <T as="div" className="impact" i18nKey="ch09-event-vmoc2-impact" />
        </div>
        <div
          className={`event win ${filter !== "all" && filter !== "win" ? "hidden" : ""}`}
        >
          <T
            as="div"
            className="event-header"
            i18nKey="ch09-event-transfer-record-header"
          />
          <T
            as="div"
            className="title"
            i18nKey="ch09-event-transfer-record-title"
          />
          <T
            as="div"
            className="body"
            i18nKey="ch09-event-transfer-record-body"
          />
          <T
            as="div"
            className="impact"
            i18nKey="ch09-event-transfer-record-impact"
          />
        </div>
        <div
          className={`event win ${filter !== "all" && filter !== "win" ? "hidden" : ""}`}
        >
          <T
            as="div"
            className="event-header"
            i18nKey="ch09-event-youth-header"
          />
          <T as="div" className="title" i18nKey="ch09-event-youth-title" />
          <T as="div" className="body" i18nKey="ch09-event-youth-body" />
          <T
            as="div"
            className="impact"
            i18nKey="ch09-event-youth-impact"
          />
        </div>
        <div
          className={`event restructure ${filter !== "all" && filter !== "restructure" ? "hidden" : ""}`}
        >
          <T
            as="div"
            className="event-header"
            i18nKey="ch09-event-uspp-header"
          />
          <T as="div" className="title" i18nKey="ch09-event-uspp-title" />
          <T as="div" className="body" i18nKey="ch09-event-uspp-body" />
          <T as="div" className="impact" i18nKey="ch09-event-uspp-impact" />
        </div>
      </div>
    </>
  );
});
