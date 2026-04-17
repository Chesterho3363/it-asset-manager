"use client";
import { useState, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Moon, Sun, Languages, LogOut, User, CheckCircle2, ShieldAlert } from "lucide-react";
import { useApp } from "../providers";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  // 🌟 從 useApp 取出 customName 跟 updateCustomName
  const { theme, toggleTheme, lang, toggleLang, t, customName, updateCustomName } = useApp();
  const router = useRouter();

  const [adminViewAll, setAdminViewAll] = useState(true);
  const isLoading = status === "loading";
  const isAdmin = session?.user?.email === "ho3363@gmail.com";

  useEffect(() => {
    const savedView = localStorage.getItem("adminViewAll");
    if (savedView !== null) {
      setAdminViewAll(savedView === "true");
    }
  }, []);

  const toggleAdminView = () => {
    const nextState = !adminViewAll;
    setAdminViewAll(nextState);
    localStorage.setItem("adminViewAll", nextState);
    router.refresh(); 
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", color: "var(--text-primary)", padding: "1.5rem" }}>
      <header style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
        <button 
          onClick={() => window.location.href = "/"}
          style={{ width: "40px", height: "40px", borderRadius: "12px", background: "var(--bg-surface)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-primary)" }}
        >
          <ChevronLeft size={20} />
        </button>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, fontFamily: "var(--font-display)" }}>{t("系統設定", "Settings")}</h1>
      </header>

      <main style={{ maxWidth: "600px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        
        {/* ── 1. 使用者帳戶區塊 ── */}
        <section style={{ background: "var(--bg-surface)", borderRadius: "16px", border: "1px solid var(--border)", overflow: "hidden" }}>
          <div style={{ padding: "1.25rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: "2px solid var(--border)" }}>
              {session?.user?.image ? (
                <img src={session.user.image} alt="Avatar" style={{ width: "100%", height: "100%" }} />
              ) : (
                <User size={24} style={{ color: "var(--text-muted)" }} />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "1rem", fontWeight: 700 }}>
                {/* 🌟 設定頁的名稱也同步顯示自訂名稱 */}
                {session ? (customName || session.user.name) : t("訪客模式", "Guest Mode")}
                {isAdmin && <span style={{ marginLeft: "8px", fontSize: "0.7rem", padding: "2px 6px", background: "var(--danger-soft)", color: "var(--danger)", borderRadius: "4px" }}>Admin</span>}
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                {session ? session.user.email : t("登入以同步您的資產數據", "Sign in to sync data")}
              </div>
            </div>
            {session && <CheckCircle2 size={18} style={{ color: "var(--success)" }} />}
          </div>

          {/* 🌟 新增：自訂名稱輸入框 (只有登入時才會顯示) */}
          {session && (
            <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)" }}>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                {t("自訂顯示名稱 (顯示於左上角)", "Custom Display Name")}
              </label>
              <input 
                type="text" 
                value={customName}
                onChange={(e) => updateCustomName(e.target.value)}
                placeholder={session.user.name}
                style={{
                  width: "100%", padding: "0.6rem 0.8rem", borderRadius: "8px",
                  background: "var(--bg-base)", border: "1px solid var(--border)",
                  color: "var(--text-primary)", fontSize: "0.9rem", outline: "none",
                  transition: "border-color 0.2s"
                }}
                onFocus={e => e.target.style.borderColor = "var(--border-focus)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"}
              />
            </div>
          )}

          <div style={{ padding: "0.75rem" }}>
            {session ? (
              <button onClick={() => signOut()} style={{ width: "100%", padding: "0.75rem", borderRadius: "10px", background: "var(--danger-soft)", color: "var(--danger)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", fontSize: "0.9rem", fontWeight: 600 }}>
                <LogOut size={16} /> {t("登出帳號", "Sign Out")}
              </button>
            ) : (
              <button onClick={() => signIn("google")} disabled={isLoading} style={{ width: "100%", padding: "0.75rem", borderRadius: "10px", background: "var(--text-primary)", color: "var(--bg-base)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", fontSize: "0.9rem", fontWeight: 700, opacity: isLoading ? 0.6 : 1 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {t("使用 Google 登入", "Sign in with Google")}
              </button>
            )}
          </div>
        </section>

        {/* ── 2. 介面設定區塊 ── */}
        <section style={{ background: "var(--bg-surface)", borderRadius: "16px", border: "1px solid var(--border)", padding: "0.5rem" }}>
          
          {isAdmin && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 0.75rem", borderBottom: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ color: "var(--danger)" }}><ShieldAlert size={20} /></div>
                <div>
                  <span style={{ fontSize: "0.95rem", fontWeight: 500, display: "block" }}>{t("查看全公司資產", "View All Assets")}</span>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{t("關閉後僅顯示個人名下設備", "Turn off to view only your assets")}</span>
                </div>
              </div>
              <button onClick={toggleAdminView} style={{ width: "48px", height: "24px", borderRadius: "12px", background: adminViewAll ? "var(--success)" : "var(--bg-elevated)", border: "1px solid var(--border)", cursor: "pointer", position: "relative", transition: "all 0.3s" }}>
                <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: adminViewAll ? "#fff" : "var(--text-muted)", position: "absolute", top: "2px", left: adminViewAll ? "26px" : "2px", transition: "all 0.3s" }} />
              </button>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 0.75rem", borderBottom: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ color: "var(--text-secondary)" }}>{theme === "dark" ? <Moon size={20} /> : <Sun size={20} />}</div>
              <span style={{ fontSize: "0.95rem", fontWeight: 500 }}>{t("深色模式", "Dark Mode")}</span>
            </div>
            <button onClick={toggleTheme} style={{ width: "48px", height: "24px", borderRadius: "12px", background: theme === "dark" ? "var(--text-primary)" : "var(--bg-elevated)", border: "1px solid var(--border)", cursor: "pointer", position: "relative", transition: "all 0.3s" }}>
              <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: theme === "dark" ? "var(--bg-base)" : "var(--text-muted)", position: "absolute", top: "2px", left: theme === "dark" ? "26px" : "2px", transition: "all 0.3s" }} />
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ color: "var(--text-secondary)" }}><Languages size={20} /></div>
              <span style={{ fontSize: "0.95rem", fontWeight: 500 }}>{t("顯示語言", "Language")}</span>
            </div>
            <button onClick={toggleLang} style={{ padding: "0.4rem 0.8rem", borderRadius: "8px", background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>
              {lang === "zh" ? "繁體中文" : "English"}
            </button>
          </div>
        </section>

        <div style={{ textAlign: "center", marginTop: "1rem" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", letterSpacing: "0.05em" }}>ASSET TRACKER V2.5.0</div>
        </div>
      </main>
    </div>
  );
}