"use client";
import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    try {
      const logs = JSON.parse(localStorage.getItem("__error_logs") || "[]");
      logs.unshift({
        timestamp: new Date().toISOString(),
        type: "global",
        message: error?.message,
        stack: error?.stack,
        url: window.location.href,
      });
      localStorage.setItem("__error_logs", JSON.stringify(logs.slice(0, 50)));
    } catch (_) {}
    console.error("🚨 [GlobalError]", error);
  }, [error]);

  return (
    <html>
      <body style={{ margin: 0, background: "#0f0f1a", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "sans-serif" }}>
        <div style={{ textAlign: "center", padding: "2rem", maxWidth: "480px" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(239,68,68,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
            <AlertTriangle size={30} color="#ef4444" />
          </div>
          <h1 style={{ color: "#fff", fontSize: "1.25rem", fontWeight: 700 }}>系統發生嚴重錯誤</h1>
          <p style={{ color: "#aaa", fontSize: "0.85rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
            應用程式發生了一個無法恢復的錯誤，錯誤已記錄至本地 Log 供開發者分析。
          </p>
          <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "0.75rem 1rem", fontFamily: "monospace", fontSize: "0.76rem", color: "#ef4444", marginBottom: "1.5rem", wordBreak: "break-word" }}>
            {error?.message || "Unknown error"}
          </div>
          <button onClick={() => reset()} style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.65rem 1.5rem", background: "#6366f1", border: "none", borderRadius: "999px", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: "0.9rem" }}>
            <RefreshCw size={15} /> 重新嘗試
          </button>
        </div>
      </body>
    </html>
  );
}
