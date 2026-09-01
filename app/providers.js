"use client";
import { useState, createContext, useContext, useEffect, useRef, useCallback } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import { mutate } from "swr"; // 🌟 引入全域 mutate
import * as OpenCC from "opencc-js";

const converter = OpenCC.Converter({ from: "tw", to: "cn" });

export const AppContext = createContext();

export function useApp() {
  return useContext(AppContext);
}

function SettingsSyncHandler({ setUserAliases, setUserEmpIds, setUserDepartments, setDeptManagers, setCategoryManagers, setCustomName }) {
  const { data: session } = useSession();
  const loadedRef = useRef(false);

  useEffect(() => {
    if (session?.user && !loadedRef.current) {
      const fetchSettings = async () => {
        try {
          const res = await fetch("/api/user-settings");
          if (res.ok) {
            const data = await res.json();
            if (data.success) {
              if (data.userAliases) {
                setUserAliases(data.userAliases);
                localStorage.setItem("userAliases", JSON.stringify(data.userAliases));
                
                // 🌟 同步使用者自己的名稱：如果伺服器上有設定自己的別名，更新 customName
                const myEmail = session.user.email.toLowerCase().trim();
                const myAlias = data.userAliases[myEmail];
                if (myAlias) {
                  setCustomName(myAlias);
                  localStorage.setItem("customName", myAlias);
                }
              }
              if (data.userEmpIds) {
                setUserEmpIds(data.userEmpIds);
                localStorage.setItem("userEmpIds", JSON.stringify(data.userEmpIds));
              }
              if (data.userDepartments) {
                setUserDepartments(data.userDepartments);
                localStorage.setItem("userDepartments", JSON.stringify(data.userDepartments));
              }
              if (data.deptManagers) {
                setDeptManagers(data.deptManagers);
                localStorage.setItem("deptManagers", JSON.stringify(data.deptManagers));
              }
              if (data.categoryManagers) {
                setCategoryManagers(data.categoryManagers);
                localStorage.setItem("categoryManagers", JSON.stringify(data.categoryManagers));
              }
              loadedRef.current = true;
            }
          }
        } catch (e) {
          console.error("Failed to fetch settings:", e);
        }
      };
      fetchSettings();
    }
  }, [session, setUserAliases, setUserDepartments, setDeptManagers, setCategoryManagers, setCustomName]);

  return null;
}

export function Providers({ children }) {
  const [theme, setTheme] = useState("dark");
  const [lang, setLang] = useState("zh");
  const [customName, setCustomName] = useState("");
  const [showOnlyIssues, setShowOnlyIssues] = useState(false);
  const [userAliases, setUserAliases] = useState({});
  const [userEmpIds, setUserEmpIds] = useState({});
  const [userDepartments, setUserDepartments] = useState({});
  const [deptManagers, setDeptManagers] = useState({});
  const [categoryManagers, setCategoryManagers] = useState({});

  const hasPendingChanges = useRef(false);
  const saveTimeout = useRef(null);

  // 🌟 離線同步佇列狀態
  const [queueLength, setQueueLength] = useState(0);
  const [isQueueSyncing, setIsQueueSyncing] = useState(false);
  const isSyncingRef = useRef(false);

  // 取得當前 Queue
  const getQueue = useCallback(() => {
    if (typeof window === "undefined") return [];
    try {
      const q = localStorage.getItem("offline_requests_queue");
      return q ? JSON.parse(q) : [];
    } catch (e) {
      return [];
    }
  }, []);

  // 儲存 Queue
  const saveQueue = useCallback((q) => {
    if (typeof window === "undefined") return;
    localStorage.setItem("offline_requests_queue", JSON.stringify(q));
    setQueueLength(q.length);
  }, []);

  // 離線安全的 Fetch 包裝
  const offlineSafeFetch = useCallback(async (url, options = {}) => {
    const method = options.method || "GET";
    const isWrite = ["POST", "PATCH", "DELETE"].includes(method.toUpperCase());

    // 如果是離線狀態，且是寫入型操作，進行佇列處理
    if (typeof window !== "undefined" && !navigator.onLine && isWrite) {
      const queue = getQueue();
      const bodyData = options.body ? JSON.parse(options.body) : null;
      const requestItem = {
        id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        url,
        method,
        body: bodyData,
        headers: options.headers || {},
        timestamp: Date.now()
      };
      
      queue.push(requestItem);
      saveQueue(queue);
      console.log("[Offline Queue] Buffered offline request:", requestItem);

      // 返回一個模擬的成功響應，讓 UI 以樂觀更新處理
      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          isOfflineBuffered: true,
          data: { ...bodyData, id: requestItem.id }
        })
      };
    }

    // 在線狀態，直接發送請求
    try {
      const res = await fetch(url, options);
      return res;
    } catch (error) {
      // 如果發送 fetch 丟出網路異常（例如連線中斷），且是寫入型操作，也寫入離線佇列
      if (isWrite && typeof window !== "undefined") {
        console.warn("[Offline Queue] Fetch failed due to network error, queueing request...", error);
        const queue = getQueue();
        const bodyData = options.body ? JSON.parse(options.body) : null;
        const requestItem = {
          id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          url,
          method,
          body: bodyData,
          headers: options.headers || {},
          timestamp: Date.now()
        };
        queue.push(requestItem);
        saveQueue(queue);
        
        return {
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            isOfflineBuffered: true,
            data: { ...bodyData, id: requestItem.id }
          })
        };
      }
      throw error;
    }
  }, [getQueue, saveQueue]);

  // 同步佇列任務
  const syncOfflineQueue = useCallback(async () => {
    if (isSyncingRef.current) return;
    const queue = getQueue();
    if (queue.length === 0) {
      setIsQueueSyncing(false);
      return;
    }

    isSyncingRef.current = true;
    setIsQueueSyncing(true);
    console.log(`[Offline Queue] Starting sync of ${queue.length} buffered requests...`);

    const remainingQueue = [...queue];

    for (const req of queue) {
      if (!navigator.onLine) {
        console.warn("[Offline Queue] Connection lost during sync. Aborting.");
        break;
      }

      try {
        const res = await fetch(req.url, {
          method: req.method,
          headers: {
            "Content-Type": "application/json",
            ...req.headers
          },
          body: req.body ? JSON.stringify(req.body) : undefined
        });

        if (res.ok || res.status < 500) {
          // 如果伺服器響應為成功，或是雖然是業務錯誤 (4xx) 但非伺服器崩潰/斷線，我們都把它移除
          // 4xx 不宜卡住同步佇列，只記錄到 console，以防佇列永久阻塞
          if (!res.ok) {
            console.error(`[Offline Queue] Request ${req.id} failed with status ${res.status}. Removing from queue to prevent deadlock.`);
            // 寫入前端 error log
            try {
              const errLogs = JSON.parse(localStorage.getItem("error_logs") || "[]");
              errLogs.unshift({
                time: new Date().toISOString(),
                msg: `Offline sync error: ${req.method} ${req.url} returned status ${res.status}`,
                stack: `Payload: ${JSON.stringify(req.body)}`
              });
              localStorage.setItem("error_logs", JSON.stringify(errLogs.slice(0, 50)));
            } catch (e) {}
          } else {
            console.log(`[Offline Queue] Successfully synced request: ${req.id}`);
          }
          
          const index = remainingQueue.findIndex(item => item.id === req.id);
          if (index !== -1) {
            remainingQueue.splice(index, 1);
            saveQueue(remainingQueue);
          }
        } else {
          // 5xx 或者是其他伺服器重試錯誤，中斷同步
          console.warn(`[Offline Queue] Server error ${res.status} on sync. Retrying later.`);
          break;
        }
      } catch (err) {
        // 連線異常，中斷同步
        console.warn("[Offline Queue] Network error during sync. Retrying later.", err);
        break;
      }
    }

    isSyncingRef.current = false;
    if (remainingQueue.length === 0) {
      setIsQueueSyncing(false);
      console.log("[Offline Queue] All offline requests successfully synced.");
      // 🌟 全域重新整理 SWR 快取
      mutate(() => true);
    } else {
      setIsQueueSyncing(false);
      console.log(`[Offline Queue] Sync paused. ${remainingQueue.length} requests remaining.`);
    }
  }, [getQueue, saveQueue]);

  useEffect(() => {
    // 同步佇列與事件綁定
    const handleOnline = () => {
      console.log("[Network] Browser went online. Triggering sync...");
      syncOfflineQueue();
    };

    window.addEventListener("online", handleOnline);
    
    // 將所有可能觸發 cascading renders 的 setState 延後執行，避免 ESLint / React 報錯
    const timer = setTimeout(() => {
      const savedTheme = localStorage.getItem("theme") || "dark";
      const savedLang = localStorage.getItem("lang") || "zh";
      const savedName = localStorage.getItem("customName") || "";
      const savedAliases = localStorage.getItem("userAliases");
      const savedEmpIds = localStorage.getItem("userEmpIds");
      const savedDepts = localStorage.getItem("userDepartments");
      const savedManagers = localStorage.getItem("deptManagers");

      setTheme(savedTheme);
      setLang(savedLang);
      setCustomName(savedName);
      document.documentElement.setAttribute("data-theme", savedTheme);
      document.documentElement.lang = savedLang === 'zh-CN' ? 'zh-CN' : (savedLang === 'zh' ? 'zh-TW' : 'en');

      if (savedAliases) { try { setUserAliases(JSON.parse(savedAliases)); } catch (e) {} }
      if (savedEmpIds) { try { setUserEmpIds(JSON.parse(savedEmpIds)); } catch (e) {} }
      if (savedDepts) { try { setUserDepartments(JSON.parse(savedDepts)); } catch (e) {} }
      if (savedManagers) { try { setDeptManagers(JSON.parse(savedManagers)); } catch (e) {} }

      // 初始化 Queue 長度
      const q = localStorage.getItem("offline_requests_queue");
      setQueueLength(q ? JSON.parse(q).length : 0);

      // 啟動時如果是在線，先嘗試同步一次
      if (typeof navigator !== "undefined" && navigator.onLine) {
        syncOfflineQueue();
      }
    }, 0);

    return () => {
      window.removeEventListener("online", handleOnline);
      clearTimeout(timer);
    };
  }, [syncOfflineQueue]);

  // 🌟 實作防抖同步 (Debounced Sync) 機製到 Notion
  useEffect(() => {
    if (!hasPendingChanges.current) return;

    if (saveTimeout.current) clearTimeout(saveTimeout.current);

    saveTimeout.current = setTimeout(async () => {
      try {
        const res = await offlineSafeFetch("/api/user-settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userAliases, userEmpIds, userDepartments, deptManagers, categoryManagers })
        });
        if (res.ok) {
          hasPendingChanges.current = false;
        }
      } catch (e) {
        console.error("Failed to sync settings to Notion:", e);
      }
    }, 1500);

    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [userAliases, userEmpIds, userDepartments, deptManagers, categoryManagers, offlineSafeFetch]);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };


  const updateCustomName = (name, email) => {
    setCustomName(name);
    localStorage.setItem("customName", name);
    if (email) {
      setUserAliases(prev => {
        const next = { ...prev };
        const trimmed = name.trim();
        if (trimmed === "") delete next[email];
        else next[email] = trimmed;
        localStorage.setItem("userAliases", JSON.stringify(next));
        hasPendingChanges.current = true;
        return next;
      });
    }
  };

  const updateUserAlias = (email, alias) => {
    setUserAliases(prev => {
      const next = { ...prev };
      if (alias.trim() === "") delete next[email];
      else next[email] = alias;
      localStorage.setItem("userAliases", JSON.stringify(next));
      hasPendingChanges.current = true;
      return next;
    });
  };

  const updateUserEmpId = (email, empId) => {
    setUserEmpIds(prev => {
      const next = { ...prev };
      if (!empId || empId.trim() === "") delete next[email];
      else next[email] = empId;
      localStorage.setItem("userEmpIds", JSON.stringify(next));
      hasPendingChanges.current = true;
      return next;
    });
  };


  const updateUserDepartment = (email, dept) => {
    setUserDepartments(prev => {
      const next = { ...prev };
      if (!dept || dept.trim() === "") delete next[email];
      else next[email] = dept;
      localStorage.setItem("userDepartments", JSON.stringify(next));
      hasPendingChanges.current = true;
      return next;
    });
    // Cascading update: if user is also a manager, update their managed department
    setDeptManagers(prev => {
      if (prev[email]) {
        const next = { ...prev };
        if (!dept || dept.trim() === "") delete next[email];
        else next[email] = dept;
        localStorage.setItem("deptManagers", JSON.stringify(next));
        hasPendingChanges.current = true;
        return next;
      }
      return prev;
    });
  };

  const updateUserDeptManager = (email, dept) => {
    setDeptManagers(prev => {
      const next = { ...prev };
      if (!dept || dept.trim() === "") delete next[email];
      else next[email] = dept;
      localStorage.setItem("deptManagers", JSON.stringify(next));
      hasPendingChanges.current = true;
      return next;
    });
  };

  const updateUserCategoryManager = (email, category) => {
    setCategoryManagers(prev => {
      const next = { ...prev };
      if (!category || category.trim() === "") delete next[email];
      else next[email] = category;
      localStorage.setItem("categoryManagers", JSON.stringify(next));
      hasPendingChanges.current = true;
      return next;
    });
  };

  const changeLang = (newLang) => {
    setLang(newLang);
    localStorage.setItem("lang", newLang);
    document.documentElement.lang = newLang === 'zh-CN' ? 'zh-CN' : (newLang === 'zh' ? 'zh-TW' : 'en');
  };

  const t = (zh, en) => {
    if (lang === "en") return en;
    if (lang === "zh-CN") return converter(zh);
    return zh;
  };

  return (
    <SessionProvider>
      <AppContext.Provider value={{ 
        theme, toggleTheme, lang, setLang: changeLang, t, 
        customName, updateCustomName, showOnlyIssues, setShowOnlyIssues,
        userAliases, updateUserAlias,
        userEmpIds, updateUserEmpId,
        userDepartments, updateUserDepartment,
        deptManagers, updateUserDeptManager,
        categoryManagers, updateUserCategoryManager,
        offlineSafeFetch, queueLength, isQueueSyncing, syncOfflineQueue // 🌟 新增暴露
      }}>
        <SettingsSyncHandler 
          setUserAliases={setUserAliases} 
          setUserEmpIds={setUserEmpIds}
          setUserDepartments={setUserDepartments} 
          setDeptManagers={setDeptManagers} 
          setCategoryManagers={setCategoryManagers}
          setCustomName={setCustomName} 
        />
        {children}
      </AppContext.Provider>
    </SessionProvider>
  );
}