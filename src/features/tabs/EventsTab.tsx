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
          <T as="div" className="event-header" i18nKey="auto-txt-div-36" />
          <T as="div" className="title" i18nKey="auto-txt-div-37" />
          <T as="div" className="body" i18nKey="auto-txt-div-38" />
          <T as="div" className="impact" i18nKey="auto-txt-div-39" />
        </div>
        <div
          className={`event win ${filter !== "all" && filter !== "win" ? "hidden" : ""}`}
        >
          <T as="div" className="event-header" i18nKey="auto-txt-div-40" />
          <T as="div" className="title" i18nKey="auto-txt-div-41" />
          <T as="div" className="body" i18nKey="auto-txt-div-42" />
          <T as="div" className="impact" i18nKey="auto-txt-div-43" />
        </div>
        <div
          className={`event crisis ${filter !== "all" && filter !== "crisis" ? "hidden" : ""}`}
        >
          <T as="div" className="event-header" i18nKey="auto-txt-div-44" />
          <T as="div" className="title" i18nKey="auto-txt-div-45" />
          <T as="div" className="body" i18nKey="auto-txt-div-46" />
          <T as="div" className="impact" i18nKey="auto-txt-div-47" />
        </div>
        <div
          className={`event restructure ${filter !== "all" && filter !== "restructure" ? "hidden" : ""}`}
        >
          <T as="div" className="event-header" i18nKey="auto-txt-div-48" />
          <T as="div" className="title" i18nKey="auto-txt-div-49" />
          <T as="div" className="body" i18nKey="auto-txt-div-50" />
          <T as="div" className="impact" i18nKey="auto-txt-div-51" />
        </div>
        <div
          className={`event crisis ${filter !== "all" && filter !== "crisis" ? "hidden" : ""}`}
        >
          <T as="div" className="event-header" i18nKey="auto-txt-div-52" />
          <T as="div" className="title" i18nKey="auto-txt-div-53" />
          <T as="div" className="body" i18nKey="auto-txt-div-54" />
          <T as="div" className="impact" i18nKey="auto-txt-div-55" />
        </div>
        <div
          className={`event win ${filter !== "all" && filter !== "win" ? "hidden" : ""}`}
        >
          <T as="div" className="event-header" i18nKey="auto-txt-div-56" />
          <T as="div" className="title" i18nKey="auto-txt-div-57" />
          <T as="div" className="body" i18nKey="auto-txt-div-58" />
          <T as="div" className="impact" i18nKey="auto-txt-div-59" />
        </div>
        <div
          className={`event restructure ${filter !== "all" && filter !== "restructure" ? "hidden" : ""}`}
        >
          <T as="div" className="event-header" i18nKey="auto-txt-div-60" />
          <T as="div" className="title" i18nKey="auto-txt-div-61" />
          <T as="div" className="body" i18nKey="auto-txt-div-62" />
          <T as="div" className="impact" i18nKey="auto-txt-div-63" />
        </div>
        <div
          className={`event restructure ${filter !== "all" && filter !== "restructure" ? "hidden" : ""}`}
        >
          <T as="div" className="event-header" i18nKey="auto-txt-div-64" />
          <T as="div" className="title" i18nKey="auto-txt-div-65" />
          <T as="div" className="body" i18nKey="auto-txt-div-66" />
          <T as="div" className="impact" i18nKey="auto-txt-div-67" />
        </div>
        <div
          className={`event win ${filter !== "all" && filter !== "win" ? "hidden" : ""}`}
        >
          <T as="div" className="event-header" i18nKey="auto-txt-div-68" />
          <T as="div" className="title" i18nKey="auto-txt-div-69" />
          <T as="div" className="body" i18nKey="auto-txt-div-70" />
          <T as="div" className="impact" i18nKey="auto-txt-div-71" />
        </div>
        <div
          className={`event win ${filter !== "all" && filter !== "win" ? "hidden" : ""}`}
        >
          <T as="div" className="event-header" i18nKey="auto-txt-div-72" />
          <T as="div" className="title" i18nKey="auto-txt-div-73" />
          <T as="div" className="body" i18nKey="auto-txt-div-74" />
          <T as="div" className="impact" i18nKey="auto-txt-div-75" />
        </div>
        <div
          className={`event restructure ${filter !== "all" && filter !== "restructure" ? "hidden" : ""}`}
        >
          <T as="div" className="event-header" i18nKey="auto-txt-div-76" />
          <T as="div" className="title" i18nKey="auto-txt-div-77" />
          <T as="div" className="body" i18nKey="auto-txt-div-78" />
          <T as="div" className="impact" i18nKey="auto-txt-div-79" />
        </div>
      </div>
    </>
  );
}
