import React, { Component, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onRetry?: () => void;
  maxRetries?: number;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

/**
 * Catches rendering errors in lazy-loaded tab chunks and displays a
 * user-friendly fallback instead of crashing the entire SPA.
 * Supports automatic retry with configurable max retries.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary] Render failed:", error, errorInfo);
  }

  handleRetry = () => {
    const { maxRetries = 3, onRetry } = this.props;
    const { retryCount } = this.state;

    if (retryCount < maxRetries) {
      this.setState((prev) => ({
        hasError: false,
        error: null,
        retryCount: prev.retryCount + 1,
      }));
      onRetry?.();
    }
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, retryCount: 0 });
  };

  render() {
    const { hasError, error, retryCount } = this.state;
    const { children, fallback, maxRetries = 3 } = this.props;

    if (hasError) {
      if (fallback) {
        return fallback;
      }

      const canRetry = retryCount < maxRetries;

      return (
        <div className="card" style={{ padding: "2rem", textAlign: "center" }}>
          <div style={{ marginBottom: "1rem" }}>
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--neg)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h3 style={{ color: "var(--neg)", marginBottom: "0.5rem", margin: "0 0 0.5rem" }}>
            Something went wrong
          </h3>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: "0 0 1rem" }}>
            {error?.message || "This section failed to load."}
          </p>
          {retryCount > 0 && (
            <p style={{ color: "var(--muted)", fontSize: "0.75rem", margin: "0 0 1rem" }}>
              Retry {retryCount}/{maxRetries}
            </p>
          )}
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
            {canRetry && (
              <button
                onClick={this.handleRetry}
                style={{
                  padding: "0.5rem 1rem",
                  background: "var(--green)",
                  color: "var(--paper)",
                  border: "none",
                  borderRadius: "var(--radius-lg)",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                }}
              >
                Try again
              </button>
            )}
            <button
              onClick={this.handleReset}
              style={{
                padding: "0.5rem 1rem",
                background: "var(--surface)",
                color: "var(--ink)",
                border: "1px solid var(--rule)",
                borderRadius: "var(--radius-lg)",
                cursor: "pointer",
                fontSize: "0.875rem",
              }}
            >
              Reset
            </button>
          </div>
        </div>
      );
    }

    return children;
  }
}
