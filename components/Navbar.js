"use client";
import { useState, useEffect } from "react";
import { Bell, Settings, User, BarChart2, RefreshCw } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useApp } from "../app/providers";
import useSWR from "swr";
import { isAssetOverdue } from "./ui/Badges";
import { useRef, useMemo } from "react";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const { t, customName, showOnlyIssues, setShowOnlyIssues, queueLength, isQueueSyncing, syncOfflineQueue } = useApp();

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const displayName = session ? (customName || session.user.name) : "Guest";

  // ── 通知下拉選單邏輯 ──
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetcher = url => fetch(url).then(res => res.json());
  const { data: assetsData } = useSWR("/api/assets", fetcher);
  const allAssets = assetsData?.success ? assetsData.data : [];

  const notifications = useMemo(() => {
    if (!allAssets.length || !session?.user?.email) return [];
    const userEmail = session.user.email.toLowerCase().trim();
    const isAdmin = userEmail === "ho3363@gmail.com";
    
    const myAssets = allAssets.filter(a => isAdmin || a.owner?.toLowerCase().trim() === userEmail);
    const notifs = [];
    
    myAssets.forEach(a => {
      if (isAssetOverdue(a.status, a.returnDate)) {
        notifs.push({ id: `overdue-${a.id}`, type: "overdue", asset: a, title: "資產逾期通知", desc: `您的資產「${a.model || a.assetCode}」已逾期，請盡快歸還或辦理展延。`, time: a.returnDate });
      }
      if (a.issueId) {
        notifs.push({ id: `issue-${a.id}`, type: "issue", asset: a, title: "異常報修提醒", desc: `資產「${a.model || a.assetCode}」目前標記為異常 (${a.issueId})。`, time: a.updatedAt || a.acquisitionDate });
      }
    });
    
    // Sort by time descending
    return notifs.sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));
  }, [allAssets, session]);

  const unreadCount = notifications.length;

  return (
    <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "transparent", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", paddingTop: "calc(0.5rem + env(safe-area-inset-top))", paddingBottom: "0.5rem", paddingLeft: "1.25rem", paddingRight: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div style={{ fontSize: "1.25rem", fontWeight: 800, fontFamily: "var(--font-display)", letterSpacing: "-0.02em", color: "var(--text-primary)", cursor: "pointer" }} onClick={() => router.push("/")}>
        {displayName}
      </div>

      {!isMobile && (
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          {[
            { path: "/", label: t("主畫面", "Home") },
            { path: "/shared", label: t("共用裝置", "Shared") },
            { path: "/scan", label: t("掃描", "Scan") }
          ].map(item => {
            const isActive = pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: isActive ? "var(--text-primary)" : "var(--text-muted)",
                  fontSize: "0.9rem",
                  fontWeight: isActive ? 700 : 500,
                  cursor: "pointer",
                  padding: "0.5rem 0.25rem",
                  position: "relative",
                  transition: "color 0.2s"
                }}
              >
                {item.label}
                {isActive && (
                  <div style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "2px",
                    background: "var(--text-primary)",
                    borderRadius: "2px"
                  }} />
                )}
              </button>
            );
          })}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "var(--bg-surface)", padding: "0.3rem", borderRadius: "999px", border: "1px solid var(--border)", boxShadow: "0 2px 10px rgba(0,0,0,0.2)" }}>
        
        {/* 🌟 離線同步指示器 */}
        {queueLength > 0 && (
          <button 
            onClick={() => {
              if (navigator.onLine) {
                syncOfflineQueue();
              }
            }}
            title={navigator.onLine ? t("點擊同步", "Click to sync") : t("處於離線狀態", "Offline")}
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "4px", 
              padding: "0.25rem 0.6rem", 
              background: isQueueSyncing ? "var(--success-soft)" : "var(--warning-soft)", 
              border: "none", 
              borderRadius: "999px", 
              color: isQueueSyncing ? "var(--success)" : "var(--warning)", 
              cursor: navigator.onLine ? "pointer" : "default", 
              fontSize: "0.75rem", 
              fontWeight: 700,
              outline: "none",
              transition: "all 0.2s"
            }}
            className="btn-spring"
          >
            <RefreshCw 
              size={12} 
              className={isQueueSyncing ? "animate-spin" : ""}
            />
            <span>{queueLength}</span>
          </button>
        )}

        {/* 🌟 儀表板按鈕 */}
        <button onClick={() => router.push('/dashboard')} style={{ padding: "0.4rem", background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer", outline: "none", WebkitTapHighlightColor: "transparent" }}>
          <BarChart2 size={18} />
        </button>

        {/* 🌟 專案追蹤切換按鈕 */}
        <button onClick={() => setShowOnlyIssues && setShowOnlyIssues(!showOnlyIssues)} style={{ position: "relative", padding: "0.4rem", background: showOnlyIssues ? "var(--danger-soft)" : "transparent", border: "none", borderRadius: "50%", color: showOnlyIssues ? "var(--danger)" : "var(--text-secondary)", cursor: "pointer", outline: "none", transition: "all 0.2s" }}>
          <Bell size={18} />
        </button>

        <button onClick={() => router.push('/settings')} style={{ padding: "0.4rem", background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer", outline: "none" }}>
          <Settings size={18} />
        </button>

        <div onClick={() => router.push('/settings')} style={{ width: "30px", height: "30px", borderRadius: "50%", background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", cursor: "pointer", transition: "opacity 0.2s" }} onMouseEnter={e => e.currentTarget.style.opacity = 0.8} onMouseLeave={e => e.currentTarget.style.opacity = 1}>
          {session?.user?.image ? ( <img src={session.user.image} alt="User" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> ) : ( <User size={16} color="var(--text-primary)" /> )}
        </div>
      </div>
    </nav>
  );
}