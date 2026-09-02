"use client";
import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ScanLine, CheckCircle2, AlertCircle, Loader2, ArrowLeft, QrCode, Barcode, Camera } from "lucide-react";
import { useSession } from "next-auth/react";
import { mutate, useSWRConfig } from "swr";
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
  const { t, offlineSafeFetch, userAliases, userDepartments, deptManagers, categoryManagers } = useApp();
  const { data: session } = useSession();
  const { cache } = useSWRConfig();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const scannerRef = useRef(null);
  const scanRegionId = "qr-reader-region";

  const [mode, setMode] = useState("scan");
  const [scanning, setScanning] = useState(false);
  const [scanType, setScanType] = useState("qr"); 
  const [asset, setAsset] = useState(null);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isBorrowMode, setIsBorrowMode] = useState(false);
  const [returning, setReturning] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [activeCameraId, setActiveCameraId] = useState(null);

  const userEmail = session?.user?.email?.toLowerCase().trim();
  const adminEmail = "ho3363@gmail.com";
  const isAdmin = userEmail === adminEmail;
  const isOwner = asset && asset.owner?.toLowerCase().trim() === userEmail;

  const displayDept = asset?.department || (asset?.owner ? userDepartments[asset.owner] : null);
  const isDeptManager = userEmail && deptManagers?.[userEmail] && displayDept && 
    deptManagers[userEmail].toLowerCase().trim() === displayDept.toLowerCase().trim();
  const isCategoryManager = userEmail && categoryManagers?.[userEmail] && asset?.category &&
    categoryManagers[userEmail].toLowerCase().trim() === asset.category.toLowerCase().trim();
  const canEdit = isAdmin || isOwner || isDeptManager || isCategoryManager;

  const userDisplayName = session?.user?.name || "";
  const userAlias = userAliases?.[userEmail] || "";
  const userEmailPrefix = userEmail ? userEmail.split('@')[0] : "";
  const isCurrentBorrower = asset?.status === "borrowed" && asset?.borrower && (
    asset.borrower.toLowerCase().trim() === userDisplayName.toLowerCase().trim() ||
    asset.borrower.toLowerCase().trim() === userAlias.toLowerCase().trim() ||
    asset.borrower.toLowerCase().trim() === userEmailPrefix.toLowerCase().trim() ||
    asset.borrower.toLowerCase().trim() === userEmail
  );

  const haptic = (v = 40) => { if (navigator.vibrate) navigator.vibrate(v); };

  useEffect(() => {
    const code = searchParams.get("code");
    if (code) fetchByCode(code);
  }, [searchParams]);

  const fetchByCode = async (code) => {
    setError("");

    // 🌟 離線或網路 fetch 失敗時，使用 SWR 快取尋找
    const searchSWRKeysForAsset = () => {
      if (typeof window !== "undefined" && typeof cache.keys === "function") {
        for (const key of cache.keys()) {
          if (typeof key === "string" && key.startsWith("/api/assets")) {
            const cachedValue = cache.get(key);
            if (cachedValue && cachedValue.data) {
              const found = cachedValue.data.find(a => a.assetCode === code);
              if (found) {
                return found;
              }
            }
          }
        }
      }
      return null;
    };

    // 如果確定處於離線狀態，直接用 SWR cache
    if (typeof window !== "undefined" && !navigator.onLine) {
      const found = searchSWRKeysForAsset();
      if (found) {
        setAsset(found);
        setMode("result");
      } else {
        setError(t(`離線模式下找不到資產「${code}」`, `Asset "${code}" not found in offline cache`));
      }
      return;
    }

    try {
      const res = await fetch(`/api/assets?search=${encodeURIComponent(code)}`);
      if (res.ok) {
        const data = await res.json();
        const found = data.data?.find(a => a.assetCode === code);
        if (found) { 
          setAsset(found); 
          setMode("result"); 
          return;
        }
      }
      setError(t(`找不到資產「${code}」`, `Asset "${code}" not found`));
    } catch (err) {
      // 網路 fetch 丟出錯誤，嘗試用 SWR 快取做備份
      const found = searchSWRKeysForAsset();
      if (found) {
        setAsset(found);
        setMode("result");
      } else {
        setError(t("查詢失敗，且無快取資料", "Query failed and no cached data available"));
      }
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

  const startCamera = async (currentType = scanType, specificCameraId = activeCameraId) => {
    setError("");
    setScanning(true);
    
    // 等待 React 把 #qr-reader-region 渲染到 DOM 上
    await new Promise(resolve => setTimeout(resolve, 50));
    
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      
      let camIdToUse = specificCameraId;
      if (!camIdToUse) {
        try {
          const devices = await Html5Qrcode.getCameras();
          if (devices && devices.length > 0) {
            setCameras(devices);
            const backCams = devices.filter(c => c.label.toLowerCase().includes('back') || c.label.toLowerCase().includes('environment') || c.label.toLowerCase().includes('後置'));
            if (backCams.length > 0) {
              const mainBack = backCams.find(c => !c.label.toLowerCase().includes('ultra') && !c.label.toLowerCase().includes('0.5x') && !c.label.toLowerCase().includes('廣角')) || backCams[0];
              camIdToUse = mainBack.id;
            } else {
              camIdToUse = devices[devices.length - 1].id;
            }
            setActiveCameraId(camIdToUse);
          }
        } catch(e) {
          console.warn('Could not list cameras', e);
        }
      }
      
      // 不再限制格式 (formatsToSupport)，直接採用套件預設支援所有 QR / 1D 條碼
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(scanRegionId, { 
          experimentalFeatures: { useBarCodeDetectorIfSupported: true } 
        });
      }

      // 將條碼掃描的框框改寬一點，幫助傳統條碼更容易對焦
      const config = { 
        fps: 15,
        qrbox: currentType === 'qr' ? { width: 250, height: 250 } : { width: 320, height: 120 },
        aspectRatio: 1.777778
      };

      const cameraConfig = camIdToUse ? { deviceId: { exact: camIdToUse } } : { facingMode: "environment" };

      await scannerRef.current.start(
        cameraConfig, 
        config, 
        (decodedText) => handleScanSuccess(decodedText),
        (errorMessage) => { /* ignore normal scan errors */ }
      );

      // 移除強制 focusMode: continuous，交由原生相機自動對焦，避免報錯或卡死

    } catch (err) {
      console.error(err);
      setError(t("無法開啟相機，請確認已授予權限", "Cannot access camera. Please allow permission."));
      setScanning(false);
    }
  };

  const handleSwitchCamera = async (e) => {
    if (e) e.preventDefault();
    if (cameras.length <= 1) return;
    haptic();
    const currentIndex = cameras.findIndex(c => c.id === activeCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCameraId = cameras[nextIndex].id;
    setActiveCameraId(nextCameraId);
    
    if (scanning) {
      if (scannerRef.current) {
        try { await scannerRef.current.stop(); } catch(e){}
        try { scannerRef.current.clear(); } catch(e){}
        scannerRef.current = null;
      }
      setTimeout(() => startCamera(scanType, nextCameraId), 100);
    }
  };

  const stopCamera = useCallback(async () => {
    setScanning(false);
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (e) {}
      try {
        scannerRef.current.clear();
      } catch (e) {}
      scannerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(e => {}).finally(() => {
           try { scannerRef.current.clear(); } catch(e){} 
        });
      }
    };
  }, []);

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
    haptic(60);

    const originalAsset = asset;
    // 1. 樂觀更新 local state
    setAsset(prev => ({
      ...prev,
      status: "available",
      borrower: "",
      returnDate: null
    }));

    try {
      // 2. 呼叫離線安全的 fetch
      const res = await offlineSafeFetch(`/api/assets/${asset.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "available", borrower: "", returnDate: null }),
      });
      const json = await res.json();
      const updatedAsset = { ...originalAsset, ...json.data, status: "available", borrower: "", returnDate: null };

      // 更新 local state
      setAsset(updatedAsset);

      // 3. 樂觀更新全域 SWR 快取
      mutate(
        key => typeof key === "string" && key.startsWith("/api/assets"),
        async (currentData) => {
          if (!currentData || !currentData.data) return currentData;
          return {
            ...currentData,
            data: currentData.data.map(a => a.id === asset.id ? updatedAsset : a)
          };
        },
        { revalidate: !json.isOfflineBuffered }
      );

      // 在線時，重新 fetch 最新資料確保完全一致
      if (!json.isOfflineBuffered) {
        await fetchByCode(asset.assetCode);
      }
    } catch (err) {
      console.error("[Return Error] Failed to return asset in scan:", err);
      setAsset(originalAsset);
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
                  <div id="qr-reader-region" style={{ width: "100%", height: "100%" }} />
                  <style>{`
                    #qr-reader-region video {
                      object-fit: cover !important;
                      width: 100% !important;
                      height: 100% !important;
                    }
                    /* Hide html5-qrcode's default UI elements we don't want */
                    #qr-reader-region__dashboard_section_csr span { display: none !important; }
                  `}</style>
                  {cameras.length > 1 && (
                    <button 
                      onClick={handleSwitchCamera}
                      style={{
                        position: "absolute", top: "1rem", right: "1rem", zIndex: 50,
                        background: "rgba(0,0,0,0.5)", color: "white", border: "none", 
                        borderRadius: "50%", width: "40px", height: "40px", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        backdropFilter: "blur(4px)"
                      }}
                      aria-label="Switch Camera"
                    >
                      <Camera size={20} />
                    </button>
                  )}
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
                  {asset.status === "borrowed" && (isAdmin || isOwner || isCurrentBorrower || isDeptManager) && (
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
                  {asset.status === "available" && (canEdit || asset.isShared) && (
                    <button onClick={() => { haptic(); setIsBorrowMode(true); setShowForm(true); }} style={{
                      width: "100%", padding: "1rem",
                      background: "var(--accent)", border: "none", borderRadius: "14px",
                      color: "var(--bg-base)", fontSize: "1rem", fontFamily: "var(--font-display)", 
                      cursor: "pointer", fontWeight: 700, boxShadow: "var(--shadow-sm)",
                      outline: "none", WebkitTapHighlightColor: "transparent"
                    }} className="btn-spring">
                      {t("借出此設備", "Borrow This Device")}
                    </button>
                  )}
                  {canEdit && (
                    <button onClick={() => { haptic(); setShowForm(true); }} style={{
                      width: "100%", padding: "0.875rem",
                      background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "14px",
                      color: "var(--text-secondary)", fontSize: "0.95rem", fontFamily: "var(--font-display)", 
                      cursor: "pointer", fontWeight: 600,
                      outline: "none", WebkitTapHighlightColor: "transparent"
                    }} className="btn-spring">
                      {t("編輯資產資訊", "Edit Asset Info")}
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>
      {showForm && asset && (
        <AssetForm
          editData={asset}
          isBorrowOnly={isBorrowMode}
          onClose={() => { setShowForm(false); setIsBorrowMode(false); }}
          onSuccess={async (responseData, actionType) => {
            setShowForm(false);
            setIsBorrowMode(false);
            if (!responseData || !responseData.success) {
              fetchByCode(asset.assetCode);
              return;
            }

            const { isOfflineBuffered, data: responseAsset } = responseData;
            
            // 1. 樂觀更新當前的 local asset 狀態
            if (actionType === "delete") {
              setAsset(null);
              setMode("scan");
            } else {
              setAsset(prev => ({ ...prev, ...responseAsset }));
            }

            // 2. 樂觀更新全域 SWR 快取
            mutate(
              key => typeof key === "string" && key.startsWith("/api/assets"),
              async (currentData) => {
                if (!currentData || !currentData.data) return currentData;
                let newData = [...currentData.data];
                if (actionType === "delete") {
                  newData = newData.filter(a => a.id !== responseAsset.id);
                } else if (actionType === "edit") {
                  newData = newData.map(a => a.id === responseAsset.id ? { ...a, ...responseAsset } : a);
                } else if (actionType === "add") {
                  newData.unshift({ ...responseAsset, owner: responseAsset.owner || session?.user?.email });
                }
                return { ...currentData, data: newData };
              },
              { revalidate: !isOfflineBuffered }
            );

            // 3. 在線時，重新讀取
            if (!isOfflineBuffered) {
              fetchByCode(responseAsset.assetCode || asset.assetCode);
            }
          }}
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