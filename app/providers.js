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
  const [showOnlyIssues, setShowOnlyIssues] = useState(false);
  const [userAliases, setUserAliases] = useState({});
  
  // 🌟 新增：使用者部門對照表 (Email -> 部門名稱)
  const [userDepartments, setUserDepartments] = useState({});

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    const savedLang = localStorage.getItem("lang") || "zh";
    const savedName = localStorage.getItem("customName") || "";
    const savedAliases = localStorage.getItem("userAliases");
    const savedDepts = localStorage.getItem("userDepartments");

    setTheme(savedTheme);
    setLang(savedLang);
    setCustomName(savedName);
    document.documentElement.setAttribute("data-theme", savedTheme);

    if (savedAliases) { try { setUserAliases(JSON.parse(savedAliases)); } catch (e) {} }
    if (savedDepts) { try { setUserDepartments(JSON.parse(savedDepts)); } catch (e) {} }
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

  const updateUserAlias = (email, alias) => {
    setUserAliases(prev => {
      const next = { ...prev };
      if (alias.trim() === "") delete next[email];
      else next[email] = alias;
      localStorage.setItem("userAliases", JSON.stringify(next));
      return next;
    });
  };

  // 🌟 新增：更新部門對照表的函數
  const updateUserDepartment = (email, dept) => {
    setUserDepartments(prev => {
      const next = { ...prev };
      if (!dept || dept.trim() === "") delete next[email];
      else next[email] = dept;
      localStorage.setItem("userDepartments", JSON.stringify(next));
      return next;
    });
  };

  const t = (zh, en) => (lang === "zh" ? zh : en);

  return (
    <SessionProvider>
      <AppContext.Provider value={{ 
        theme, toggleTheme, lang, toggleLang, t, 
        customName, updateCustomName, showOnlyIssues, setShowOnlyIssues,
        userAliases, updateUserAlias,
        userDepartments, updateUserDepartment // 🌟 匯出供其他元件使用
      }}>
        {children}
      </AppContext.Provider>
    </SessionProvider>
  );
}