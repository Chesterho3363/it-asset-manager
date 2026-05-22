import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getSystemSettings, saveSystemSettings } from "@/lib/notion";

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "ho3363@gmail.com").toLowerCase().trim();

// GET /api/user-settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
    }
    const settings = await getSystemSettings();
    return NextResponse.json({ success: true, ...settings });
  } catch (error) {
    console.error("[GET /api/user-settings] Error:", error);
    return NextResponse.json({ success: false, error: "讀取設定失敗" }, { status: 500 });
  }
}

// POST /api/user-settings
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
    }
    
    const userEmail = session.user.email.toLowerCase().trim();
    const isAdmin = userEmail === ADMIN_EMAIL;

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: "請求格式錯誤：無效的 JSON" }, { status: 400 });
    }

    const { userAliases, userDepartments, deptManagers } = body;
    if (!userAliases || !userDepartments) {
      return NextResponse.json({ success: false, error: "欄位錯誤" }, { status: 400 });
    }

    if (isAdmin) {
      // 管理員：可寫入/覆蓋所有設定
      const updated = await saveSystemSettings({ 
        userAliases, 
        userDepartments, 
        deptManagers: deptManagers || {} 
      });
      return NextResponse.json({ success: true, data: updated });
    } else {
      // 一般使用者：僅限更新自己 email 對應的別名 (使用者自訂顯示名稱)
      const current = await getSystemSettings();
      
      const newUserAliases = { ...current.userAliases };
      const newUserDepartments = { ...current.userDepartments };
      
      // 僅覆蓋當前登入使用者的別名
      const myNewAlias = userAliases[userEmail];
      if (myNewAlias !== undefined) {
        if (!myNewAlias || myNewAlias.trim() === "") {
          delete newUserAliases[userEmail];
        } else {
          newUserAliases[userEmail] = myNewAlias;
        }
      }
      
      // 儲存合併後的設定，其餘部門與其他成員設定維持 Notion 上的版本不變
      const updated = await saveSystemSettings({
        userAliases: newUserAliases,
        userDepartments: newUserDepartments,
        deptManagers: current.deptManagers || {}
      });
      
      return NextResponse.json({ success: true, data: updated });
    }
  } catch (error) {
    console.error("[POST /api/user-settings] Error:", error);
    return NextResponse.json({ success: false, error: "儲存設定失敗" }, { status: 500 });
  }
}
