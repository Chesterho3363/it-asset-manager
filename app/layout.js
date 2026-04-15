"use client";
import { useState, createContext, useContext, useEffect } from "react";
import "./globals.css";

// ─── Global Context ───────────────────────────────────────────────────────────
export const AppContext = createContext({
  theme: "dark",
  toggleTheme: () => {},
  lang: "zh",
  toggleLang: () => {},
  t: (zh, en) => zh,
});

export function useApp() {
  return useContext(AppContext);
}

export default function RootLayout({ children }) {
  const [theme, setTheme] = useState("dark");
  const [lang, setLang] = useState("zh");

  useEffect(() => {
    const saved = localStorage.getItem("theme") || "dark";
    setTheme(saved);
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };

  const toggleLang = () => {
    setLang((l) => (l === "zh" ? "en" : "zh"));
  };

  const t = (zh, en) => (lang === "zh" ? zh : en);

  return (
    <html lang={lang} data-theme={theme} suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <AppContext.Provider value={{ theme, toggleTheme, lang, toggleLang, t }}>
          {children}
        </AppContext.Provider>
      </body>
    </html>
  );
}