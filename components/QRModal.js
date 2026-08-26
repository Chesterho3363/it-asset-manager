"use client";
import { useEffect, useRef, useState } from "react";
import { X, Download, Printer } from "lucide-react";
import { useApp } from "../app/providers"; 

export default function QRModal({ asset, onClose }) {
  const { t, userAliases } = useApp(); // 🌟 匯入 userAliases 名稱對照表
  const canvasRef = useRef(null);
  const [qrReady, setQrReady] = useState(false);

  // 🌟 判斷並取得目前的保管人名稱（如果有設定自訂名稱就優先使用）
  const ownerName = asset.owner ? ((userAliases || {})[asset.owner] || asset.owner.split('@')[0]) : null;

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
        errorCorrectionLevel: 'H', // 🌟 極重要：設定最高容錯率 (High)，這樣中間被文字遮擋也能正常掃描！
        color: { dark: "#0a0a0f", light: "#ffffff" },
      }, (err) => {
        if (!err) {
          // 🌟 在 QR Code 產生完畢後，把名字畫在正中間
          if (ownerName) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");
            const width = 240;
            const center = width / 2;
            
            // 1. 設定文字樣式
            ctx.font = "900 16px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            
            // 2. 計算背景白框的大小 (文字寬度 + 左右各 10px 的 Padding)
            const textWidth = ctx.measureText(ownerName).width;
            const boxWidth = textWidth + 20; 
            const boxHeight = 28;
            
            // 3. 畫出白色背景框 (把原本的 QR Code 蓋掉)
            ctx.fillStyle = "#ffffff";
            // 若想要圓角可以替換成 roundRect，但考慮瀏覽器相容性，fillRect 最穩
            ctx.fillRect(center - boxWidth / 2, center - boxHeight / 2, boxWidth, boxHeight);
            
            // 4. 畫出名字文字
            ctx.fillStyle = "#0a0a0f"; // 文字顏色
            ctx.fillText(ownerName, center, center);
          }
          setQrReady(true);
        }
      });
    });
  }, [qrUrl, ownerName]);

  const handleDownload = () => {
    const qrCanvas = canvasRef.current;
    if (!qrCanvas) return;
    
    // 🌟 建立一個新的 Canvas 來繪製「完整的資產標籤」
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    
    const padding = 24;
    const qrSize = qrCanvas.width; // 240
    const textHeight = asset.model ? 65 : 40;
    
    canvas.width = qrSize + padding * 2;
    canvas.height = qrSize + padding * 2 + textHeight;
    
    // 1. 畫白色背景
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 2. 畫 QR Code
    ctx.drawImage(qrCanvas, padding, padding);
    
    // 3. 畫下方資產編號
    ctx.textAlign = "center";
    ctx.fillStyle = "#0a0a0f";
    ctx.font = "bold 20px sans-serif";
    ctx.fillText(asset.assetCode, canvas.width / 2, qrSize + padding + 35);
    
    // 4. 畫下方資產型號
    if (asset.model) {
      ctx.fillStyle = "#71717a";
      ctx.font = "14px sans-serif";
      // 如果型號過長，稍微截斷以防超出圖片
      let displayModel = asset.model;
      if (displayModel.length > 28) displayModel = displayModel.substring(0, 26) + "...";
      ctx.fillText(displayModel, canvas.width / 2, qrSize + padding + 60);
    }
    
    const link = document.createElement("a");
    link.download = `Asset-Label-${asset.assetCode}.png`;
    link.href = canvas.toDataURL("image/png");
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