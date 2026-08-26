import { NextResponse } from "next/server";
import { getAssetById, updateAsset, deleteAsset, getSystemSettings } from "@/lib/notion";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { updateAssetSchema, formatZodError } from "@/lib/validation";

// Helper functions for settings case-insensitive lookup
const findUserDept = (settings, email) => {
  if (!email || !settings.userDepartments) return "";
  const key = Object.keys(settings.userDepartments).find(k => k.toLowerCase().trim() === email.toLowerCase().trim());
  return key ? settings.userDepartments[key] : "";
};

const findUserDeptManager = (settings, email) => {
  if (!email || !settings.deptManagers) return "";
  const key = Object.keys(settings.deptManagers).find(k => k.toLowerCase().trim() === email.toLowerCase().trim());
  return key ? settings.deptManagers[key] : "";
};

// ─── PATCH /api/assets/[id] ───────────────────────────────────────────────────
export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: "權限不足，請先登入" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: "缺少資產 ID" }, { status: 400 });
    }

    // ── 解析 JSON ──
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: "請求格式錯誤：無效的 JSON 格式" }, { status: 400 });
    }

    // ── Zod 嚴格驗證 ──
    const result = updateAssetSchema.safeParse(body);
    if (!result.success) {
      const message = formatZodError(result.error);
      console.warn(`[PATCH /api/assets/${id}] Validation failed:`, message, "| Body:", JSON.stringify(body));
      return NextResponse.json({ success: false, error: message }, { status: 400 });
    }

    const validated = result.data;

    let existingAsset;
    try {
      existingAsset = await getAssetById(id);
    } catch (err) {
      console.error(`[PATCH /api/assets/${id}] getAssetById failed:`, err);
      return NextResponse.json({ success: false, error: "找不到指定資產" }, { status: 404 });
    }

    // ── 權限確認 ──
    const adminEmail = (process.env.ADMIN_EMAIL || "ho3363@gmail.com").toLowerCase().trim();
    const userEmail = session.user.email.toLowerCase().trim();
    const isAdmin = userEmail === adminEmail;

    if (!isAdmin) {
      const isOwner = existingAsset?.owner?.toLowerCase().trim() === userEmail;
      let isDeptManager = false;
      if (!isOwner) {
        const settings = await getSystemSettings();
        const owner = existingAsset?.owner || "";
        const assetDept = (existingAsset?.department || findUserDept(settings, owner) || "").toLowerCase().trim();
        const managedDept = (findUserDeptManager(settings, userEmail) || "").toLowerCase().trim();
        isDeptManager = managedDept !== "" && assetDept !== "" && managedDept === assetDept;
      }

      if (!isOwner && !isDeptManager) {
        return NextResponse.json({ success: false, error: "權限不足：您無法修改其他人的資產" }, { status: 403 });
      }
    }

    const updatedAsset = await updateAsset(id, validated);

    return NextResponse.json({ success: true, data: updatedAsset }, { status: 200 });
  } catch (error) {
    console.error(`[PATCH /api/assets] Error:`, error);
    return NextResponse.json({ success: false, error: "無法更新資產", message: error.message }, { status: 500 });
  }
}

// ─── DELETE /api/assets/[id] ──────────────────────────────────────────────────
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: "權限不足，請先登入" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: "缺少資產 ID" }, { status: 400 });
    }

    let existingAsset;
    try {
      existingAsset = await getAssetById(id);
    } catch (err) {
      console.error(`[DELETE /api/assets/${id}] getAssetById failed:`, err);
      return NextResponse.json({ success: false, error: "找不到指定資產" }, { status: 404 });
    }

    // ── 權限確認：只有管理員、資產擁有者或部門管理人能刪除 ──
    const adminEmail = (process.env.ADMIN_EMAIL || "ho3363@gmail.com").toLowerCase().trim();
    const userEmail = session.user.email.toLowerCase().trim();
    const isAdmin = userEmail === adminEmail;

    if (!isAdmin) {
      const isOwner = existingAsset?.owner?.toLowerCase().trim() === userEmail;
      let isDeptManager = false;
      if (!isOwner) {
        const settings = await getSystemSettings();
        const owner = existingAsset?.owner || "";
        const assetDept = (existingAsset?.department || findUserDept(settings, owner) || "").toLowerCase().trim();
        const managedDept = (findUserDeptManager(settings, userEmail) || "").toLowerCase().trim();
        isDeptManager = managedDept !== "" && assetDept !== "" && managedDept === assetDept;
      }

      if (!isOwner && !isDeptManager) {
        return NextResponse.json({ success: false, error: "權限不足：您無法刪除其他人的資產" }, { status: 403 });
      }
    }

    const result = await deleteAsset(id);

    return NextResponse.json({ success: true, message: "資產已成功刪除（封存）", data: result }, { status: 200 });
  } catch (error) {
    console.error(`[DELETE /api/assets] Error:`, error);
    return NextResponse.json({ success: false, error: "無法刪除資產", message: error.message }, { status: 500 });
  }
}