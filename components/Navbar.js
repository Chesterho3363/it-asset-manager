"use client";
import { Settings, Bell, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react"; 
import { useApp } from "../app/providers";    

export default function Navbar() {
  const router = useRouter();
  const { data: session } = useSession(); 
  const { customName, t, showOnlyIssues, toggleShowOnlyIssues, theme } = useApp();

  // 🌟 觸覺回饋
  const haptic = () => { if (navigator.vibrate) navigator.vibrate(40); };

  const displayName = session ? (customName || session.user?.name) : t("IT 資產管理", "IT Asset Manager");

  return (
    <nav style={{ 
      padding: "0.75rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", 
      // 🌟 毛玻璃效果 (Glassmorphism)
      background: theme === "dark" ? "rgba(18, 18, 18, 0.75)" : "rgba(244, 245, 247, 0.75)",
      backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
      borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 100 
    }}>
      <div style={{ fontWeight: 800, fontSize: "1.2rem", fontFamily: "var(--font-display)", letterSpacing: "-0.02em", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginRight: "1rem" }}>
        {displayName}
      </div>
      
      <div style={{ display: "flex", gap: "0.2rem", alignItems: "center", background: "var(--bg-elevated)", padding: "0.25rem", borderRadius: "999px", border: "1px solid var(--border)" }}>
        <button onClick={() => { haptic(); toggleShowOnlyIssues(); }} style={{ width: "36px", height: "36px", borderRadius: "50%", background: showOnlyIssues ? "var(--warning-soft)" : "transparent", border: "none", color: showOnlyIssues ? "var(--warning)" : "var(--text-secondary)", cursor: "pointer", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", transition: "0.2s" }} className="btn-spring">
          <Bell size={18} />
          {!showOnlyIssues && <span style={{ position: "absolute", top: "8px", right: "8px", width: "8px", height: "8px", background: "var(--danger)", borderRadius: "50%", border: "2px solid var(--bg-surface)" }}></span>}
        </button>

        <button onClick={() => { haptic(); router.push("/settings"); }} style={{ width: "36px", height: "36px", borderRadius: "50%", background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} className="btn-spring">
          <Settings size={18} />
        </button>
        
        <div onClick={() => { haptic(); router.push("/settings"); }} style={{ width: "36px", height: "36px", borderRadius: "50%", overflow: "hidden", cursor: "pointer", border: "2px solid var(--bg-surface)" }}>
          {session?.user?.image ? <img src={session.user.image} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ background: "var(--text-primary)", color: "var(--bg-base)", display: "flex", height: "100%", alignItems: "center", justifyContent: "center" }}><User size={18} /></div>}
        </div>
      </div>
    </nav>
  );
}