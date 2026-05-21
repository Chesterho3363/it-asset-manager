import { Laptop, Monitor, Plug, Briefcase, Layers, Package, Building2 } from "lucide-react";

export const categoryMeta = {
  laptop:  { icon: Laptop,    color: "var(--accent)", softColor: "var(--accent-soft)", label: ["筆電", "Laptop"] },
  monitor: { icon: Monitor,   color: "#f59e0b", softColor: "rgba(245, 158, 11, 0.15)", label: ["螢幕", "Monitor"] },
  docking: { icon: Plug,      color: "#10b981", softColor: "rgba(16, 185, 129, 0.15)", label: ["Docking", "Docking"] },
  office:  { icon: Briefcase, color: "#8b5cf6", softColor: "rgba(139, 92, 246, 0.15)", label: ["辦公室用品", "Office"] },
  semi:    { icon: Layers,    color: "#06b6d4", softColor: "rgba(6, 182, 212, 0.15)", label: ["半成品", "Semi-finished"] },
  other:   { icon: Package,   color: "#71717a", softColor: "rgba(113, 113, 122, 0.15)", label: ["其他", "Other"] },
};

export function isAssetOverdue(status, returnDate) {
  if (status !== "borrowed" || !returnDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(returnDate) < today;
}

export function StatusBadge({ status, returnDate, t }) {
  const overdue = isAssetOverdue(status, returnDate);
  if (status === "available") {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.25rem 0.65rem", background: "var(--success-soft)", borderRadius: "999px", color: "var(--success)", fontSize: "0.72rem", fontWeight: 700 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--success)", flexShrink: 0 }} />{t("可借用", "Available")}
      </span>
    );
  }
  if (overdue) {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.25rem 0.65rem", background: "var(--danger-soft)", border: "1px solid rgba(229,115,115,0.3)", borderRadius: "999px", color: "var(--danger)", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.02em" }}>
        <span className="radar-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--danger)", flexShrink: 0 }} />
        {t("已逾期", "Overdue")}
      </span>
    );
  }
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.25rem 0.65rem", background: "var(--warning-soft)", borderRadius: "999px", color: "var(--warning)", fontSize: "0.72rem", fontWeight: 700 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--warning)", flexShrink: 0 }} />{t("借出中", "Borrowed")}
    </span>
  );
}

export function CategoryBadge({ category, t }) {
  const meta = categoryMeta[category] || categoryMeta.other;
  const Icon = meta.icon;
  return (
    <span style={{ 
      display: "inline-flex", alignItems: "center", gap: "0.35rem", 
      padding: "0.25rem 0.65rem", 
      background: meta.softColor, 
      border: "none", 
      borderRadius: "999px", 
      color: meta.color, 
      fontSize: "0.72rem",
      fontWeight: 700 
    }}>
      <Icon size={13} strokeWidth={2.5} />{t(meta.label[0], meta.label[1])}
    </span>
  );
}

export function DepartmentBadge({ department }) {
  if (!department) return null;
  return (
    <span style={{ 
      display: "inline-flex", alignItems: "center", gap: "0.3rem", 
      padding: "0.25rem 0.65rem", background: "rgba(139, 92, 246, 0.1)", 
      border: "1px solid rgba(139, 92, 246, 0.2)", borderRadius: "6px", 
      color: "#8b5cf6", fontSize: "0.72rem", fontWeight: 700 
    }}>
      <Building2 size={12} /> {department}
    </span>
  );
}

export function IssueBadge({ issueId }) {
  if (!issueId) return null;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.2rem 0.55rem", background: "rgba(234, 179, 8, 0.15)", border: "1px solid rgba(234, 179, 8, 0.4)", color: "var(--warning)", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.04em" }}>
      🔖 {issueId}
    </span>
  );
}

export function DoeBadge({ doe }) {
  if (!doe) return null;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "0.2rem 0.55rem", background: "rgba(14, 165, 233, 0.15)", border: "1px solid rgba(14, 165, 233, 0.4)", color: "#0ea5e9", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 700 }}>
      🔬 {doe}
    </span>
  );
}
