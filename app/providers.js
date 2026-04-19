"use client";
import { useState, createContext, useContext, useEffect } from "react";
import { SessionProvider } from "next-auth/react";

export const AppContext = createContext();

export function useApp() {
  return useContext(AppContext);
}

export function Providers({ children }) {
  const [theme, setTheme] = useState("dark");
  const [lang, setLang] = useState("zh");
  const [customName, setCustomName] = useState("");
  
  // 🌟 專案追蹤模式 (鈴鐺開關)
  const [showOnlyIssues, setShowOnlyIssues] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    const savedLang = localStorage.getItem("lang") || "zh";
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

  const updateCustomName = (name) => {
    setCustomName(name);
    localStorage.setItem("customName", name);
  };

  const t = (zh, en) => (lang === "zh" ? zh : en);

  return (
    <SessionProvider>
      <AppContext.Provider value={{ 
        theme, toggleTheme, 
        lang, toggleLang, t, 
        customName, updateCustomName,
        showOnlyIssues, setShowOnlyIssues // 🌟 修正這裡！匯出 setShowOnlyIssues 來跟 Navbar 對接
      }}>
        {children}
      </AppContext.Provider>
    </SessionProvider>
  );
}