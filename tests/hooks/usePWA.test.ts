import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePWA } from "../../src/hooks/usePWA";

// Mock the virtual:pwa-register module
vi.mock("virtual:pwa-register", () => ({
  registerSW: vi.fn(() => vi.fn()),
}));

describe("usePWA", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts with toasts hidden", () => {
    const { result } = renderHook(() => usePWA());
    expect(result.current.showUpdate).toBe(false);
    expect(result.current.showOfflineReady).toBe(false);
  });

  it("provides localized messages", () => {
    const { result } = renderHook(() => usePWA());
    expect(result.current.updateMsg).toContain("New version");
    expect(result.current.offlineMsg).toContain("offline");
    expect(result.current.updateBtnTxt).toBe("Update");
    expect(result.current.offlineBtnTxt).toBe("Dismiss");
  });

  it("dismissUpdate hides update toast", () => {
    const { result } = renderHook(() => usePWA());

    act(() => {
      result.current.dismissUpdate();
    });

    expect(result.current.showUpdate).toBe(false);
  });

  it("dismissOfflineReady hides offline toast", () => {
    const { result } = renderHook(() => usePWA());

    act(() => {
      result.current.dismissOfflineReady();
    });

    expect(result.current.showOfflineReady).toBe(false);
  });

  it("applyUpdate calls updateSW and hides toast", () => {
    const { result } = renderHook(() => usePWA());

    act(() => {
      result.current.applyUpdate();
    });

    expect(result.current.showUpdate).toBe(false);
  });
});
