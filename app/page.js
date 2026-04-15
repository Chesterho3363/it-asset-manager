"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, RefreshCw, Pencil, Laptop, Monitor, Plug, Package, CheckCircle2, Clock, Search, Undo2, QrCode, AlertCircle, ChevronDown } from "lucide-react";
import Navbar from "../components/Navbar";
import BottomNav from "../components/BottomNav";
import AssetForm from "../components/AssetForm";
import QRModal from "../components/QRModal";
import { useApp } from "./layout";
import AssetDetailModal from "../components/AssetDetailModal";

const categoryMeta = {
  laptop:  { icon: Laptop,  colorVar: "--accent",     label: ["筆電", "Laptop"] },
  monitor: { icon: Monitor, colorVar: "--warning",    label: ["螢幕", "Monitor"] },
  docking: { icon: Plug,    colorVar: "--success",    label: ["擴充座", "Docking"] },
  other:   { icon: Package, colorVar: "--text-muted", label: ["其他", "Other"] },
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
  const returnD = new Date(returnDate);
  return returnD < today;
}

function StatusBadge({ status, returnDate, t }) {
  const overdue = isAssetOverdue(status, returnDate);

  if (status === "available") {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.25rem 0.65rem", background: "var(--success-soft)", borderRadius: "999px", color: "var(--success)", fontSize: "0.72rem", fontWeight: 500 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--success)", flexShrink: 0 }} />
        {t("可借用", "Available")}
      </span>
    );
  }

  if (overdue) {
    return (
      <span className="animate-pulse-soft" style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.25rem 0.65rem", background: "var(--danger-soft)", borderRadius: "999px", color: "var(--danger)", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.02em" }}>
        <AlertCircle size={12} strokeWidth={2.5} />
        {t("已逾期", "Overdue")}
      </span>
    );
  }

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.25rem 0.65rem", background: "var(--warning-soft)", borderRadius: "999px", color: "var(--warning)", fontSize: "0.72rem", fontWeight: 500 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--warning)", flexShrink: 0 }} />
      {t("借出中", "Borrowed")}
    </span>
  );
}

function CategoryBadge({ category, t }) {
  const meta = categoryMeta[category] || categoryMeta.other;
  const Icon = meta.icon;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.25rem 0.65rem", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "999px", color: `var(${meta.colorVar})`, fontSize: "0.72rem" }}>
      <Icon size={11} />{t(meta.label[0], meta.label[1])}
    </span>
  );
}

function IssueBadge({ issueId }) {
  if (!issueId) return null;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.2rem 0.55rem", background: "#fef08a", color: "#92400e", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.04em" }}>
      🔖 {issueId}
    </span>
  );
}

function DoeBadge({ doe }) {
  if (!doe) return null;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "0.2rem 0.55rem", background: "#a5f3fc", color: "#0c4a6e", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 600 }}>
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
    <div style={{
      background: isActive ? `${color}11` : "var(--bg-surface)",
      border: `1px solid ${isActive ? color : "var(--border)"}`,
      borderRadius: "12px", 
      padding: "1rem 1.25rem", 
      display: "flex", 
      alignItems: "center", 
      gap: "1rem",
      transition: "all 0.2s ease"
    }}>
      <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: `${color}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <div style={{ fontSize: "1.5rem", fontWeight: 700, fontFamily: "var(--font-display)", lineHeight: 1 }}>{value}</div>
        <div style={{ 
          fontSize: "0.72rem", 
          color: isActive ? color : "var(--text-muted)", 
          marginTop: "4px",
          fontWeight: isActive ? 600 : 400
        }}>
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
      <button 
        type="button" 
        onClick={() => setIsOpen(!isOpen)} 
        style={{
          width: "100%", padding: "0.55rem 0.875rem", background: "var(--bg-surface)", border: "1px solid var(--border)",
          borderRadius: "8px", color: "var(--text-primary)", fontSize: "0.8rem", fontFamily: "var(--font-display)",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", outline: "none",
          borderColor: isOpen ? "var(--border-focus)" : "var(--border)", transition: "border-color 0.2s"
        }}
      >
        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{selected.label}</span>
        <ChevronDown size={14} style={{ color: "var(--text-muted)", transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0, marginLeft: "0.5rem" }} />
      </button>

      {isOpen && (
        <div className="animate-fade-in" style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 100,
          background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "12px",
          boxShadow: "var(--shadow-lg)", padding: "0.35rem", display: "flex", flexDirection: "column", gap: "2px"
        }}>
          {options.map(opt => {
            const isActive = value === opt.value;
            return (
              <div 
                key={opt.value} 
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                style={{
                  padding: "0.5rem 0.75rem", borderRadius: "8px", fontSize: "0.8rem", fontFamily: "var(--font-display)", cursor: "pointer",
                  color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                  background: isActive ? "var(--bg-elevated)" : "transparent",
                  fontWeight: isActive ? 600 : 400, transition: "all 0.15s"
                }}
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

function AssetCard({ asset, t, onEdit, onReturn, onQR, onView, returning }) {
  const { text: noteText } = parseSpecs(asset.note);
  const isBorrowed = asset.status === "borrowed";
  const overdue = isAssetOverdue(asset.status, asset.returnDate);

  return (
    <div 
      onClick={() => onView(asset)}
      style={{ background: "var(--bg-surface)", border: overdue ? "1px solid var(--danger)" : "1px solid var(--border)", borderRadius: "12px", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.6rem", cursor: "pointer", transition: "transform 0.1s" }}
      onMouseDown={e => e.currentTarget.style.transform="scale(0.99)"}
      onMouseUp={e => e.currentTarget.style.transform="scale(1)"}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: "0.95rem", fontWeight: 600 }}>{asset.model || <span style={{ color: "var(--text-muted)" }}>—</span>}</div>
        <StatusBadge status={asset.status} returnDate={asset.returnDate} t={t} />
      </div>
      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}># {asset.assetCode || "—"}</div>

      {(asset.issueId || asset.doe) && (
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          <IssueBadge issueId={asset.issueId} />
          <DoeBadge doe={asset.doe} />
        </div>
      )}

      <SpecsPreview note={asset.note} category={asset.category} />

      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
        <CategoryBadge category={asset.category} t={t} />
        {asset.borrower && <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>👤 {asset.borrower}</span>}
        {asset.returnDate && <span style={{ fontSize: "0.78rem", color: overdue ? "var(--danger)" : "var(--text-muted)", fontWeight: overdue ? 600 : 400 }}>📅 {asset.returnDate}</span>}
      </div>
      {noteText && <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontStyle: "italic" }}>📝 {noteText}</div>}

      <div style={{ display: "flex", gap: "0.5rem", paddingTop: "0.4rem", borderTop: "1px solid var(--border)" }}>
        {isBorrowed && (
          <button 
            onClick={(e) => { e.stopPropagation(); onReturn(asset); }} 
            disabled={returning} 
            style={{ flex: 1, padding: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", background: "var(--success-soft)", border: "1px solid var(--success)", borderRadius: "8px", color: "var(--success)", cursor: "pointer", fontSize: "0.8rem", fontFamily: "var(--font-display)", opacity: returning ? 0.5 : 1 }}
          >
            <Undo2 size={13} /> {t("歸還", "Return")}
          </button>
        )}
        <button 
          onClick={(e) => { e.stopPropagation(); onQR(asset); }} 
          style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-muted)", cursor: "pointer", flexShrink: 0 }}
        >
          <QrCode size={15} />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onEdit(asset); }} 
          style={{ flex: 1, padding: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", background: "var(--accent-soft)", border: "1px solid var(--accent)", borderRadius: "8px", color: "var(--accent)", cursor: "pointer", fontSize: "0.8rem", fontFamily: "var(--font-display)" }}
        >
          <Pencil size={13} /> {t("編輯", "Edit")}
        </button>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { t } = useApp();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("assetCode"); // ── 新增排序狀態 ──
  const [showForm, setShowForm] = useState(false);
  const [editAsset, setEditAsset] = useState(null);
  const [returningId, setReturningId] = useState(null);
  const [qrAsset, setQrAsset] = useState(null);
  const [viewAsset, setViewAsset] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check(); window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try { const res = await fetch("/api/assets"); const data = await res.json(); if (data.success) setAssets(data.data); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAssets(); }, [fetchAssets]);

  const handleReturn = async (asset) => {
    if (!confirm(t(`確定歸還「${asset.assetCode}」？`, `Return "${asset.assetCode}"?`))) return;
    setReturningId(asset.id);
    try {
      await fetch(`/api/assets/${asset.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "available", borrower: "", returnDate: null }) });
      await fetchAssets();
    } finally { setReturningId(null); }
  };

  const filtered = assets.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !search || (a.assetCode||"").toLowerCase().includes(q) || (a.model||"").toLowerCase().includes(q) || (a.borrower||"").toLowerCase().includes(q) || (a.issueId||"").toLowerCase().includes(q);
    
    if (filterStatus === "overdue") {
        return matchSearch && isAssetOverdue(a.status, a.returnDate) && (filterCategory === "all" || a.category === filterCategory);
    }
    
    return matchSearch && (filterStatus === "all" || a.status === filterStatus) && (filterCategory === "all" || a.category === filterCategory);
  });

  // ── 新增：自訂排序邏輯 ──
  const sortedAndFiltered = [...filtered].sort((a, b) => {
    if (sortBy === "assetCode") {
      return (a.assetCode || "").localeCompare(b.assetCode || "");
    }
    if (sortBy === "model") {
      return (a.model || "").localeCompare(b.model || "");
    }
    if (sortBy === "date_desc") {
      return new Date(b.acquisitionDate || 0) - new Date(a.acquisitionDate || 0);
    }
    if (sortBy === "date_asc") {
      return new Date(a.acquisitionDate || 0) - new Date(b.acquisitionDate || 0);
    }
    return 0;
  });

  const total = assets.length;
  const available = assets.filter(a => a.status === "available").length;
  const borrowed  = assets.filter(a => a.status === "borrowed").length;
  const overdueCount = assets.filter(a => isAssetOverdue(a.status, a.returnDate)).length;

  const btnBase = { display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1.1rem", border: "none", borderRadius: "8px", fontSize: "0.85rem", fontFamily: "var(--font-display)", cursor: "pointer", fontWeight: 500 };
  const selStyle = { padding: "0.55rem 0.875rem", background: "var(--danger-soft)", border: "1px solid var(--danger)", borderRadius: "8px", color: "var(--danger)", fontSize: "0.8rem", fontFamily: "var(--font-display)", cursor: "pointer", outline: "none" };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", paddingBottom: isMobile ? "80px" : 0 }}>
      <Navbar />
      <main style={{ maxWidth: "1400px", margin: "0 auto", padding: isMobile ? "1.25rem 1rem" : "2rem 1.5rem" }}>

        <div className="animate-fade-in" style={{ marginBottom: "1.5rem", display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "flex-end", justifyContent: "space-between", gap: "1rem" }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: isMobile ? "1.6rem" : "2rem", fontWeight: 800, letterSpacing: "-0.03em" }}>{t("資產總覽", "Asset Overview")}</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "4px" }}>{t("管理所有 IT 設備的借還狀態", "Manage all IT equipment borrow status")}</p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", width: isMobile ? "100%" : "auto" }}>
            <button onClick={fetchAssets} style={{ ...btnBase, background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-secondary)", flex: isMobile ? 1 : "none", justifyContent: "center" }}>
              <RefreshCw size={15} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />{t("重新整理", "Refresh")}
            </button>
            <button onClick={() => { setEditAsset(null); setShowForm(true); }} style={{ ...btnBase, background: "var(--accent)", color: "#fff", flex: isMobile ? 1 : "none", justifyContent: "center" }}>
              <Plus size={15} />{t("新增資產", "Add")}
            </button>
          </div>
        </div>

        <div className="stagger" style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: "0.75rem", marginBottom: "1.5rem" }}>
          <div onClick={() => setFilterStatus("all")} style={{ cursor: "pointer", transition: "transform 0.1s" }} onMouseDown={e => e.currentTarget.style.transform="scale(0.98)"} onMouseUp={e => e.currentTarget.style.transform="scale(1)"}>
            <StatCard label={t("資產總數", "Total")} value={total} icon={Package} color="var(--accent)" isActive={filterStatus === "all"} />
          </div>
          <div onClick={() => setFilterStatus("available")} style={{ cursor: "pointer", transition: "transform 0.1s" }} onMouseDown={e => e.currentTarget.style.transform="scale(0.98)"} onMouseUp={e => e.currentTarget.style.transform="scale(1)"}>
            <StatCard label={t("可借用", "Available")} value={available} icon={CheckCircle2} color="var(--success)" isActive={filterStatus === "available"} />
          </div>
          <div onClick={() => setFilterStatus("borrowed")} style={{ cursor: "pointer", transition: "transform 0.1s" }} onMouseDown={e => e.currentTarget.style.transform="scale(0.98)"} onMouseUp={e => e.currentTarget.style.transform="scale(1)"}>
            <StatCard label={t("借出中", "Borrowed")} value={borrowed} icon={Clock} color="var(--warning)" isActive={filterStatus === "borrowed"} />
          </div>
          <div onClick={() => setFilterStatus("overdue")} style={{ cursor: "pointer", transition: "transform 0.1s" }} onMouseDown={e => e.currentTarget.style.transform="scale(0.98)"} onMouseUp={e => e.currentTarget.style.transform="scale(1)"}>
             <StatCard label={t("逾期未還", "Overdue")} value={overdueCount} icon={AlertCircle} color="var(--danger)" isActive={filterStatus === "overdue"} />
          </div>
        </div>

        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "0.875rem", marginBottom: "1.25rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          <div style={{ position: "relative" }}>
            <Search size={15} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("搜尋編號、型號、借用人、Issue ID...", "Search...")}
              style={{ width: "100%", padding: "0.6rem 0.875rem 0.6rem 2.2rem", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", fontSize: "0.85rem", fontFamily: "var(--font-display)", outline: "none" }}
              onFocus={e => e.target.style.borderColor = "var(--border-focus)"}
              onBlur={e => e.target.style.borderColor = "var(--border)"} />
          </div>
          
          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
            <CustomSelect 
              value={filterStatus} 
              onChange={setFilterStatus} 
              options={[
                { value: "all", label: t("全部狀態", "All Status") },
                { value: "available", label: t("可借用", "Available") },
                { value: "borrowed", label: t("借出中", "Borrowed") },
                { value: "overdue", label: t("🔴 逾期", "Overdue") }
              ]} 
              style={{ flex: 1, minWidth: "120px" }} 
            />
            <CustomSelect 
              value={filterCategory} 
              onChange={setFilterCategory} 
              options={[
                { value: "all", label: t("全部類別", "All") },
                { value: "laptop", label: t("筆電", "Laptop") },
                { value: "monitor", label: t("螢幕", "Monitor") },
                { value: "docking", label: t("擴充座", "Docking") },
                { value: "other", label: t("其他", "Other") }
              ]} 
              style={{ flex: 1, minWidth: "120px" }} 
            />
            
            {/* ── 新增：排序選項下拉選單 ── */}
            <CustomSelect 
              value={sortBy} 
              onChange={setSortBy} 
              options={[
                { value: "assetCode", label: t("依編號排序", "Sort by Code") },
                { value: "model", label: t("依型號排序 (A-Z)", "Sort by Model") },
                { value: "date_desc", label: t("取得日：新 ➔ 舊", "Date: Newest") },
                { value: "date_asc", label: t("取得日：舊 ➔ 新", "Date: Oldest") }
              ]} 
              style={{ flex: 1, minWidth: "140px" }} 
            />

            {(filterStatus !== "all" || filterCategory !== "all" || search || sortBy !== "assetCode") && (
              <button onClick={() => { setSearch(""); setFilterStatus("all"); setFilterCategory("all"); setSortBy("assetCode"); }} style={{ ...selStyle, whiteSpace: "nowrap" }}>{t("清除", "Clear")}</button>
            )}
          </div>
        </div>

        {loading ? (
          <div style={{ padding: "4rem", textAlign: "center", color: "var(--text-muted)" }}>
            <RefreshCw size={24} style={{ animation: "spin 1s linear infinite", margin: "0 auto 0.75rem", display: "block" }} />
            <div style={{ fontSize: "0.85rem" }}>{t("載入中...", "Loading...")}</div>
          </div>
        ) : sortedAndFiltered.length === 0 ? (
          <div style={{ padding: "4rem", textAlign: "center", color: "var(--text-muted)" }}>
            <Package size={36} style={{ margin: "0 auto 0.75rem", opacity: 0.4, display: "block" }} />
            <div style={{ fontSize: "0.9rem" }}>{t("找不到資產", "No assets found")}</div>
          </div>
        ) : isMobile ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {sortedAndFiltered.map(asset => (
              <AssetCard key={asset.id} asset={asset} t={t}
                onView={setViewAsset}
                onEdit={a => { setEditAsset(a); setShowForm(true); }}
                onReturn={handleReturn} onQR={setQrAsset}
                returning={returningId === asset.id} />
            ))}
            <div style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--text-muted)", padding: "0.5rem" }}>
              {t(`顯示 ${sortedAndFiltered.length} / ${total} 筆`, `Showing ${sortedAndFiltered.length} of ${total}`)}
            </div>
          </div>
        ) : (
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {[t("型號","Model"), t("資產編號","Code"), t("類別","Category"), t("狀態","Status"), t("借用人","Borrower"), t("Issue/DOE","Issue/DOE"), t("操作","Actions")].map(h => (
                    <th key={h} style={{ padding: "0.875rem 1rem", textAlign: "left", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.08em", color: "var(--text-muted)", textTransform: "uppercase", background: "var(--bg-elevated)", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="stagger">
                {sortedAndFiltered.map(asset => {
                  const { text: noteText } = parseSpecs(asset.note);
                  const overdue = isAssetOverdue(asset.status, asset.returnDate);
                  return (
                    <tr key={asset.id} 
                      onClick={() => setViewAsset(asset)}
                      style={{ borderBottom: "1px solid var(--border)", transition: "background 0.15s", background: overdue ? "var(--danger-soft)" : "transparent", cursor: "pointer" }}
                      onMouseEnter={e => e.currentTarget.style.background = overdue ? "var(--danger-soft)" : "var(--bg-hover)"}
                      onMouseLeave={e => e.currentTarget.style.background = overdue ? "var(--danger-soft)" : "transparent"}>
                      <td style={{ padding: "0.875rem 1rem" }}>
                        <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{asset.model || <span style={{ color: "var(--text-muted)" }}>—</span>}</div>
                        <SpecsPreview note={asset.note} category={asset.category} />
                        {noteText && <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>📝 {noteText}</div>}
                      </td>
                      <td style={{ padding: "0.875rem 1rem", fontSize: "0.8rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{asset.assetCode || "—"}</td>
                      <td style={{ padding: "0.875rem 1rem" }}><CategoryBadge category={asset.category} t={t} /></td>
                      <td style={{ padding: "0.875rem 1rem" }}><StatusBadge status={asset.status} returnDate={asset.returnDate} t={t} /></td>
                      <td style={{ padding: "0.875rem 1rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                        {asset.borrower || <span style={{ color: "var(--text-muted)" }}>—</span>}
                        {asset.returnDate && <div style={{ fontSize: "0.72rem", color: overdue ? "var(--danger)" : "var(--text-muted)", fontWeight: overdue ? 600 : 400 }}>📅 {asset.returnDate}</div>}
                      </td>
                      <td style={{ padding: "0.875rem 1rem" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                          <IssueBadge issueId={asset.issueId} />
                          <DoeBadge doe={asset.doe} />
                        </div>
                      </td>
                      <td style={{ padding: "0.875rem 1rem" }}>
                        <div style={{ display: "flex", gap: "0.4rem" }}>
                          {asset.status === "borrowed" && (
                            <button onClick={(e) => { e.stopPropagation(); handleReturn(asset); }} disabled={returningId === asset.id} title={t("歸還","Return")} style={{ width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--success-soft)", border: "1px solid var(--success)", borderRadius: "6px", color: "var(--success)", cursor: "pointer", opacity: returningId === asset.id ? 0.5 : 1 }}>
                              <Undo2 size={13} />
                            </button>
                          )}
                          <button onClick={(e) => { e.stopPropagation(); setQrAsset(asset); }} title="QR Code" style={{ width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "6px", color: "var(--text-muted)", cursor: "pointer" }}>
                            <QrCode size={13} />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setEditAsset(asset); setShowForm(true); }} title={t("編輯","Edit")} style={{ width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--accent-soft)", border: "1px solid var(--accent)", borderRadius: "6px", color: "var(--accent)", cursor: "pointer" }}>
                            <Pencil size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ padding: "0.75rem 1rem", borderTop: "1px solid var(--border)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
              {t(`顯示 ${sortedAndFiltered.length} / ${total} 筆`, `Showing ${sortedAndFiltered.length} of ${total}`)}
            </div>
          </div>
        )}
      </main>

      {/* ── 渲染 Modals ── */}
      {showForm && <AssetForm editData={editAsset} onClose={() => { setShowForm(false); setEditAsset(null); }} onSuccess={fetchAssets} />}
      {qrAsset && <QRModal asset={qrAsset} onClose={() => setQrAsset(null)} />}
      {viewAsset && <AssetDetailModal asset={viewAsset} onClose={() => setViewAsset(null)} />} 
      
      {isMobile && <BottomNav />}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}