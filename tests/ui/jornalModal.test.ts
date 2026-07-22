import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { initJornalModal } from "../../src/ui/jornalModal";
import * as focusTrap from "../../src/utils/focusTrap";

vi.mock("../../src/utils/focusTrap", () => ({
  trapFocusWithin: vi.fn(() => vi.fn()), // Returns a release function
}));

describe("Jornal Modal", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <button id="btnJornalModal">Open Jornal</button>
      <div id="jornalModal" class="hidden">
        <button id="btnCloseJornal">Close Jornal</button>
        <div id="jornalIframeContainer"></div>
      </div>
    `;
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("does nothing if elements are missing", () => {
    document.body.innerHTML = "";
    initJornalModal();
    // No errors thrown, nothing happens
  });

  it("opens modal, injects iframe, and locks scroll on click", () => {
    initJornalModal();

    const btnOpen = document.getElementById("btnJornalModal")!;
    const modal = document.getElementById("jornalModal")!;
    const container = document.getElementById("jornalIframeContainer")!;

    expect(modal.classList.contains("hidden")).toBe(true);
    expect(container.innerHTML).toBe("");

    btnOpen.click();

    expect(modal.classList.contains("hidden")).toBe(false);
    expect(document.body.style.overflow).toBe("hidden");
    expect(container.innerHTML).toContain("<iframe");
    expect(focusTrap.trapFocusWithin).toHaveBeenCalledWith(modal);
  });

  it("closes modal and restores scroll on close button click", () => {
    initJornalModal();

    const btnOpen = document.getElementById("btnJornalModal")!;
    const btnClose = document.getElementById("btnCloseJornal")!;
    const modal = document.getElementById("jornalModal")!;

    btnOpen.click();
    expect(modal.classList.contains("hidden")).toBe(false);

    btnClose.click();
    expect(modal.classList.contains("hidden")).toBe(true);
    expect(document.body.style.overflow).toBe("");
  });

  it("closes modal when clicking outside (on the modal overlay)", () => {
    initJornalModal();

    const btnOpen = document.getElementById("btnJornalModal")!;
    const modal = document.getElementById("jornalModal")!;

    btnOpen.click();
    expect(modal.classList.contains("hidden")).toBe(false);

    modal.click(); // Simulate clicking the overlay
    expect(modal.classList.contains("hidden")).toBe(true);
  });

  it("closes modal on Escape key", () => {
    initJornalModal();

    const btnOpen = document.getElementById("btnJornalModal")!;
    const modal = document.getElementById("jornalModal")!;

    btnOpen.click();
    expect(modal.classList.contains("hidden")).toBe(false);

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(modal.classList.contains("hidden")).toBe(true);
  });
});
