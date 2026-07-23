import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLightbox, LightboxProvider } from "../../src/hooks/useLightboxContext";
import React from "react";

const mockOpen = vi.fn();

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <LightboxProvider open={mockOpen}>{children}</LightboxProvider>
);

describe("useLightbox context", () => {
  beforeEach(() => {
    mockOpen.mockClear();
  });

  it("provides open function from context", () => {
    const { result } = renderHook(() => useLightbox(), { wrapper });
    expect(result.current.open).toBe(mockOpen);
  });

  it("calls open function when invoked", () => {
    const { result } = renderHook(() => useLightbox(), { wrapper });
    const fakeImg = document.createElement("img");

    act(() => {
      result.current.open(fakeImg as any);
    });

    expect(mockOpen).toHaveBeenCalledTimes(1);
    expect(mockOpen.mock.calls[0][0]).toBe(fakeImg);
  });

  it("calls open with options when provided", () => {
    const { result } = renderHook(() => useLightbox(), { wrapper });
    const fakeImg = document.createElement("img");
    const options = { frontSrc: "front.jpg", backSrc: "back.jpg" };

    act(() => {
      result.current.open(fakeImg as any, options);
    });

    expect(mockOpen).toHaveBeenCalledTimes(1);
    expect(mockOpen.mock.calls[0][0]).toBe(fakeImg);
    expect(mockOpen.mock.calls[0][1]).toEqual(options);
  });

  it("provides default open function when no provider", () => {
    const { result } = renderHook(() => useLightbox());
    expect(typeof result.current.open).toBe("function");
    // Should not throw
    result.current.open(document.createElement("img") as any);
  });
});
