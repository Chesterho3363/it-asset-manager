export function StatCard({ label, value, icon: Icon, color, isActive }) {
  return (
    <div className="hover-lift" style={{ 
      background: isActive ? `${color}11` : "var(--bg-surface)", 
      border: `1px solid ${isActive ? color : "var(--border)"}`,
      borderRadius: "12px", 
      padding: "1rem", 
      display: "flex", 
      alignItems: "center", 
      gap: "0.75rem", 
      transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)", 
      minWidth: 0 
    }}>
      <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: isActive ? "var(--bg-surface)" : "var(--bg-elevated)", boxShadow: isActive ? "0 2px 8px rgba(0,0,0,0.05)" : "none", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.3s ease" }}>
        <Icon size={18} color={color} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: "1.4rem", fontWeight: 700, fontFamily: "var(--font-display)", lineHeight: 1, color: "var(--text-primary)" }}>{value}</div>
        <div style={{ fontSize: "0.75rem", color: isActive ? color : "var(--text-muted)", marginTop: "4px", fontWeight: isActive ? 600 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {label}
        </div>
      </div>
    </div>
  );
}
