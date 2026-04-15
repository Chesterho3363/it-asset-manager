import { NextResponse } from "next/server";
import { getAssetById, updateAsset, deleteAsset } from "@/lib/notion";

// ─── PATCH /api/assets/[id] ───────────────────────────────────────────────────
export async function PATCH(request, { params }) {
  try {
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

    const allowedFields = [
      "assetCode",
      "model",
      "category",
      "status",
      "borrower",
      "returnDate",
      "note",
    ];
    const filteredBody = Object.fromEntries(
      Object.entries(body).filter(([key]) => allowedFields.includes(key))
    );

    const validCategories = ["laptop", "monitor", "docking", "other"];
    if (
      filteredBody.category !== undefined &&
      filteredBody.category !== null &&
      !validCategories.includes(filteredBody.category)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: `category 必須為以下其一：${validCategories.join(", ")}`,
        },
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
        {
          success: false,
          error: `status 必須為以下其一：${validStatuses.join(", ")}`,
        },
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

// ─── DELETE /api/assets/[id] ──────────────────────────────────────────────────
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
