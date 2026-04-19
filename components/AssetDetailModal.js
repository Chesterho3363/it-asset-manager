"use client";
import { X, Laptop, Monitor, Plug, Package, User, Calendar, Tag, Hash, FileText, Pencil, QrCode, Undo2 } from "lucide-react";
import { useApp } from "../app/providers"; 

// 🌟 筆電改回 var(--accent)，且設定為無外框的實心/透色組合
const categoryMeta = {
  laptop:  { icon: Laptop,  color: "var(--accent)", softColor: "var(--accent-soft)", label: ["筆電", "Laptop"] },
  monitor: { icon: Monitor, color: "#f59e0b", softColor: "rgba(245, 158, 11, 0.15)", label: ["螢幕", "Monitor"] },
  docking: { icon: Plug,    color: "#10b981", softColor: "rgba(16, 185, 129, 0.15)", label: ["Docking", "Docking"] }, 
  other:   { icon: Package, color: "#71717a", softColor: "rgba(113, 113, 122, 0.15)", label: ["其他", "Other"] },
};

function parseSpecs(noteStr) {
  if (!noteStr) return { text: "", specs: {} };
  try {
    const parsed = JSON.parse(noteStr);
    const { _note, ...specs } = parsed;
    return { text: _note || "", specs };
  } catch { return { text: noteStr, specs: {} }; }
}

function isAssetOverdue(status, returnDate) {
  if (status !== "borrowed" || !returnDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(returnDate) < today;
}

export default function AssetDetailModal({ asset, onClose, onEdit, onQR, onReturn, returning }) {
  const { t } = useApp();
  if (!asset) return null;

  const { text: noteText, specs } = parseSpecs(asset.note);
  const meta = categoryMeta[asset.category] || categoryMeta.other;
  const CategoryIcon = meta.icon;
  const overdue = isAssetOverdue(asset.status, asset.returnDate);

  const SectionTitle = ({ icon: Icon, title }) => (
    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
      <Icon size={14} /> {title}
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="animate-fade-in" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "16px", width: "100%", maxWidth: "480px", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "var(--shadow-lg)", overflow: "hidden" }}>
        
        {/* Header */}
        <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border)", background: "var(--bg-surface)", zIndex: 1, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: "1.25rem", alignItems: "center" }}>
            
            {/* 🌟 實心高飽和度色塊 + 鏤空圖示，無外框 */}
            <div style={{ 
              width: "56px", height: "56px", 
              borderRadius: "14px", 
              background: meta.color, 
              border: "none",
              display: "flex", alignItems: "center", justifyContent: "center", 
              color: "var(--bg-base)", // 自動適應深淺色背景
              flexShrink: 0,
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
            }}>
              <CategoryIcon size={28} strokeWidth={2.5} />
            </div>
            
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.4rem", lineHeight: 1.2 }}>
                {asset.model || t("未命名型號", "Unnamed Model")}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginTop: "0.4rem" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}># {asset.assetCode}</span>
                {/* 🌟 無框透色分類標籤 */}
                <span style={{ 
                  fontSize: "0.75rem", padding: "0.2rem 0.6rem", borderRadius: "999px", 
                  background: meta.softColor, 
                  border: "none",
                  color: meta.color, 
                  fontWeight: 700 
                }}>
                  {t(meta.label[0], meta.label[1])}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-muted)", cursor: "pointer" }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem", overflowY: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", background: "var(--bg-elevated)", padding: "1rem", borderRadius: "12px", border: "1px solid var(--border)" }}>
            <div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>{t("目前狀態", "Status")}</div>
              {asset.status === "available" ? (
                <span style={{ color: "var(--success)", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.3rem" }}>● {t("可借用", "Available")}</span>
              ) : (
                <span style={{ color: overdue ? "var(--danger)" : "var(--warning)", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  ● {overdue ? t("已逾期", "Overdue") : t("借出中", "Borrowed")}
                </span>
              )}
            </div>
            {asset.status === "borrowed" && (
              <>
                <div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>{t("借用人", "Borrower")}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontWeight: 600, fontSize: "0.9rem" }}><User size={14} /> {asset.borrower || "—"}</div>
                </div>
                <div style={{ gridColumn: "1 / -1", borderTop: "1px dashed var(--border)", paddingTop: "0.75rem", marginTop: "-0.25rem" }}>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>{t("預計歸還日", "Return Date")}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontWeight: 600, fontSize: "0.9rem", color: overdue ? "var(--danger)" : "var(--text-primary)" }}><Calendar size={14} /> {asset.returnDate || "—"}</div>
                </div>
              </>
            )}
          </div>

          {asset.acquisitionDate && (
            <div>
              <SectionTitle icon={Calendar} title={t("取得資訊", "Acquisition")} />
              <div style={{ background: "var(--bg-elevated)", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "0.85rem", color: "var(--text-primary)" }}>
                📅 {t("取得日期", "Acquisition Date")}: <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{asset.acquisitionDate}</span>
              </div>
            </div>
          )}

          {(asset.issueId || asset.doe) && (
            <div>
              <SectionTitle icon={Tag} title={t("專案追蹤", "Project Tracking")} />
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {asset.issueId && <span style={{ padding: "0.4rem 0.6rem", background: "#fef08a33", border: "1px solid #fef08a88", color: "#92400e", borderRadius: "8px", fontSize: "0.8rem", fontWeight: 700 }}>🔖 ISSUE: {asset.issueId}</span>}
                {asset.doe && <span style={{ padding: "0.4rem 0.6rem", background: "#a5f3fc22", border: "1px solid #a5f3fc88", color: "#0c4a6e", borderRadius: "8px", fontSize: "0.8rem", fontWeight: 700 }}>🔬 DOE: {asset.doe}</span>}
              </div>
            </div>
          )}

          {Object.keys(specs).length > 0 && (
            <div>
              <SectionTitle icon={Hash} title={t("硬體規格", "Hardware Specs")} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                {Object.entries(specs).filter(([, v]) => v).map(([k, v]) => (
                  <div key={k} style={{ background: "var(--bg-elevated)", padding: "0.6rem 0.75rem", borderRadius: "8px", border: "1px solid var(--border)" }}>
                    <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{k}</div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600, marginTop: "0.2rem" }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {noteText && (
            <div>
              <SectionTitle icon={FileText} title={t("備註", "Note")} />
              <div style={{ fontSize: "0.85rem", lineHeight: 1.6, color: "var(--text-secondary)", background: "var(--bg-elevated)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--border)", whiteSpace: "pre-wrap" }}>
                {noteText}
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid var(--border)", background: "var(--bg-surface)", display: "flex", gap: "0.75rem" }}>
          {asset.status === "borrowed" && (
            <button onClick={() => { onReturn(asset); onClose(); }} disabled={returning} style={{ flex: 1, padding: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", background: "var(--success-soft)", border: "1px solid var(--success)", borderRadius: "10px", color: "var(--success)", cursor: "pointer", fontSize: "0.9rem", fontWeight: 700, opacity: returning ? 0.5 : 1 }}>
              <Undo2 size={18} /> {t("歸還", "Return")}
            </button>
          )}
          <button onClick={() => onQR(asset)} style={{ width: "48px", height: "48px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "10px", color: "var(--text-primary)", cursor: "pointer", flexShrink: 0 }}>
            <QrCode size={20} />
          </button>
          <button onClick={() => onEdit(asset)} style={{ flex: 1, padding: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", background: "var(--accent-soft)", border: "1px solid var(--accent)", borderRadius: "10px", color: "var(--accent)", cursor: "pointer", fontSize: "0.9rem", fontWeight: 700 }}>
            <Pencil size={18} /> {t("編輯", "Edit")}
          </button>
        </div>
      </div>
    </div>
  );
}