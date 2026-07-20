import { describe, it, expect, beforeEach, vi } from "vitest";
import { state } from "../src/state.js";
import { initPdfExport } from "../src/pdfExportModal.js";

const generateCuratedPdf = vi.fn(() => Promise.resolve());
vi.mock("../src/pdfGenerator.js", () => ({
  generateCuratedPdf: (...args) => generateCuratedPdf(...args),
}));

function buildDom() {
  document.body.innerHTML = `
    <button id="pdfExportBtn"></button>
    <div id="pdfModal" class="modal-overlay hidden">
      <div class="modal-content">
        <button id="btnClosePdf"></button>
        <form id="pdfCustomizerForm">
          <select id="pdfLanguageSelect">
            <option value="en">English</option>
            <option value="pt">Português</option>
          </select>
          <input type="checkbox" id="chkPage1" />
          <input type="checkbox" id="chkPage2" />
          <input type="checkbox" id="chkPage3" />
          <input type="checkbox" id="chkPage4" />
          <input type="checkbox" id="chkPage5" />
          <textarea id="pdfNotesText"></textarea>
          <button type="submit">Export</button>
        </form>
      </div>
    </div>
  `;
}

describe("pdfExportModal.js", () => {
  beforeEach(() => {
    buildDom();
    state.isPt = false;
    generateCuratedPdf.mockClear();
    generateCuratedPdf.mockImplementation(() => Promise.resolve());
  });

  it("does nothing (no throw) when a required element is missing", () => {
    document.body.innerHTML = "";
    expect(() => initPdfExport()).not.toThrow();
  });

  it("opens the modal, resets its fields, and syncs the language selector to the active UI language", () => {
    state.isPt = true;
    initPdfExport();

    document.getElementById("pdfNotesText").value = "leftover note";
    document.getElementById("chkPage1").checked = false;

    document.getElementById("pdfExportBtn").click();

    const modal = document.getElementById("pdfModal");
    expect(modal.classList.contains("hidden")).toBe(false);
    expect(document.body.style.overflow).toBe("hidden");
    expect(document.getElementById("pdfLanguageSelect").value).toBe("pt");
    for (let i = 1; i <= 5; i++) {
      expect(document.getElementById(`chkPage${i}`).checked).toBe(true);
    }
    expect(document.getElementById("pdfNotesText").value).toBe("");
  });

  it("closes the modal and restores body overflow via the close button", () => {
    initPdfExport();
    document.getElementById("pdfExportBtn").click();

    document.getElementById("btnClosePdf").click();

    expect(document.getElementById("pdfModal").classList.contains("hidden")).toBe(
      true,
    );
    expect(document.body.style.overflow).toBe("");
  });

  it("closes the modal on a backdrop click but not on a click inside its content", () => {
    initPdfExport();
    const modal = document.getElementById("pdfModal");
    document.getElementById("pdfExportBtn").click();
    expect(modal.classList.contains("hidden")).toBe(false);

    modal.querySelector(".modal-content").dispatchEvent(
      new window.MouseEvent("click", { bubbles: true }),
    );
    expect(modal.classList.contains("hidden")).toBe(false);

    modal.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    expect(modal.classList.contains("hidden")).toBe(true);
  });

  it("closes the modal on Escape, and is a no-op when the modal is already hidden", () => {
    initPdfExport();
    const modal = document.getElementById("pdfModal");

    // Already hidden — Escape shouldn't do anything observable.
    document.dispatchEvent(
      new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    expect(modal.classList.contains("hidden")).toBe(true);

    document.getElementById("pdfExportBtn").click();
    expect(modal.classList.contains("hidden")).toBe(false);

    document.dispatchEvent(
      new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    expect(modal.classList.contains("hidden")).toBe(true);
  });

  it("submits the chosen language, page selections, and executive note to generateCuratedPdf, then closes the modal", async () => {
    initPdfExport();
    document.getElementById("pdfExportBtn").click();

    document.getElementById("pdfLanguageSelect").value = "pt";
    document.getElementById("chkPage1").checked = true;
    document.getElementById("chkPage2").checked = false;
    document.getElementById("chkPage3").checked = true;
    document.getElementById("chkPage4").checked = false;
    document.getElementById("chkPage5").checked = true;
    document.getElementById("pdfNotesText").value = "Focus on the debt chapter.";

    document
      .getElementById("pdfCustomizerForm")
      .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

    expect(document.getElementById("pdfModal").classList.contains("hidden")).toBe(
      true,
    );

    await vi.waitFor(() => expect(generateCuratedPdf).toHaveBeenCalledTimes(1));
    expect(generateCuratedPdf).toHaveBeenCalledWith({
      lang: "pt",
      pages: [true, false, true, false, true],
      executiveNote: "Focus on the debt chapter.",
    });
  });

  it("shows a dismissible error toast (localised) when generateCuratedPdf rejects", async () => {
    generateCuratedPdf.mockImplementation(() =>
      Promise.reject(new Error("boom")),
    );
    state.isPt = true;
    initPdfExport();
    document.getElementById("pdfExportBtn").click();

    document
      .getElementById("pdfCustomizerForm")
      .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

    const toast = await vi.waitFor(() => {
      const el = document.getElementById("pdf-export-error-toast");
      if (!el) throw new Error("toast not rendered yet");
      return el;
    });
    expect(toast.textContent).toContain(
      "Não foi possível gerar o PDF. Tente novamente.",
    );

    await vi.waitFor(() => expect(toast.classList.contains("visible")).toBe(true));
    document.getElementById("pdf-export-error-btn").click();
    expect(toast.classList.contains("visible")).toBe(false);
  });

  it("does not accumulate duplicate listeners when called a second time", () => {
    initPdfExport();
    initPdfExport();

    document.getElementById("pdfExportBtn").click();
    expect(document.getElementById("pdfModal").classList.contains("hidden")).toBe(
      false,
    );

    document.getElementById("btnClosePdf").click();
    // If listeners had doubled up, this single click would still only close
    // once (closeModal() is idempotent) — the real signal is submit firing
    // generateCuratedPdf exactly once, checked below.
    expect(document.getElementById("pdfModal").classList.contains("hidden")).toBe(
      true,
    );
  });

  it("submits exactly once per click when initialised twice (AbortController re-init)", async () => {
    initPdfExport();
    initPdfExport();

    document.getElementById("pdfExportBtn").click();
    document
      .getElementById("pdfCustomizerForm")
      .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));

    await vi.waitFor(() => expect(generateCuratedPdf).toHaveBeenCalledTimes(1));
  });
});
