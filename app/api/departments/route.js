import { NextResponse } from "next/server";
import { Client } from "@notionhq/client";

// 獨立初始化一個 Notion 客戶端
const notion = new Client({ auth: process.env.NOTION_API_KEY });
const DATABASE_ID = process.env.NOTION_DATABASE_ID;

export async function GET() {
  try {
    // 向 Notion 請求資料庫的「結構描述 (Schema)」
    const db = await notion.databases.retrieve({ database_id: DATABASE_ID });
    
    // 找到名為 department 的屬性
    const deptProp = db.properties.department;
    
    // 提取出裡面的選項名稱 (如果沒設定就回傳空陣列)
    const options = deptProp?.select?.options?.map(opt => opt.name) || [];
    
    return NextResponse.json({ success: true, data: options }, { status: 200 });
  } catch (error) {
    console.error("[GET /api/departments] Error:", error);
    return NextResponse.json({ success: false, error: "無法取得部門列表" }, { status: 500 });
  }
}