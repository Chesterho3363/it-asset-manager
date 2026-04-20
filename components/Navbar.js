"use client";
import { Bell, Settings, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useApp } from "../app/providers";

export default function Navbar() {
  const router = useRouter();
  const { data: session } = useSession();
  const { customName, showOnlyIssues, setShowOnlyIssues } = useApp();

  const displayName = session ? (customName || session.user.name) : "Guest";

  return (
    <nav style={{
      position: "sticky",
      top: 0,
      zIndex: 100,
      background: "transparent",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
      paddingTop: "calc(0.5rem + env(safe-area-inset-top))",
      paddingBottom: "0.5rem",
      paddingLeft: "1.25rem",
      paddingRight: "1.25rem",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    }}>
      {/* 左側：純名稱 */}
      <div style={{ fontSize: "1.25rem", fontWeight: 800, fontFamily: "var(--font-display)", letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
        {displayName}
      </div>

      {/* 右側：功能選單 */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        background: "var(--bg-surface)",
        padding: "0.3rem",
        borderRadius: "999px",
        border: "1px solid var(--border)",
        boxShadow: "0 2px 10px rgba(0,0,0,0.2)"
      }}>
        
        <button 
          onClick={() => setShowOnlyIssues && setShowOnlyIssues(!showOnlyIssues)}
          style={{ 
            position: "relative", 
            padding: "0.4rem", 
            background: showOnlyIssues ? "var(--danger-soft)" : "transparent", 
            border: "none", 
            borderRadius: "50%",
            color: showOnlyIssues ? "var(--danger)" : "var(--text-secondary)", 
            cursor: "pointer", 
            outline: "none", 
            WebkitTapHighlightColor: "transparent",
            transition: "all 0.2s"
          }}
        >
          <Bell size={18} />
        </button>

        <button onClick={() => router.push('/settings')} style={{ padding: "0.4rem", background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer", outline: "none", WebkitTapHighlightColor: "transparent" }}>
          <Settings size={18} />
        </button>

        {/* 🌟 修改：為頭像區塊加入 onClick 與指標，讓它也具備按鈕功能 */}
        <div 
          onClick={() => router.push('/settings')}
          style={{ 
            width: "30px", 
            height: "30px", 
            borderRadius: "50%", 
            background: "var(--bg-elevated)", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            overflow: "hidden",
            cursor: "pointer",           /* 讓滑鼠變成手指形狀 */
            transition: "opacity 0.2s"   /* 加入轉場動畫 */
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = 0.8}
          onMouseLeave={e => e.currentTarget.style.opacity = 1}
        >
          {session?.user?.image ? (
            <img src={session.user.image} alt="User" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <User size={16} color="var(--text-primary)" />
          )}
        </div>
      </div>
    </nav>
  );
}