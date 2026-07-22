import { state } from "../core/state.js";
import {
  getBrandColors,
  getZoneColors,
  ZONE_COLORS,
} from "../charts/chartUtils.js";

// THEME
// =============================================================

export function updateThemeUI(isDark: boolean) {
  const themeBtn = document.getElementById("themeToggleBtn");
  if (!themeBtn) return;
  const btnText = themeBtn.querySelector("span");
  const btnIcon = themeBtn.querySelector("svg");
  if (isDark) {
    if (btnText) btnText.textContent = state.isPt ? "Modo Claro" : "Light Mode";
    if (btnIcon)
      btnIcon.innerHTML =
        '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
  } else {
    if (btnText) btnText.textContent = state.isPt ? "Modo Escuro" : "Dark Mode";
    if (btnIcon)
      btnIcon.innerHTML =
        '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
  }
}

export function updateChartTheme() {
  const isDark = document.body.classList.contains("dark");
  // Palette + zone colors come from chartUtils.js's canonical getBrandColors()/
  // getZoneColors() — see the PALETTE comment there for why this must stay
  // the single source of truth (both light and dark mode) rather than a
  // second hand-copied set of values here.
  Object.assign(state.COLORS, getBrandColors(isDark));
  Object.assign(ZONE_COLORS, getZoneColors(isDark));

  state.baseOpts.scales.x.ticks.color = state.COLORS.muted;
  state.baseOpts.scales.y.ticks.color = state.COLORS.muted;
  if (state.baseOpts.scales.y.grid) {
    state.baseOpts.scales.y.grid.color = isDark
      ? "rgba(255,255,255,0.12)"
      : "rgba(0,0,0,0.05)";
  }
}
