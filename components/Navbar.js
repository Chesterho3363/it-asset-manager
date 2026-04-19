"use client";
import { Bell, Settings, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useApp } from "../app/providers";

export default function Navbar() {
  const router = useRouter();
  const { data: session } = useSession();
  const { customName } = useApp();

  // 自動判斷要顯示的名稱（自訂名稱優先，再來是 Google 暱稱，最後是訪客）
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
      {/* 🌟 左側：專屬問候語與標題 */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div className="animate-fade-in" style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: "2px" }}>
          Hi, {displayName} 👋
        </div>
        <div style={{ fontSize: "1.25rem", fontWeight: 800, fontFamily: "var(--font-display)", letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
          Your Assets
        </div>
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
        <button style={{ position: "relative", padding: "0.4rem", background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer", outline: "none", WebkitTapHighlightColor: "transparent" }}>
          <Bell size={18} />
          <span style={{ position: "absolute", top: "4px", right: "4px", width: "6px", height: "6px", background: "var(--danger)", borderRadius: "50%" }} />
        </button>
        <button onClick={() => router.push('/settings')} style={{ padding: "0.4rem", background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer", outline: "none", WebkitTapHighlightColor: "transparent" }}>
          <Settings size={18} />
        </button>
        <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
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