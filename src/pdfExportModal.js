import { state } from "./state.js";

// PDF EXPORT MODAL
// =============================================================

let pdfAbortController = null;

export function initPdfExport() {
  const btn = document.getElementById("pdfExportBtn");
  const modal = document.getElementById("pdfModal");
  const btnClose = document.getElementById("btnClosePdf");
  const form = document.getElementById("pdfCustomizerForm");

  if (!btn || !modal || !btnClose || !form) return;

  if (pdfAbortController) {
    pdfAbortController.abort();
  }
  pdfAbortController = new AbortController();
  const { signal } = pdfAbortController;

  function openModal() {
    // Sync active UI language to modal language selector
    const langSelect = document.getElementById("pdfLanguageSelect");
    if (langSelect) {
      langSelect.value = state.isPt ? "pt" : "en";
    }
    // Check all pages by default
    for (let i = 1; i <= 5; i++) {
      const chk = document.getElementById(`chkPage${i}`);
      if (chk) chk.checked = true;
    }
    // Clear custom note
    const notesText = document.getElementById("pdfNotesText");
    if (notesText) notesText.value = "";

    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    modal.classList.add("hidden");
    document.body.style.overflow = "";
  }

  btn.addEventListener("click", openModal, { signal });
  btnClose.addEventListener("click", closeModal, { signal });

  // Close on backdrop click
  modal.addEventListener(
    "click",
    (e) => {
      if (e.target === modal) {
        closeModal();
      }
    },
    { signal },
  );

  // Close on ESC key
  document.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Escape" && !modal.classList.contains("hidden")) {
        closeModal();
      }
    },
    { signal },
  );

  // Handle form submission
  form.addEventListener(
    "submit",
    (e) => {
      e.preventDefault();
      const langSelect = document.getElementById("pdfLanguageSelect");
      const chk1 = document.getElementById("chkPage1");
      const chk2 = document.getElementById("chkPage2");
      const chk3 = document.getElementById("chkPage3");
      const chk4 = document.getElementById("chkPage4");
      const chk5 = document.getElementById("chkPage5");
      const notesText = document.getElementById("pdfNotesText");
      if (
        !langSelect ||
        !chk1 ||
        !chk2 ||
        !chk3 ||
        !chk4 ||
        !chk5 ||
        !notesText
      )
        return;

      const lang = langSelect.value;
      const pages = [
        chk1.checked,
        chk2.checked,
        chk3.checked,
        chk4.checked,
        chk5.checked,
      ];
      const executiveNote = notesText.value;

      closeModal();
      import("./pdfGenerator.js")
        .then((m) => m.generateCuratedPdf({ lang, pages, executiveNote }))
        .catch((err) => {
          // generateCuratedPdf() is async and was previously fired-and-forgotten
          // here — a failure inside it (or in the dynamic import itself) became
          // a silent unhandled rejection with no user-facing signal at all.
          console.error("Failed to generate PDF export", err);
          showPdfExportErrorToast();
        });
    },
    { signal },
  );
}

// Minimal reuse of the .pwa-toast/.toast-body/.toast-btn styling already
// used by pwa.js's update/offline toasts — this is the only other failure
// in the app (besides the initial data-load error screen) that previously
// had no user-facing indicator at all beyond a console.error.
function showPdfExportErrorToast() {
  let toast = document.getElementById("pdf-export-error-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "pdf-export-error-toast";
    toast.className = "pwa-toast";
    document.body.appendChild(toast);
  }
  const msg = state.isPt
    ? "Não foi possível gerar o PDF. Tente novamente."
    : "Couldn't generate the PDF. Please try again.";
  const btnTxt = state.isPt ? "Ok" : "Dismiss";
  toast.innerHTML = `
    <div class="toast-body">
      <span>${msg}</span>
      <button id="pdf-export-error-btn" class="toast-btn">${btnTxt}</button>
    </div>
  `;
  setTimeout(() => toast.classList.add("visible"), 10);
  document
    .getElementById("pdf-export-error-btn")
    .addEventListener("click", () => toast.classList.remove("visible"), {
      once: true,
    });
}
