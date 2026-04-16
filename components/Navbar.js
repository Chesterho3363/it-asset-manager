"use client";
import { Box, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useApp } from "../app/layout";

export default function Navbar() {
  const { t } = useApp();
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);

  // 偵測螢幕寬度，判斷是否為手機版
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <nav style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "1rem 1.5rem", background: "var(--bg-surface)",
      borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 50
    }}>
      {/* 左側 Logo 與標題 (點擊可回首頁) */}
      <div
        onClick={() => router.push("/")}
        style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}
      >
        <div style={{
          width: "36px", height: "36px", background: "var(--accent)", color: "var(--bg-base)",
          borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <Box size={20} />
        </div>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.1rem", lineHeight: 1.1, color: "var(--text-primary)" }}>
            {t("IT 資產管理", "IT Asset Manager")}
          </div>
          <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", letterSpacing: "0.05em", fontFamily: "var(--font-mono)", marginTop: "2px" }}>
            ASSET TRACKER
          </div>
        </div>
      </div>

      {/* 右側按鈕：網頁版顯示「設定齒輪」，手機版則自動隱藏（交給 BottomNav 負責） */}
      {!isMobile && (
        <button
          onClick={() => router.push("/settings")}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: "40px", height: "40px", borderRadius: "10px",
            background: "var(--bg-elevated)", border: "1px solid var(--border)",
            color: "var(--text-secondary)", cursor: "pointer", transition: "all 0.2s"
          }}
          onMouseEnter={e => e.currentTarget.style.color = "var(--text-primary)"}
          onMouseLeave={e => e.currentTarget.style.color = "var(--text-secondary)"}
          title={t("設定", "Settings")}
        >
          <Settings size={18} />
        </button>
      )}
    </nav>
  );
}