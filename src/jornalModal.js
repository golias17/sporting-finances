import { trapFocusWithin } from "./focusTrap.js";

// JORNAL MODAL
// =============================================================

// AbortController for modal listeners — replaced on each call so re-invoking
// initJornalModal never accumulates duplicate document-level keydown handlers.
let jornalAbortController = null;

export function initJornalModal() {
  const btnOpen = document.getElementById("btnJornalModal");
  const btnClose = document.getElementById("btnCloseJornal");
  const modal = document.getElementById("jornalModal");
  const container = document.getElementById("jornalIframeContainer");

  if (!btnOpen || !btnClose || !modal || !container) return;

  if (jornalAbortController) {
    jornalAbortController.abort();
  }
  jornalAbortController = new AbortController();
  const { signal } = jornalAbortController;

  const iframeSrc =
    "https://e.issuu.com/embed.html?backgroundColor=%23008057&backgroundColorFullscreen=%23008057&d=jornal_sporting_n._4077&hideIssuuLogo=true&hideShareButton=true&showOtherPublicationsAsSuggestions=true&u=sporting-digitalpaper";

  // Restores focus to whatever triggered the modal once it closes, and
  // releases the Tab focus trap — see trapFocusWithin() in focusTrap.js.
  let previouslyFocused = null;
  let releaseFocusTrap = null;

  function openModal() {
    // Inject iframe only on first open
    if (container.innerHTML === "") {
      container.innerHTML = `<iframe src="${iframeSrc}" allow="clipboard-write; autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen="true"></iframe>`;
    }
    previouslyFocused = document.activeElement;
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden"; // Prevent background scrolling
    releaseFocusTrap = trapFocusWithin(modal);
    btnClose.focus();
  }

  function closeModal() {
    modal.classList.add("hidden");
    document.body.style.overflow = ""; // Restore background scrolling
    if (releaseFocusTrap) {
      releaseFocusTrap();
      releaseFocusTrap = null;
    }
    if (previouslyFocused instanceof HTMLElement) {
      previouslyFocused.focus();
    }
    previouslyFocused = null;
  }

  btnOpen.addEventListener("click", openModal, { signal });
  btnClose.addEventListener("click", closeModal, { signal });

  // Close on outside click
  modal.addEventListener(
    "click",
    (e) => {
      if (e.target === modal) closeModal();
    },
    { signal },
  );

  // Close on escape key
  document.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Escape" && !modal.classList.contains("hidden")) {
        closeModal();
      }
    },
    { signal },
  );
}
