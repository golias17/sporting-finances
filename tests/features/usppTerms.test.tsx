import { describe, it, expect, beforeEach, vi } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import { state } from "../../src/core/state.js";
import { UsppTerms } from "../../src/features/bonds/UsppTerms";

vi.mock("../../src/core/state", () => ({
  useAppState: vi.fn(),
  state: { setIsPt: vi.fn(), isPt: false },
}));

describe("UsppTerms", () => {
  beforeEach(() => {
    const mockState: Record<string, any> = {
      isPt: false,
    };
    (state as any).useAppState = vi.fn((selector: any) => selector(mockState));
  });

  it("renders without crashing", () => {
    const { container } = render(<UsppTerms />);
    expect(container.firstChild).toBeTruthy();
  });

  it("renders terms grid", () => {
    const { container } = render(<UsppTerms />);
    expect(container.querySelector(".uspp-grid")).toBeTruthy();
  });

  it("renders all term items", () => {
    const { container } = render(<UsppTerms />);
    const items = container.querySelectorAll(".uspp-term");
    expect(items.length).toBeGreaterThan(0);
  });

  it("renders with Portuguese labels", () => {
    const mockState: Record<string, any> = {
      isPt: true,
    };
    (state as any).useAppState = vi.fn((selector: any) => selector(mockState));

    const { container } = render(<UsppTerms />);
    expect(container.querySelector(".uspp-grid")).toBeTruthy();
  });

  it("renders term labels", () => {
    const { container } = render(<UsppTerms />);
    const labels = container.querySelectorAll(".ut-label");
    expect(labels.length).toBeGreaterThan(0);
  });

  it("renders term values", () => {
    const { container } = render(<UsppTerms />);
    const values = container.querySelectorAll(".ut-value");
    expect(values.length).toBeGreaterThan(0);
  });

  it("renders highlighted terms", () => {
    const { container } = render(<UsppTerms />);
    const highlighted = container.querySelectorAll(".ut-value.highlight");
    expect(highlighted.length).toBeGreaterThan(0);
  });

  it("renders term notes", () => {
    const { container } = render(<UsppTerms />);
    const notes = container.querySelectorAll(".ut-note");
    expect(notes.length).toBeGreaterThan(0);
  });

  it("renders uses section", () => {
    const { container } = render(<UsppTerms />);
    expect(container.querySelector(".uspp-uses")).toBeTruthy();
  });

  it("renders use items", () => {
    const { container } = render(<UsppTerms />);
    const items = container.querySelectorAll(".uspp-use-row");
    expect(items.length).toBeGreaterThan(0);
  });
});
