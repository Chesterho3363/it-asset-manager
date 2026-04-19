"use client";
import { useState, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  ChevronLeft, Moon, Sun, Languages, LogOut, User, 
  CheckCircle2, ShieldAlert, Users, ChevronDown, 
  Laptop, Monitor, Plug, Package, Briefcase, Layers 
} from "lucide-react";
import { useApp } from "../providers";

const categoryIcons = {
  laptop:  { icon: Laptop,    label: ["筆電", "Laptop"], color: "var(--accent)", softColor: "var(--accent-soft)" },
  monitor: { icon: Monitor,   label: ["螢幕", "Monitor"], color: "#f59e0b", softColor: "rgba(245, 158, 11, 0.15)" },
  docking: { icon: Plug,      label: ["Docking", "Docking"], color: "#10b981", softColor: "rgba(16, 185, 129, 0.15)" }, 
  office:  { icon: Briefcase, label: ["辦公室用品", "Office"], color: "#8b5cf6", softColor: "rgba(139, 92, 246, 0.15)" }, 
  semi:    { icon: Layers,    label: ["半成品", "Semi-finished"], color: "#06b6d4", softColor: "rgba(6, 182, 212, 0.15)" }, 
  other:   { icon: Package,   label: ["其他", "Other"], color: "#71717a", softColor: "rgba(113, 113, 122, 0.15)" },
};

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const { theme, toggleTheme, lang, toggleLang, t, customName, updateCustomName } = useApp();
  const router = useRouter();

  const [adminViewAll, setAdminViewAll] = useState(true);
  const [adminStats, setAdminStats] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const [expandedUser, setExpandedUser] = useState(null);

  const isAdmin = session?.user?.email === "ho3363@gmail.com";

  useEffect(() => {
    const savedView = localStorage.getItem("adminViewAll");
    if (savedView !== null) setAdminViewAll(savedView === "true");
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
      minHeight: "100vh", 
      background: "var(--bg-base)", 
      color: "var(--text-primary)", 
      // 🌟 關鍵修正：加入 env(safe-area-inset-top) 自動閃避 iOS 頂部時間與瀏海
      paddingTop: "calc(1.5rem + env(safe-area-inset-top))",
      paddingLeft: "1.5rem",
      paddingRight: "1.5rem",
      paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))"
    }}>
      <header style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
        <button onClick={() => window.location.href = "/"} style={{ width: "40px", height: "40px", borderRadius: "12px", background: "var(--bg-surface)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-primary)", outline: "none", WebkitTapHighlightColor: "transparent" }}>
          <ChevronLeft size={20} />
        </button>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800 }}>{t("系統設定", "Settings")}</h1>
      </header>

      <main style={{ maxWidth: "600px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
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
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.5rem", textTransform: "uppercase" }}>{t("自訂顯示名稱", "Display Name")}</label>
              <input type="text" value={customName} onChange={(e) => updateCustomName(e.target.value)} placeholder={session.user.name} style={{ width: "100%", padding: "0.7rem 0.8rem", borderRadius: "10px", background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)", outline: "none", transition: "border-color 0.2s" }} onFocus={e => e.target.style.borderColor = "var(--border-focus)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
            </div>
          )}
          <div style={{ padding: "0.75rem" }}>
            <button onClick={() => session ? signOut() : signIn("google")} style={{ width: "100%", padding: "0.75rem", borderRadius: "10px", background: session ? "var(--danger-soft)" : "var(--text-primary)", color: session ? "var(--danger)" : "var(--bg-base)", border: "none", cursor: "pointer", fontWeight: 600, outline: "none", WebkitTapHighlightColor: "transparent" }}>{session ? t("登出帳號", "Sign Out") : t("登入 Google", "Sign in with Google")}</button>
          </div>
        </section>

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

        {isAdmin && (
          <section style={{ background: "var(--bg-surface)", borderRadius: "16px", border: "1px solid var(--border)", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
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
                  return (
                    <div key={idx} style={{ background: "var(--bg-elevated)", borderRadius: "12px", border: "1px solid var(--border)", overflow: "hidden" }}>
                      <button onClick={() => setExpandedUser(isExpanded ? null : user.email)} style={{ width: "100%", padding: "0.85rem 1rem", border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", color: "var(--text-primary)", outline: "none", WebkitTapHighlightColor: "transparent" }}>
                        <span style={{ fontSize: "0.85rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                           <span style={{ fontSize: "0.75rem", fontWeight: 700, background: "var(--accent-soft)", color: "var(--accent)", padding: "2px 8px", borderRadius: "999px" }}>{user.total} 項</span>
                           <ChevronDown size={14} style={{ transform: isExpanded ? "rotate(180deg)" : "none", transition: "0.2s" }} />
                        </div>
                      </button>
                      {isExpanded && (
                        <div style={{ padding: "0.2rem 1rem 0.85rem 1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem", borderTop: "1px dashed var(--border)", marginTop: "-2px" }}>
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
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
        
        <div style={{ textAlign: "center", marginTop: "1rem", marginBottom: "2rem", display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.05em", opacity: 0.8 }}>
            ASSET TRACKER V2.7.0
          </div>
          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 500, opacity: 0.6 }}>
            By Chester
          </div>
        </div>

      </main>
    </div>
  );
}