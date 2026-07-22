import React, { Component, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Catches rendering errors in lazy-loaded tab chunks and displays a
 * user-friendly fallback instead of crashing the entire SPA.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary] Tab render failed:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="card" style={{ padding: "2rem", textAlign: "center" }}>
            <h3 style={{ color: "var(--neg)", marginBottom: "0.5rem" }}>
              Something went wrong
            </h3>
            <p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>
              This section failed to load. Try refreshing the page.
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              style={{
                marginTop: "1rem",
                padding: "0.5rem 1rem",
                background: "var(--green)",
                color: "#fff",
                border: "none",
                borderRadius: "var(--radius-lg)",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
