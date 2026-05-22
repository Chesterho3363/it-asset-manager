"use client";
import { useState, useEffect } from "react";
import { AlertTriangle, Trash2, ChevronDown, ChevronRight } from "lucide-react";

export default function ErrorLogViewer() {
  const [logs, setLogs] = useState([]);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const stored = JSON.parse(localStorage.getItem("__error_logs") || "[]");
        setLogs(stored);
      } catch {
        setLogs([]);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const clearLogs = () => {
    localStorage.removeItem("__error_logs");
    setLogs([]);
  };

  if (logs.length === 0) {
    return (
      <div style={{ padding: "1.5rem", background: "var(--bg-surface)", borderRadius: "12px", border: "1px solid var(--border)", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
        ✅ 目前沒有任何錯誤紀錄
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
        <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>共 {logs.length} 筆錯誤紀錄</span>
        <button onClick={clearLogs} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.9rem", background: "var(--danger-soft)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", color: "var(--danger)", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}>
          <Trash2 size={12} /> 清除全部
        </button>
      </div>

      {logs.map((log, i) => (
        <div key={i} style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden" }}>
          <div onClick={() => setExpanded(expanded === i ? null : i)} style={{ padding: "0.9rem 1rem", display: "flex", alignItems: "flex-start", gap: "0.75rem", cursor: "pointer" }}>
            <AlertTriangle size={15} color="var(--danger)" style={{ marginTop: "2px", flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.2rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {log.message || "Unknown error"}
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                {new Date(log.timestamp).toLocaleString("zh-TW")} · {log.type === "global" ? "全域錯誤" : "元件錯誤"}
              </div>
            </div>
            {expanded === i ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </div>

          {expanded === i && (
            <div style={{ borderTop: "1px solid var(--border)", padding: "0.75rem 1rem", background: "var(--bg-elevated)" }}>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}><strong>URL：</strong>{log.url}</div>
              <pre style={{ fontSize: "0.68rem", color: "var(--text-muted)", whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0, lineHeight: 1.6 }}>
                {log.stack || log.componentStack || "No stack trace available"}
              </pre>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
