"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ScanLine, CheckCircle2, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import Navbar from "../../components/Navbar";
import BottomNav from "../../components/BottomNav";
import AssetForm from "../../components/AssetForm";
import { useApp } from "../layout";

export default function ScanPage() {
  const { t } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [mode, setMode] = useState("scan"); // "scan" | "result"
  const [scanning, setScanning] = useState(false);
  const [asset, setAsset] = useState(null);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [returning, setReturning] = useState(false);

  // If ?code= param is present (opened from QR), fetch that asset directly
  useEffect(() => {
    const code = searchParams.get("code");
    if (code) fetchByCode(code);
  }, []);

  const fetchByCode = async (code) => {
    setError("");
    try {
      const res = await fetch(`/api/assets?search=${encodeURIComponent(code)}`);
      const data = await res.json();
      const found = data.data?.find(a => a.assetCode === code);
      if (found) { setAsset(found); setMode("result"); }
      else setError(t(`找不到資產「${code}」`, `Asset "${code}" not found`));
    } catch {
      setError(t("查詢失敗", "Query failed"));
    }
  };

  const startCamera = async () => {
    setScanning(true);
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;

      // Dynamically import jsQR for QR decoding
      const jsQR = (await import("jsqr")).default;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const scan = () => {
        if (!videoRef.current || videoRef.current.readyState !== 4) {
          requestAnimationFrame(scan);
          return;
        }
        canvas.width  = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code) {
          stopCamera();
          // Parse URL to get code param
          try {
            const url = new URL(code.data);
            const assetCode = url.searchParams.get("code");
            if (assetCode) fetchByCode(assetCode);
            else setError(t("QR Code 格式不符", "Invalid QR Code format"));
          } catch {
            setError(t("無法解析 QR Code", "Cannot parse QR Code"));
          }
        } else {
          requestAnimationFrame(scan);
        }
      };
      videoRef.current.onloadedmetadata = () => requestAnimationFrame(scan);
    } catch {
      setError(t("無法開啟相機，請確認已授予相機權限", "Cannot access camera. Please allow camera permission."));
      setScanning(false);
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    setScanning(false);
  };

  useEffect(() => () => stopCamera(), []);

  const handleReturn = async () => {
    if (!confirm(t(`確定歸還「${asset.assetCode}」？`, `Return "${asset.assetCode}"?`))) return;
    setReturning(true);
    try {
      await fetch(`/api/assets/${asset.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "available", borrower: "", returnDate: null }),
      });
      await fetchByCode(asset.assetCode);
    } finally {
      setReturning(false);
    }
  };

  const reset = () => { setMode("scan"); setAsset(null); setError(""); stopCamera(); };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", paddingBottom: "80px" }}>
      <Navbar />
      <main style={{ maxWidth: "600px", margin: "0 auto", padding: "1.5rem 1rem" }}>

        {mode === "scan" ? (
          <>
            <div style={{ marginBottom: "1.5rem" }}>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
                {t("掃描 QR Code", "Scan QR Code")}
              </h1>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "4px" }}>
                {t("掃描貼在設備上的 QR Code 快速存取", "Scan the QR code on the device")}
              </p>
            </div>

            {/* Camera viewfinder */}
            <div style={{
              background: "var(--bg-surface)", border: "1px solid var(--border)",
              borderRadius: "16px", overflow: "hidden", marginBottom: "1.25rem",
              aspectRatio: "1", position: "relative",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {scanning ? (
                <>
                  <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  {/* Scan overlay */}
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                    <div style={{
                      width: "60%", aspectRatio: "1",
                      border: "2px solid var(--accent)",
                      borderRadius: "12px",
                      boxShadow: "0 0 0 9999px rgba(0,0,0,0.4)",
                    }} />
                  </div>
                  <div style={{ position: "absolute", bottom: "1rem", left: 0, right: 0, textAlign: "center", color: "#fff", fontSize: "0.8rem" }}>
                    {t("將 QR Code 對準框框", "Align QR Code within the frame")}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>
                  <ScanLine size={48} style={{ margin: "0 auto 1rem", opacity: 0.3, display: "block" }} />
                  <div style={{ fontSize: "0.9rem" }}>{t("點擊下方按鈕開始掃描", "Tap button below to start scanning")}</div>
                </div>
              )}
            </div>

            {error && (
              <div style={{ padding: "0.75rem 1rem", background: "var(--danger-soft)", border: "1px solid var(--danger)", borderRadius: "10px", color: "var(--danger)", fontSize: "0.85rem", marginBottom: "1rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <button onClick={scanning ? stopCamera : startCamera} style={{
              width: "100%", padding: "0.875rem",
              background: scanning ? "var(--danger)" : "var(--accent)",
              border: "none", borderRadius: "12px",
              color: "#fff", fontSize: "1rem", fontFamily: "var(--font-mono)",
              cursor: "pointer", fontWeight: 600,
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
            }}>
              <ScanLine size={20} />
              {scanning ? t("停止掃描", "Stop Scanning") : t("開始掃描", "Start Scanning")}
            </button>
          </>
        ) : (
          /* Result view */
          <>
            <button onClick={reset} style={{
              display: "flex", alignItems: "center", gap: "0.4rem",
              background: "none", border: "none", color: "var(--text-muted)",
              fontSize: "0.85rem", fontFamily: "var(--font-mono)", cursor: "pointer",
              marginBottom: "1.25rem",
            }}>
              <ArrowLeft size={16} /> {t("重新掃描", "Scan Again")}
            </button>

            {asset && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {/* Asset Card */}
                <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "1.5rem" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1rem" }}>
                    <div>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", fontWeight: 800 }}>{asset.model || asset.assetCode}</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "2px" }}>#{asset.assetCode}</div>
                    </div>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: "0.35rem",
                      padding: "0.3rem 0.75rem",
                      background: asset.status === "available" ? "var(--success-soft)" : "var(--warning-soft)",
                      borderRadius: "999px",
                      color: asset.status === "available" ? "var(--success)" : "var(--warning)",
                      fontSize: "0.78rem", fontWeight: 600,
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: asset.status === "available" ? "var(--success)" : "var(--warning)" }} />
                      {asset.status === "available" ? t("可借用", "Available") : t("借出中", "Borrowed")}
                    </span>
                  </div>

                  {/* Info grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                    {asset.borrower && (
                      <div style={{ background: "var(--bg-elevated)", borderRadius: "8px", padding: "0.6rem 0.75rem" }}>
                        <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginBottom: "2px" }}>BORROWER</div>
                        <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>{asset.borrower}</div>
                      </div>
                    )}
                    {asset.returnDate && (
                      <div style={{ background: "var(--bg-elevated)", borderRadius: "8px", padding: "0.6rem 0.75rem" }}>
                        <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginBottom: "2px" }}>RETURN DATE</div>
                        <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>{asset.returnDate}</div>
                      </div>
                    )}
                    {asset.issueId && (
                      <div style={{ background: "#fef08a33", border: "1px solid #fef08a88", borderRadius: "8px", padding: "0.6rem 0.75rem" }}>
                        <div style={{ fontSize: "0.65rem", color: "#a16207", marginBottom: "2px" }}>ISSUE ID</div>
                        <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#92400e" }}>{asset.issueId}</div>
                      </div>
                    )}
                    {asset.doe && (
                      <div style={{ background: "#a5f3fc22", border: "1px solid #a5f3fc88", borderRadius: "8px", padding: "0.6rem 0.75rem" }}>
                        <div style={{ fontSize: "0.65rem", color: "#0369a1", marginBottom: "2px" }}>DOE</div>
                        <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#0c4a6e" }}>{asset.doe}</div>
                      </div>
                    )}
                  </div>

                  {asset.note && (
                    <div style={{ marginTop: "0.75rem", fontSize: "0.82rem", color: "var(--text-muted)", fontStyle: "italic" }}>📝 {asset.note}</div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {asset.status === "borrowed" && (
                    <button onClick={handleReturn} disabled={returning} style={{
                      width: "100%", padding: "0.875rem",
                      background: "var(--success)", border: "none", borderRadius: "12px",
                      color: "#fff", fontSize: "0.95rem", fontFamily: "var(--font-mono)",
                      cursor: returning ? "not-allowed" : "pointer", fontWeight: 600,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                      opacity: returning ? 0.6 : 1,
                    }}>
                      {returning ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> : <CheckCircle2 size={18} />}
                      {t("確認歸還", "Confirm Return")}
                    </button>
                  )}
                  {asset.status === "available" && (
                    <button onClick={() => setShowForm(true)} style={{
                      width: "100%", padding: "0.875rem",
                      background: "var(--accent)", border: "none", borderRadius: "12px",
                      color: "#fff", fontSize: "0.95rem", fontFamily: "var(--font-mono)",
                      cursor: "pointer", fontWeight: 600,
                    }}>
                      {t("借出此設備", "Borrow This Device")}
                    </button>
                  )}
                  <button onClick={() => setShowForm(true)} style={{
                    width: "100%", padding: "0.75rem",
                    background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "12px",
                    color: "var(--text-secondary)", fontSize: "0.9rem", fontFamily: "var(--font-mono)",
                    cursor: "pointer",
                  }}>
                    {t("編輯資產資訊", "Edit Asset Info")}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {showForm && asset && (
        <AssetForm
          editData={asset}
          onClose={() => setShowForm(false)}
          onSuccess={() => { setShowForm(false); fetchByCode(asset.assetCode); }}
        />
      )}

      <BottomNav />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
