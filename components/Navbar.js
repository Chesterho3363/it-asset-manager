"use client";
import { Sun, Moon, Languages, Package } from "lucide-react";
import { useApp } from "../app/layout";

export default function Navbar() {
  const { theme, toggleTheme, lang, toggleLang, t } = useApp();

  return (
    <header style={{
      background: "var(--bg-surface)",
      borderBottom: "1px solid var(--border)",
      boxShadow: "var(--shadow)",
      position: "sticky",
      top: 0,
      zIndex: 50,
    }}>
      <div style={{
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "0 1.5rem",
        height: "60px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{
            width: "32px", height: "32px",
            background: "var(--accent)",
            borderRadius: "8px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Package size={18} color="#fff" />
          </div>
          <div>
            <div style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: "1rem",
              color: "var(--text-primary)",
              letterSpacing: "-0.02em",
            }}>
              {t("IT 資產管理", "IT Asset Manager")}
            </div>
            <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", letterSpacing: "0.05em" }}>
              ASSET TRACKER
            </div>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {/* Language Toggle */}
          <button
            onClick={toggleLang}
            title={t("切換英文", "Switch to Chinese")}
            style={{
              display: "flex", alignItems: "center", gap: "0.4rem",
              padding: "0.4rem 0.75rem",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              color: "var(--text-secondary)",
              fontSize: "0.75rem",
              fontFamily: "var(--font-mono)",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = "var(--accent)";
              e.currentTarget.style.color = "var(--accent)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            <Languages size={14} />
            {lang === "zh" ? "EN" : "中文"}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={t("切換亮色", "Toggle theme")}
            style={{
              width: "36px", height: "36px",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              color: "var(--text-secondary)",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = "var(--accent)";
              e.currentTarget.style.color = "var(--accent)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>
    </header>
  );
}
