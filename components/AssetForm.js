"use client";
import { useState, useEffect } from "react";
import { X, Laptop, Monitor, Plug, Package, CheckCircle2, Hourglass, Save, Trash2, Hash, AlertCircle, Briefcase, Layers } from "lucide-react";
import { useApp } from "../app/providers";
import { useSession } from "next-auth/react";

function parseSpecs(noteStr) {
  if (!noteStr) return { text: "", specs: {} };
  try {
    const parsed = JSON.parse(noteStr);
    const { _note, ...specs } = parsed;
    return { text: _note || "", specs };
  } catch { return { text: noteStr, specs: {} }; }
}

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

export default function AssetForm({ editData, onClose, onSuccess, isBorrowOnly = false }) {
  const { t } = useApp();
  const { data: session } = useSession();
  const userEmail = session?.user?.email?.toLowerCase().trim();
  const adminEmail = "ho3363@gmail.com";
  const isAdmin = userEmail === adminEmail;
  const isOwner = !editData || (editData.owner?.toLowerCase().trim() === userEmail);

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
  
  // 🌟 新增：部門的狀態與 Notion 讀取回來的選項列表
  const [department, setDepartment] = useState("");
  const [deptOptions, setDeptOptions] = useState([]);

  const [specs, setSpecs] = useState({});
  const [noteText, setNoteText] = useState("");
  const [isShared, setIsShared] = useState(false);
  const [shareWithEveryone, setShareWithEveryone] = useState(true);
  const [sharedDepts, setSharedDepts] = useState([]);
  const [sharedUsers, setSharedUsers] = useState([]);
  const [newUser, setNewUser] = useState("");

  // 🌟 新增：元件載入時，去向 API 要 Notion 裡的部門選項
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await fetch('/api/departments');
        const data = await res.json();
        if (data.success) {
          setDeptOptions(data.data);
        }
      } catch (err) {
        console.error("無法取得部門列表", err);
      }
    };
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (editData) {
      setAssetCode(editData.assetCode || "");
      setModel(editData.model || "");
      setAcquisitionDate(editData.acquisitionDate || "");
      setCategory(editData.category || "laptop");
      setStatus(isBorrowOnly ? "borrowed" : (editData.status || "available"));
      setBorrower(editData.borrower || "");
      setReturnDate(editData.returnDate || "");
      setIssueId(editData.issueId || "");
      setDoe(editData.doe || "");
      setDepartment(editData.department || ""); // 🌟 讀取現有的部門資料

      const { text, specs: parsedSpecs } = parseSpecs(editData.note);
      setNoteText(text || "");
      setSpecs(parsedSpecs || {});
      setIsShared(!!editData.isShared);
      setShareWithEveryone(editData.shareWithEveryone !== undefined ? editData.shareWithEveryone : true);
      setSharedDepts(editData.sharedDepts || []);
      setSharedUsers(editData.sharedUsers || []);
    } else {
      setIsShared(false);
      setShareWithEveryone(true);
      setSharedDepts([]);
      setSharedUsers([]);
    }
  }, [editData, isBorrowOnly]);

  const handleSpecChange = (key, value) => {
    setSpecs(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (isBorrowOnly) {
      if (!borrower?.trim()) {
        setError(t("請填寫借用人", "Borrower is required"));
        setLoading(false);
        return;
      }
      if (!returnDate) {
        setError(t("請選擇預計歸還日", "Return date is required"));
        setLoading(false);
        return;
      }
    } else {
      if (!assetCode) {
        setError(t("請填寫資產編號", "Asset Code is required"));
        setLoading(false);
        return;
      }
      if (isShared && !shareWithEveryone && sharedDepts.length === 0 && sharedUsers.length === 0) {
        setError(t("請至少指定一個分享部門或使用者", "Please specify at least one department or user"));
        setLoading(false);
        return;
      }
    }

    const specsObj = { _note: noteText, isShared, shareWithEveryone, sharedDepts, sharedUsers };
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
      department, // 🌟 將選擇的部門送出
      status: isBorrowOnly ? "borrowed" : status,
      borrower: (isBorrowOnly || status === "borrowed") ? borrower : "",
      returnDate: (isBorrowOnly || status === "borrowed") ? returnDate : null,
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
             <h2 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0 }}>
               {isBorrowOnly ? t("借用資產", "Borrow Asset") : (editData ? t("編輯資產", "Edit Asset") : t("新增資產", "Add Asset"))}
             </h2>
             {editData && <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px", fontFamily: "var(--font-mono)" }}>{editData.id}</div>}
           </div>
           <button onClick={onClose} style={{ width: "32px", height: "32px", borderRadius: "8px", background: "var(--bg-elevated)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", cursor: "pointer" }}><X size={16} /></button>
         </div>

         {/* Body */}
         <div style={{ padding: "1.5rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {error && <div style={{ padding: "0.75rem", background: "var(--danger-soft)", color: "var(--danger)", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 600 }}>{error}</div>}
            
            {isBorrowOnly ? (
              <div className="animate-fade-in" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", padding: "1rem", background: "var(--warning-soft)", borderRadius: "12px", border: "1px solid rgba(245,158,11,0.2)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", minWidth: 0 }}>
                  <label style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--warning)" }}>{t("借用人", "Borrower")} <span style={{ color: "var(--danger)" }}>*</span></label>
                  <input value={borrower} onChange={e => setBorrower(e.target.value)} required style={{ width: "100%", boxSizing: "border-box", minWidth: 0, padding: "0.6rem", borderRadius: "6px", border: "1px solid rgba(245,158,11,0.3)", background: "var(--bg-surface)", color: "var(--text-primary)", fontSize: "0.85rem", outline: "none" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", minWidth: 0 }}>
                  <label style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--warning)" }}>{t("預計歸還日", "Return Date")} <span style={{ color: "var(--danger)" }}>*</span></label>
                  <input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} required style={{ width: "100%", boxSizing: "border-box", minWidth: 0, padding: "0.6rem", borderRadius: "6px", border: "1px solid rgba(245,158,11,0.3)", background: "var(--bg-surface)", color: "var(--text-primary)", fontSize: "0.85rem", outline: "none", colorScheme: "dark" }} />
                </div>
              </div>
            ) : (
              <>
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

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", minWidth: 0 }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)" }}>{t("資產取得日", "Acquisition Date")}</label>
                    <input type="date" value={acquisitionDate} onChange={e => setAcquisitionDate(e.target.value)} style={{ width: "100%", boxSizing: "border-box", minWidth: 0, padding: "0.7rem 0.8rem", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--text-primary)", fontSize: "0.9rem", outline: "none", colorScheme: "dark" }} />
                  </div>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", minWidth: 0 }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)" }}>{t("保管部門", "Department")}</label>
                    <select 
                      value={department} 
                      onChange={e => setDepartment(e.target.value)} 
                      style={{ width: "100%", boxSizing: "border-box", minWidth: 0, padding: "0.7rem 0.8rem", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--text-primary)", fontSize: "0.9rem", outline: "none", cursor: "pointer" }}
                    >
                      <option value="">{t("未指定", "Unassigned")}</option>
                      {deptOptions.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
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

                {(isAdmin || isOwner) && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", padding: "1rem", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>{t("共享此資產", "Share this Asset")}</span>
                        <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{t("允許其他人檢視與借用此設備", "Allow others to view and borrow this device")}</span>
                      </div>
                      <label style={{ position: "relative", display: "inline-block", width: "46px", height: "24px", flexShrink: 0 }}>
                        <input type="checkbox" checked={isShared} onChange={e => setIsShared(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                        <span style={{
                          position: "absolute", cursor: "pointer", inset: 0,
                          background: isShared ? "var(--accent)" : "var(--bg-hover)",
                          borderRadius: "24px", transition: "0.2s",
                          border: "1px solid var(--border)"
                        }}>
                          <span style={{
                            position: "absolute", height: "16px", width: "16px",
                            left: isShared ? "24px" : "3px", bottom: "3px",
                            background: "var(--bg-surface)", borderRadius: "50%", transition: "0.2s",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                          }} />
                        </span>
                      </label>
                    </div>

                    {isShared && (
                      <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "0.5rem", paddingTop: "1rem", borderTop: "1px dashed var(--border)" }}>
                        
                        <div 
                          onClick={() => setShareWithEveryone(!shareWithEveryone)} 
                          style={{ display: "flex", alignItems: "center", gap: "0.6rem", cursor: "pointer", padding: "0.5rem 0.75rem", background: shareWithEveryone ? "var(--accent-soft)" : "transparent", border: shareWithEveryone ? "1px solid var(--accent)" : "1px solid transparent", borderRadius: "8px", transition: "all 0.2s" }}
                        >
                          <div style={{ width: "20px", height: "20px", borderRadius: "4px", border: shareWithEveryone ? "none" : "2px solid var(--text-muted)", background: shareWithEveryone ? "var(--accent)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
                            {shareWithEveryone && <CheckCircle2 size={14} color="var(--bg-base)" strokeWidth={3} />}
                          </div>
                          <span style={{ fontSize: "0.9rem", fontWeight: 700, color: shareWithEveryone ? "var(--accent)" : "var(--text-primary)" }}>
                            {t("與所有人分享", "Share with everyone")}
                          </span>
                        </div>

                        {!shareWithEveryone && (
                          <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1rem", background: "var(--bg-surface)", padding: "1.25rem", borderRadius: "8px", border: "1px solid var(--border)", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)" }}>{t("分享給特定部門", "Share with Departments")}</label>
                              <select 
                                onChange={e => { 
                                  const val = e.target.value; 
                                  if (val && !sharedDepts.includes(val)) setSharedDepts([...sharedDepts, val]); 
                                  e.target.value = ""; 
                                }} 
                                style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--text-primary)", fontSize: "0.85rem", outline: "none", cursor: "pointer" }}
                              >
                                <option value="">{t("選擇部門...", "Select department...")}</option>
                                {deptOptions.map(dept => (
                                  <option key={dept} value={dept}>{dept}</option>
                                ))}
                              </select>
                              {sharedDepts.length > 0 && (
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.4rem" }}>
                                  {sharedDepts.map(dept => (
                                    <span key={dept} style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem", padding: "0.2rem 0.5rem", background: "rgba(139, 92, 246, 0.15)", color: "#8b5cf6", borderRadius: "4px", fontWeight: 600 }}>
                                      {dept}
                                      <button type="button" onClick={() => setSharedDepts(sharedDepts.filter(d => d !== dept))} style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", color: "inherit", display: "flex" }}><X size={12}/></button>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)" }}>{t("分享給特定使用者 (Email 或名稱)", "Share with Specific Users")}</label>
                              <div style={{ display: "flex", gap: "0.4rem" }}>
                                <input value={newUser} onChange={e => setNewUser(e.target.value)} onKeyDown={e => {
                                  if (e.key === "Enter" && newUser.trim()) {
                                    e.preventDefault();
                                    if (!sharedUsers.includes(newUser.trim())) setSharedUsers([...sharedUsers, newUser.trim()]);
                                    setNewUser("");
                                  }
                                }} placeholder="e.g. user@example.com" style={{ flex: 1, padding: "0.6rem", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--text-primary)", fontSize: "0.85rem", outline: "none" }} />
                                <button type="button" onClick={() => {
                                  if (newUser.trim() && !sharedUsers.includes(newUser.trim())) {
                                    setSharedUsers([...sharedUsers, newUser.trim()]);
                                    setNewUser("");
                                  }
                                }} style={{ padding: "0 0.8rem", background: "var(--accent-soft)", border: "1px solid var(--accent)", color: "var(--accent)", borderRadius: "6px", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }}>{t("新增", "Add")}</button>
                              </div>
                              {sharedUsers.length > 0 && (
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.4rem" }}>
                                  {sharedUsers.map(user => (
                                    <span key={user} style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem", padding: "0.2rem 0.5rem", background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: "4px", fontWeight: 600 }}>
                                      {user}
                                      <button type="button" onClick={() => setSharedUsers(sharedUsers.filter(u => u !== user))} style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", color: "inherit", display: "flex" }}><X size={12}/></button>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", minWidth: 0 }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)" }}>{t("備註", "Note")}</label>
                  <textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={3} style={{ width: "100%", boxSizing: "border-box", minWidth: 0, padding: "0.7rem 0.8rem", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--text-primary)", fontSize: "0.9rem", outline: "none", resize: "vertical" }} />
                </div>
              </>
            )}

         </div>

         {/* Footer */}
         <div style={{ padding: "1.25rem 1.5rem", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-surface)", flexShrink: 0 }}>
            {editData && !isBorrowOnly ? (
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
                {isBorrowOnly ? t("確認借用", "Confirm Borrow") : t("儲存", "Save")}
              </button>
            </div>
         </div>
       </div>
     </div>
  );
}