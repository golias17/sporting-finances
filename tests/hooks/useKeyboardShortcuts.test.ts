import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useKeyboardShortcuts } from "../../src/hooks/useKeyboardShortcuts.ts";
import { useAppState } from "../../src/core/state.ts";

describe("useKeyboardShortcuts Hook", () => {
  beforeEach(() => {
    act(() => {
      useAppState.setState({
        isStoryVisible: false,
        activeTab: "overview",
      });
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runAllTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("focuses #searchInput when / is pressed outside input elements", () => {
    const input = document.createElement("input");
    input.id = "searchInput";
    document.body.appendChild(input);
    const focusSpy = vi.spyOn(input, "focus");

    renderHook(() => useKeyboardShortcuts());

    act(() => {
      const event = new KeyboardEvent("keydown", { key: "/" });
      window.dispatchEvent(event);
    });

    expect(focusSpy).toHaveBeenCalled();
    document.body.removeChild(input);
  });

  it("switches to data tab if #searchInput is not in DOM when / is pressed", () => {
    renderHook(() => useKeyboardShortcuts());

    act(() => {
      const event = new KeyboardEvent("keydown", { key: "/" });
      window.dispatchEvent(event);
    });

    expect(useAppState.getState().activeTab).toBe("data");
  });

  it("closes story mode when Escape is pressed", () => {
    act(() => {
      useAppState.setState({ isStoryVisible: true });
    });

    renderHook(() => useKeyboardShortcuts());

    act(() => {
      const event = new KeyboardEvent("keydown", { key: "Escape" });
      window.dispatchEvent(event);
    });

    expect(useAppState.getState().isStoryVisible).toBe(false);
  });
});
