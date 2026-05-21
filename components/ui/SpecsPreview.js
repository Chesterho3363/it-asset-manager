export function parseSpecs(noteStr) {
  if (!noteStr) return { text: "", specs: {} };
  try {
    const parsed = JSON.parse(noteStr);
    const { _note, ...specs } = parsed;
    return { text: _note || "", specs };
  } catch { return { text: noteStr, specs: {} }; }
}

export function SpecsPreview({ note, category }) {
  const { specs } = parseSpecs(note);
  const entries = Object.entries(specs).filter(([, v]) => v);
  if (!entries.length || (category !== "laptop" && category !== "monitor")) return null;
  return (
    <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap", marginTop: "0.2rem" }}>
      {entries.slice(0, 3).map(([k, v]) => (
        <span key={k} style={{ fontSize: "0.67rem", padding: "0.1rem 0.4rem", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "4px", color: "var(--text-muted)" }}>
          {k.toUpperCase()}: {v}
        </span>
      ))}
      {entries.length > 3 && <span style={{ fontSize: "0.67rem", color: "var(--text-muted)" }}>+{entries.length - 3}</span>}
    </div>
  );
}
