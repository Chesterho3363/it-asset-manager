"use client";
import { Settings, Bell, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react"; // 🌟 引入 Session 拿 Google 資料
import { useApp } from "../app/providers";    // 🌟 取得自訂名稱

export default function Navbar() {
  const router = useRouter();
  const { data: session } = useSession(); 
  const { customName, t } = useApp();

  // 🌟 邏輯判斷：如果登入了，優先顯示自訂名稱 ➔ 沒有自訂就顯示 Google 名稱 ➔ 沒登入就顯示預設文字
  const displayName = session 
    ? (customName || session.user?.name) 
    : t("IT 資產管理", "IT Asset Manager");

  return (
    <nav style={{ padding: "1rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-surface)", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 50 }}>
      <div style={{ fontWeight: 800, fontSize: "1.25rem", fontFamily: "var(--font-display)", letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
        {/* 🌟 顯示名稱 */}
        {displayName}
      </div>
      
      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
        <button style={{ background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer", position: "relative" }}>
          <Bell size={20} />
          <span style={{ position: "absolute", top: 0, right: 0, width: "8px", height: "8px", background: "var(--danger)", borderRadius: "50%", border: "2px solid var(--bg-surface)" }}></span>
        </button>
        <button 
          onClick={() => router.push("/settings")}
          style={{ background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}
        >
          <Settings size={20} />
        </button>
        
        {/* 🌟 顯示 Google 頭像 */}
        <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--bg-elevated)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          {session?.user?.image ? (
            <img src={session.user.image} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <User size={16} style={{ color: "var(--text-muted)" }} />
          )}
        </div>
      </div>
    </nav>
  );
}