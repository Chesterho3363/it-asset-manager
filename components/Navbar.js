"use client";
import { Bell, Settings, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useApp } from "../app/providers";

export default function Navbar() {
  const router = useRouter();
  const { data: session } = useSession();
  const { t } = useApp();

  return (
    <nav style={{
      position: "sticky",
      top: 0,
      zIndex: 100,
      background: "var(--bg-base)",
      // 🌟 關鍵修正：將頂部留白改為動態適應，大幅減少多餘黑邊
      paddingTop: "calc(0.5rem + env(safe-area-inset-top))",
      paddingBottom: "0.5rem",
      paddingLeft: "1.25rem",
      paddingRight: "1.25rem",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    }}>
      <div style={{ fontSize: "1.25rem", fontWeight: 800, fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
        {t("IT 資產管理", "IT Asset Manager")}
      </div>

      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        background: "var(--bg-surface)",
        padding: "0.3rem",
        borderRadius: "999px",
        border: "1px solid var(--border)"
      }}>
        <button style={{ position: "relative", padding: "0.4rem", background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer", outline: "none", WebkitTapHighlightColor: "transparent" }}>
          <Bell size={18} />
          {/* 裝飾用的通知小紅點 */}
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