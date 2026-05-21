"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { 
  ChevronLeft, BarChart2, Building2, Package, 
  AlertCircle, ChevronDown, User, Laptop, 
  Monitor, Plug, Layers, Briefcase, List, Network
} from "lucide-react";
import { useApp } from "../providers";

import { categoryMeta, isAssetOverdue } from "../../components/ui/Badges";

export default function DashboardPage() {
  const router = useRouter();
  const { t, userDepartments, userAliases } = useApp();
  
  const [expandedDept, setExpandedDept] = useState(null);
  const [viewModes, setViewModes] = useState({}); // { [dept]: 'list' | 'tree' }
  const [expandedMembers, setExpandedMembers] = useState({}); // { [email]: boolean }
  const [collapsedCategories, setCollapsedCategories] = useState({}); // { [email_cat]: boolean }

  const fetcher = (url) => fetch(url).then(res => res.json());
  const { data: assetsData, isLoading: loading } = useSWR("/api/assets?adminView=true", fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  });

  const assets = assetsData?.success ? assetsData.data : [];

  const setViewMode = (dept, mode) => {
    setViewModes(prev => ({ ...prev, [dept]: mode }));
  };
  
  const toggleMember = (email) => {
    setExpandedMembers(prev => ({ ...prev, [email]: !prev[email] }));
  };

  const toggleCategory = (email, cat) => {
    const key = `${email}_${cat}`;
    setCollapsedCategories(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const deptStats = {};
  assets.forEach(a => {
    const dept = a.department || (a.owner ? userDepartments[a.owner] : null) || "未分類";
    
    if (!deptStats[dept]) {
      deptStats[dept] = { 
        total: 0, available: 0, borrowed: 0, overdue: 0, 
        members: {} 
      };
    }
    
    deptStats[dept].total += 1;
    if (a.status === 'available') deptStats[dept].available += 1;
    else if (isAssetOverdue(a.status, a.returnDate)) deptStats[dept].overdue += 1;
    else deptStats[dept].borrowed += 1;

    if (a.owner) {
      if (!deptStats[dept].members[a.owner]) {
        deptStats[dept].members[a.owner] = { total: 0, categories: {}, items: [] };
      }
      const member = deptStats[dept].members[a.owner];
      member.total += 1;
      const cat = a.category || 'other';
      member.categories[cat] = (member.categories[cat] || 0) + 1;
      member.items.push(a);
    }
  });

  const sortedDepts = Object.entries(deptStats).sort((a, b) => b[1].total - a[1].total);
  const totalAssets = assets.length;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", color: "var(--text-primary)", padding: "calc(1.5rem + env(safe-area-inset-top)) 1.5rem" }}>
      <header style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem", maxWidth: "800px", margin: "0 auto 1.5rem" }}>
        <button onClick={() => router.push('/')} style={{ width: "40px", height: "40px", borderRadius: "12px", background: "var(--bg-surface)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-primary)", outline: "none" }}>
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.5rem" }}><BarChart2 size={24} color="var(--accent)" /> {t("跨部門分析", "Dashboard")}</h1>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>點擊部門區塊可查看組員資產詳情</p>
        </div>
      </header>

      <main style={{ maxWidth: "800px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>分析數據載入中...</div>
        ) : (
          <>
            {/* 🌟 修正：強制使用 2 欄位網格 (repeat(2, 1fr))，並縮小 Padding 與間距，適合手機螢幕 */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem" }}>
              <div style={{ background: "var(--bg-surface)", padding: "1rem", borderRadius: "12px", border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "0.4rem", justifyContent: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--text-muted)", fontSize: "0.8rem", fontWeight: 600 }}>
                  <Package size={14} /> 總資產數
                </div>
                <div style={{ fontSize: "1.8rem", fontWeight: 800, lineHeight: 1 }}>{totalAssets}</div>
              </div>
              
              <div style={{ background: "var(--bg-surface)", padding: "1rem", borderRadius: "12px", border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "0.4rem", justifyContent: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--danger)", fontSize: "0.8rem", fontWeight: 600 }}>
                  <AlertCircle size={14} /> 系統逾期
                </div>
                <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--danger)", lineHeight: 1 }}>
                  {assets.filter(a => isAssetOverdue(a.status, a.returnDate)).length}
                </div>
              </div>
            </div>

            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Building2 size={18} /> 部門與成員分佈
            </h2>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {sortedDepts.map(([dept, stats]) => {
                const isExpanded = expandedDept === dept;
                const availPct = (stats.available / stats.total) * 100 || 0;
                const borrPct = (stats.borrowed / stats.total) * 100 || 0;
                const overPct = (stats.overdue / stats.total) * 100 || 0;

                return (
                  <div key={dept} style={{ background: "var(--bg-surface)", borderRadius: "16px", border: "1px solid var(--border)", overflow: "hidden", transition: "all 0.3s" }}>
                    {/* 部門主區塊 */}
                    <div 
                      onClick={() => setExpandedDept(isExpanded ? null : dept)}
                      style={{ padding: "1.25rem", cursor: "pointer" }}
                      className="btn-spring"
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem", alignItems: "center" }}>
                        <div style={{ fontWeight: 800, fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          {dept}
                          <ChevronDown size={18} style={{ transform: isExpanded ? "rotate(180deg)" : "none", transition: "0.3s", color: "var(--text-muted)" }} />
                        </div>
                        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>共 {stats.total} 項</div>
                      </div>
                      
                      <div style={{ display: "flex", height: "10px", borderRadius: "5px", overflow: "hidden", background: "var(--bg-elevated)", marginBottom: "0.75rem" }}>
                        <div style={{ width: `${availPct}%`, background: "var(--success)" }} />
                        <div style={{ width: `${borrPct}%`, background: "var(--warning)" }} />
                        <div style={{ width: `${overPct}%`, background: "var(--danger)" }} />
                      </div>

                      <div style={{ display: "flex", gap: "1rem", fontSize: "0.75rem", fontWeight: 600 }}>
                        <span style={{ color: "var(--success)" }}>可借用 {stats.available}</span>
                        <span style={{ color: "var(--warning)" }}>借出中 {stats.borrowed}</span>
                        {stats.overdue > 0 && <span style={{ color: "var(--danger)" }}>逾期 {stats.overdue}</span>}
                      </div>
                    </div>

                    {/* 展開內容：組員分析 */}
                    {isExpanded && (
                      <div className="animate-fade-in" style={{ background: "var(--bg-base)", padding: "1rem", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
                        
                        {/* 檢視模式切換器 */}
                        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
                          <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "8px", padding: "3px", display: "flex", gap: "2px" }}>
                            <button 
                              onClick={() => setViewMode(dept, "list")}
                              style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.6rem", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600, background: (viewModes[dept] || "list") === "list" ? "var(--bg-surface)" : "transparent", color: (viewModes[dept] || "list") === "list" ? "var(--text-primary)" : "var(--text-muted)", boxShadow: (viewModes[dept] || "list") === "list" ? "var(--shadow-sm)" : "none", transition: "all 0.2s" }}
                            >
                              <List size={14} /> 列表
                            </button>
                            <button 
                              onClick={() => setViewMode(dept, "tree")}
                              style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.6rem", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600, background: viewModes[dept] === "tree" ? "var(--bg-surface)" : "transparent", color: viewModes[dept] === "tree" ? "var(--accent)" : "var(--text-muted)", boxShadow: viewModes[dept] === "tree" ? "var(--shadow-sm)" : "none", transition: "all 0.2s" }}
                            >
                              <Network size={14} /> 樹狀圖
                            </button>
                          </div>
                        </div>

                        {/* 成員清單與樹狀圖內容 */}
                        <div style={{ display: "flex", flexDirection: "column", gap: (viewModes[dept] || "list") === "list" ? "0.75rem" : "0" }}>
                          {Object.entries(stats.members).sort((a, b) => b[1].total - a[1].total).map(([email, mStats], idx, arr) => {
                            const aliasName = userAliases[email] || email.split('@')[0];
                            const isTree = viewModes[dept] === "tree";
                            const isLast = idx === arr.length - 1;
                            
                            const isMemberExpanded = expandedMembers[email];
                            
                            const MemberCard = (
                              <div 
                                onClick={() => toggleMember(email)}
                                className="btn-spring"
                                style={{ background: "var(--bg-surface)", padding: "0.85rem 1rem", borderRadius: "10px", border: isMemberExpanded ? "1px solid var(--accent)" : "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", width: "100%", boxShadow: isTree ? "var(--shadow-sm)" : "none", cursor: "pointer", transition: "all 0.2s" }}
                              >
                                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", minWidth: 0, flex: 1 }}>
                                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: isMemberExpanded ? "var(--accent)" : "var(--bg-elevated)", color: isMemberExpanded ? "var(--bg-base)" : "var(--text-secondary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "0.2s" }}>
                                    <User size={16} />
                                  </div>
                                  <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                                    <span style={{ fontSize: "0.95rem", fontWeight: 700, lineHeight: 1.2, paddingTop: "6px", color: isMemberExpanded ? "var(--accent)" : "var(--text-primary)" }}>{aliasName}</span>
                                    
                                    <div style={{ display: "flex", gap: "6px", marginTop: "8px", flexWrap: "wrap" }}>
                                      {Object.entries(mStats.categories).map(([cat, count]) => {
                                        const meta = categoryMeta[cat] || categoryMeta.other;
                                        const Icon = meta.icon;
                                        return (
                                          <div key={cat} style={{ 
                                            display: "flex", alignItems: "center", gap: "4px", 
                                            fontSize: "0.7rem", color: "var(--text-secondary)", 
                                            background: "var(--bg-elevated)", padding: "3px 6px", 
                                            borderRadius: "6px", border: "1px solid var(--border)"
                                          }}>
                                            <Icon size={12} color={meta.color} /> 
                                            <span>{t(meta.label[0], meta.label[1])}</span>
                                            <span style={{ fontWeight: 700, color: "var(--text-primary)", marginLeft: "2px" }}>{count}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                                  <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--accent)", whiteSpace: "nowrap" }}>
                                    {mStats.total} <span style={{fontSize:'0.75rem', fontWeight:600}}>項</span>
                                  </div>
                                  <ChevronDown size={18} style={{ transform: isMemberExpanded ? "rotate(180deg)" : "none", transition: "0.3s", color: "var(--text-muted)" }} />
                                </div>
                              </div>
                            );

                            // 渲染第三層(類別)與第四層(資產清單)
                            const SubItemsList = isMemberExpanded && (
                              <div className="animate-fade-in" style={{ paddingLeft: isTree ? "1.5rem" : "0.5rem", marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                {Object.entries(mStats.categories).map(([cat, count], catIdx, catArr) => {
                                  const isLastCat = catIdx === catArr.length - 1;
                                  const catMeta = categoryMeta[cat] || categoryMeta.other;
                                  const CatIcon = catMeta.icon;
                                  const catItems = mStats.items.filter(i => (i.category || 'other') === cat);
                                  
                                  const catKey = `${email}_${cat}`;
                                  const isCatCollapsed = collapsedCategories[catKey];
                                  
                                  return (
                                    <div key={cat} style={{ display: "flex", flexDirection: "column", position: "relative" }}>
                                      
                                      {/* 若此類別並非最後一個，畫一條貫穿整個類別區塊的垂直線，對齊上方層級 */}
                                      {!isLastCat && isTree && (
                                        <div style={{ position: "absolute", left: "8px", top: "12px", bottom: "-0.75rem", width: "2px", background: "var(--border)", zIndex: 0 }} />
                                      )}

                                      {/* 第三層：類別 */}
                                      <div style={{ display: "flex", alignItems: "center", marginBottom: isCatCollapsed ? "0" : "0.5rem" }}>
                                        {isTree && (
                                          <div style={{ position: "relative", width: "24px", flexShrink: 0, height: "24px" }}>
                                            {/* 連接上一層 (成員) 到此類別的垂直與水平線 */}
                                            <div style={{ position: "absolute", left: "8px", top: "-1.5rem", bottom: "50%", width: "2px", background: "var(--border)", zIndex: 0 }} />
                                            <div style={{ position: "absolute", left: "8px", top: "50%", width: "16px", height: "2px", background: "var(--border)", transform: "translateY(-50%)" }} />
                                          </div>
                                        )}
                                        <div 
                                          onClick={() => toggleCategory(email, cat)}
                                          className="btn-spring"
                                          style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", background: "var(--bg-elevated)", padding: "4px 8px", borderRadius: "6px", border: "1px solid var(--border)", position: "relative", zIndex: 1, cursor: "pointer", transition: "all 0.2s", boxShadow: "var(--shadow-sm)" }}
                                        >
                                          <CatIcon size={14} color={catMeta.color} />
                                          {t(catMeta.label[0], catMeta.label[1])}
                                          <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>({count})</span>
                                          <ChevronDown size={14} style={{ transform: isCatCollapsed ? "rotate(-90deg)" : "none", transition: "0.3s", marginLeft: "2px" }} />
                                        </div>
                                      </div>

                                      {/* 第四層：資產項目 */}
                                      {!isCatCollapsed && (
                                        <div className="animate-fade-in" style={{ paddingLeft: isTree ? "24px" : "1rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                                        {catItems.map((item, itemIdx, itemArr) => {
                                          const isLastSub = itemIdx === itemArr.length - 1;
                                          const isBorrowed = item.status === "borrowed";
                                          const overdue = isAssetOverdue(item.status, item.returnDate);

                                          return (
                                            <div key={item.id} style={{ display: "flex", alignItems: "center" }}>
                                              {isTree && (
                                                <div style={{ position: "relative", width: "24px", flexShrink: 0, height: "36px" }}>
                                                  {/* 從類別圖示下方連接到此項目的垂直與水平線 */}
                                                  <div style={{ position: "absolute", left: "15px", top: "-0.5rem", bottom: isLastSub ? "50%" : "-0.5rem", width: "2px", background: "var(--border)" }} />
                                                  <div style={{ position: "absolute", left: "15px", top: "50%", width: "12px", height: "2px", background: "var(--border)", transform: "translateY(-50%)" }} />
                                                </div>
                                              )}
                                              <div style={{ flex: 1, background: "var(--bg-surface)", padding: "0.5rem 0.75rem", borderRadius: "8px", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
                                                <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                  {item.model || item.assetCode}
                                                </span>
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexShrink: 0 }}>
                                                  {overdue ? (
                                                    <span style={{ fontSize: "0.65rem", fontWeight: 700, background: "var(--danger)", color: "var(--bg-base)", padding: "2px 6px", borderRadius: "4px", display: "flex", alignItems: "center", gap: "2px" }}>
                                                      <AlertCircle size={10} /> 逾期
                                                    </span>
                                                  ) : isBorrowed ? (
                                                    <span style={{ fontSize: "0.65rem", fontWeight: 700, background: "rgba(245, 158, 11, 0.15)", color: "#d97706", padding: "2px 6px", borderRadius: "4px" }}>
                                                      借出中
                                                    </span>
                                                  ) : null}
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            );

                            if (isTree) {
                              return (
                                <div key={email} style={{ display: "flex" }}>
                                  {/* 樹狀結構連接線 */}
                                  <div style={{ position: "relative", width: "24px", flexShrink: 0 }}>
                                    {/* 垂直線 (如果是最後一個成員，線只畫到中間) */}
                                    <div style={{ position: "absolute", left: "11px", top: "0", bottom: isLast ? "50%" : "0", width: "2px", background: "var(--border)" }} />
                                    {/* 水平分支線 */}
                                    <div style={{ position: "absolute", left: "11px", top: "50%", width: "13px", height: "2px", background: "var(--border)", transform: "translateY(-50%)" }} />
                                  </div>
                                  {/* 成員卡片容器 */}
                                  <div style={{ flex: 1, paddingBottom: (isLast && !isMemberExpanded) ? "0" : "0.5rem" }}>
                                    {MemberCard}
                                    {SubItemsList}
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <div key={email} style={{ display: "flex", flexDirection: "column" }}>
                                {MemberCard}
                                {SubItemsList}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
      <style>{`
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}