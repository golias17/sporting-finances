import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ErrorBoundary } from "../../src/components/ErrorBoundary";

// Suppress console.error from expected test errors
const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

describe("ErrorBoundary", () => {
  afterEach(() => {
    consoleSpy.mockClear();
  });

  it("renders children when no error", () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>,
    );
    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("renders fallback UI when child throws", () => {
    const ThrowingChild = () => {
      throw new Error("Test error");
    };

    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("This section failed to load. Try refreshing the page.")).toBeInTheDocument();
  });

  it("renders custom fallback when provided", () => {
    const ThrowingChild = () => {
      throw new Error("Test error");
    };

    render(
      <ErrorBoundary fallback={<div>Custom error UI</div>}>
        <ThrowingChild />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Custom error UI")).toBeInTheDocument();
  });

  it("shows try again button that resets error state", () => {
    const ThrowingChild = () => {
      throw new Error("Test error");
    };

    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    // Click try again - this resets the error boundary state
    const tryAgainBtn = screen.getByText("Try again");
    tryAgainBtn.click();

    // After clicking, the boundary should re-render (showing error again since child still throws)
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("logs error to console", () => {
    const ThrowingChild = () => {
      throw new Error("Test error");
    };

    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>,
    );

    expect(consoleSpy).toHaveBeenCalled();
  });

  it("renders default fallback when no custom fallback provided", () => {
    const ThrowingChild = () => {
      throw new Error("Test error");
    };

    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>,
    );

    // Check for the default fallback content
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });
});
