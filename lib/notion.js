import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const DATABASE_ID = process.env.NOTION_DATABASE_ID;

// 🌟 指數退避重試包裝 (Exponential Backoff Retry Wrapper)
async function withRetry(fn, maxRetries = 3, baseDelay = 500) {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      const status = error.status;
      const isRateLimit = status === 429;
      const isServerError = status >= 500 && status <= 599;

      if ((isRateLimit || isServerError) && attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.warn(`[Notion SDK Retry] Attempt ${attempt} failed with status ${status}. Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
}

const prop = {
  title:    (p) => p?.title?.map((t) => t.plain_text).join("") ?? "",
  richText: (p) => p?.rich_text?.map((t) => t.plain_text).join("") ?? "",
  select:   (p) => p?.select?.name ?? null,
  date:     (p) => p?.date?.start ?? null,
};

function flattenPage(page) {
  const p = page.properties;
  const noteRaw = prop.richText(p.Note);
  let isShared = false;
  let shareWithEveryone = true;
  let sharedDepts = [];
  let sharedUsers = [];
  try {
    const parsed = JSON.parse(noteRaw);
    if (parsed && typeof parsed === "object") {
      isShared = !!parsed.isShared;
      shareWithEveryone = parsed.shareWithEveryone !== undefined ? !!parsed.shareWithEveryone : true;
      sharedDepts = Array.isArray(parsed.sharedDepts) ? parsed.sharedDepts : [];
      sharedUsers = Array.isArray(parsed.sharedUsers) ? parsed.sharedUsers : [];
    }
  } catch (e) {}

  return {
    id:              page.id,
    assetCode:       prop.title(p.AssetCode),
    model:           prop.richText(p.Model),
    category:        prop.select(p.Category)?.toLowerCase() ?? null,
    status:          prop.select(p.Status)?.toLowerCase() ?? null,
    borrower:        prop.richText(p.Borrower),
    returnDate:      prop.date(p.ReturnDate),
    acquisitionDate: prop.date(p.AcquisitionDate),
    note:            noteRaw,
    isShared:        isShared,
    shareWithEveryone,
    sharedDepts,
    sharedUsers,
    issueId:         prop.richText(p.IssueID),
    doe:             prop.richText(p.DOE),
    owner:           p.owner?.email ?? prop.richText(p.owner) ?? null,
    department:      prop.select(p.department) ?? null, // 🌟 新增：讀取 Notion 裡的 department 欄位
    createdAt:       page.created_time,
    updatedAt:       page.last_edited_time,
  };
}

function mapCategoryForNotion(cat) {
  if (!cat) return cat;
  const l = cat.toLowerCase();
  if (l === "monitor") return "Monitor";
  if (l === "docking") return "Docking";
  if (l === "other") return "Other";
  if (l === "laptop") return "laptop";
  if (l === "semi") return "semi";
  if (l === "office") return "office";
  return cat;
}

export async function getAllAssets(filters = {}) {
  const andFilters = [];
  if (filters.category) andFilters.push({ property: "Category", select: { equals: mapCategoryForNotion(filters.category) } });
  if (filters.status)   andFilters.push({ property: "Status",   select: { equals: filters.status } });
  
  // (可選) 預留未來如果需要直接從 API 過濾特定部門的功能
  if (filters.department) andFilters.push({ property: "department", select: { equals: filters.department } });

  if (filters.owner) {
    const orConditions = [
      {
        property: "owner", 
        email: { equals: filters.owner } 
      },
      {
        property: "Note",
        rich_text: { contains: '"isShared":true' }
      }
    ];
    if (filters.managedDepartment) {
      orConditions.push({
        property: "department",
        select: { equals: filters.managedDepartment }
      });
    }
    if (filters.managedCategory) {
      orConditions.push({
        property: "Category",
        select: { equals: mapCategoryForNotion(filters.managedCategory) }
      });
    }
    andFilters.push({
      or: orConditions
    });
  }

  let results = [];
  let next_cursor = undefined;
  
  do {
    const response = await withRetry(() => notion.databases.query({
      database_id: DATABASE_ID,
      ...(andFilters.length > 0 && {
        filter: andFilters.length === 1 ? andFilters[0] : { and: andFilters },
      }),
      sorts: [{ property: "AssetCode", direction: "ascending" }],
      start_cursor: next_cursor,
    }));
    
    results = results.concat(response.results);
    next_cursor = response.next_cursor;
  } while (next_cursor);

  return results.map(flattenPage).filter(asset => asset.assetCode !== "SYSTEM_SETTINGS");
}

export async function getAssetById(id) {
  const page = await withRetry(() => notion.pages.retrieve({ page_id: id }));
  return flattenPage(page);
}

export async function createAsset(data) {
  const page = await withRetry(() => notion.pages.create({
    parent: { database_id: DATABASE_ID },
    properties: buildProperties(data),
  }));
  return flattenPage(page);
}

export async function updateAsset(id, data) {
  const page = await withRetry(() => notion.pages.update({
    page_id: id,
    properties: buildProperties(data),
  }));
  return flattenPage(page);
}

export async function deleteAsset(id) {
  await withRetry(() => notion.pages.update({ page_id: id, archived: true }));
  return { success: true, id };
}

function buildProperties(data) {
  const properties = {};
  if (data.assetCode       !== undefined) properties.AssetCode       = { title:     [{ text: { content: data.assetCode } }] };
  if (data.model           !== undefined) properties.Model           = { rich_text: [{ text: { content: data.model } }] };
  if (data.category        !== undefined) properties.Category        = { select: data.category ? { name: data.category } : null };
  if (data.status          !== undefined) properties.Status          = { select: data.status   ? { name: data.status }   : null };
  if (data.borrower        !== undefined) properties.Borrower        = { rich_text: [{ text: { content: data.borrower } }] };
  if (data.returnDate      !== undefined) properties.ReturnDate      = { date: data.returnDate ? { start: data.returnDate } : null };
  if (data.acquisitionDate !== undefined) properties.AcquisitionDate = { date: data.acquisitionDate ? { start: data.acquisitionDate } : null };
  if (data.note            !== undefined) properties.Note            = { rich_text: [{ text: { content: data.note } }] };
  if (data.issueId         !== undefined) properties.IssueID         = { rich_text: [{ text: { content: data.issueId } }] };
  if (data.doe             !== undefined) properties.DOE             = { rich_text: [{ text: { content: data.doe } }] };
  
  // 🌟 核心防呆：只有真的有值時，才寫入 Email
  if (data.owner) properties.owner = { email: data.owner };
  
  // 🌟 新增：將 department 寫入 Notion (對應您截圖中全小寫的 department 屬性)
  if (data.department      !== undefined) properties.department      = { select: data.department ? { name: data.department } : null };
  
  return properties;
}

let cachedSettings = null;
let cacheTime = 0;
const CACHE_TTL = 30000; // 30 秒

export async function getSystemSettings(forceRefresh = false) {
  const now = Date.now();
  if (cachedSettings && !forceRefresh && (now - cacheTime < CACHE_TTL)) {
    return cachedSettings;
  }

  const response = await withRetry(() => notion.databases.query({
    database_id: DATABASE_ID,
    filter: {
      property: "AssetCode",
      title: {
        equals: "SYSTEM_SETTINGS"
      }
    }
  }));

  let parsed = null;
  if (response.results.length > 0) {
    const page = response.results[0];
    const note = prop.richText(page.properties.Note);
    try {
      parsed = JSON.parse(note);
    } catch (e) {}
  }

  const settings = parsed || { userAliases: {}, userEmpIds: {}, userDepartments: {}, deptManagers: {}, categoryManagers: {} };
  if (!settings.userEmpIds) settings.userEmpIds = {};
  if (!settings.deptManagers) {
    settings.deptManagers = {};
  }
  if (!settings.categoryManagers) {
    settings.categoryManagers = {};
  }
  
  cachedSettings = settings;
  cacheTime = now;
  return settings;
}

export async function saveSystemSettings(settings) {
  const response = await withRetry(() => notion.databases.query({
    database_id: DATABASE_ID,
    filter: {
      property: "AssetCode",
      title: {
        equals: "SYSTEM_SETTINGS"
      }
    }
  }));

  const payload = {
    userAliases: settings.userAliases || {},
    userEmpIds: settings.userEmpIds || {},
    userDepartments: settings.userDepartments || {},
    deptManagers: settings.deptManagers || {},
    categoryManagers: settings.categoryManagers || {}
  };

  const properties = {
    AssetCode: { title: [{ text: { content: "SYSTEM_SETTINGS" } }] },
    Note: { rich_text: [{ text: { content: JSON.stringify(payload) } }] }
  };

  if (response.results.length === 0) {
    await withRetry(() => notion.pages.create({
      parent: { database_id: DATABASE_ID },
      properties
    }));
  } else {
    await withRetry(() => notion.pages.update({
      page_id: response.results[0].id,
      properties
    }));
  }

  cachedSettings = payload;
  cacheTime = Date.now();
  return payload;
}