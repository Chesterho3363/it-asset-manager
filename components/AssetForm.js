"use client";
import { useState, useEffect } from "react";
import { X, Laptop, Monitor, Plug, Package, CheckCircle2, Hourglass, Save, Trash2, Hash, AlertCircle, Briefcase, Layers } from "lucide-react";
import { useApp } from "../app/providers";

function parseSpecs(noteStr) {
  if (!noteStr) return { text: "", specs: {} };
  try {
    const parsed = JSON.parse(noteStr);
    const { _note, ...specs } = parsed;
    return { text: _note || "", specs };
  } catch { return { text: noteStr, specs: {} }; }
}

// 🌟 更新後的動態硬體規格表 (Schema)
const specSchema = {
  laptop: [
    { key: "SKU", label: "SKU", placeholder: "e.g. SKU12" },
    { key: "CPU", label: "CPU", placeholder: "e.g. Ultra 7" },
    { key: "RAM", label: "RAM", placeholder: "e.g. 32GB" },
    { key: "STORAGE", label: "Storage", placeholder: "e.g. 1TB SSD" },
    { key: "PANEL", label: "Panel", placeholder: "e.g. OLED" },
    { key: "PD", label: "PD (供電)", placeholder: "e.g. 100W" }
  ],
  monitor: [
    { key: "SIZE", label: "Size", placeholder: "e.g. 32\"" },
    { key: "RESOLUTION", label: "Resolution", placeholder: "e.g. 4K" },
    { key: "REFRESHRATE", label: "Refresh Rate", placeholder: "e.g. 144Hz" },
    { key: "FW", label: "FW (韌體)", placeholder: "e.g. M001" },
    { key: "Interface", label: "Interface", placeholder: "e.g. HDMI 2.1, DP 1.4" }
  ],
  docking: [
    { key: "SKU", label: "SKU", placeholder: "e.g. WD22TB4" },
    { key: "Power", label: "Power (瓦數)", placeholder: "e.g. 180W" },
    { key: "FW OCI", label: "FW OCI", placeholder: "e.g. 21.0.28" }
  ],
  semi: [
    { key: "Type", label: "Type (類型)", placeholder: "e.g. PCBA / Housing" }
  ]
};

export default function AssetForm({ editData, onClose, onSuccess }) {
  const { t } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [assetCode, setAssetCode] = useState("");
  const [model, setModel] = useState("");
  const [acquisitionDate, setAcquisitionDate] = useState("");
  const [category, setCategory] = useState("laptop");
  const [status, setStatus] = useState("available");
  const [borrower, setBorrower] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [issueId, setIssueId] = useState("");
  const [doe, setDoe] = useState("");

  const [specs, setSpecs] = useState({});
  const [noteText, setNoteText] = useState("");

  useEffect(() => {
    if (editData) {
      setAssetCode(editData.assetCode || "");
      setModel(editData.model || "");
      setAcquisitionDate(editData.acquisitionDate || "");
      setCategory(editData.category || "laptop");
      setStatus(editData.status || "available");
      setBorrower(editData.borrower || "");
      setReturnDate(editData.returnDate || "");
      setIssueId(editData.issueId || "");
      setDoe(editData.doe || "");

      const { text, specs: parsedSpecs } = parseSpecs(editData.note);
      setNoteText(text || "");
      setSpecs(parsedSpecs || {});
    }
  }, [editData]);

  const handleSpecChange = (key, value) => {
    setSpecs(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!assetCode) {
      setError(t("請填寫資產編號", "Asset Code is required"));
      setLoading(false);
      return;
    }

    const specsObj = { _note: noteText };
    const currentSchema = specSchema[category] || [];
    currentSchema.forEach(field => {
      if (specs[field.key]) {
        specsObj[field.key] = specs[field.key];
      }
    });

    const payload = {
      assetCode,
      model,
      acquisitionDate,
      category,
      status,
      borrower: status === "borrowed" ? borrower : "",
      returnDate: status === "borrowed" ? returnDate : null,
      issueId,
      doe,
      note: JSON.stringify(specsObj)
    };

    try {
      const url = editData ? `/api/assets/${editData.id}` : `/api/assets`;
      const method = editData ? "PATCH" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (data.success) {
        onSuccess(); 
        onClose(); 
      } else {
        setError(data.error || "提交失敗");
      }
    } catch (err) {
      setError("網路錯誤，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t("確定要刪除此資產？此操作無法復原。", "Delete this asset?"))) return;
    setLoading(true);
    try {
      await fetch(`/api/assets/${editData.id}`, { method: "DELETE" });
      onSuccess(); 
      onClose(); 
    } catch (err) {
      setError("刪除失敗");
      setLoading(false);
    }
  };

  const categories = [
    { id: "laptop", label: t("筆電", "Laptop"), icon: Laptop, color: "var(--accent)" },
    { id: "monitor", label: t("螢幕", "Monitor"), icon: Monitor, color: "var(--warning)" },
    { id: "docking", label: "Docking", icon: Plug, color: "var(--success)" }, 
    { id: "office", label: t("辦公室用品", "Office"), icon: Briefcase, color: "#8b5cf6" },
    { id: "semi", label: t("半成品", "Semi-finished"), icon: Layers, color: "#06b6d4" },
    { id: "other", label: t("其他", "Other"), icon: Package, color: "var(--text-muted)" }
  ];

  const currentSpecsFields = specSchema[category] || [];

  return (
     <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }} onClick={e => e.target === e.currentTarget && onClose()}>
       <div className="animate-fade-in" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "16px", width: "100%", maxWidth: "520px", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "var(--shadow-lg)" }}>
         
         {/* Header */}
         <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
           <div>
             <h2 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0 }}>{editData ? t("編輯資產", "Edit Asset") : t("新增資產", "Add Asset")}</h2>
             {editData && <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px", fontFamily: "var(--font-mono)" }}>{editData.id}</div>}
           </div>
           <button onClick={onClose} style={{ width: "32px", height: "32px", borderRadius: "8px", background: "var(--bg-elevated)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", cursor: "pointer" }}><X size={16} /></button>
         </div>

         {/* Body */}
         <div style={{ padding: "1.5rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {error && <div style={{ padding: "0.75rem", background: "var(--danger-soft)", color: "var(--danger)", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 600 }}>{error}</div>}
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", minWidth: 0 }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)" }}>{t("資產編號", "Asset Code")} <span style={{ color: "var(--danger)" }}>*</span></label>
                <input value={assetCode} onChange={e => setAssetCode(e.target.value)} placeholder="e.g. 151100493051" style={{ width: "100%", boxSizing: "border-box", minWidth: 0, padding: "0.7rem 0.8rem", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--text-primary)", fontSize: "0.9rem", outline: "none" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", minWidth: 0 }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)" }}>{t("型號", "Model")}</label>
                <input value={model} onChange={e => setModel(e.target.value)} placeholder="e.g. Hendrixx" style={{ width: "100%", boxSizing: "border-box", minWidth: 0, padding: "0.7rem 0.8rem", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--text-primary)", fontSize: "0.9rem", outline: "none" }} />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", minWidth: 0 }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)" }}>{t("資產取得日", "Acquisition Date")}</label>
              <input type="date" value={acquisitionDate} onChange={e => setAcquisitionDate(e.target.value)} style={{ width: "100%", boxSizing: "border-box", minWidth: 0, padding: "0.7rem 0.8rem", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--text-primary)", fontSize: "0.9rem", outline: "none", colorScheme: "dark" }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)" }}>{t("類別", "Category")}</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                {categories.map(c => (
                  <button key={c.id} type="button" onClick={() => setCategory(c.id)} style={{ padding: "0.6rem", borderRadius: "8px", border: category === c.id ? `1px solid ${c.color}` : "1px solid var(--border)", background: category === c.id ? "var(--text-primary)" : "var(--bg-elevated)", color: category === c.id ? "var(--bg-base)" : "var(--text-secondary)", fontSize: "0.85rem", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", cursor: "pointer", transition: "all 0.2s" }}>
                    <c.icon size={16} color={category === c.id ? "var(--bg-base)" : c.color} /> {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)" }}>{t("狀態", "Status")}</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                <button type="button" onClick={() => setStatus("available")} style={{ padding: "0.6rem", borderRadius: "8px", border: status === "available" ? "1px solid var(--success)" : "1px solid var(--border)", background: status === "available" ? "var(--success-soft)" : "var(--bg-elevated)", color: status === "available" ? "var(--success)" : "var(--text-secondary)", fontSize: "0.85rem", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", cursor: "pointer" }}>
                  <CheckCircle2 size={16} /> {t("可借用", "Available")}
                </button>
                <button type="button" onClick={() => setStatus("borrowed")} style={{ padding: "0.6rem", borderRadius: "8px", border: status === "borrowed" ? "1px solid var(--warning)" : "1px solid var(--border)", background: status === "borrowed" ? "var(--warning-soft)" : "var(--bg-elevated)", color: status === "borrowed" ? "var(--warning)" : "var(--text-secondary)", fontSize: "0.85rem", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", cursor: "pointer" }}>
                  <Hourglass size={16} /> {t("借出中", "Borrowed")}
                </button>
              </div>
            </div>

            {status === "borrowed" && (
              <div className="animate-fade-in" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", padding: "1rem", background: "var(--warning-soft)", borderRadius: "12px", border: "1px solid rgba(245,158,11,0.2)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", minWidth: 0 }}>
                  <label style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--warning)" }}>{t("借用人", "Borrower")}</label>
                  <input value={borrower} onChange={e => setBorrower(e.target.value)} style={{ width: "100%", boxSizing: "border-box", minWidth: 0, padding: "0.6rem", borderRadius: "6px", border: "1px solid rgba(245,158,11,0.3)", background: "var(--bg-surface)", color: "var(--text-primary)", fontSize: "0.85rem", outline: "none" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", minWidth: 0 }}>
                  <label style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--warning)" }}>{t("預計歸還日", "Return Date")}</label>
                  <input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} style={{ width: "100%", boxSizing: "border-box", minWidth: 0, padding: "0.6rem", borderRadius: "6px", border: "1px solid rgba(245,158,11,0.3)", background: "var(--bg-surface)", color: "var(--text-primary)", fontSize: "0.85rem", outline: "none", colorScheme: "dark" }} />
                </div>
              </div>
            )}

            {/* 🌟 動態硬體規格區塊：會隨類別改變顯示對應欄位 */}
            {currentSpecsFields.length > 0 && (
              <div className="animate-fade-in" style={{ background: "rgba(14, 165, 233, 0.05)", border: "1px solid rgba(14, 165, 233, 0.2)", borderRadius: "12px", padding: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#0ea5e9", fontSize: "0.75rem", fontWeight: 700, marginBottom: "0.75rem" }}>
                  <Hash size={14} /> {t("硬體資訊", "Hardware Specs")}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  {currentSpecsFields.map(field => (
                    <div key={field.key} style={{ display: "flex", flexDirection: "column", gap: "0.4rem", minWidth: 0 }}>
                      <label style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-secondary)" }}>{field.label}</label>
                      <input 
                        value={specs[field.key] || ""} 
                        onChange={e => handleSpecChange(field.key, e.target.value)} 
                        placeholder={field.placeholder} 
                        style={{ width: "100%", boxSizing: "border-box", minWidth: 0, padding: "0.6rem", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--bg-surface)", color: "var(--text-primary)", fontSize: "0.85rem", outline: "none" }} 
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ background: "#fef08a11", border: "1px solid #fef08a44", borderRadius: "12px", padding: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#ca8a04", fontSize: "0.75rem", fontWeight: 700, marginBottom: "0.75rem" }}>
                <AlertCircle size={14} /> {t("實驗 / Issue 追蹤", "Project Tracking")}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", minWidth: 0 }}>
                  <label style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-secondary)" }}>ISSUE ID</label>
                  <input value={issueId} onChange={e => setIssueId(e.target.value)} placeholder="e.g. PROJ-1234" style={{ width: "100%", boxSizing: "border-box", minWidth: 0, padding: "0.6rem", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--bg-surface)", color: "var(--text-primary)", fontSize: "0.85rem", outline: "none" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", minWidth: 0 }}>
                  <label style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-secondary)" }}>DOE / 用途</label>
                  <input value={doe} onChange={e => setDoe(e.target.value)} placeholder="e.g. 專案測試 A" style={{ width: "100%", boxSizing: "border-box", minWidth: 0, padding: "0.6rem", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--bg-surface)", color: "var(--text-primary)", fontSize: "0.85rem", outline: "none" }} />
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", minWidth: 0 }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)" }}>{t("備註", "Note")}</label>
              <textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={3} style={{ width: "100%", boxSizing: "border-box", minWidth: 0, padding: "0.7rem 0.8rem", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--text-primary)", fontSize: "0.9rem", outline: "none", resize: "vertical" }} />
            </div>

         </div>

         {/* Footer */}
         <div style={{ padding: "1.25rem 1.5rem", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-surface)", flexShrink: 0 }}>
            {editData ? (
              <button onClick={handleDelete} disabled={loading} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.6rem 1rem", borderRadius: "8px", border: "1px solid var(--danger)", background: "var(--danger-soft)", color: "var(--danger)", fontWeight: 600, cursor: "pointer" }}>
                <Trash2 size={16} /> {t("刪除", "Delete")}
              </button>
            ) : <div />}
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={onClose} disabled={loading} style={{ padding: "0.6rem 1.25rem", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--text-primary)", fontWeight: 600, cursor: "pointer" }}>
                {t("取消", "Cancel")}
              </button>
              <button onClick={handleSubmit} disabled={loading} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.6rem 1.25rem", borderRadius: "8px", border: "none", background: "var(--text-primary)", color: "var(--bg-base)", fontWeight: 700, cursor: "pointer" }}>
                {loading ? <Hourglass size={16} style={{ animation: "spin 1s infinite" }} /> : <Save size={16} />} 
                {t("儲存", "Save")}
              </button>
            </div>
         </div>
       </div>
     </div>
  );
}