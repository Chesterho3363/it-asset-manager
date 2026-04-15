import { NextResponse } from "next/server";
import { getAllAssets, createAsset } from "@/lib/notion";

// ─── GET /api/assets ──────────────────────────────────────────────────────────
// 支援 Query Params 篩選：?category=laptop&status=available
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const filters = {
      category: searchParams.get("category") || undefined,
      status: searchParams.get("status") || undefined,
    };

    const assets = await getAllAssets(filters);

    return NextResponse.json(
      {
        success: true,
        count: assets.length,
        data: assets,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GET /api/assets] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "無法取得資產列表",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// ─── POST /api/assets ─────────────────────────────────────────────────────────
// Body: { assetCode, model, category, status, borrower, returnDate, note }
export async function POST(request) {
  try {
    const body = await request.json();

    // ── 必填欄位驗證 ──
    const { assetCode } = body;
    if (!assetCode || typeof assetCode !== "string" || !assetCode.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "assetCode 為必填欄位",
        },
        { status: 400 }
      );
    }

    // ── Category 合法值驗證 ──
    const validCategories = ["laptop", "monitor", "docking", "other"];
    if (body.category && !validCategories.includes(body.category)) {
      return NextResponse.json(
        {
          success: false,
          error: `category 必須為以下其一：${validCategories.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // ── Status 合法值驗證 ──
    const validStatuses = ["available", "borrowed"];
    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json(
        {
          success: false,
          error: `status 必須為以下其一：${validStatuses.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const asset = await createAsset({
      assetCode: assetCode.trim(),
      model: body.model ?? "",
      category: body.category ?? "other",
      status: body.status ?? "available",
      borrower: body.borrower ?? "",
      returnDate: body.returnDate ?? null,
      note: body.note ?? "",
    });

    return NextResponse.json(
      {
        success: true,
        data: asset,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/assets] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "無法新增資產",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
