import { z } from "zod";

// ── 共用的枚舉值 ───────────────────────────────────────────
export const ALLOWED_CATEGORIES = ["laptop", "monitor", "docking", "other", "office", "semi"];
export const ALLOWED_STATUSES = ["available", "borrowed"];

// ── POST /api/assets 建立資產 ─────────────────────────────
export const createAssetSchema = z.object({
  assetCode: z
    .string({ required_error: "assetCode 為必填欄位" })
    .min(1, "assetCode 不可為空白")
    .max(50, "assetCode 最多 50 個字元")
    .trim(),

  model: z
    .string()
    .max(100, "型號最多 100 個字元")
    .optional(),

  category: z
    .enum(ALLOWED_CATEGORIES, {
      errorMap: () => ({ message: `category 必須為以下其一：${ALLOWED_CATEGORIES.join(", ")}` }),
    })
    .optional()
    .default("other"),

  status: z
    .enum(ALLOWED_STATUSES, {
      errorMap: () => ({ message: `status 必須為以下其一：${ALLOWED_STATUSES.join(", ")}` }),
    })
    .optional()
    .default("available"),

  department: z.string().max(50).optional(),

  borrower: z.string().max(100).optional(),

  returnDate: z
    .string()
    .nullable()
    .optional()
    .refine((val) => val === null || val === undefined || val === "" || !isNaN(Date.parse(val)), {
      message: "returnDate 格式無效，請使用 ISO 8601 (例：2025-12-31)",
    }),

  acquisitionDate: z
    .string()
    .nullable()
    .optional()
    .refine((val) => val === null || val === undefined || val === "" || !isNaN(Date.parse(val)), {
      message: "acquisitionDate 格式無效，請使用 ISO 8601",
    }),

  issueId: z.string().max(50).optional(),
  doe: z.string().max(50).optional(),
  note: z.string().max(2000).optional(),
  isShared: z.boolean().optional().default(false),
  shareWithEveryone: z.boolean().optional(),
  sharedDepts: z.array(z.string()).optional(),
  sharedUsers: z.array(z.string()).optional(),
  owner: z.string().max(100).optional(),
});

// ── PATCH /api/assets/[id] 更新資產 ──────────────────────
export const updateAssetSchema = z.object({
  assetCode: z.string().min(1).max(50).trim().optional(),
  model: z.string().max(100).optional(),
  category: z
    .enum(ALLOWED_CATEGORIES, {
      errorMap: () => ({ message: `category 必須為以下其一：${ALLOWED_CATEGORIES.join(", ")}` }),
    })
    .optional(),
  status: z
    .enum(ALLOWED_STATUSES, {
      errorMap: () => ({ message: `status 必須為以下其一：${ALLOWED_STATUSES.join(", ")}` }),
    })
    .optional(),
  department: z.string().max(50).optional(),
  borrower: z.string().max(100).optional(),
  returnDate: z
    .string()
    .nullable()
    .optional()
    .refine((val) => val === null || val === undefined || val === "" || !isNaN(Date.parse(val)), {
      message: "returnDate 格式無效",
    }),
  acquisitionDate: z
    .string()
    .nullable()
    .optional()
    .refine((val) => val === null || val === undefined || val === "" || !isNaN(Date.parse(val)), {
      message: "acquisitionDate 格式無效",
    }),
  issueId: z.string().max(50).nullable().optional(),
  doe: z.string().max(50).nullable().optional(),
  note: z.string().max(2000).optional(),
  isShared: z.boolean().optional(),
  shareWithEveryone: z.boolean().optional(),
  sharedDepts: z.array(z.string()).optional(),
  sharedUsers: z.array(z.string()).optional(),
  owner: z.string().max(100).optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "請提供至少一個要更新的欄位" }
);

// ── 統一錯誤格式化工具 ──────────────────────────────────────
export function formatZodError(error) {
  return error.errors.map((e) => `${e.path.join(".") || "body"}: ${e.message}`).join("; ");
}
