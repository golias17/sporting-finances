import { state } from "./state.js";

// KEY EVENTS TIMELINE & FILTERING
// =============================================================
export function syncEventsFilter() {
  const filterValue = state.activeEventFilter || "all";
  const eventLegend = document.querySelector(".event-legend");
  if (eventLegend) {
    eventLegend.querySelectorAll(".el-filter").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.filter === filterValue);
    });
  }
  const events = document.querySelectorAll("#eventsList .event");
  events.forEach((event) => {
    if (filterValue === "all") {
      event.classList.remove("hidden");
    } else {
      event.classList.toggle("hidden", !event.classList.contains(filterValue));
    }
  });
}

export function initEventFilter() {
  const eventLegend = document.querySelector(".event-legend");
  if (eventLegend) {
    eventLegend.addEventListener("click", (e) => {
      const filterBtn = e.target.closest(".el-filter");
      if (!filterBtn) return;
      state.activeEventFilter = filterBtn.dataset.filter;
      syncEventsFilter();
    });
  }
}
