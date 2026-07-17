import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { state } from "../src/state.js";
import { showUpdateToast, showOfflineReadyToast, initPWA } from "../src/pwa.js";

vi.mock("virtual:pwa-register", () => {
  const registerSWMock = vi.fn().mockImplementation((opts) => {
    if (opts) {
      if (opts.onNeedRefresh) opts.onNeedRefresh();
      if (opts.onOfflineReady) opts.onOfflineReady();
    }
    return vi.fn();
  });
  return {
    registerSW: registerSWMock,
  };
});

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

  it("should show offline ready toast in English and dismiss it", () => {
    state.isPt = false;
    showOfflineReadyToast();

    const toast = document.getElementById("pwa-offline-toast");
    expect(toast).not.toBeNull();
    expect(toast.innerHTML).toContain("App is ready to work offline!");

    const btn = document.getElementById("pwa-offline-btn");
    expect(btn).not.toBeNull();
    expect(btn.textContent).toBe("Dismiss");

    btn.click();
    expect(toast.classList.contains("visible")).toBe(false);
  });

  it("should show offline ready toast in Portuguese", () => {
    state.isPt = true;
    showOfflineReadyToast();

    const toast = document.getElementById("pwa-offline-toast");
    expect(toast).not.toBeNull();
    expect(toast.innerHTML).toContain(
      "Aplicação pronta para funcionar offline!",
    );

    const btn = document.getElementById("pwa-offline-btn");
    expect(btn.textContent).toBe("Ok");
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

  it("initPWA registers service worker in non-test mode and triggers callbacks", async () => {
    vi.stubEnv("MODE", "production");

    const serviceWorkerMock = { register: vi.fn() };
    Object.defineProperty(navigator, "serviceWorker", {
      value: serviceWorkerMock,
      configurable: true,
    });

    initPWA();

    await vi.waitFor(() => {
      const updateToast = document.getElementById("pwa-update-toast");
      const offlineToast = document.getElementById("pwa-offline-toast");
      expect(updateToast).not.toBeNull();
      expect(offlineToast).not.toBeNull();
    });

    vi.unstubAllEnvs();
  });
});
