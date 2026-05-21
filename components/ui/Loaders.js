export const SkeletonCard = () => (
  <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.8rem" }}>
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <div className="skeleton" style={{ width: "40%", height: "1.2rem" }} />
      <div className="skeleton" style={{ width: "20%", height: "1.2rem", borderRadius: "999px" }} />
    </div>
    <div className="skeleton" style={{ width: "30%", height: "0.8rem" }} />
    <div style={{ display: "flex", gap: "0.5rem" }}>
      <div className="skeleton" style={{ width: "60px", height: "1.5rem", borderRadius: "999px" }} />
      <div className="skeleton" style={{ width: "80px", height: "1.5rem", borderRadius: "999px" }} />
    </div>
  </div>
);

export const SkeletonTable = () => (
  <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "12px", overflowX: "auto", boxShadow: "var(--shadow-sm)" }}>
    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
      <thead>
        <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
          {[1, 2, 3, 4, 5, 6, 7].map(i => (
            <th key={i} style={{ padding: "1rem" }}><div className="skeleton" style={{ height: "0.8rem", width: "50%" }} /></th>
          ))}
        </tr>
      </thead>
      <tbody>
        {[1, 2, 3, 4, 5].map(i => (
          <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
            <td style={{ padding: "1rem" }}>
              <div className="skeleton" style={{ height: "1.2rem", width: "80%" }} />
              <div className="skeleton" style={{ height: "0.8rem", width: "40%", marginTop: "0.5rem" }} />
            </td>
            <td style={{ padding: "1rem" }}><div className="skeleton" style={{ height: "1rem", width: "60%" }} /></td>
            <td style={{ padding: "1rem" }}><div className="skeleton" style={{ height: "1.5rem", width: "80px", borderRadius: "999px" }} /></td>
            <td style={{ padding: "1rem" }}><div className="skeleton" style={{ height: "1.5rem", width: "80px", borderRadius: "999px" }} /></td>
            <td style={{ padding: "1rem" }}><div className="skeleton" style={{ height: "1rem", width: "70%" }} /></td>
            <td style={{ padding: "1rem" }}><div className="skeleton" style={{ height: "1.5rem", width: "80px", borderRadius: "4px" }} /></td>
            <td style={{ padding: "1rem" }}><div className="skeleton" style={{ height: "1.5rem", width: "60px", borderRadius: "4px", marginLeft: "auto" }} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const AnimatedEmptyState = ({ t }) => (
  <div style={{ padding: "4rem 2rem", textAlign: "center", color: "var(--text-muted)" }}>
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: "0 auto 1.5rem", opacity: 0.5 }}>
      <circle cx="11" cy="11" r="8" strokeDasharray="50" strokeDashoffset="50">
        <animate attributeName="stroke-dashoffset" from="50" to="0" dur="1.5s" fill="freeze" />
      </circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65">
        <animate attributeName="opacity" from="0" to="1" dur="1s" begin="1s" fill="freeze" />
      </line>
    </svg>
    <div style={{ fontSize: "1rem", fontWeight: 600 }}>{t("找不到相關資產", "No assets found")}</div>
    <div style={{ fontSize: "0.85rem", marginTop: "4px", opacity: 0.7 }}>{t("試著調整篩選條件或是重新搜尋", "Try adjusting your filters")}</div>
  </div>
);
