import { NextResponse } from "next/server";
import { getAllAssets, createAsset } from "@/lib/notion";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

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
    
    // 🌟 關鍵新增：接收前端傳來的視角參數
    const adminViewParam = searchParams.get("adminView");
    
    // 🌟 判斷邏輯：如果是管理員，且前端「沒有」明確傳送 false，才開啟全域視角
    const shouldViewAll = isOwnerAdmin && adminViewParam !== "false";

    const filters = {
      category: searchParams.get("category") || undefined,
      status: searchParams.get("status") || undefined,
      // 如果要看全部 -> undefined (不限制 owner)
      // 如果是一般人，或是管理員把開關切掉了 -> 嚴格限制只能抓自己的 Email
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

    const body = await request.json();
    const { assetCode } = body;

    if (!assetCode?.trim()) {
      return NextResponse.json({ success: false, error: "assetCode 為必填" }, { status: 400 });
    }

    const asset = await createAsset({
      ...body,
      assetCode: assetCode.trim(),
      owner: session.user.email, 
    });

    return NextResponse.json({ success: true, data: asset }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/assets] Error:", error);
    return NextResponse.json({ success: false, error: "新增失敗" }, { status: 500 });
  }
}