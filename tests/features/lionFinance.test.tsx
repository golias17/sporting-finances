import { describe, it, expect, beforeEach, vi } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import { state } from "../../src/core/state.js";
import { LionFinance } from "../../src/features/bonds/LionFinance";

vi.mock("../../src/core/state", () => ({
  useAppState: vi.fn(),
  state: { setIsPt: vi.fn(), isPt: false },
}));

describe("LionFinance", () => {
  beforeEach(() => {
    const mockState: Record<string, any> = {
      isPt: false,
      activeLionTab: "both",
      setActiveLionTab: vi.fn(),
    };
    (state as any).useAppState = vi.fn((selector: any) => selector(mockState));
  });

  it("renders without crashing", () => {
    const { container } = render(<LionFinance />);
    expect(container.firstChild).toBeTruthy();
  });

  it("renders with switcher", () => {
    const { container } = render(<LionFinance />);
    expect(container.querySelector(".lf-switcher")).toBeTruthy();
  });

  it("renders with no1 active tab", () => {
    const mockState: Record<string, any> = {
      isPt: false,
      activeLionTab: "no1",
      setActiveLionTab: vi.fn(),
    };
    (state as any).useAppState = vi.fn((selector: any) => selector(mockState));

    const { container } = render(<LionFinance />);
    expect(container.querySelector(".lf-switcher")).toBeTruthy();
  });

  it("renders with no2 active tab", () => {
    const mockState: Record<string, any> = {
      isPt: false,
      activeLionTab: "no2",
      setActiveLionTab: vi.fn(),
    };
    (state as any).useAppState = vi.fn((selector: any) => selector(mockState));

    const { container } = render(<LionFinance />);
    expect(container.querySelector(".lf-switcher")).toBeTruthy();
  });

  it("renders with Portuguese labels", () => {
    const mockState: Record<string, any> = {
      isPt: true,
      activeLionTab: "both",
      setActiveLionTab: vi.fn(),
    };
    (state as any).useAppState = vi.fn((selector: any) => selector(mockState));

    const { container } = render(<LionFinance />);
    expect(container.querySelector(".lf-switcher")).toBeTruthy();
  });
});
