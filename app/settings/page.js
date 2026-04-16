"use client";
import { Sun, Moon, Languages, Info, Package } from "lucide-react";
import Navbar from "../../components/Navbar";
import BottomNav from "../../components/BottomNav";
import { useApp } from "../layout";

function SettingRow({ icon: Icon, label, children }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "1rem 1.25rem",
      borderBottom: "1px solid var(--border)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <div style={{ width: "32px", height: "32px", background: "var(--accent-soft)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={16} color="var(--accent)" />
        </div>
        <span style={{ fontSize: "0.9rem" }}>{label}</span>
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const { theme, toggleTheme, lang, toggleLang, t } = useApp();

const Toggle = ({ active, onToggle, labelOn, labelOff }) => (
  <button onClick={onToggle} style={{
    padding: "0.35rem 0.875rem",
    background: active ? "var(--accent)" : "var(--bg-elevated)",
    border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
    borderRadius: "8px",
    // 🌟 關鍵修正：將 "#fff" 改為 "var(--bg-base)"
    color: active ? "var(--bg-base)" : "var(--text-secondary)", 
    fontSize: "0.75rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s",
    fontFamily: "var(--font-display)",
  }}>
    {active ? labelOn : labelOff}
  </button>
);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", paddingBottom: "80px" }}>
      <Navbar />
      <main style={{ maxWidth: "600px", margin: "0 auto", padding: "1.5rem 1rem" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
            {t("設定", "Settings")}
          </h1>
        </div>

        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden", marginBottom: "1.25rem" }}>
          <div style={{ padding: "0.75rem 1.25rem", background: "var(--bg-elevated)", fontSize: "0.7rem", fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {t("外觀", "Appearance")}
          </div>
          <SettingRow icon={theme === "dark" ? Moon : Sun} label={t("深色模式", "Dark Mode")}>
            <Toggle active={theme === "dark"} onToggle={toggleTheme} labelOn={t("開啟", "On")} labelOff={t("關閉", "Off")} />
          </SettingRow>
          <SettingRow icon={Languages} label={t("語言", "Language")}>
            <Toggle active={lang === "zh"} onToggle={toggleLang} labelOn="中文" labelOff="EN" />
          </SettingRow>
        </div>

        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
          <div style={{ padding: "0.75rem 1.25rem", background: "var(--bg-elevated)", fontSize: "0.7rem", fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {t("關於", "About")}
          </div>
          <SettingRow icon={Package} label={t("版本", "Version")}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>v1.0.0</span>
          </SettingRow>
          <SettingRow icon={Info} label={t("資料來源", "Data Source")}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>Notion API</span>
          </SettingRow>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
