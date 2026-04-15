"use client";
import { useEffect, useRef, useState } from "react";
import { X, Download, Printer } from "lucide-react";
import { useApp } from "../app/layout";

export default function QRModal({ asset, onClose }) {
  const { t } = useApp();
  const canvasRef = useRef(null);
  const [qrReady, setQrReady] = useState(false);

  // The QR code URL points to the asset detail (scan landing page)
  const qrUrl = typeof window !== "undefined"
    ? `${window.location.origin}/scan?code=${encodeURIComponent(asset.assetCode)}`
    : "";

  useEffect(() => {
    if (!qrUrl) return;
    import("qrcode").then((QRCode) => {
      QRCode.toCanvas(canvasRef.current, qrUrl, {
        width: 240,
        margin: 2,
        color: { dark: "#0a0a0f", light: "#ffffff" },
      }, (err) => {
        if (!err) setQrReady(true);
      });
    });
  }, [qrUrl]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `QR-${asset.assetCode}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const handlePrint = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL();
    const win = window.open("", "_blank");
    win.document.write(`
      <html><head><title>QR Code - ${asset.assetCode}</title>
      <style>
        body { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; font-family:monospace; gap:12px; }
        img { width:200px; height:200px; }
        .code { font-size:14px; font-weight:700; letter-spacing:0.1em; }
        .model { font-size:12px; color:#666; }
        @media print { body { margin:0; } }
      </style></head>
      <body>
        <img src="${dataUrl}" />
        <div class="code">${asset.assetCode}</div>
        <div class="model">${asset.model || ""}</div>
        <script>window.onload=()=>{ window.print(); window.close(); }<\/script>
      </body></html>
    `);
    win.document.close();
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: "var(--bg-surface)", border: "1px solid var(--border)",
        borderRadius: "16px", width: "100%", maxWidth: "340px",
        boxShadow: "var(--shadow-lg)",
      }}>
        {/* Header */}
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>QR Code</div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{asset.assetCode}</div>
          </div>
          <button onClick={onClose} style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text-muted)", cursor: "pointer" }}>
            <X size={16} />
          </button>
        </div>

        {/* QR Canvas */}
        <div style={{ padding: "2rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
          <div style={{
            background: "#fff", borderRadius: "12px", padding: "1rem",
            boxShadow: "0 2px 16px rgba(0,0,0,0.12)",
          }}>
            <canvas ref={canvasRef} style={{ display: "block" }} />
          </div>

          <div style={{ textAlign: "center" }}>
            <div style={{ fontWeight: 700, fontSize: "1rem", letterSpacing: "0.05em" }}>{asset.assetCode}</div>
            {asset.model && <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "2px" }}>{asset.model}</div>}
          </div>

          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textAlign: "center", lineHeight: 1.5 }}>
            {t("掃描後可直接開啟此資產詳情", "Scan to open asset details")}
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid var(--border)", display: "flex", gap: "0.75rem" }}>
          <button onClick={handleDownload} disabled={!qrReady} style={{
            flex: 1, padding: "0.6rem",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
            background: "var(--accent-soft)", border: "1px solid var(--accent)",
            borderRadius: "8px", color: "var(--accent)", cursor: "pointer",
            fontSize: "0.82rem", fontFamily: "var(--font-mono)",
          }}>
            <Download size={14} /> {t("下載", "Download")}
          </button>
          <button onClick={handlePrint} disabled={!qrReady} style={{
            flex: 1, padding: "0.6rem",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
            background: "var(--bg-elevated)", border: "1px solid var(--border)",
            borderRadius: "8px", color: "var(--text-secondary)", cursor: "pointer",
            fontSize: "0.82rem", fontFamily: "var(--font-mono)",
          }}>
            <Printer size={14} /> {t("列印", "Print")}
          </button>
        </div>
      </div>
    </div>
  );
}
