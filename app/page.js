"use client";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import useSWR from "swr";
import { Plus, RefreshCw, CheckCircle2, Clock, Search, Undo2, QrCode, AlertCircle, AlertTriangle, Filter, Pencil, Users, Package, ChevronDown, Building2, Laptop, Monitor, Plug, Briefcase, Layers } from "lucide-react";
import Navbar from "../components/Navbar";
import BottomNav from "../components/BottomNav";
import AssetForm from "../components/AssetForm";
import QRModal from "../components/QRModal";
import { useApp } from "./providers"; 
import AssetDetailModal from "../components/AssetDetailModal";
import { useSession } from "next-auth/react";

import { SkeletonCard, SkeletonTable, AnimatedEmptyState } from "../components/ui/Loaders";
import { StatusBadge, CategoryBadge, DepartmentBadge, IssueBadge, DoeBadge, categoryMeta, isAssetOverdue } from "../components/ui/Badges";
import { StatCard } from "../components/ui/StatCard";
import { CustomSelect } from "../components/ui/CustomSelect";
import { SpecsPreview, parseSpecs } from "../components/ui/SpecsPreview";

// ─── 頁面主要元件 ─────────────────────────────────────────────────────────────

function AssetCard({ asset, t, onView, haptic }) {
  // 🌟 修正：拉入 userDepartments 以備無縫接軌
  const { userAliases, userDepartments } = useApp();
  const overdue = isAssetOverdue(asset.status, asset.returnDate);
  const ownerName = asset.owner ? (userAliases[asset.owner] || asset.owner.split('@')[0]) : null;
  // 🌟 修正：如果有 owner 但沒 department，就從對照表抓
  const displayDept = asset.department || (asset.owner ? userDepartments[asset.owner] : null);

  return (
    <div onClick={() => { haptic(30); onView(asset); }} style={{ background: "var(--bg-surface)", border: overdue ? "1px solid var(--danger)" : "1px solid var(--border)", borderRadius: "12px", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem", cursor: "pointer" }} className="btn-spring hover-lift">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: "1.05rem", fontWeight: 700, fontFamily: "var(--font-display)" }}>{asset.model || "—"}</div>
        <StatusBadge status={asset.status} returnDate={asset.returnDate} t={t} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}># {asset.assetCode}</div>
        <DepartmentBadge department={displayDept} />
      </div>
      {(asset.issueId || asset.doe) && (
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          <IssueBadge issueId={asset.issueId} />
          <DoeBadge doe={asset.doe} />
        </div>
      )}
      <SpecsPreview note={asset.note} category={asset.category} />
      
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginTop: "2px" }}>
        <CategoryBadge category={asset.category} t={t} />
        {asset.isShared && (
          <span style={{ 
            fontSize: "0.75rem", padding: "2px 6px", borderRadius: "4px", 
            background: "rgba(14, 165, 233, 0.15)", 
            color: "#0ea5e9", 
            fontWeight: 700,
            display: "inline-flex",
            alignItems: "center",
            gap: "2px"
          }}>
            <Users size={12} /> 
            {asset.shareWithEveryone !== false 
              ? t("公開共用", "Publicly Shared") 
              : t("限定共用", "Restricted Share")}
          </span>
        )}
        {ownerName && <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "2px", background: "var(--bg-elevated)", padding: "2px 6px", borderRadius: "4px" }}>👑 {ownerName}</span>}
        {asset.borrower && <span style={{ fontSize: "0.75rem", color: "var(--warning)", display: "flex", alignItems: "center", gap: "2px", background: "var(--warning-soft)", padding: "2px 6px", borderRadius: "4px", fontWeight: 600 }}>👤 {asset.borrower}</span>}
      </div>
    </div>
  );
}

export default function AssetsPage({ showSharedOnly = false }) {
  const { t, showOnlyIssues, userAliases, userDepartments, deptManagers, categoryManagers, offlineSafeFetch } = useApp();
  const { data: session } = useSession();
  const userEmail = session?.user?.email?.toLowerCase().trim();
  const adminEmail = "ho3363@gmail.com";
  const isAdmin = userEmail === adminEmail;

  // ── SWR Data Fetching ──
  // 讀取管理員的「查看全公司」開關，並將其作為 SWR key 的一部分
  // 這樣當設定頁面切換開關並執行 router.refresh() 後，SWR 就會用不同的 URL 重新拉取
  const adminViewAll = isAdmin
    ? (typeof window !== "undefined" ? localStorage.getItem("adminViewAll") !== "false" : true)
    : false;
  
  const apiUrl = isAdmin ? `/api/assets?adminView=${adminViewAll}` : "/api/assets";

  const fetcher = (url) => fetch(url).then(res => res.json());
  const { data: assetsData, error, isLoading, mutate: fetchAssets } = useSWR(apiUrl, fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  });

  const baseAssets = assetsData?.success ? assetsData.data : [];
  const loading = isLoading;

  // ── States ──
  const [activeTab, setActiveTab] = useState("personal");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [sortBy, setSortBy] = useState("date_desc");
  const [showForm, setShowForm] = useState(false);
  const [isBorrowMode, setIsBorrowMode] = useState(false);
  const [editAsset, setEditAsset] = useState(null);
  const [returningId, setReturningId] = useState(null);
  const [qrAsset, setQrAsset] = useState(null);
  const [viewAsset, setViewAsset] = useState(null);
  
  const [deptOptions, setDeptOptions] = useState([{ value: "all", label: t("全部部門", "All Depts") }]); 
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

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await fetch('/api/departments');
        const data = await res.json();
        if (data.success) {
          const options = [{ value: "all", label: t("全部部門", "All Depts") }, ...data.data.map(d => ({ value: d, label: d }))];
          setDeptOptions(options);
        }
      } catch (e) { console.error(e); }
    };
    fetchDepts();
  }, [t]);

  const handleReturn = async (asset) => {
    if (!confirm(t(`確定歸還「${asset.assetCode}」？`, `Return "${asset.assetCode}"?`))) return;
    haptic(60); 
    setReturningId(asset.id);

    // 🌟 SWR 樂觀更新數據：立即將該資產狀態變為 available，borrower 清空
    const optimisticData = {
      ...assetsData,
      data: assetsData.data.map(a => a.id === asset.id ? { ...a, status: "available", borrower: "", returnDate: null } : a)
    };

    try { 
      await fetchAssets(
        async () => {
          const res = await offlineSafeFetch(`/api/assets/${asset.id}`, { 
            method: "PATCH", 
            headers: { "Content-Type": "application/json" }, 
            body: JSON.stringify({ status: "available", borrower: "", returnDate: null }) 
          });
          const json = await res.json();
          return {
            ...assetsData,
            data: assetsData.data.map(a => a.id === asset.id ? { ...a, ...json.data } : a)
          };
        },
        {
          optimisticData,
          rollbackOnError: true,
          populateCache: true,
          revalidate: true
        }
      );
    } catch (e) {
      console.error("[Return Error] Failed to return asset:", e);
    } finally { 
      setReturningId(null); 
    }
  };

  const handleFormSuccess = async (responseData, actionType) => {
    if (!responseData || !responseData.success) {
      fetchAssets();
      return;
    }

    const { isOfflineBuffered, data: responseAsset } = responseData;

    // 樂觀更新 SWR 快取
    const optimisticData = {
      ...assetsData,
      data: assetsData?.data ? [...assetsData.data] : []
    };

    if (actionType === "delete") {
      optimisticData.data = optimisticData.data.filter(a => a.id !== responseAsset.id);
    } else if (actionType === "edit") {
      optimisticData.data = optimisticData.data.map(a => a.id === responseAsset.id ? { ...a, ...responseAsset } : a);
    } else if (actionType === "add") {
      const newAsset = {
        ...responseAsset,
        owner: responseAsset.owner || userEmail,
        status: responseAsset.status || "available"
      };
      optimisticData.data.unshift(newAsset);
    }

    try {
      await fetchAssets(
        async () => {
          return optimisticData;
        },
        {
          optimisticData,
          rollbackOnError: true,
          populateCache: true,
          revalidate: !isOfflineBuffered
        }
      );
    } catch (e) {
      console.error("[Form Success Error] Failed to mutate cache:", e);
    }
  };

  // ── Filtered Assets & Stats Calculation ──
  const { filtered, stats } = useMemo(() => {
    let filteredBase = baseAssets;
    
    // 1. Initial scope filter (Tab context)
    if (activeTab === "categoryManager" && userEmail && categoryManagers?.[userEmail]) {
      const managedCategory = categoryManagers[userEmail];
      filteredBase = baseAssets.filter(a => a.category?.toLowerCase() === managedCategory?.toLowerCase());
    } else {
      filteredBase = baseAssets.filter(a => {
        const isOwner = userEmail && a.owner?.toLowerCase().trim() === userEmail;
        const displayDept = a.department || (a.owner ? userDepartments[a.owner] : null);
        const isDeptManager = userEmail && deptManagers?.[userEmail] && displayDept && 
          deptManagers[userEmail].toLowerCase().trim() === displayDept.toLowerCase().trim();

        let hasAccess = false;
        
        if (isAdmin) {
           if (activeTab === "adminAll" || showSharedOnly || isOwner) {
             hasAccess = true;
           }
        } else if (isOwner || isDeptManager) {
          hasAccess = true;
        } 
        
        if (!hasAccess && a.isShared) {
          if (a.shareWithEveryone !== false) {
            hasAccess = true;
          } else {
            const currentDept = userEmail ? userDepartments[userEmail] : "";
            const currentUserAlias = userEmail ? userAliases[userEmail] : "";
            const currentUserNamePrefix = userEmail ? userEmail.split('@')[0] : "";
            const inDepts = a.sharedDepts && currentDept && a.sharedDepts.includes(currentDept);
            const inUsers = a.sharedUsers && userEmail && (
              a.sharedUsers.includes(userEmail) || 
              (currentUserAlias && a.sharedUsers.includes(currentUserAlias)) ||
              a.sharedUsers.includes(currentUserNamePrefix)
            );
            hasAccess = inDepts || inUsers;
          }
        }
        
        if (!hasAccess) return false;
        if (!showSharedOnly && activeTab !== "adminAll" && !isOwner && !isDeptManager) return false;
        
        return true;
      });
    }

    // 2. Apply search and other filters EXCEPT status
    const preStatusFiltered = filteredBase.filter(a => {
      if (showSharedOnly && !a.isShared) return false;
      const isOwner = userEmail && a.owner?.toLowerCase().trim() === userEmail;
      if (!showSharedOnly && activeTab === "personal" && a.isShared && !isOwner) return false;
      if (showOnlyIssues && !a.issueId && !a.doe) return false;
      
      const q = search.toLowerCase();
      const ownerAlias = a.owner ? (userAliases[a.owner] || a.owner.split('@')[0]) : "";
      const matchSearch = !search || 
        (a.assetCode||"").toLowerCase().includes(q) || 
        (a.model||"").toLowerCase().includes(q) || 
        (a.borrower||"").toLowerCase().includes(q) || 
        ownerAlias.toLowerCase().includes(q); 
      
      const assetDept = a.department || (a.owner ? userDepartments[a.owner] : "未分類");
      const matchDept = filterDepartment === "all" || assetDept === filterDepartment;
      const matchCat = filterCategory === "all" || a.category === filterCategory;
      
      return matchSearch && matchDept && matchCat;
    });

    // 3. Calculate stats based on preStatusFiltered
    const s = { total: 0, available: 0, borrowed: 0, overdue: 0 };
    preStatusFiltered.forEach(a => {
      s.total++;
      if (a.status === "available") s.available++;
      if (a.status === "borrowed") {
        s.borrowed++;
        if (isAssetOverdue(a.status, a.returnDate)) s.overdue++;
      }
    });

    // 4. Apply status filter
    const finalFiltered = preStatusFiltered.filter(a => {
      return filterStatus === "all" || (filterStatus === "overdue" ? isAssetOverdue(a.status, a.returnDate) : a.status === filterStatus);
    });

    // 5. Sort
    const sorted = [...finalFiltered].sort((a, b) => {
      if (sortBy === "assetCode") return (a.assetCode || "").localeCompare(b.assetCode || "");
      if (sortBy === "model") return (a.model || "").localeCompare(b.model || "");
      if (sortBy === "date_desc") return new Date(b.acquisitionDate || 0) - new Date(a.acquisitionDate || 0);
      if (sortBy === "date_asc") return new Date(a.acquisitionDate || 0) - new Date(b.acquisitionDate || 0);
      return 0;
    });

    return { filtered: sorted, stats: s };
  }, [baseAssets, search, filterStatus, filterCategory, filterDepartment, sortBy, isAdmin, userEmail, userDepartments, userAliases, showSharedOnly, showOnlyIssues, activeTab, categoryManagers]);

  const hasActiveFilters = search || filterStatus !== "all" || filterCategory !== "all" || filterDepartment !== "all" || sortBy !== "date_desc";

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", paddingBottom: isMobile ? "calc(140px + env(safe-area-inset-bottom))" : "2rem" }}>
      <Navbar />
      <main style={{ maxWidth: "1400px", margin: "0 auto", padding: isMobile ? "1.5rem 1.25rem" : "2rem 1.5rem" }}>
        
        <div className="animate-fade-in" style={{ marginBottom: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: isMobile ? "1.6rem" : "2rem", fontWeight: 800, letterSpacing: "-0.03em", margin: 0 }}>
              {showSharedOnly ? t("共用裝置", "Shared Devices") : t("資產總覽", "Asset Overview")}
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "4px", margin: 0 }}>
              {showSharedOnly ? t("共享與輪流借用辦公室設備", "Share and rotate borrowing of office equipment") : t("管理所有 IT 設備的借還狀態", "Manage all IT equipment borrow status")}
            </p>
          </div>
          
          <div style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
            <button onClick={() => { haptic(); setShowFilters(!showFilters); }} style={{ position: "relative", background: showFilters ? "var(--bg-elevated)" : "transparent", border: "none", color: showFilters ? "var(--text-primary)" : "var(--text-muted)", cursor: "pointer", display: "flex", padding: "8px", borderRadius: "50%", transition: "all 0.2s" }} className="btn-spring">
              <Filter size={18} />
            </button>
            <button onClick={() => { haptic(); fetchAssets(); }} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "flex", padding: "8px", borderRadius: "50%", transition: "background 0.2s" }} className="btn-spring">
              <RefreshCw size={18} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            </button>
          </div>
        </div>        {!showSharedOnly && userEmail && (categoryManagers?.[userEmail] || (isAdmin && adminViewAll)) && (
          <div className="animate-fade-in" style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", background: "var(--bg-elevated)", padding: "0.25rem", borderRadius: "12px", overflowX: "auto", whiteSpace: "nowrap" }}>
            <button
              onClick={() => setActiveTab("personal")}
              style={{
                flex: 1, padding: "0.75rem 1rem", border: "none", borderRadius: "8px",
                background: activeTab === "personal" ? "var(--bg-surface)" : "transparent",
                color: activeTab === "personal" ? "var(--text-primary)" : "var(--text-muted)",
                fontWeight: activeTab === "personal" ? 700 : 500,
                boxShadow: activeTab === "personal" ? "0 2px 8px rgba(0,0,0,0.05)" : "none",
                cursor: "pointer", transition: "all 0.2s"
              }}
              className="btn-spring"
            >
              {t("個人資產", "Personal")}
            </button>
            {categoryManagers?.[userEmail] && (
              <button
                onClick={() => setActiveTab("categoryManager")}
                style={{
                  flex: 1, padding: "0.75rem 1rem", border: "none", borderRadius: "8px",
                  background: activeTab === "categoryManager" ? "var(--bg-surface)" : "transparent",
                  color: activeTab === "categoryManager" ? "var(--text-primary)" : "var(--text-muted)",
                  fontWeight: activeTab === "categoryManager" ? 700 : 500,
                  boxShadow: activeTab === "categoryManager" ? "0 2px 8px rgba(0,0,0,0.05)" : "none",
                  cursor: "pointer", transition: "all 0.2s"
                }}
                className="btn-spring"
              >
                {categoryManagers[userEmail]}
              </button>
            )}
            {isAdmin && adminViewAll && (
              <button
                onClick={() => setActiveTab("adminAll")}
                style={{
                  flex: 1, padding: "0.75rem 1rem", border: "none", borderRadius: "8px",
                  background: activeTab === "adminAll" ? "var(--bg-surface)" : "transparent",
                  color: activeTab === "adminAll" ? "var(--text-primary)" : "var(--text-muted)",
                  fontWeight: activeTab === "adminAll" ? 700 : 500,
                  boxShadow: activeTab === "adminAll" ? "0 2px 8px rgba(0,0,0,0.05)" : "none",
                  cursor: "pointer", transition: "all 0.2s"
                }}
                className="btn-spring"
              >
                {t("全公司資產", "Company Assets")}
              </button>
            )}
          </div>
        )}

        <div className="stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
          <div onClick={() => setFilterStatus("all")} style={{ cursor: "pointer" }} className="btn-spring">
            <StatCard label={t("資產總數", "Total")} value={stats.total} icon={Package} color="var(--accent)" isActive={filterStatus === "all"} />
          </div>
          <div onClick={() => setFilterStatus("available")} style={{ cursor: "pointer" }} className="btn-spring">
            <StatCard label={t("可借用", "Available")} value={stats.available} icon={CheckCircle2} color="var(--success)" isActive={filterStatus === "available"} />
          </div>
          <div onClick={() => setFilterStatus("borrowed")} style={{ cursor: "pointer" }} className="btn-spring">
            <StatCard label={t("借出中", "Borrowed")} value={stats.borrowed} icon={Clock} color="var(--warning)" isActive={filterStatus === "borrowed"} />
          </div>
          <div onClick={() => setFilterStatus("overdue")} style={{ cursor: "pointer" }} className="btn-spring">
             <StatCard label={t("逾期未還", "Overdue")} value={stats.overdue} icon={AlertCircle} color="var(--danger)" isActive={filterStatus === "overdue"} />
          </div>
        </div>

        {showFilters && (
          <div className="animate-fade-in" style={{ position: "relative", zIndex: 20, background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1rem", marginBottom: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem", boxShadow: "var(--shadow-sm)" }}>
            <div style={{ position: "relative" }}>
              <Search size={16} style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("搜尋編號、型號、保管人、借用人、Issue ID...", "Search...")}
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
              <CustomSelect value={filterDepartment} onChange={setFilterDepartment} options={deptOptions} />
              <CustomSelect value={sortBy} onChange={setSortBy} options={[{ value: "assetCode", label: t("依編號排序", "Sort by Code") }, { value: "model", label: t("依型號排序 (A-Z)", "Sort by Model") }, { value: "date_desc", label: t("取得日：新 ➔ 舊", "Date: Newest") }, { value: "date_asc", label: t("取得日：舊 ➔ 新", "Date: Oldest") }]} />
              
              {hasActiveFilters && (
                <button onClick={() => { setSearch(""); setFilterStatus("all"); setFilterCategory("all"); setFilterDepartment("all"); setSortBy("date_desc"); }} style={{ padding: "0.55rem 0.875rem", background: "var(--danger-soft)", border: "1px solid var(--danger)", borderRadius: "8px", color: "var(--danger)", fontSize: "0.8rem", fontFamily: "var(--font-display)", cursor: "pointer", outline: "none", transition: "all 0.2s" }}>{t("清除", "Clear")}</button>
              )}
            </div>
          </div>
        )}

        {error && !loading && (
          <div style={{ padding: "1rem", background: "var(--danger-soft)", border: "1px solid rgba(229,115,115,0.3)", borderRadius: "12px", color: "var(--danger)", display: "flex", gap: "0.8rem", alignItems: "flex-start", marginBottom: "1.5rem" }}>
            <AlertTriangle size={18} />
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{t("讀取資料失敗", "Error loading data")}</div>
              <div style={{ fontSize: "0.75rem", opacity: 0.8 }}>{error.message || String(error) || t("無法連接伺服器", "Failed to load data.")}</div>
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
        ) : filtered.length === 0 ? (
          <AnimatedEmptyState t={t} />
        ) : isMobile ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }} className="stagger">
            {filtered.map(asset => (
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
                    { label: t("部門 / 借用","Dept / Borrower"), align: "left" }, 
                    { label: t("Issue/DOE","Issue/DOE"), align: "left" },
                    { label: t("操作","Actions"), align: "right" }
                  ].map(h => (
                    <th key={h.label} style={{ padding: "1rem", textAlign: h.align, fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.05em", color: "var(--text-muted)", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(asset => {
                  const { text: noteText } = parseSpecs(asset.note);
                  const overdue = isAssetOverdue(asset.status, asset.returnDate);
                  
                  const ownerName = asset.owner ? (userAliases[asset.owner] || asset.owner.split('@')[0]) : null;
                  
                  // 🌟 修正：計算並應用無縫接軌的部門資料
                  const displayDept = asset.department || (asset.owner ? userDepartments[asset.owner] : null);

                  return (
                    <tr key={asset.id} 
                      onClick={() => { haptic(30); setViewAsset(asset); }}
                      style={{ borderBottom: "1px solid var(--border)", transition: "background 0.15s", background: overdue ? "var(--danger-soft)" : "transparent", cursor: "pointer" }}
                      onMouseEnter={e => e.currentTarget.style.background = overdue ? "var(--danger-soft)" : "var(--bg-hover)"}
                      onMouseLeave={e => e.currentTarget.style.background = overdue ? "var(--danger-soft)" : "transparent"}>
                      <td style={{ padding: "1rem", verticalAlign: "middle" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{asset.model || <span style={{ color: "var(--text-muted)" }}>—</span>}</div>
                          {asset.isShared && (
                            <span style={{ 
                              fontSize: "0.68rem", padding: "2px 6px", borderRadius: "4px", 
                              background: "rgba(14, 165, 233, 0.15)", 
                              color: "#0ea5e9", 
                              fontWeight: 700,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "2px"
                            }}>
                              <Users size={10} /> 
                              {asset.shareWithEveryone !== false 
                                ? t("公開共用", "Publicly Shared") 
                                : t("限定共用", "Restricted Share")}
                            </span>
                          )}
                        </div>
                        <SpecsPreview note={asset.note} category={asset.category} />
                        {noteText && <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "6px" }}>📝 {noteText}</div>}
                      </td>
                      <td style={{ padding: "1rem", verticalAlign: "middle", fontSize: "0.8rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{asset.assetCode || "—"}</td>
                      <td style={{ padding: "1rem", verticalAlign: "middle" }}><CategoryBadge category={asset.category} t={t} /></td>
                      <td style={{ padding: "1rem", verticalAlign: "middle" }}><StatusBadge status={asset.status} returnDate={asset.returnDate} t={t} /></td>
                      
                      <td style={{ padding: "1rem", verticalAlign: "middle" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-start" }}>
                          
                          {/* 🌟 修正：將無縫接軌的部門傳入 Badge */}
                          <DepartmentBadge department={displayDept} />
                          
                          {ownerName && (
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                              <span style={{ fontSize: "0.65rem", fontWeight: 700, background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-muted)", padding: "2px 6px", borderRadius: "4px" }}>保管</span>
                              {ownerName}
                            </div>
                          )}
                          {asset.borrower ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", color: "var(--warning)", fontWeight: 600 }}>
                               <span style={{ fontSize: "0.65rem", fontWeight: 700, background: "var(--warning-soft)", color: "var(--warning)", padding: "2px 6px", borderRadius: "4px" }}>借用</span>
                               {asset.borrower}
                            </div>
                          ) : (
                            !ownerName && !displayDept && <span style={{ color: "var(--text-muted)" }}>—</span>
                          )}
                          {asset.returnDate && <div style={{ fontSize: "0.72rem", color: overdue ? "var(--danger)" : "var(--text-muted)", fontWeight: overdue ? 700 : 500, marginTop: "2px" }}>📅 {asset.returnDate}</div>}
                        </div>
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
                          {(() => {
                            const isOwner = userEmail && asset.owner?.toLowerCase().trim() === userEmail;
                            const isDeptManager = userEmail && deptManagers?.[userEmail] && displayDept && 
                              deptManagers[userEmail].toLowerCase().trim() === displayDept.toLowerCase().trim();
                            const isCategoryManager = userEmail && categoryManagers?.[userEmail] && asset.category === categoryManagers[userEmail];
                            const canEdit = isAdmin || isOwner || isDeptManager || isCategoryManager;
                            
                            return canEdit ? (
                              <button onClick={(e) => { e.stopPropagation(); haptic(40); setEditAsset(asset); setShowForm(true); }} title={t("編輯","Edit")} 
                                style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", borderRadius: "8px", color: "var(--accent)", cursor: "pointer", transition: "background 0.2s" }}
                                onMouseEnter={e => e.currentTarget.style.background = "var(--accent-soft)"}
                                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                <Pencil size={15} />
                              </button>
                            ) : null;
                          })()}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        
        {!loading && !isMobile && filtered.length > 0 && (
          <div style={{ padding: "1rem 0", fontSize: "0.8rem", color: "var(--text-muted)", textAlign: "center" }}>
            {t(`顯示 ${filtered.length} / ${stats.total} 筆`, `Showing ${filtered.length} of ${stats.total}`)}
          </div>
        )}
      </main>

      <button onClick={() => { haptic(50); setEditAsset(activeTab === "categoryManager" ? { category: categoryManagers[userEmail], status: "available" } : null); setShowForm(true); }} style={{ 
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

      {showForm && <AssetForm editData={editAsset} onClose={() => { setShowForm(false); setIsBorrowMode(false); }} onSuccess={handleFormSuccess} isBorrowOnly={isBorrowMode} />}
      {qrAsset && <QRModal asset={qrAsset} onClose={() => setQrAsset(null)} />}
      
      {viewAsset && <AssetDetailModal asset={viewAsset} onClose={() => setViewAsset(null)} onEdit={(a) => { haptic(); setEditAsset(a); setShowForm(true); setViewAsset(null); }} onBorrow={(a) => { haptic(); setEditAsset(a); setIsBorrowMode(true); setShowForm(true); setViewAsset(null); }} onQR={(a) => { haptic(); setQrAsset(a); setViewAsset(null); }} onReturn={handleReturn} returning={returningId === viewAsset?.id} />} 
      
      {isMobile && <BottomNav />}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}