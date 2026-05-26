import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { state } from "../src/state.js";
import { showUpdateToast, initPWA } from "../src/pwa.js";

describe("pwa.js", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    state.isPt = false;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should create the PWA toast element with English text", () => {
    state.isPt = false;
    const confirmSpy = vi.fn();

    showUpdateToast(confirmSpy);

    const toast = document.getElementById("pwa-update-toast");
    expect(toast).not.toBeNull();
    expect(toast.innerHTML).toContain("New version available!");
    expect(toast.innerHTML).toContain("Update");
  });

  it("should create the PWA toast element with Portuguese text", () => {
    state.isPt = true;
    const confirmSpy = vi.fn();

    showUpdateToast(confirmSpy);

    const toast = document.getElementById("pwa-update-toast");
    expect(toast).not.toBeNull();
    expect(toast.innerHTML).toContain("Nova versão disponível!");
    expect(toast.innerHTML).toContain("Atualizar");
  });

  it("should execute callback when update button is clicked", () => {
    const confirmSpy = vi.fn();
    showUpdateToast(confirmSpy);

    const btn = document.getElementById("pwa-update-btn");
    expect(btn).not.toBeNull();

    btn.click();
    expect(confirmSpy).toHaveBeenCalledTimes(1);

    const toast = document.getElementById("pwa-update-toast");
    expect(toast.classList.contains("visible")).toBe(false);
  });

  it("initPWA does not register service worker in test environment", () => {
    const serviceWorkerMock = { register: vi.fn() };
    Object.defineProperty(navigator, "serviceWorker", {
      value: serviceWorkerMock,
      configurable: true,
    });

    initPWA();

    // Since import.meta.env.MODE is 'test', registration is skipped
    expect(serviceWorkerMock.register).not.toHaveBeenCalled();
  });
});
