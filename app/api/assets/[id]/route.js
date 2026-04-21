import { NextResponse } from "next/server";
import { getAssetById, updateAsset, deleteAsset } from "@/lib/notion";

// ─── PATCH /api/assets/[id] (更新資產) ───────────────────────────────────────────
export async function PATCH(request, { params }) {
  try {
    // 在 Next.js App Router 中，params 通常需要 await
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "缺少資產 ID" },
        { status: 400 }
      );
    }

    const body = await request.json();

    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json(
        { success: false, error: "請提供至少一個要更新的欄位" },
        { status: 400 }
      );
    }

    // ── 修正：擴充允許更新的欄位清單，包含所有新功能欄位 ──
    const allowedFields = [
      "assetCode",
      "model",
      "category",
      "status",
      "borrower",
      "returnDate",
      "acquisitionDate", // 新增：資產取得日
      "issueId",         // 新增：Issue ID
      "doe",             // 新增：DOE
      "note",
    ];

    const filteredBody = Object.fromEntries(
      Object.entries(body).filter(([key]) => allowedFields.includes(key))
    );

    // ── 合法值驗證 (維持原有的安全機制) ──
    // 🌟 修正：補上 office 和 semi
    const validCategories = ["laptop", "monitor", "docking", "other", "office", "semi"];
    if (
      filteredBody.category !== undefined &&
      filteredBody.category !== null &&
      !validCategories.includes(filteredBody.category)
    ) {
      return NextResponse.json(
        { success: false, error: `category 必須為以下其一：${validCategories.join(", ")}` },
        { status: 400 }
      );
    }

    const validStatuses = ["available", "borrowed"];
    if (
      filteredBody.status !== undefined &&
      filteredBody.status !== null &&
      !validStatuses.includes(filteredBody.status)
    ) {
      return NextResponse.json(
        { success: false, error: `status 必須為以下其一：${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    // 先確認該資產是否存在
    try {
      await getAssetById(id);
    } catch {
      return NextResponse.json(
        { success: false, error: "找不到指定資產" },
        { status: 404 }
      );
    }

    // 呼叫更新功能
    const updatedAsset = await updateAsset(id, filteredBody);

    return NextResponse.json(
      {
        success: true,
        data: updatedAsset,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(`[PATCH /api/assets] Error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: "無法更新資產",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// ─── DELETE /api/assets/[id] (刪除資產) ──────────────────────────────────────────
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "缺少資產 ID" },
        { status: 400 }
      );
    }

    try {
      await getAssetById(id);
    } catch {
      return NextResponse.json(
        { success: false, error: "找不到指定資產" },
        { status: 404 }
      );
    }

    const result = await deleteAsset(id);

    return NextResponse.json(
      {
        success: true,
        message: "資產已成功刪除（封存）",
        data: result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(`[DELETE /api/assets] Error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: "無法刪除資產",
        message: error.message,
      },
      { status: 500 }
    );
  }
}