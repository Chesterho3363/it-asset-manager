"use client";
import { useState, createContext, useContext, useEffect } from "react";
import { SessionProvider } from "next-auth/react";

// ─── Global Context ───────────────────────────────────────────────────────────
// 這裡可以不用給預設值，因為我們在 Provider 裡面都會給
export const AppContext = createContext();

export function useApp() {
  return useContext(AppContext);
}

export function Providers({ children }) {
  const [theme, setTheme] = useState("dark");
  const [lang, setLang] = useState("zh");
  // 🌟 1. 新增自訂名稱的狀態
  const [customName, setCustomName] = useState("");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    const savedLang = localStorage.getItem("lang") || "zh";
    // 🌟 2. 啟動時讀取存檔的自訂名稱
    const savedName = localStorage.getItem("customName") || "";

    setTheme(savedTheme);
    setLang(savedLang);
    setCustomName(savedName);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };

  const toggleLang = () => {
    const nextLang = lang === "zh" ? "en" : "zh";
    setLang(nextLang);
    localStorage.setItem("lang", nextLang);
  };

  // 🌟 3. 新增更新名稱的函數，同步寫入 localStorage
  const updateCustomName = (name) => {
    setCustomName(name);
    localStorage.setItem("customName", name);
  };

  const t = (zh, en) => (lang === "zh" ? zh : en);

  return (
    <SessionProvider>
      {/* 🌟 4. 把 customName 跟 updateCustomName 傳遞給全站 */}
      <AppContext.Provider value={{ theme, toggleTheme, lang, toggleLang, t, customName, updateCustomName }}>
        {children}
      </AppContext.Provider>
    </SessionProvider>
  );
}