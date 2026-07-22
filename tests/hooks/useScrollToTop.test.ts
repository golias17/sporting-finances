import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useScrollToTop } from "../../src/hooks/useScrollToTop";

describe("useScrollToTop", () => {
  beforeEach(() => {
    window.scrollY = 0;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts with button hidden", () => {
    const { result } = renderHook(() => useScrollToTop());
    expect(result.current.isVisible).toBe(false);
  });

  it("shows button when scrolled past threshold", () => {
    const { result } = renderHook(() => useScrollToTop(300));

    act(() => {
      window.scrollY = 400;
      window.dispatchEvent(new Event("scroll"));
    });

    expect(result.current.isVisible).toBe(true);
  });

  it("hides button when scrolled below threshold", () => {
    const { result } = renderHook(() => useScrollToTop(300));

    act(() => {
      window.scrollY = 400;
      window.dispatchEvent(new Event("scroll"));
    });
    expect(result.current.isVisible).toBe(true);

    act(() => {
      window.scrollY = 100;
      window.dispatchEvent(new Event("scroll"));
    });
    expect(result.current.isVisible).toBe(false);
  });

  it("scrollToTop scrolls window to top", () => {
    const scrollToSpy = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    const { result } = renderHook(() => useScrollToTop());

    act(() => {
      result.current.scrollToTop();
    });

    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });

  it("uses custom threshold", () => {
    const { result } = renderHook(() => useScrollToTop(500));

    act(() => {
      window.scrollY = 400;
      window.dispatchEvent(new Event("scroll"));
    });
    expect(result.current.isVisible).toBe(false);

    act(() => {
      window.scrollY = 600;
      window.dispatchEvent(new Event("scroll"));
    });
    expect(result.current.isVisible).toBe(true);
  });

  it("cleans up scroll listener on unmount", () => {
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useScrollToTop());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith("scroll", expect.any(Function));
  });
});
