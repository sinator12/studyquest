import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("RootErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          backgroundColor: "#0F172A",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 32,
          fontFamily: "system-ui, -apple-system, sans-serif",
          textAlign: "center"
        }}>
          <div style={{
            background: "#1E293B",
            padding: 32,
            borderRadius: 16,
            maxWidth: 600,
            border: "1px solid rgba(239, 68, 68, 0.4)"
          }}>
            <h2 style={{ color: "#EF4444", marginTop: 0 }}>Something went wrong</h2>
            <p style={{ color: "#CBD5E1", fontSize: 14 }}>
              {this.state.error?.message || "An unexpected error occurred."}
            </p>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              style={{
                marginTop: 16,
                padding: "10px 20px",
                background: "#7C3AED",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: "bold"
              }}
            >
              Reset & Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootEl = document.getElementById("root");
if (rootEl) {
  createRoot(rootEl).render(
    <React.StrictMode>
      <RootErrorBoundary>
        <App />
      </RootErrorBoundary>
    </React.StrictMode>,
  );
}
