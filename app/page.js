"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, RefreshCw, Laptop, Monitor, Plug, Package, CheckCircle2, Clock, Search, Undo2, QrCode, AlertCircle, ChevronDown, AlertTriangle, Filter, Pencil, Briefcase, Layers } from "lucide-react";
import Navbar from "../components/Navbar";
import BottomNav from "../components/BottomNav";
import AssetForm from "../components/AssetForm";
import QRModal from "../components/QRModal";
import { useApp } from "./providers"; 
import AssetDetailModal from "../components/AssetDetailModal";

const SkeletonCard = () => (
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

const SkeletonTable = () => (
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

const AnimatedEmptyState = ({ t }) => (
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

const categoryMeta = {
  laptop:  { icon: Laptop,    color: "var(--accent)", softColor: "var(--accent-soft)", label: ["筆電", "Laptop"] },
  monitor: { icon: Monitor,   color: "#f59e0b", softColor: "rgba(245, 158, 11, 0.15)", label: ["螢幕", "Monitor"] },
  docking: { icon: Plug,      color: "#10b981", softColor: "rgba(16, 185, 129, 0.15)", label: ["Docking", "Docking"] },
  office:  { icon: Briefcase, color: "#8b5cf6", softColor: "rgba(139, 92, 246, 0.15)", label: ["辦公室用品", "Office"] },
  semi:    { icon: Layers,    color: "#06b6d4", softColor: "rgba(6, 182, 212, 0.15)", label: ["半成品", "Semi-finished"] },
  other:   { icon: Package,   color: "#71717a", softColor: "rgba(113, 113, 122, 0.15)", label: ["其他", "Other"] },
};

function parseSpecs(noteStr) {
  if (!noteStr) return { text: "", specs: {} };
  try {
    const parsed = JSON.parse(noteStr);
    const { _note, ...specs } = parsed;
    return { text: _note || "", specs };
  } catch { return { text: noteStr, specs: {} }; }
}

function isAssetOverdue(status, returnDate) {
  if (status !== "borrowed" || !returnDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(returnDate) < today;
}

function StatusBadge({ status, returnDate, t }) {
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

function CategoryBadge({ category, t }) {
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

function IssueBadge({ issueId }) {
  if (!issueId) return null;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.2rem 0.55rem", background: "rgba(234, 179, 8, 0.15)", border: "1px solid rgba(234, 179, 8, 0.4)", color: "var(--warning)", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.04em" }}>
      🔖 {issueId}
    </span>
  );
}

function DoeBadge({ doe }) {
  if (!doe) return null;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "0.2rem 0.55rem", background: "rgba(14, 165, 233, 0.15)", border: "1px solid rgba(14, 165, 233, 0.4)", color: "#0ea5e9", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 700 }}>
      🔬 {doe}
    </span>
  );
}

function SpecsPreview({ note, category }) {
  const { specs } = parseSpecs(note);
  const entries = Object.entries(specs).filter(([, v]) => v);
  if (!entries.length || (category !== "laptop" && category !== "monitor")) return null;
  return (
    <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap", marginTop: "0.2rem" }}>
      {entries.slice(0, 3).map(([k, v]) => (
        <span key={k} style={{ fontSize: "0.67rem", padding: "0.1rem 0.4rem", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "4px", color: "var(--text-muted)" }}>
          {k.toUpperCase()}: {v}
        </span>
      ))}
      {entries.length > 3 && <span style={{ fontSize: "0.67rem", color: "var(--text-muted)" }}>+{entries.length - 3}</span>}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, isActive }) {
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

function CustomSelect({ value, onChange, options, style }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = options.find(o => o.value === value) || options[0];

  return (
    <div ref={ref} style={{ position: "relative", ...style }}>
      <button type="button" onClick={() => setIsOpen(!isOpen)} style={{ width: "100%", padding: "0.55rem 0.875rem", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", fontSize: "0.8rem", fontFamily: "var(--font-display)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", outline: "none", borderColor: isOpen ? "var(--border-focus)" : "var(--border)", transition: "border-color 0.2s" }}>
        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{selected.label}</span>
        <ChevronDown size={14} style={{ color: "var(--text-muted)", transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0, marginLeft: "0.5rem" }} />
      </button>

      {isOpen && (
        <div className="animate-fade-in" style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 100, background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "12px", boxShadow: "var(--shadow-lg)", padding: "0.35rem", display: "flex", flexDirection: "column", gap: "2px" }}>
          {options.map(opt => {
            const isActive = value === opt.value;
            return (
              <div 
                key={opt.value} 
                onClick={() => { onChange(opt.value); setIsOpen(false); }} 
                style={{ padding: "0.5rem 0.75rem", borderRadius: "8px", fontSize: "0.8rem", fontFamily: "var(--font-display)", cursor: "pointer", color: isActive ? "var(--text-primary)" : "var(--text-secondary)", background: isActive ? "var(--bg-elevated)" : "transparent", fontWeight: isActive ? 600 : 400, transition: "all 0.15s" }} 
                onMouseEnter={e => { if(!isActive) { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-primary)"; } }} 
                onMouseLeave={e => { if(!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; } }}
              >
                {opt.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AssetCard({ asset, t, onView, haptic }) {
  const { text: noteText } = parseSpecs(asset.note);
  const overdue = isAssetOverdue(asset.status, asset.returnDate);

  return (
    <div onClick={() => { haptic(30); onView(asset); }} style={{ background: "var(--bg-surface)", border: overdue ? "1px solid var(--danger)" : "1px solid var(--border)", borderRadius: "12px", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem", cursor: "pointer" }} className="btn-spring hover-lift">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: "1.05rem", fontWeight: 700, fontFamily: "var(--font-display)" }}>{asset.model || "—"}</div>
        <StatusBadge status={asset.status} returnDate={asset.returnDate} t={t} />
      </div>
      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}># {asset.assetCode}</div>
      {(asset.issueId || asset.doe) && (
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          <IssueBadge issueId={asset.issueId} />
          <DoeBadge doe={asset.doe} />
        </div>
      )}
      <SpecsPreview note={asset.note} category={asset.category} />
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
        <CategoryBadge category={asset.category} t={t} />
        {asset.borrower && <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>👤 {asset.borrower}</span>}
      </div>
    </div>
  );
}

export default function HomePage() {
  const { t, showOnlyIssues } = useApp();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("assetCode");
  const [showForm, setShowForm] = useState(false);
  const [editAsset, setEditAsset] = useState(null);
  const [returningId, setReturningId] = useState(null);
  const [qrAsset, setQrAsset] = useState(null);
  const [viewAsset, setViewAsset] = useState(null);
  
  const [isMobile, setIsMobile] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  const haptic = (v = 40) => { if (navigator.vibrate) navigator.vibrate(v); };

  useEffect(() => {
    const check = () => { 
      const mobile = window.innerWidth < 768; 
      setIsMobile(mobile); 
      setShowFilters(!mobile); 
    }; 
    check(); 
    window.addEventListener("resize", check); 
    return () => window.removeEventListener("resize", check); 
  }, []);

  const fetchAssets = useCallback(async () => {
    setLoading(true); 
    setFetchError("");
    try { 
      const adminViewAll = localStorage.getItem("adminViewAll") !== "false";
      const res = await fetch(`/api/assets?adminView=${adminViewAll}`, { headers: { "ngrok-skip-browser-warning": "true" }, cache: "no-store" }); 
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json(); 
      if (data.success) {
        setAssets(data.data); 
      } else {
        throw new Error(data.error || "API 回傳失敗");
      }
    } catch (err) { 
      setFetchError(t("無法連接伺服器", "Failed to load data.")); 
    } finally { 
      setLoading(false); 
    }
  }, [t]);

  useEffect(() => { fetchAssets(); }, [fetchAssets]);

  const handleReturn = async (asset) => {
    if (!confirm(t(`確定歸還「${asset.assetCode}」？`, `Return "${asset.assetCode}"?`))) return;
    haptic(60); 
    setReturningId(asset.id);
    try { 
      await fetch(`/api/assets/${asset.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "available", borrower: "", returnDate: null }) }); 
      await fetchAssets(); 
    } finally { 
      setReturningId(null); 
    }
  };

  const filtered = assets.filter(a => {
    if (showOnlyIssues && !a.issueId && !a.doe) return false;
    const q = search.toLowerCase();
    const matchSearch = !search || (a.assetCode||"").toLowerCase().includes(q) || (a.model||"").toLowerCase().includes(q) || (a.borrower||"").toLowerCase().includes(q) || (a.issueId||"").toLowerCase().includes(q);
    if (filterStatus === "overdue") return matchSearch && isAssetOverdue(a.status, a.returnDate) && (filterCategory === "all" || a.category === filterCategory);
    return matchSearch && (filterStatus === "all" || a.status === filterStatus) && (filterCategory === "all" || a.category === filterCategory);
  });

  const sortedAndFiltered = [...filtered].sort((a, b) => {
    if (sortBy === "assetCode") return (a.assetCode || "").localeCompare(b.assetCode || "");
    if (sortBy === "model") return (a.model || "").localeCompare(b.model || "");
    if (sortBy === "date_desc") return new Date(b.acquisitionDate || 0) - new Date(a.acquisitionDate || 0);
    if (sortBy === "date_asc") return new Date(a.acquisitionDate || 0) - new Date(b.acquisitionDate || 0);
    return 0;
  });

  const total = assets.length;
  const available = assets.filter(a => a.status === "available").length;
  const borrowed  = assets.filter(a => a.status === "borrowed").length;
  const overdueCount = assets.filter(a => isAssetOverdue(a.status, a.returnDate)).length;
  const hasActiveFilters = search || filterStatus !== "all" || filterCategory !== "all" || sortBy !== "assetCode";

  return (
    // 🌟 關鍵修正：確保主畫面的 padding-bottom 能容納「導覽列 (56px) + 安全區域 + 加號按鈕空間」
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", paddingBottom: isMobile ? "calc(140px + env(safe-area-inset-bottom))" : "2rem" }}>
      <Navbar />
      <main style={{ maxWidth: "1400px", margin: "0 auto", padding: isMobile ? "1.5rem 1.25rem" : "2rem 1.5rem" }}>
        
        <div className="animate-fade-in" style={{ marginBottom: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: isMobile ? "1.6rem" : "2rem", fontWeight: 800, letterSpacing: "-0.03em", margin: 0 }}>
              {t("資產總覽", "Asset Overview")}
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "4px", margin: 0 }}>
              {t("管理所有 IT 設備的借還狀態", "Manage all IT equipment borrow status")}
            </p>
          </div>
          
          <div style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
            <button onClick={() => { haptic(); setShowFilters(!showFilters); }} style={{ position: "relative", background: showFilters ? "var(--bg-elevated)" : "transparent", border: "none", color: showFilters ? "var(--text-primary)" : "var(--text-muted)", cursor: "pointer", display: "flex", padding: "8px", borderRadius: "50%", transition: "all 0.2s" }} className="btn-spring">
              <Filter size={18} />
              {hasActiveFilters && !showFilters && <span style={{ position: "absolute", top: "4px", right: "4px", width: "8px", height: "8px", background: "var(--danger)", borderRadius: "50%", border: "2px solid var(--bg-base)" }}></span>}
            </button>
            <button onClick={() => { haptic(); fetchAssets(); }} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "flex", padding: "8px", borderRadius: "50%", transition: "background 0.2s" }} className="btn-spring">
              <RefreshCw size={18} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            </button>
          </div>
        </div>

        <div className="stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
          <div onClick={() => setFilterStatus("all")} style={{ cursor: "pointer" }} className="btn-spring">
            <StatCard label={t("資產總數", "Total")} value={total} icon={Package} color="var(--accent)" isActive={filterStatus === "all"} />
          </div>
          <div onClick={() => setFilterStatus("available")} style={{ cursor: "pointer" }} className="btn-spring">
            <StatCard label={t("可借用", "Available")} value={available} icon={CheckCircle2} color="var(--success)" isActive={filterStatus === "available"} />
          </div>
          <div onClick={() => setFilterStatus("borrowed")} style={{ cursor: "pointer" }} className="btn-spring">
            <StatCard label={t("借出中", "Borrowed")} value={borrowed} icon={Clock} color="var(--warning)" isActive={filterStatus === "borrowed"} />
          </div>
          <div onClick={() => setFilterStatus("overdue")} style={{ cursor: "pointer" }} className="btn-spring">
             <StatCard label={t("逾期未還", "Overdue")} value={overdueCount} icon={AlertCircle} color="var(--danger)" isActive={filterStatus === "overdue"} />
          </div>
        </div>

        {showFilters && (
          <div className="animate-fade-in" style={{ position: "relative", zIndex: 20, background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1rem", marginBottom: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem", boxShadow: "var(--shadow-sm)" }}>
            <div style={{ position: "relative" }}>
              <Search size={16} style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("搜尋編號、型號、借用人、Issue ID...", "Search...")}
                style={{ width: "100%", padding: "0.7rem 1rem 0.7rem 2.4rem", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", fontSize: "0.9rem", fontFamily: "var(--font-display)", outline: "none", transition: "border-color 0.2s" }}
                onFocus={e => e.target.style.borderColor = "var(--border-focus)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"} />
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.6rem" }}>
              <CustomSelect value={filterStatus} onChange={setFilterStatus} options={[{ value: "all", label: t("全部狀態", "All Status") }, { value: "available", label: t("可借用", "Available") }, { value: "borrowed", label: t("借出中", "Borrowed") }, { value: "overdue", label: t("逾期", "Overdue") }]} />
              <CustomSelect value={filterCategory} onChange={setFilterCategory} options={[
                { value: "all", label: t("全部類別", "All") }, 
                { value: "laptop", label: t("筆電", "Laptop") }, 
                { value: "monitor", label: t("螢幕", "Monitor") }, 
                { value: "docking", label: t("Docking", "Docking") }, 
                { value: "office", label: t("辦公室用品", "Office") }, 
                { value: "semi", label: t("半成品", "Semi-finished") }, 
                { value: "other", label: t("其他", "Other") }
              ]} />
              <CustomSelect value={sortBy} onChange={setSortBy} options={[{ value: "assetCode", label: t("依編號排序", "Sort by Code") }, { value: "model", label: t("依型號排序 (A-Z)", "Sort by Model") }, { value: "date_desc", label: t("取得日：新 ➔ 舊", "Date: Newest") }, { value: "date_asc", label: t("取得日：舊 ➔ 新", "Date: Oldest") }]} />
              {hasActiveFilters && (
                <button onClick={() => { setSearch(""); setFilterStatus("all"); setFilterCategory("all"); setSortBy("assetCode"); }} style={{ padding: "0.55rem 0.875rem", background: "var(--danger-soft)", border: "1px solid var(--danger)", borderRadius: "8px", color: "var(--danger)", fontSize: "0.8rem", fontFamily: "var(--font-display)", cursor: "pointer", outline: "none", transition: "all 0.2s" }}>{t("清除", "Clear")}</button>
              )}
            </div>
          </div>
        )}

        {fetchError && !loading && (
          <div style={{ padding: "1rem", background: "var(--danger-soft)", border: "1px solid var(--danger)", borderRadius: "12px", color: "var(--danger)", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem", fontSize: "0.85rem" }}>
            <AlertTriangle size={18} />
            <div>
              <div style={{ fontWeight: 600 }}>讀取失敗</div>
              <div style={{ fontSize: "0.75rem", opacity: 0.8 }}>{fetchError}</div>
            </div>
          </div>
        )}

        {loading ? (
          isMobile ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <SkeletonTable />
          )
        ) : sortedAndFiltered.length === 0 ? (
          <AnimatedEmptyState t={t} />
        ) : isMobile ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }} className="stagger">
            {sortedAndFiltered.map(asset => (
              <AssetCard 
                key={asset.id} 
                asset={asset} 
                t={t} 
                onView={setViewAsset} 
                haptic={haptic}
              />
            ))}
          </div>
        ) : (
          <div className="animate-fade-in stagger" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "12px", overflowX: "auto", boxShadow: "var(--shadow-sm)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
                  {[
                    { label: t("型號","Model"), align: "left" },
                    { label: t("資產編號","Code"), align: "left" },
                    { label: t("類別","Category"), align: "left" },
                    { label: t("狀態","Status"), align: "left" },
                    { label: t("借用人","Borrower"), align: "left" },
                    { label: t("Issue/DOE","Issue/DOE"), align: "left" },
                    { label: t("操作","Actions"), align: "right" }
                  ].map(h => (
                    <th key={h.label} style={{ padding: "1rem", textAlign: h.align, fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.05em", color: "var(--text-muted)", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedAndFiltered.map(asset => {
                  const { text: noteText } = parseSpecs(asset.note);
                  const overdue = isAssetOverdue(asset.status, asset.returnDate);
                  return (
                    <tr key={asset.id} 
                      onClick={() => { haptic(30); setViewAsset(asset); }}
                      style={{ borderBottom: "1px solid var(--border)", transition: "background 0.15s", background: overdue ? "var(--danger-soft)" : "transparent", cursor: "pointer" }}
                      onMouseEnter={e => e.currentTarget.style.background = overdue ? "var(--danger-soft)" : "var(--bg-hover)"}
                      onMouseLeave={e => e.currentTarget.style.background = overdue ? "var(--danger-soft)" : "transparent"}>
                      <td style={{ padding: "1rem", verticalAlign: "middle" }}>
                        <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{asset.model || <span style={{ color: "var(--text-muted)" }}>—</span>}</div>
                        <SpecsPreview note={asset.note} category={asset.category} />
                        {noteText && <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "6px" }}>📝 {noteText}</div>}
                      </td>
                      <td style={{ padding: "1rem", verticalAlign: "middle", fontSize: "0.8rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{asset.assetCode || "—"}</td>
                      <td style={{ padding: "1rem", verticalAlign: "middle" }}><CategoryBadge category={asset.category} t={t} /></td>
                      <td style={{ padding: "1rem", verticalAlign: "middle" }}><StatusBadge status={asset.status} returnDate={asset.returnDate} t={t} /></td>
                      <td style={{ padding: "1rem", verticalAlign: "middle", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                        {asset.borrower ? <span style={{ fontWeight: 600 }}>{asset.borrower}</span> : <span style={{ color: "var(--text-muted)" }}>—</span>}
                        {asset.returnDate && <div style={{ fontSize: "0.72rem", color: overdue ? "var(--danger)" : "var(--text-muted)", fontWeight: overdue ? 700 : 500, marginTop: "4px" }}>📅 {asset.returnDate}</div>}
                      </td>
                      <td style={{ padding: "1rem", verticalAlign: "middle" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", alignItems: "flex-start" }}>
                          <IssueBadge issueId={asset.issueId} />
                          <DoeBadge doe={asset.doe} />
                        </div>
                      </td>
                      <td style={{ padding: "1rem", verticalAlign: "middle", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "0.25rem", justifyContent: "flex-end" }}>
                          {asset.status === "borrowed" && (
                            <button onClick={(e) => { e.stopPropagation(); haptic(40); handleReturn(asset); }} disabled={returningId === asset.id} title={t("歸還","Return")} 
                              style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", borderRadius: "8px", color: "var(--success)", cursor: "pointer", opacity: returningId === asset.id ? 0.5 : 1, transition: "background 0.2s" }}
                              onMouseEnter={e => e.currentTarget.style.background = "var(--success-soft)"}
                              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                              <Undo2 size={15} />
                            </button>
                          )}
                          <button onClick={(e) => { e.stopPropagation(); haptic(40); setQrAsset(asset); }} title="QR Code" 
                            style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", borderRadius: "8px", color: "var(--text-secondary)", cursor: "pointer", transition: "background 0.2s" }}
                            onMouseEnter={e => e.currentTarget.style.background = "var(--bg-elevated)"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                            <QrCode size={15} />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); haptic(40); setEditAsset(asset); setShowForm(true); }} title={t("編輯","Edit")} 
                            style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", borderRadius: "8px", color: "var(--accent)", cursor: "pointer", transition: "background 0.2s" }}
                            onMouseEnter={e => e.currentTarget.style.background = "var(--accent-soft)"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                            <Pencil size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        
        {!loading && !isMobile && sortedAndFiltered.length > 0 && (
          <div style={{ padding: "1rem", fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "right" }}>
            {t(`顯示 ${sortedAndFiltered.length} / ${total} 筆`, `Showing ${sortedAndFiltered.length} of ${total}`)}
          </div>
        )}
      </main>

      {/* 🌟 關鍵修正：透過 calc 動態計算，讓加號按鈕剛好懸浮在導覽列 (56px) 上方約 16px 處 */}
      <button onClick={() => { haptic(50); setEditAsset(null); setShowForm(true); }} style={{ 
        position: "fixed", 
        bottom: isMobile ? "calc(72px + env(safe-area-inset-bottom))" : "32px", 
        right: isMobile ? "16px" : "32px", 
        width: "56px", height: "56px", 
        borderRadius: "50%", 
        background: "var(--accent)", color: "var(--bg-base)", 
        boxShadow: "var(--shadow-lg)", 
        display: "flex", alignItems: "center", justifyContent: "center", 
        cursor: "pointer", zIndex: 40 
      }} className="btn-spring fab-btn">
        <Plus size={26} strokeWidth={2.5} className="fab-icon" />
      </button>

      {showForm && <AssetForm editData={editAsset} onClose={() => setShowForm(false)} onSuccess={fetchAssets} />}
      {qrAsset && <QRModal asset={qrAsset} onClose={() => setQrAsset(null)} />}
      
      {viewAsset && <AssetDetailModal asset={viewAsset} onClose={() => setViewAsset(null)} onEdit={(a) => { haptic(); setEditAsset(a); setShowForm(true); setViewAsset(null); }} onQR={(a) => { haptic(); setQrAsset(a); setViewAsset(null); }} onReturn={handleReturn} returning={returningId === viewAsset?.id} />} 
      
      {isMobile && <BottomNav />}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}