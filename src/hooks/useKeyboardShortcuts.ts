import { useEffect } from "react";
import { useAppState } from "../core/state.js";

/**
 * Global keyboard shortcuts hook for the application:
 * - `/` key: Focuses transfer ledger search input (`#searchInput`).
 * - `Escape` key: Exits Story Mode or closes active lightboxes/modals.
 */
export function useKeyboardShortcuts() {
  const isStoryVisible = useAppState((s) => s.isStoryVisible);
  const setIsStoryVisible = useAppState((s) => s.setIsStoryVisible);
  const setActiveTab = useAppState((s) => s.setActiveTab);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const activeEl = document.activeElement;
      const isInputActive =
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          (activeEl as HTMLElement).isContentEditable);

      if (e.key === "/" && !isInputActive) {
        e.preventDefault();
        const triggerFocus = (input: HTMLInputElement) => {
          input.focus();
          input.classList.remove("highlight-pulse");
          void input.offsetWidth;
          input.classList.add("highlight-pulse");
          setTimeout(() => input.classList.remove("highlight-pulse"), 1200);
        };

        const searchInput = document.getElementById("searchInput") as HTMLInputElement | null;
        if (searchInput) {
          triggerFocus(searchInput);
        } else {
          setActiveTab("data");
          setTimeout(() => {
            const input = document.getElementById("searchInput") as HTMLInputElement | null;
            if (input) triggerFocus(input);
          }, 100);
        }
      } else if (e.key === "Escape") {
        if (isStoryVisible) {
          setIsStoryVisible(false);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isStoryVisible, setIsStoryVisible, setActiveTab]);
}
