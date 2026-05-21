"use client";
import React from "react";
import { AlertTriangle, RefreshCw, ChevronDown } from "lucide-react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, showDetails: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });

    // ── 寫入 localStorage 供開發者分析 ──
    try {
      const logs = JSON.parse(localStorage.getItem("__error_logs") || "[]");
      logs.unshift({
        timestamp: new Date().toISOString(),
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo?.componentStack,
        url: typeof window !== "undefined" ? window.location.href : "",
      });
      // 只保留最新 50 筆
      localStorage.setItem("__error_logs", JSON.stringify(logs.slice(0, 50)));
    } catch (_) {}

    // ── 同時打印到 console 方便開發環境分析 ──
    console.group("🚨 [ErrorBoundary] Caught an error");
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);
    console.error("Component Stack:", errorInfo?.componentStack);
    console.groupEnd();
  }

  handleReset() {
    this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const { error, errorInfo, showDetails } = this.state;
    const isDev = process.env.NODE_ENV === "development";

    return (
      <div style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}>
        <div style={{
          maxWidth: "560px",
          width: "100%",
          background: "var(--bg-surface, #1a1a2e)",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          borderRadius: "20px",
          padding: "2rem",
          boxShadow: "0 20px 60px rgba(239, 68, 68, 0.1)",
          textAlign: "center",
        }}>
          {/* Icon */}
          <div style={{
            width: "64px", height: "64px",
            borderRadius: "50%",
            background: "rgba(239, 68, 68, 0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 1.25rem",
          }}>
            <AlertTriangle size={30} color="#ef4444" />
          </div>

          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary, #fff)", marginBottom: "0.5rem" }}>
            哎呀！發生了一點小問題 🔧
          </h2>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted, #aaa)", lineHeight: 1.6, marginBottom: "1.5rem" }}>
            頁面遇到了一個未預期的錯誤，請嘗試重新整理，若問題持續發生請聯繫管理員。
          </p>

          {/* 錯誤摘要 */}
          <div style={{
            background: "rgba(239, 68, 68, 0.08)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            borderRadius: "10px",
            padding: "0.75rem 1rem",
            marginBottom: "1.25rem",
            textAlign: "left",
            fontFamily: "monospace",
            fontSize: "0.78rem",
            color: "#ef4444",
            wordBreak: "break-word",
          }}>
            {error?.message || "Unknown error"}
          </div>

          {/* 操作按鈕 */}
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => this.handleReset()}
              style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                padding: "0.6rem 1.25rem",
                background: "var(--accent, #6366f1)",
                border: "none",
                borderRadius: "999px",
                color: "#fff",
                fontWeight: 600,
                fontSize: "0.85rem",
                cursor: "pointer",
              }}
            >
              <RefreshCw size={14} /> 重新嘗試
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: "0.6rem 1.25rem",
                background: "transparent",
                border: "1px solid var(--border, rgba(255,255,255,0.1))",
                borderRadius: "999px",
                color: "var(--text-secondary, #ccc)",
                fontWeight: 600,
                fontSize: "0.85rem",
                cursor: "pointer",
              }}
            >
              重新整理頁面
            </button>
          </div>

          {/* 詳細錯誤資訊（開發模式 或 展開時顯示）*/}
          {(isDev || showDetails) && (
            <details
              open={isDev}
              style={{
                marginTop: "1.5rem",
                textAlign: "left",
                border: "1px solid var(--border, rgba(255,255,255,0.08))",
                borderRadius: "10px",
                overflow: "hidden",
              }}
            >
              <summary style={{
                padding: "0.75rem 1rem",
                background: "var(--bg-elevated, #23233a)",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.8rem",
                color: "var(--text-secondary, #ccc)",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                listStyle: "none",
              }}>
                <ChevronDown size={14} /> 詳細錯誤紀錄 (Error Log)
              </summary>
              <pre style={{
                padding: "1rem",
                fontSize: "0.7rem",
                lineHeight: 1.6,
                color: "var(--text-muted, #888)",
                overflowX: "auto",
                margin: 0,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}>
{`[Stack Trace]
${error?.stack || "N/A"}

[Component Stack]
${errorInfo?.componentStack || "N/A"}`}
              </pre>
            </details>
          )}

          {/* 非開發環境時提供「展開詳細資訊」按鈕 */}
          {!isDev && !showDetails && (
            <button
              onClick={() => this.setState({ showDetails: true })}
              style={{
                marginTop: "1rem",
                background: "none",
                border: "none",
                color: "var(--text-muted, #888)",
                fontSize: "0.75rem",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              展開詳細錯誤資訊
            </button>
          )}
        </div>
      </div>
    );
  }
}
