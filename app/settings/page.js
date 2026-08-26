"use client";
import { useState, useEffect, useRef } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  ChevronLeft, Moon, Sun, Languages, User, 
  ShieldAlert, Users, ChevronDown, Edit3,
  Laptop, Monitor, Plug, Package, Briefcase, Layers,
  Shield
} from "lucide-react";
import { useApp } from "../providers";
import ErrorLogViewer from "../../components/ErrorLogViewer";

const categoryIcons = {
  laptop:  { icon: Laptop,    label: ["筆電", "Laptop"], color: "var(--accent)", softColor: "var(--accent-soft)" },
  monitor: { icon: Monitor,   label: ["螢幕", "Monitor"], color: "#f59e0b", softColor: "rgba(245, 158, 11, 0.15)" },
  docking: { icon: Plug,      label: ["Docking", "Docking"], color: "#10b981", softColor: "rgba(16, 185, 129, 0.15)" }, 
  office:  { icon: Briefcase, label: ["辦公室用品", "Office"], color: "#8b5cf6", softColor: "rgba(139, 92, 246, 0.15)" }, 
  semi:    { icon: Layers,    label: ["半成品", "Semi-finished"], color: "#06b6d4", softColor: "rgba(6, 182, 212, 0.15)" }, 
  other:   { icon: Package,   label: ["其他", "Other"], color: "#71717a", softColor: "rgba(113, 113, 122, 0.15)" },
};

function DepartmentSelect({ value, onChange, options, t }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayValue = value || t("未指定部門", "Unassigned");

  return (
    <div ref={ref} style={{ position: "relative", flex: 1 }}>
      <button 
        type="button" 
        onClick={() => setIsOpen(!isOpen)} 
        style={{ 
          width: "100%", background: "transparent", border: "none", 
          color: value ? "var(--text-primary)" : "var(--text-muted)", 
          fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", 
          display: "flex", alignItems: "center", justifyContent: "space-between", 
          outline: "none", padding: "0"
        }}
      >
        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{displayValue}</span>
        <ChevronDown size={14} style={{ color: "var(--text-muted)", transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
      </button>

      {isOpen && (
        <div className="animate-fade-in" style={{ 
          position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, zIndex: 100, 
          background: "var(--bg-surface)", border: "1px solid var(--border)", 
          borderRadius: "12px", boxShadow: "var(--shadow-lg)", padding: "4px", 
          display: "flex", flexDirection: "column", gap: "2px",
          maxHeight: "200px", overflowY: "auto"
        }}>
          <div 
            onClick={() => { onChange(""); setIsOpen(false); }}
            style={{ 
              padding: "0.5rem 0.75rem", borderRadius: "8px", fontSize: "0.85rem", cursor: "pointer", 
              color: !value ? "var(--text-primary)" : "var(--text-secondary)", 
              background: !value ? "var(--bg-elevated)" : "transparent",
              fontWeight: !value ? 700 : 500, transition: "all 0.15s" 
            }}
            onMouseEnter={e => { if(value) { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-primary)"; } }}
            onMouseLeave={e => { if(value) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; } }}
          >
            {t("未指定部門", "Unassigned")}
          </div>
          
          {options.map(opt => {
            const isActive = value === opt;
            return (
              <div 
                key={opt}
                onClick={() => { onChange(opt); setIsOpen(false); }}
                style={{ 
                  padding: "0.5rem 0.75rem", borderRadius: "8px", fontSize: "0.85rem", cursor: "pointer", 
                  color: isActive ? "var(--text-primary)" : "var(--text-secondary)", 
                  background: isActive ? "var(--bg-elevated)" : "transparent",
                  fontWeight: isActive ? 700 : 500, transition: "all 0.15s" 
                }}
                onMouseEnter={e => { if(!isActive) { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-primary)"; } }}
                onMouseLeave={e => { if(!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; } }}
              >
                {opt}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CategorySelect({ value, onChange, categoryIcons, t }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  let displayValue = t("無 (None)", "None");
  if (value && categoryIcons[value]) {
    displayValue = t(categoryIcons[value].label[0], categoryIcons[value].label[1]);
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button 
        type="button" 
        onClick={() => setIsOpen(!isOpen)} 
        style={{ 
          background: "var(--bg-base)", border: "1px solid var(--border)", 
          color: "var(--text-primary)", padding: "2px 6px", borderRadius: "6px",
          fontSize: "0.85rem", cursor: "pointer", 
          display: "flex", alignItems: "center", gap: "0.5rem", 
          outline: "none"
        }}
      >
        <span style={{ whiteSpace: "nowrap" }}>{displayValue}</span>
        <ChevronDown size={12} style={{ color: "var(--text-muted)", transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
      </button>

      {isOpen && (
        <div className="animate-fade-in" style={{ 
          position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 100, 
          background: "var(--bg-surface)", border: "1px solid var(--border)", 
          borderRadius: "8px", boxShadow: "var(--shadow-lg)", padding: "4px", 
          display: "flex", flexDirection: "column", gap: "2px",
          maxHeight: "200px", overflowY: "auto", minWidth: "120px"
        }}>
          <div 
            onClick={() => { onChange(""); setIsOpen(false); }}
            style={{ 
              padding: "0.4rem 0.6rem", borderRadius: "6px", fontSize: "0.85rem", cursor: "pointer", 
              color: !value ? "var(--text-primary)" : "var(--text-secondary)", 
              background: !value ? "var(--bg-elevated)" : "transparent",
              fontWeight: !value ? 600 : 400, transition: "all 0.15s", whiteSpace: "nowrap"
            }}
            onMouseEnter={e => { if(!value) { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-primary)"; } }}
            onMouseLeave={e => { if(!value) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; } }}
          >
            {t("無 (None)", "None")}
          </div>
          
          {Object.keys(categoryIcons).map(cat => {
            const isActive = value === cat;
            return (
              <div 
                key={cat}
                onClick={() => { onChange(cat); setIsOpen(false); }}
                style={{ 
                  padding: "0.4rem 0.6rem", borderRadius: "6px", fontSize: "0.85rem", cursor: "pointer", 
                  color: isActive ? "var(--text-primary)" : "var(--text-secondary)", 
                  background: isActive ? "var(--bg-elevated)" : "transparent",
                  fontWeight: isActive ? 600 : 400, transition: "all 0.15s", whiteSpace: "nowrap"
                }}
                onMouseEnter={e => { if(!isActive) { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-primary)"; } }}
                onMouseLeave={e => { if(!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; } }}
              >
                {t(categoryIcons[cat].label[0], categoryIcons[cat].label[1])}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const { 
    theme, toggleTheme, lang, toggleLang, t, 
    customName, updateCustomName, 
    userAliases, updateUserAlias,
    userEmpIds, updateUserEmpId,
    userDepartments, updateUserDepartment,
    deptManagers, updateUserDeptManager,
    categoryManagers, updateUserCategoryManager
  } = useApp();
  
  const router = useRouter();

  const [adminViewAll, setAdminViewAll] = useState(true);
  const [adminStats, setAdminStats] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const [expandedUser, setExpandedUser] = useState(null);
  
  const [deptOptions, setDeptOptions] = useState([]);

  const isAdmin = session?.user?.email === "ho3363@gmail.com";

  useEffect(() => {
    const savedView = localStorage.getItem("adminViewAll");
    if (savedView !== null) setAdminViewAll(savedView === "true");

    const fetchDepartments = async () => {
      try {
        const res = await fetch('/api/departments');
        const data = await res.json();
        if (data.success) {
          setDeptOptions(data.data);
        }
      } catch (err) {
        console.error("無法取得部門列表", err);
      }
    };
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (isAdmin) fetchAdminStats();
  }, [isAdmin]);

  const fetchAdminStats = async () => {
    setLoadingStats(true);
    try {
      const res = await fetch('/api/assets?adminView=true', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        const grouped = data.data.reduce((acc, asset) => {
          const owner = asset.owner || t('未分配', 'Unassigned');
          const cat = asset.category || 'other';
          if (!acc[owner]) { acc[owner] = { total: 0, categories: {} }; }
          acc[owner].total += 1;
          acc[owner].categories[cat] = (acc[owner].categories[cat] || 0) + 1;
          return acc;
        }, {});
        const statsArray = Object.entries(grouped).map(([email, data]) => ({ email, ...data })).sort((a, b) => b.total - a.total);
        setAdminStats(statsArray);
      }
    } catch (error) {
      console.error("無法取得統計資料", error);
    } finally {
      setLoadingStats(false);
    }
  };

  const toggleAdminView = () => {
    const nextState = !adminViewAll;
    setAdminViewAll(nextState);
    localStorage.setItem("adminViewAll", nextState);
    router.refresh(); 
  };

  return (
    <div style={{ 
      minHeight: "100vh", background: "var(--bg-base)", color: "var(--text-primary)", 
      paddingTop: "calc(1.5rem + env(safe-area-inset-top))", paddingLeft: "1.5rem", paddingRight: "1.5rem", paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))"
    }}>
      <header style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
        <button onClick={() => window.location.href = "/"} style={{ width: "40px", height: "40px", borderRadius: "12px", background: "var(--bg-surface)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-primary)", outline: "none", WebkitTapHighlightColor: "transparent" }}>
          <ChevronLeft size={20} />
        </button>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800 }}>{t("系統設定", "Settings")}</h1>
      </header>

      <main style={{ maxWidth: "600px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {/* Profile Section */}
        <section style={{ background: "var(--bg-surface)", borderRadius: "16px", border: "1px solid var(--border)", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ padding: "1.25rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--bg-elevated)", border: "2px solid var(--border)", overflow: "hidden" }}>
              {session?.user?.image ? <img src={session.user.image} alt="Avatar" style={{ width: "100%", height: "100%" }} /> : <User size={24} style={{ margin: "12px", color: "var(--text-muted)" }} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "1rem", fontWeight: 700 }}>{session ? (customName || session.user.name) : t("訪客", "Guest")}{isAdmin && <span style={{ marginLeft: "8px", fontSize: "0.7rem", padding: "2px 6px", background: "var(--danger-soft)", color: "var(--danger)", borderRadius: "4px" }}>Admin</span>}</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{session?.user?.email}</div>
            </div>
          </div>
          {session && (
            <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)" }}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.5rem", textTransform: "uppercase" }}>{t("自訂您的顯示名稱", "Your Display Name")}</label>
                <input type="text" value={customName} onChange={(e) => updateCustomName(e.target.value, session?.user?.email)} placeholder={session.user.name} style={{ width: "100%", padding: "0.7rem 0.8rem", borderRadius: "10px", background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)", outline: "none", transition: "border-color 0.2s" }} onFocus={e => e.target.style.borderColor = "var(--border-focus)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.5rem", textTransform: "uppercase" }}>{t("您的員工編號", "Your Employee ID")}</label>
                <input type="text" value={userEmpIds[session.user.email] || ""} onChange={(e) => updateUserEmpId(session.user.email, e.target.value)} placeholder={t("設定員工編號 (如: EMP001)", "Set Employee ID...")} style={{ width: "100%", padding: "0.7rem 0.8rem", borderRadius: "10px", background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)", outline: "none", transition: "border-color 0.2s" }} onFocus={e => e.target.style.borderColor = "var(--border-focus)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
              </div>
            </div>
          )}
          <div style={{ padding: "0.75rem" }}>
            <button onClick={() => session ? signOut() : signIn("google")} style={{ width: "100%", padding: "0.75rem", borderRadius: "10px", background: session ? "var(--danger-soft)" : "var(--text-primary)", color: session ? "var(--danger)" : "var(--bg-base)", border: "none", cursor: "pointer", fontWeight: 600, outline: "none", WebkitTapHighlightColor: "transparent" }}>{session ? t("登出帳號", "Sign Out") : t("登入 Google", "Sign in with Google")}</button>
          </div>
        </section>

        {/* Global Settings Section */}
        <section style={{ background: "var(--bg-surface)", borderRadius: "16px", border: "1px solid var(--border)", padding: "0.5rem", boxShadow: "var(--shadow-sm)" }}>
          {isAdmin && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 0.75rem", borderBottom: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <ShieldAlert size={20} color="var(--danger)" />
                <div><span style={{ fontSize: "0.95rem", fontWeight: 600 }}>{t("查看全公司資產", "Global View")}</span><br/><span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{t("關閉後僅顯示個人名下設備", "Individual only")}</span></div>
              </div>
              <button onClick={toggleAdminView} style={{ width: "48px", height: "24px", borderRadius: "12px", background: adminViewAll ? "var(--success)" : "var(--bg-elevated)", border: "none", cursor: "pointer", position: "relative", transition: "0.3s", outline: "none", WebkitTapHighlightColor: "transparent" }}><div style={{ width: "18px", height: "18px", borderRadius: "50%", background: "#fff", position: "absolute", top: "3px", left: adminViewAll ? "27px" : "3px", transition: "0.3s" }} /></button>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 0.75rem", borderBottom: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>{theme === "dark" ? <Moon size={20} /> : <Sun size={20} />}<span style={{ fontSize: "0.95rem", fontWeight: 600 }}>{t("深色模式", "Dark Mode")}</span></div>
            <button onClick={toggleTheme} style={{ width: "48px", height: "24px", borderRadius: "12px", background: theme === "dark" ? "var(--text-primary)" : "var(--bg-elevated)", border: "none", cursor: "pointer", position: "relative", transition: "0.3s", outline: "none", WebkitTapHighlightColor: "transparent" }}><div style={{ width: "18px", height: "18px", borderRadius: "50%", background: theme === "dark" ? "var(--bg-base)" : "#fff", position: "absolute", top: "3px", left: theme === "dark" ? "27px" : "3px", transition: "0.3s" }} /></button>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}><Languages size={20} /><span style={{ fontSize: "0.95rem", fontWeight: 600 }}>{t("介面語言", "Language")}</span></div>
            <button onClick={toggleLang} style={{ padding: "0.4rem 0.8rem", borderRadius: "8px", background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)", fontSize: "0.8rem", cursor: "pointer", outline: "none", WebkitTapHighlightColor: "transparent" }}>{lang === "zh" ? "繁體中文" : "English"}</button>
          </div>
        </section>

        {/* 🌟 修正：移除 overflow: "hidden"，讓下拉選單可以順利超出版界 */}
        {isAdmin && (
          <section style={{ background: "var(--bg-surface)", borderRadius: "16px", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", position: "relative", zIndex: 10 }}>
            <button onClick={() => setShowUserList(!showUserList)} style={{ width: "100%", padding: "1.25rem", background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", color: "var(--text-primary)", outline: "none", WebkitTapHighlightColor: "transparent" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <Users size={20} color="var(--accent)" />
                <span style={{ fontSize: "1rem", fontWeight: 800 }}>{t("使用者資產分布", "User Distribution")}</span>
                <span style={{ fontSize: "0.75rem", padding: "2px 8px", background: "var(--bg-elevated)", borderRadius: "6px", color: "var(--text-muted)", border: "1px solid var(--border)" }}>{adminStats.length}</span>
              </div>
              <ChevronDown size={20} style={{ transform: showUserList ? "rotate(180deg)" : "none", transition: "0.3s", color: "var(--text-muted)" }} />
            </button>
            
            {showUserList && (
              <div className="animate-fade-in" style={{ padding: "0 1.25rem 1.25rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {loadingStats ? (
                  <div style={{ textAlign: "center", padding: "1rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>Loading...</div>
                ) : adminStats.map((user, idx) => {
                  const isExpanded = expandedUser === user.email;
                  const displayName = userAliases[user.email] || user.email.split('@')[0];

                  return (
                    // 🌟 修正：移除 overflow: "hidden"，並加上動態 zIndex 確保展開的卡片蓋在別的卡片上面
                    <div key={idx} style={{ background: "var(--bg-elevated)", borderRadius: "12px", border: "1px solid var(--border)", position: "relative", zIndex: isExpanded ? 20 : 1 }}>
                      <button onClick={() => setExpandedUser(isExpanded ? null : user.email)} style={{ width: "100%", padding: "0.85rem 1rem", border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", color: "var(--text-primary)", outline: "none", WebkitTapHighlightColor: "transparent" }}>
                        
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "2px" }}>
                          <span style={{ fontSize: "0.9rem", fontWeight: 700 }}>{displayName}</span>
                          {userAliases[user.email] && <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{user.email}</span>}
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                           <span style={{ fontSize: "0.75rem", fontWeight: 700, background: "var(--accent-soft)", color: "var(--accent)", padding: "2px 8px", borderRadius: "999px" }}>{user.total} 項</span>
                           <ChevronDown size={14} style={{ transform: isExpanded ? "rotate(180deg)" : "none", transition: "0.2s" }} />
                        </div>
                      </button>

                      {isExpanded && (
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          
                          <div style={{ padding: "0.6rem 1rem", borderTop: "1px dashed var(--border)", borderBottom: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "0.5rem", background: "var(--bg-base)" }}>
                            
                            {/* 別名設定 */}
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <Edit3 size={14} color="var(--accent)" />
                              <input
                                type="text"
                                placeholder={t("設定好記的名稱 (如: Kenji)", "Set Display Name...")}
                                value={userAliases[user.email] || ""}
                                onChange={(e) => updateUserAlias(user.email, e.target.value)}
                                style={{ flex: 1, background: "transparent", border: "none", color: "var(--accent)", fontSize: "0.85rem", fontWeight: 600, outline: "none" }}
                              />
                            </div>
                            
                            {/* 員工編號設定 */}
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "14px", height: "14px", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)" }}>ID</span>
                              <input
                                type="text"
                                placeholder={t("設定員工編號 (如: EMP001)", "Set Employee ID...")}
                                value={userEmpIds[user.email] || ""}
                                onChange={(e) => updateUserEmpId(user.email, e.target.value)}
                                style={{ flex: 1, background: "transparent", border: "none", color: "var(--text-secondary)", fontSize: "0.85rem", fontWeight: 600, outline: "none" }}
                              />
                            </div>

                            {/* 動態下拉選單 */}
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <Briefcase size={14} color="#8b5cf6" />
                              <DepartmentSelect 
                                value={userDepartments[user.email] || ""} 
                                onChange={(val) => updateUserDepartment(user.email, val)} 
                                options={deptOptions} 
                                t={t} 
                              />
                            </div>

                            {/* 部門管理人設定 */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", marginTop: "0.4rem", padding: "0.4rem 0.5rem", background: "var(--bg-elevated)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <Shield size={14} color={(deptManagers[user.email] === userDepartments[user.email] && !!userDepartments[user.email]) ? "var(--accent)" : "var(--text-muted)"} />
                                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                                  {t("設為此部門的管理人", "Set as Dept Manager")}
                                </span>
                              </div>
                              <label style={{ position: "relative", display: "inline-block", width: "36px", height: "20px", flexShrink: 0 }}>
                                <input
                                  type="checkbox"
                                  checked={deptManagers[user.email] === userDepartments[user.email] && !!userDepartments[user.email]}
                                  disabled={!userDepartments[user.email]}
                                  onChange={(e) => {
                                    updateUserDeptManager(user.email, e.target.checked ? userDepartments[user.email] : "");
                                  }}
                                  style={{ opacity: 0, width: 0, height: 0, position: "absolute" }}
                                />
                                <span style={{
                                  position: "absolute", cursor: userDepartments[user.email] ? "pointer" : "not-allowed", inset: 0,
                                  background: (deptManagers[user.email] === userDepartments[user.email] && !!userDepartments[user.email]) ? "var(--accent)" : "var(--bg-hover)",
                                  borderRadius: "20px", transition: "0.2s",
                                  border: "1px solid var(--border)",
                                  opacity: userDepartments[user.email] ? 1 : 0.5
                                }}>
                                  <span style={{
                                    position: "absolute", height: "12px", width: "12px",
                                    left: (deptManagers[user.email] === userDepartments[user.email] && !!userDepartments[user.email]) ? "20px" : "3px", bottom: "3px",
                                    background: "var(--bg-surface)", borderRadius: "50%", transition: "0.2s",
                                    boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                                  }} />
                                </span>
                              </label>
                            </div>

                            {/* 項目管理人設定 */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", marginTop: "0.4rem", padding: "0.4rem 0.5rem", background: "var(--bg-elevated)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <Briefcase size={14} color={categoryManagers[user.email] ? "var(--accent)" : "var(--text-muted)"} />
                                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                                  {t("項目管理人", "Category Manager")}
                                </span>
                              </div>
                              <CategorySelect 
                                value={categoryManagers[user.email] || ""}
                                onChange={(val) => updateUserCategoryManager(user.email, val)}
                                categoryIcons={categoryIcons}
                                t={t}
                              />
                            </div>

                          </div>

                          <div style={{ padding: "0.85rem 1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
                            {Object.entries(categoryIcons).map(([key, meta]) => {
                              const count = user.categories[key] || 0;
                              if (count === 0) return null;
                              const Icon = meta.icon;
                              return (
                                <div key={key} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.75rem", background: "var(--bg-surface)", borderRadius: "10px", border: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "24px", height: "24px", borderRadius: "6px", background: meta.color, color: "var(--bg-base)" }}>
                                    <Icon size={14} strokeWidth={2.5} />
                                  </div>
                                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", flex: 1 }}>{t(meta.label[0], meta.label[1])}</span>
                                  <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--text-primary)" }}>{count}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ── 錯誤日誌 (僅管理員) ── */}
        {session?.user?.email?.toLowerCase() === "ho3363@gmail.com" && (
          <section style={{ marginTop: "1.5rem", background: "var(--bg-surface)", borderRadius: "16px", border: "1px solid var(--border)", overflow: "hidden" }}>
            <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <ShieldAlert size={16} color="var(--danger)" />
              <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)" }}>{t("錯誤日誌", "Error Logs")}</span>
            </div>
            <div style={{ padding: "1rem 1.25rem" }}>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                {t("記錄於此裝置上發生過的前端錯誤，供開發者分析與排查。", "Frontend errors captured on this device for developer analysis.")}
              </p>
              <ErrorLogViewer />
            </div>
          </section>
        )}
      </main>
    </div>
  );
}