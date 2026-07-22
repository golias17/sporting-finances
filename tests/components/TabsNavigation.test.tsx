import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { TabsNavigation } from "../../src/components/TabsNavigation";
import { useAppState } from "../../src/core/state";

vi.mock("../../src/core/state", () => ({
  useAppState: vi.fn(),
}));

vi.mock("../../src/utils/urlSync", () => ({
  syncStateToUrl: vi.fn(),
}));

vi.mock("../../src/features/events", () => ({
  syncEventsFilter: vi.fn(),
}));

vi.mock("../../src/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    T: ({ i18nKey, children, onClick, ...props }: any) => (
      <button onClick={onClick} {...props}>
        {children}
      </button>
    ),
  }),
}));

describe("TabsNavigation Component", () => {
  let mockSetActiveTab: any;
  let mockSetIsStoryVisible: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSetActiveTab = vi.fn();
    mockSetIsStoryVisible = vi.fn();

    (useAppState as any).mockImplementation((selector: any) => {
      const state = {
        activeTab: "overview",
        setActiveTab: mockSetActiveTab,
        setIsStoryVisible: mockSetIsStoryVisible,
      };
      return selector(state);
    });

    // Mock scrollTo on window and element
    window.scrollTo = vi.fn();
    Element.prototype.scrollTo = vi.fn();
  });

  it("renders all tabs and marks the active tab", () => {
    render(<TabsNavigation />);
    
    // There are 13 tabs
    const overviewTab = screen.getByRole("tab", { name: /01Overview/i });
    expect(overviewTab).toBeInTheDocument();
    expect(overviewTab).toHaveClass("active");

    const revenueTab = screen.getByRole("tab", { name: /02Revenue/i });
    expect(revenueTab).toBeInTheDocument();
    expect(revenueTab).not.toHaveClass("active");
  });

  it("calls setActiveTab when a tab is clicked", () => {
    render(<TabsNavigation />);
    
    const revenueTab = screen.getByRole("tab", { name: /02Revenue/i });
    fireEvent.click(revenueTab);

    expect(mockSetActiveTab).toHaveBeenCalledWith("revenue");
    expect(mockSetIsStoryVisible).toHaveBeenCalledWith(false);
  });

  it("supports keyboard navigation with arrow keys", () => {
    render(<TabsNavigation />);
    
    const nav = screen.getByRole("tablist");
    
    // Press right arrow
    fireEvent.keyDown(nav, { key: "ArrowRight" });
    expect(mockSetActiveTab).toHaveBeenCalledWith("revenue");

    // Press left arrow
    fireEvent.keyDown(nav, { key: "ArrowLeft" });
    expect(mockSetActiveTab).toHaveBeenCalledWith("playground"); // Wraps around
  });
});
