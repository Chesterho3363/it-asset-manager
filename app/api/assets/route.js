import { NextResponse } from "next/server";
import { getAllAssets, createAsset } from "@/lib/notion";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createAssetSchema, formatZodError } from "@/lib/validation";

// ─── GET /api/assets ──────────────────────────────────────────────────────────
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({
        success: true,
        count: 0,
        data: [],
      }, { status: 200 });
    }

    const adminEmail = (process.env.ADMIN_EMAIL || "ho3363@gmail.com").toLowerCase().trim();
    const userEmail = session.user.email.toLowerCase().trim();
    const isOwnerAdmin = userEmail === adminEmail;

    const { searchParams } = new URL(request.url);
    const adminViewParam = searchParams.get("adminView");
    const shouldViewAll = isOwnerAdmin && adminViewParam !== "false";

    const filters = {
      category: searchParams.get("category") || undefined,
      status: searchParams.get("status") || undefined,
      owner: shouldViewAll ? undefined : userEmail,
    };

    const assets = await getAllAssets(filters);

    return NextResponse.json(
      { success: true, count: assets.length, data: assets },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GET /api/assets] Error:", error);
    return NextResponse.json({ success: false, error: "系統錯誤" }, { status: 500 });
  }
}

// ─── POST /api/assets ─────────────────────────────────────────────────────────
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ success: false, error: "權限不足，請先登入" }, { status: 401 });
    }

    // ── Zod 嚴格驗證 ──
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: "請求格式錯誤：無效的 JSON 格式" }, { status: 400 });
    }

    const result = createAssetSchema.safeParse(body);
    if (!result.success) {
      const message = formatZodError(result.error);
      console.warn("[POST /api/assets] Validation failed:", message, "| Body:", JSON.stringify(body));
      return NextResponse.json({ success: false, error: message }, { status: 400 });
    }

    const validated = result.data;

    const asset = await createAsset({
      ...validated,
      assetCode: validated.assetCode.trim(),
      owner: session.user.email,
    });

    return NextResponse.json({ success: true, data: asset }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/assets] Error:", error);
    return NextResponse.json({ success: false, error: "新增失敗" }, { status: 500 });
  }
}