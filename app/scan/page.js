"use client";
import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ScanLine, CheckCircle2, AlertCircle, Loader2, ArrowLeft, QrCode, Barcode } from "lucide-react";
import Navbar from "../../components/Navbar";
import BottomNav from "../../components/BottomNav";
import AssetForm from "../../components/AssetForm";
import { useApp } from "../providers";

function parseSpecs(noteStr) {
  if (!noteStr) return { text: "", specs: {} };
  try {
    const parsed = JSON.parse(noteStr);
    const { _note, ...specs } = parsed;
    return { text: _note || "", specs };
  } catch { return { text: noteStr, specs: {} }; }
}

// 🌟 將原本的掃描邏輯抽離成子元件
function ScanContent() {
  const { t } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const readerRef = useRef(null);
  const scanningRef = useRef(false);

  const [mode, setMode] = useState("scan");
  const [scanning, setScanning] = useState(false);
  const [scanType, setScanType] = useState("qr"); 
  const [asset, setAsset] = useState(null);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [returning, setReturning] = useState(false);

  const haptic = (v = 40) => { if (navigator.vibrate) navigator.vibrate(v); };

  useEffect(() => {
    const code = searchParams.get("code");
    if (code) fetchByCode(code);
  }, [searchParams]);

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

  const handleScanSuccess = (text) => {
    stopCamera();
    if (navigator.vibrate) navigator.vibrate([30, 50, 30]);

    try {
      const url = new URL(text);
      const codeParam = url.searchParams.get("code");
      if (codeParam) {
        fetchByCode(codeParam);
        return;
      }
    } catch (e) {}
    
    fetchByCode(text);
  };

  const startCamera = async (currentType = scanType) => {
    setError("");
    setScanning(true);
    scanningRef.current = true;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "environment", 
          width: { ideal: 1920 }, 
          height: { ideal: 1080 },
          advanced: [{ focusMode: "continuous" }] 
        }
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", true);
        videoRef.current.play().catch(e => console.warn("Video play interrupted:", e));
      }

      const scanLoop = async () => {
        if (!scanningRef.current || !videoRef.current || videoRef.current.readyState !== 4) {
          if (scanningRef.current) requestAnimationFrame(scanLoop);
          return;
        }

        try {
          if ('BarcodeDetector' in window) {
            if (!readerRef.current) {
              const formats = currentType === 'qr' ? ['qr_code'] : ['code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a'];
              readerRef.current = new window.BarcodeDetector({ formats });
            }
            const barcodes = await readerRef.current.detect(videoRef.current);
            if (barcodes && barcodes.length > 0) {
              handleScanSuccess(barcodes[0].rawValue);
              return;
            }
          } 
          else {
            if (currentType === 'qr') {
              const jsQR = (await import("jsqr")).default;
              const canvas = document.createElement("canvas");
              canvas.width = videoRef.current.videoWidth;
              canvas.height = videoRef.current.videoHeight;
              const ctx = canvas.getContext("2d", { willReadFrequently: true });
              ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
              const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const code = jsQR(imgData.data, imgData.width, imgData.height);
              if (code) {
                handleScanSuccess(code.data);
                return;
              }
            } else {
              const { BrowserMultiFormatReader, DecodeHintType } = await import('@zxing/library');
              if (!readerRef.current) {
                const hints = new Map();
                hints.set(DecodeHintType.TRY_HARDER, true);
                readerRef.current = new BrowserMultiFormatReader(hints);
              }
              const result = await readerRef.current.decodeOnceFromVideoElement(videoRef.current);
              if (result) {
                handleScanSuccess(result.getText());
                return;
              }
            }
          }
        } catch(e) {}

        if (scanningRef.current) {
          setTimeout(scanLoop, currentType === 'qr' ? 100 : 250);
        }
      };

      videoRef.current.onloadeddata = () => {
        scanLoop();
      };

    } catch (err) {
      setError(t("無法開啟相機，請確認已授予權限", "Cannot access camera. Please allow permission."));
      setScanning(false);
      scanningRef.current = false;
    }
  };

  const stopCamera = useCallback(() => {
    scanningRef.current = false;
    setScanning(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    readerRef.current = null;
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const handleTypeToggle = (type) => {
    haptic();
    setScanType(type);
    if (scanning) {
      stopCamera();
      setTimeout(() => startCamera(type), 300);
    }
  };

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

  const parsedNote = parseSpecs(asset?.note);
  const specs = parsedNote.specs;
  const noteText = parsedNote.text;

  return (
    <>
      <main style={{ maxWidth: "600px", margin: "0 auto", padding: "1.5rem 1rem" }}>
        {mode === "scan" ? (
          <>
            <div className="animate-fade-in" style={{ marginBottom: "1.5rem" }}>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
                {t("掃描資產條碼", "Scan Asset Barcode")}
              </h1>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "4px" }}>
                {t("切換下方的掃描模式以精準辨識設備", "Switch modes below to identify devices")}
              </p>
            </div>

            <div className="animate-fade-in" style={{ display: "flex", background: "var(--bg-elevated)", padding: "4px", borderRadius: "14px", marginBottom: "1.25rem", border: "1px solid var(--border)" }}>
              <button onClick={() => handleTypeToggle('qr')} style={{ flex: 1, padding: "0.6rem", borderRadius: "10px", border: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", background: scanType === 'qr' ? "var(--bg-surface)" : "transparent", color: scanType === 'qr' ? "var(--text-primary)" : "var(--text-muted)", fontWeight: 700, boxShadow: scanType === 'qr' ? "var(--shadow-sm)" : "none", transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)", cursor: "pointer", outline: "none", WebkitTapHighlightColor: "transparent" }}>
                <QrCode size={18} /> {t("QR Code", "QR Code")}
              </button>
              <button onClick={() => handleTypeToggle('barcode')} style={{ flex: 1, padding: "0.6rem", borderRadius: "10px", border: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", background: scanType === 'barcode' ? "var(--bg-surface)" : "transparent", color: scanType === 'barcode' ? "var(--text-primary)" : "var(--text-muted)", fontWeight: 700, boxShadow: scanType === 'barcode' ? "var(--shadow-sm)" : "none", transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)", cursor: "pointer", outline: "none", WebkitTapHighlightColor: "transparent" }}>
                <Barcode size={18} /> {t("一維條碼", "1D Barcode")}
              </button>
            </div>

            <div className="animate-fade-in" style={{
              background: scanning ? "#000" : "var(--bg-surface)", 
              border: "1px solid var(--border)",
              borderRadius: "16px", overflow: "hidden", marginBottom: "1.25rem",
              aspectRatio: "1", position: "relative",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "var(--shadow-sm)", transition: "background 0.3s ease"
            }}>
              {scanning ? (
                <>
                  <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                    <div style={{
                      width: scanType === 'qr' ? "65%" : "85%", 
                      aspectRatio: scanType === 'qr' ? "1/1" : "2.5/1",
                      border: "2px solid var(--accent)",
                      borderRadius: "12px",
                      boxShadow: "0 0 0 9999px rgba(0,0,0,0.6)",
                      position: "relative",
                      transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                      overflow: "hidden"
                    }}>
                       <div className="laser-line" />
                    </div>
                  </div>
                  <div style={{ position: "absolute", bottom: "1.5rem", left: 0, right: 0, textAlign: "center", color: "#fff", fontSize: "0.85rem", fontWeight: 600, textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
                    {scanType === 'qr' ? t("請將 QR Code 對準框內", "Align QR Code within the frame") : t("請將條碼水平對準掃描線", "Align Barcode horizontally")}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>
                  <ScanLine size={48} style={{ margin: "0 auto 1rem", opacity: 0.3, display: "block" }} />
                  <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>{t("點擊下方按鈕開啟鏡頭", "Tap button below to start")}</div>
                </div>
              )}
            </div>

            {error && (
              <div className="animate-fade-in" style={{ padding: "0.75rem 1rem", background: "var(--danger-soft)", border: "1px solid var(--danger)", borderRadius: "10px", color: "var(--danger)", fontSize: "0.85rem", marginBottom: "1rem", display: "flex", gap: "0.5rem", alignItems: "center", fontWeight: 600 }}>
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <button onClick={() => { haptic(); scanning ? stopCamera() : startCamera(); }} style={{
              width: "100%", padding: "1rem",
              background: scanning ? "var(--danger)" : "var(--accent)",
              border: "none", borderRadius: "14px",
              color: scanning ? "#fff" : "var(--bg-base)", 
              fontSize: "1.05rem", 
              fontFamily: "var(--font-display)", 
              cursor: "pointer", fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
              boxShadow: "var(--shadow-sm)", transition: "all 0.2s",
              outline: "none", WebkitTapHighlightColor: "transparent"
            }} className="btn-spring">
              <ScanLine size={20} />
              {scanning ? t("停止掃描", "Stop Scanning") : t("開始掃描", "Start Scanning")}
            </button>
          </>
        ) : (
          <>
            <button onClick={reset} style={{
              display: "flex", alignItems: "center", gap: "0.4rem",
              background: "none", border: "none", color: "var(--text-muted)",
              fontSize: "0.85rem", 
              fontFamily: "var(--font-display)", 
              cursor: "pointer",
              marginBottom: "1.25rem",
              outline: "none", WebkitTapHighlightColor: "transparent"
            }}>
              <ArrowLeft size={16} /> {t("重新掃描", "Scan Again")}
            </button>

            {asset && (
              <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "1.5rem", boxShadow: "var(--shadow-sm)" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                    <div>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 800 }}>{asset.model || asset.assetCode}</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px", fontFamily: "var(--font-mono)" }}>#{asset.assetCode}</div>
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

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
                    {asset.borrower && (
                      <div style={{ background: "var(--bg-elevated)", borderRadius: "8px", padding: "0.6rem 0.75rem", border: "1px solid var(--border)" }}>
                        <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginBottom: "4px", fontWeight: 600 }}>BORROWER</div>
                        <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>{asset.borrower}</div>
                      </div>
                    )}
                    {asset.returnDate && (
                      <div style={{ background: "var(--bg-elevated)", borderRadius: "8px", padding: "0.6rem 0.75rem", border: "1px solid var(--border)" }}>
                        <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginBottom: "4px", fontWeight: 600 }}>RETURN DATE</div>
                        <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>{asset.returnDate}</div>
                      </div>
                    )}
                    {asset.acquisitionDate && (
                      <div style={{ background: "var(--bg-elevated)", borderRadius: "8px", padding: "0.6rem 0.75rem", border: "1px solid var(--border)" }}>
                        <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginBottom: "4px", fontWeight: 600 }}>ACQUISITION DATE</div>
                        <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>{asset.acquisitionDate}</div>
                      </div>
                    )}
                  </div>

                  {(asset.issueId || asset.doe) && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
                      {asset.issueId && (
                        <div style={{ background: "#fef08a33", border: "1px solid #fef08a88", borderRadius: "8px", padding: "0.6rem 0.75rem" }}>
                          <div style={{ fontSize: "0.65rem", color: "#a16207", marginBottom: "4px", fontWeight: 600 }}>ISSUE ID</div>
                          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#92400e" }}>{asset.issueId}</div>
                        </div>
                      )}
                      {asset.doe && (
                        <div style={{ background: "#a5f3fc22", border: "1px solid #a5f3fc88", borderRadius: "8px", padding: "0.6rem 0.75rem" }}>
                          <div style={{ fontSize: "0.65rem", color: "#0369a1", marginBottom: "4px", fontWeight: 600 }}>DOE</div>
                          <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#0c4a6e" }}>{asset.doe}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {Object.keys(specs).length > 0 && (
                    <div style={{ paddingTop: "0.75rem", borderTop: "1px dashed var(--border)" }}>
                      <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>
                        HARDWARE SPECS
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                        {Object.entries(specs).filter(([, v]) => v).map(([k, v]) => (
                          <div key={k} style={{ background: "var(--bg-elevated)", padding: "0.5rem 0.75rem", borderRadius: "8px", border: "1px solid var(--border)" }}>
                            <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "2px" }}>{k}</div>
                            <div style={{ fontSize: "0.85rem", fontWeight: 500 }}>{v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {noteText && (
                    <div style={{ marginTop: "1rem", fontSize: "0.85rem", lineHeight: 1.6, color: "var(--text-secondary)", background: "var(--bg-elevated)", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid var(--border)" }}>
                      📝 {noteText}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {asset.status === "borrowed" && (
                    <button onClick={handleReturn} disabled={returning} style={{
                      width: "100%", padding: "1rem",
                      background: "var(--success)", border: "none", borderRadius: "14px",
                      color: "#fff", fontSize: "1rem", fontFamily: "var(--font-display)", 
                      cursor: returning ? "not-allowed" : "pointer", fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                      opacity: returning ? 0.6 : 1, boxShadow: "var(--shadow-sm)",
                      outline: "none", WebkitTapHighlightColor: "transparent"
                    }} className="btn-spring">
                      {returning ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> : <CheckCircle2 size={18} />}
                      {t("確認歸還", "Confirm Return")}
                    </button>
                  )}
                  {asset.status === "available" && (
                    <button onClick={() => { haptic(); setShowForm(true); }} style={{
                      width: "100%", padding: "1rem",
                      background: "var(--accent)", border: "none", borderRadius: "14px",
                      color: "var(--bg-base)", fontSize: "1rem", fontFamily: "var(--font-display)", 
                      cursor: "pointer", fontWeight: 700, boxShadow: "var(--shadow-sm)",
                      outline: "none", WebkitTapHighlightColor: "transparent"
                    }} className="btn-spring">
                      {t("借出此設備", "Borrow This Device")}
                    </button>
                  )}
                  <button onClick={() => { haptic(); setShowForm(true); }} style={{
                    width: "100%", padding: "0.875rem",
                    background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "14px",
                    color: "var(--text-secondary)", fontSize: "0.95rem", fontFamily: "var(--font-display)", 
                    cursor: "pointer", fontWeight: 600,
                    outline: "none", WebkitTapHighlightColor: "transparent"
                  }} className="btn-spring">
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
    </>
  );
}

// 🌟 主頁面加上 Suspense 封裝，解決編譯錯誤
export default function ScanPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", paddingBottom: "80px" }}>
      <Navbar />
      <Suspense fallback={<div style={{ padding: "4rem 2rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem", fontWeight: 600 }}>載入中 (Loading...)</div>}>
        <ScanContent />
      </Suspense>
      <BottomNav />
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes scan-laser {
          0% { transform: translateY(0); opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { transform: translateY(220px); opacity: 0; }
        }
        .laser-line {
          position: absolute;
          top: 0; left: 5%; right: 5%;
          height: 2px;
          background: var(--accent);
          box-shadow: 0 0 10px var(--accent), 0 0 20px var(--accent);
          animation: scan-laser 2.5s cubic-bezier(0.25, 0.1, 0.25, 1) infinite;
          will-change: transform, opacity;
        }
      `}</style>
    </div>
  );
}