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
      // 🌟 關鍵修正：底部加上安全區域的高度，完美避開 iOS 橫條
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
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              padding: "0.75rem 0", // 維持原本的按鈕高度
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