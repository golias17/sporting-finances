import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TabsNavigation } from "../../src/components/TabsNavigation";

vi.mock("../../src/core/state", () => ({
  useAppState: vi.fn(),
}));

vi.mock("../../src/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    T: ({ as: Component = "span", children, i18nKey, ...props }: any) => (
      <Component {...props}>{children || i18nKey}</Component>
    ),
  }),
}));

vi.mock("../../src/utils/urlSync", () => ({
  syncStateToUrl: vi.fn(),
}));

const mockSetActiveTab = vi.fn();
const mockSetIsStoryVisible = vi.fn();

import { useAppState } from "../../src/core/state";

describe("TabsNavigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAppState as any).mockImplementation((selector: any) => {
      const state = {
        activeTab: "overview",
        setActiveTab: mockSetActiveTab,
        setIsStoryVisible: mockSetIsStoryVisible,
      };
      return selector(state);
    });
  });

  it("renders all tab buttons", () => {
    render(<TabsNavigation />);
    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Revenue")).toBeInTheDocument();
    expect(screen.getByText("Health")).toBeInTheDocument();
    expect(screen.getByText("Debt")).toBeInTheDocument();
    expect(screen.getByText("Instruments")).toBeInTheDocument();
    expect(screen.getByText("Squad")).toBeInTheDocument();
    expect(screen.getByText("Cash")).toBeInTheDocument();
    expect(screen.getByText("Compare")).toBeInTheDocument();
    expect(screen.getByText("Events")).toBeInTheDocument();
    expect(screen.getByText("Data")).toBeInTheDocument();
    expect(screen.getByText("Club SAD")).toBeInTheDocument();
    expect(screen.getByText("News")).toBeInTheDocument();
    expect(screen.getByText("Playground")).toBeInTheDocument();
  });

  it("marks the active tab", () => {
    render(<TabsNavigation />);
    const overviewBtn = screen.getByText("Overview").closest("button");
    expect(overviewBtn).toHaveAttribute("aria-selected", "true");
  });

  it("calls setActiveTab when a tab is clicked", () => {
    render(<TabsNavigation />);
    fireEvent.click(screen.getByText("Revenue"));
    expect(mockSetActiveTab).toHaveBeenCalledWith("revenue");
  });

  it("hides story when switching away from overview", () => {
    (useAppState as any).mockImplementation((selector: any) => {
      const state = {
        activeTab: "overview",
        setActiveTab: mockSetActiveTab,
        setIsStoryVisible: mockSetIsStoryVisible,
      };
      return selector(state);
    });

    render(<TabsNavigation />);
    fireEvent.click(screen.getByText("Revenue"));
    expect(mockSetIsStoryVisible).toHaveBeenCalledWith(false);
  });

  it("does not hide story when clicking overview", () => {
    (useAppState as any).mockImplementation((selector: any) => {
      const state = {
        activeTab: "revenue",
        setActiveTab: mockSetActiveTab,
        setIsStoryVisible: mockSetIsStoryVisible,
      };
      return selector(state);
    });

    render(<TabsNavigation />);
    fireEvent.click(screen.getByText("Overview"));
    expect(mockSetIsStoryVisible).not.toHaveBeenCalledWith(false);
  });

  it("navigates tabs with arrow keys", () => {
    render(<TabsNavigation />);
    const overviewBtn = screen.getByText("Overview").closest("button")!;
    overviewBtn.focus();

    fireEvent.keyDown(overviewBtn, { key: "ArrowRight" });
    expect(mockSetActiveTab).toHaveBeenCalledWith("revenue");
  });

  it("wraps around with arrow keys", () => {
    (useAppState as any).mockImplementation((selector: any) => {
      const state = {
        activeTab: "playground",
        setActiveTab: mockSetActiveTab,
        setIsStoryVisible: mockSetIsStoryVisible,
      };
      return selector(state);
    });

    render(<TabsNavigation />);
    const playgroundBtn = screen.getByText("Playground").closest("button")!;
    playgroundBtn.focus();

    fireEvent.keyDown(playgroundBtn, { key: "ArrowRight" });
    expect(mockSetActiveTab).toHaveBeenCalledWith("overview");
  });

  it("navigates left with arrow keys", () => {
    render(<TabsNavigation />);
    const overviewBtn = screen.getByText("Overview").closest("button")!;
    overviewBtn.focus();

    fireEvent.keyDown(overviewBtn, { key: "ArrowLeft" });
    expect(mockSetActiveTab).toHaveBeenCalledWith("playground");
  });

  it("ignores non-arrow keys", () => {
    render(<TabsNavigation />);
    const overviewBtn = screen.getByText("Overview").closest("button")!;
    overviewBtn.focus();

    fireEvent.keyDown(overviewBtn, { key: "Enter" });
    expect(mockSetActiveTab).not.toHaveBeenCalled();
  });
});
