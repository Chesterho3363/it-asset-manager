"use client";
import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";

export function CustomSelect({ value, onChange, options, style }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const safeOptions = options && options.length > 0 ? options : [{ value: "", label: "載入中..." }];
  const selected = safeOptions.find(o => o.value === value) || safeOptions[0];

  return (
    <div ref={ref} style={{ position: "relative", ...style }}>
      <button type="button" onClick={() => setIsOpen(!isOpen)} style={{ width: "100%", padding: "0.55rem 0.875rem", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-primary)", fontSize: "0.8rem", fontFamily: "var(--font-display)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", outline: "none", borderColor: isOpen ? "var(--border-focus)" : "var(--border)", transition: "border-color 0.2s" }}>
        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{selected.label}</span>
        <ChevronDown size={14} style={{ color: "var(--text-muted)", transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0, marginLeft: "0.5rem" }} />
      </button>

      {isOpen && (
        <div className="animate-fade-in" style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 100, background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "12px", boxShadow: "var(--shadow-lg)", padding: "0.35rem", display: "flex", flexDirection: "column", gap: "2px", maxHeight: "200px", overflowY: "auto" }}>
          {safeOptions.map(opt => {
            const isActive = value === opt.value;
            return (
              <div 
                key={opt.value} 
                onClick={() => { onChange(opt.value); setIsOpen(false); }} 
                style={{ padding: "0.5rem 0.75rem", borderRadius: "8px", fontSize: "0.8rem", fontFamily: "var(--font-display)", cursor: "pointer", color: isActive ? "var(--text-primary)" : "var(--text-secondary)", background: isActive ? "var(--bg-elevated)" : "transparent", fontWeight: isActive ? 600 : 400, transition: "all 0.15s" }} 
                onMouseEnter={e => { if(!isActive) { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-primary)"; } }} 
                onMouseLeave={e => { if(!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; } }}
              >
                {opt.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
