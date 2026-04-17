"use client";
import { usePathname, useRouter } from "next/navigation";
import { Home, ScanLine, Settings } from "lucide-react";
import { useApp } from "../app/providers";

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useApp();

  const tabs = [
    { path: "/",         icon: Home,     zh: "主畫面", en: "Home" },
    { path: "/scan",     icon: ScanLine, zh: "掃描",   en: "Scan" },
    { path: "/settings", icon: Settings, zh: "設定",   en: "Settings" },
  ];

  return (
    <nav style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
      background: "var(--bg-surface)",
      borderTop: "1px solid var(--border)",
      display: "flex",
      paddingBottom: "env(safe-area-inset-bottom, 0px)",
    }}>
      {tabs.map(({ path, icon: Icon, zh, en }) => {
        const active = pathname === path;
        return (
          <button key={path} onClick={() => router.push(path)} style={{
            flex: 1, padding: "0.65rem 0.5rem 0.55rem",
            display: "flex", flexDirection: "column", alignItems: "center", gap: "0.2rem",
            background: "none", border: "none", cursor: "pointer",
            color: active ? "var(--accent)" : "var(--text-muted)",
            transition: "color 0.2s",
          }}>
            <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
            <span style={{ fontSize: "0.65rem", fontFamily: "var(--font-mono)", fontWeight: active ? 600 : 400 }}>
              {t(zh, en)}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
