"use client";
import { Home, ScanLine, Settings } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "../app/providers";

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useApp();

  const haptic = (v = 30) => { if (navigator.vibrate) navigator.vibrate(v); };

  const navItems = [
    { path: "/", icon: Home, label: t("主畫面", "Home") },
    { path: "/scan", icon: ScanLine, label: t("掃描", "Scan") },
    { path: "/settings", icon: Settings, label: t("設定", "Settings") }
  ];

  return (
    <div style={{
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      background: "var(--bg-surface)", 
      borderTop: "1px solid var(--border)",
      display: "flex",
      justifyContent: "space-around",
      alignItems: "center",
      // 🌟 關鍵修正：鎖定按鈕區高度為 56px，加上 iOS 底部安全距離
      height: "calc(56px + env(safe-area-inset-bottom))", 
      paddingBottom: "env(safe-area-inset-bottom)",
      zIndex: 100,
    }}>
      {navItems.map(item => {
        const isActive = pathname === item.path;
        return (
          <button
            key={item.path}
            onClick={() => { haptic(); router.push(item.path); }}
            style={{
              flex: 1,
              height: "100%", // 讓按鈕垂直填滿 56px 的空間
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center", // 確保 icon 和文字完美置中
              gap: "4px",
              background: "transparent",
              border: "none",
              color: isActive ? "var(--text-primary)" : "var(--text-muted)",
              cursor: "pointer",
              outline: "none",
              WebkitTapHighlightColor: "transparent",
              transition: "color 0.2s"
            }}
          >
            <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
            <span style={{ fontSize: "0.65rem", fontWeight: isActive ? 700 : 500 }}>
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}