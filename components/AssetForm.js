"use client";
import { useState } from "react";
import { X, Save, Loader2, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useApp } from "../app/layout";

const inputStyle = {
  width: "100%", padding: "0.6rem 0.875rem",
  background: "var(--bg-base)", border: "1px solid var(--border)",
  borderRadius: "8px", color: "var(--text-primary)",
  fontSize: "0.85rem", fontFamily: "var(--font-mono)",
  outline: "none", transition: "border-color 0.2s",
};

const labelStyle = {
  display: "block", fontSize: "0.68rem", fontWeight: 600,
  color: "var(--text-muted)", letterSpacing: "0.08em",
  textTransform: "uppercase", marginBottom: "0.35rem",
};

const laptopFields = [
  { key: "cpu",   label: "CPU",   placeholder: "M3 Pro / i7-13700H" },
  { key: "ram",   label: "RAM",   placeholder: "16GB / 32GB" },
  { key: "ssd",   label: "SSD",   placeholder: "512GB / 1TB" },
  { key: "size",  label: "SIZE",  placeholder: '14" / 16"' },
  { key: "panel", label: "PANEL", placeholder: "IPS / OLED" },
  { key: "sku",   label: "SKU",   placeholder: "原廠料號" },
];

const monitorFields = [
  { key: "size",        label: "SIZE",       placeholder: '27" / 32"' },
  { key: "resolution",  label: "RESOLUTION", placeholder: "4K / 2K / 1080p" },
  { key: "panel",       label: "PANEL",      placeholder: "IPS / VA / OLED" },
  { key: "refreshRate", label: "REFRESH",    placeholder: "60Hz / 144Hz" },
  { key: "ports",       label: "PORTS",      placeholder: "HDMI / DP / USB-C" },
  { key: "sku",         label: "SKU",        placeholder: "原廠料號" },
];

function parseSpecs(noteStr) {
  if (!noteStr) return { text: "", specs: {} };
  try {
    const parsed = JSON.parse(noteStr);
    const { _note, ...specs } = parsed;
    return { text: _note || "", specs };
  } catch { return { text: noteStr, specs: {} }; }
}

function buildNote(text, specs, category) {
  const hasSpecs = (category === "laptop" || category === "monitor") &&
    Object.entries(specs).some(([, v]) => v);
  if (!hasSpecs && !text) return "";
  if (!hasSpecs) return text;
  const obj = { ...specs, _note: text };
  Object.keys(obj).forEach(k => { if (!obj[k]) delete obj[k]; });
  return JSON.stringify(obj);
}

function CategorySelector({ value, onChange, t }) {
  const options = [
    { val: "laptop",  icon: "💻", zh: "筆電",  en: "Laptop" },
    { val: "monitor", icon: "🖥️", zh: "螢幕",  en: "Monitor" },
    { val: "docking", icon: "🔌", zh: "擴充座", en: "Docking" },
    { val: "other",   icon: "📦", zh: "其他",   en: "Other" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
      {options.map(o => (
        <button key={o.val} type="button" onClick={() => onChange(o.val)} style={{
          padding: "0.6rem", background: value === o.val ? "var(--accent)" : "var(--bg-base)",
          border: `1px solid ${value === o.val ? "var(--accent)" : "var(--border)"}`,
          borderRadius: "8px", color: value === o.val ? "#fff" : "var(--text-secondary)",
          fontSize: "0.82rem", fontFamily: "var(--font-mono)", cursor: "pointer",
          display: "flex", alignItems: "center", gap: "0.4rem", justifyContent: "center",
          transition: "all 0.15s",
        }}>
          {o.icon} {t(o.zh, o.en)}
        </button>
      ))}
    </div>
  );
}

function SpecsSection({ category, specs, onChange, t }) {
  const [open, setOpen] = useState(true);
  const fields = category === "laptop" ? laptopFields : category === "monitor" ? monitorFields : null;
  if (!fields) return null;
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden" }}>
      <button type="button" onClick={() => setOpen(o => !o)} style={{
        width: "100%", padding: "0.75rem 1rem", background: "var(--bg-elevated)",
        border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between",
        color: "var(--text-secondary)", fontFamily: "var(--font-mono)", fontSize: "0.8rem", fontWeight: 600,
      }}>
        <span>{category === "laptop" ? "💻" : "🖥️"} {category === "laptop" ? t("筆電規格", "Laptop Specs") : t("螢幕規格", "Monitor Specs")}</span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && (
        <div style={{ padding: "1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          {fields.map(f => (
            <div key={f.key}>
              <label style={labelStyle}>{f.label}</label>
              <input style={inputStyle} value={specs[f.key] || ""} placeholder={f.placeholder}
                onChange={e => onChange({ ...specs, [f.key]: e.target.value })}
                onFocus={e => e.target.style.borderColor = "var(--border-focus)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AssetForm({ onClose, onSuccess, editData = null }) {
  const { t } = useApp();
  const isEdit = !!editData;
  const { text: initNote, specs: initSpecs } = parseSpecs(editData?.note);

  // ── 修正：加入 acquisitionDate，並確保日期格式乾淨 (切除時間 T 之後的字元) ──
  const [form, setForm] = useState({
    assetCode:       editData?.assetCode       || "",
    model:           editData?.model           || "",
    category:        editData?.category        || "laptop",
    status:          editData?.status          || "available",
    borrower:        editData?.borrower        || "",
    returnDate:      editData?.returnDate      ? editData.returnDate.split("T")[0] : "",
    issueId:         editData?.issueId         || "",
    doe:             editData?.doe             || "",
    acquisitionDate: editData?.acquisitionDate ? editData.acquisitionDate.split("T")[0] : "", 
  });
  
  const [noteText, setNoteText] = useState(initNote);
  const [specs, setSpecs] = useState(initSpecs);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.assetCode.trim()) { setError(t("資產編號為必填", "Asset code is required")); return; }
    setLoading(true); setError("");
    try {
      const note = buildNote(noteText, specs, form.category);
      const res = await fetch(
        isEdit ? `/api/assets/${editData.id}` : "/api/assets",
        { method: isEdit ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, note }) }
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      onSuccess?.(); onClose?.();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!confirm(t(`確定刪除「${editData.assetCode}」？`, `Delete "${editData.assetCode}"?`))) return;
    setDeleting(true);
    try {
      await fetch(`/api/assets/${editData.id}`, { method: "DELETE" });
      onSuccess?.(); onClose?.();
    } catch (e) { setError(e.message); setDeleting(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
      onClick={e => e.target === e.currentTarget && onClose?.()}>
      <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "16px", width: "100%", maxWidth: "560px", maxHeight: "90vh", overflowY: "auto", boxShadow: "var(--shadow-lg)" }}>

        {/* Header */}
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "var(--bg-surface)", zIndex: 1 }}>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.1rem" }}>
              {isEdit ? t("編輯資產", "Edit Asset") : t("新增資產", "Add Asset")}
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
              {isEdit ? editData.assetCode : t("填寫資產基本資料", "Fill in asset details")}
            </div>
          </div>
          <button onClick={onClose} style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-muted)", cursor: "pointer" }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>

          {/* 資產編號 + 型號 + 取得日 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={labelStyle}>{t("資產編號", "Asset Code")} *</label>
              <input style={inputStyle} value={form.assetCode} onChange={set("assetCode")} placeholder="NB-001"
                onFocus={e => e.target.style.borderColor = "var(--border-focus)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"} />
            </div>
            <div>
              <label style={labelStyle}>{t("型號", "Model")}</label>
              <input style={inputStyle} value={form.model} onChange={set("model")} placeholder="MacBook Pro 14"
                onFocus={e => e.target.style.borderColor = "var(--border-focus)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"} />
            </div>
            {/* ── 修正：新增取得日期輸入區塊 ── */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>{t("資產取得日", "Acquisition Date")}</label>
              <input type="date" style={inputStyle} value={form.acquisitionDate} onChange={set("acquisitionDate")}
                onFocus={e => e.target.style.borderColor = "var(--border-focus)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"} />
            </div>
          </div>

          {/* 類別 */}
          <div>
            <label style={labelStyle}>{t("類別", "Category")}</label>
            <CategorySelector value={form.category} onChange={v => { setForm(f => ({ ...f, category: v })); setSpecs({}); }} t={t} />
          </div>

          {/* 狀態 */}
          <div>
            <label style={labelStyle}>{t("狀態", "Status")}</label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {[{ val: "available", zh: "✅ 可借用", en: "✅ Available" }, { val: "borrowed", zh: "⏳ 借出中", en: "⏳ Borrowed" }].map(o => (
                <button key={o.val} type="button" onClick={() => setForm(f => ({ ...f, status: o.val }))} style={{
                  flex: 1, padding: "0.6rem",
                  background: form.status === o.val ? (o.val === "available" ? "var(--success-soft)" : "var(--warning-soft)") : "var(--bg-base)",
                  border: `1px solid ${form.status === o.val ? (o.val === "available" ? "var(--success)" : "var(--warning)") : "var(--border)"}`,
                  borderRadius: "8px",
                  color: form.status === o.val ? (o.val === "available" ? "var(--success)" : "var(--warning)") : "var(--text-secondary)",
                  fontSize: "0.82rem", fontFamily: "var(--font-mono)", cursor: "pointer", transition: "all 0.15s",
                }}>{t(o.zh, o.en)}</button>
              ))}
            </div>
          </div>

          {/* 借用資訊 */}
          {form.status === "borrowed" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label style={labelStyle}>{t("借用人", "Borrower")}</label>
                <input style={inputStyle} value={form.borrower} onChange={set("borrower")} placeholder={t("姓名", "Name")}
                  onFocus={e => e.target.style.borderColor = "var(--border-focus)"}
                  onBlur={e => e.target.style.borderColor = "var(--border)"} />
              </div>
              <div>
                <label style={labelStyle}>{t("預計歸還日", "Return Date")}</label>
                <input type="date" style={inputStyle} value={form.returnDate} onChange={set("returnDate")}
                  onFocus={e => e.target.style.borderColor = "var(--border-focus)"}
                  onBlur={e => e.target.style.borderColor = "var(--border)"} />
              </div>
            </div>
          )}

          {/* Issue ID + DOE */}
          <div style={{ background: "#fef9c322", border: "1px solid #fef08a", borderRadius: "10px", padding: "0.875rem" }}>
            <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#a16207", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>
              🔬 {t("實驗 / Issue 追蹤", "Lab / Issue Tracking")}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label style={{ ...labelStyle, color: "#a16207" }}>ISSUE ID</label>
                <input style={{ ...inputStyle, background: "#fff7ed", borderColor: "#fde68a" }}
                  value={form.issueId} onChange={set("issueId")} placeholder="PROJ-1234"
                  onFocus={e => e.target.style.borderColor = "#f59e0b"}
                  onBlur={e => e.target.style.borderColor = "#fde68a"} />
              </div>
              <div>
                <label style={{ ...labelStyle, color: "#a16207" }}>DOE / 用途</label>
                <input style={{ ...inputStyle, background: "#fff7ed", borderColor: "#fde68a" }}
                  value={form.doe} onChange={set("doe")} placeholder={t("專案測試 A", "Project Test A")}
                  onFocus={e => e.target.style.borderColor = "#f59e0b"}
                  onBlur={e => e.target.style.borderColor = "#fde68a"} />
              </div>
            </div>
          </div>

          {/* 規格 */}
          <SpecsSection category={form.category} specs={specs} onChange={setSpecs} t={t} />

          {/* 備註 */}
          <div>
            <label style={labelStyle}>{t("備註", "Note")}</label>
            <textarea style={{ ...inputStyle, resize: "vertical", minHeight: "64px" }}
              value={noteText} onChange={e => setNoteText(e.target.value)}
              placeholder={t("選填備註...", "Optional notes...")}
              onFocus={e => e.target.style.borderColor = "var(--border-focus)"}
              onBlur={e => e.target.style.borderColor = "var(--border)"} />
          </div>

          {error && (
            <div style={{ padding: "0.6rem 0.875rem", background: "var(--danger-soft)", border: "1px solid var(--danger)", borderRadius: "8px", color: "var(--danger)", fontSize: "0.8rem" }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid var(--border)", display: "flex", gap: "0.75rem", position: "sticky", bottom: 0, background: "var(--bg-surface)" }}>
          {isEdit && (
            <button onClick={handleDelete} disabled={deleting} style={{
              padding: "0.6rem 1rem", background: "var(--danger-soft)", border: "1px solid var(--danger)",
              borderRadius: "8px", color: "var(--danger)", fontSize: "0.85rem", fontFamily: "var(--font-mono)",
              cursor: deleting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "0.4rem",
              opacity: deleting ? 0.6 : 1,
            }}>
              {deleting ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Trash2 size={14} />}
              {t("刪除", "Delete")}
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button onClick={onClose} style={{ padding: "0.6rem 1.25rem", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-secondary)", fontSize: "0.85rem", fontFamily: "var(--font-mono)", cursor: "pointer" }}>
            {t("取消", "Cancel")}
          </button>
          <button onClick={handleSubmit} disabled={loading} style={{
            padding: "0.6rem 1.25rem", background: "var(--accent)", border: "none", borderRadius: "8px",
            color: "#fff", fontSize: "0.85rem", fontFamily: "var(--font-mono)",
            cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "0.5rem", opacity: loading ? 0.7 : 1,
          }}>
            {loading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={14} />}
            {isEdit ? t("儲存", "Save") : t("新增", "Add")}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}