import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const DATABASE_ID = process.env.NOTION_DATABASE_ID;

const prop = {
  title:    (p) => p?.title?.map((t) => t.plain_text).join("") ?? "",
  richText: (p) => p?.rich_text?.map((t) => t.plain_text).join("") ?? "",
  select:   (p) => p?.select?.name ?? null,
  date:     (p) => p?.date?.start ?? null,
};

function flattenPage(page) {
  const p = page.properties;
  return {
    id:              page.id,
    assetCode:       prop.title(p.AssetCode),
    model:           prop.richText(p.Model),
    category:        prop.select(p.Category)?.toLowerCase() ?? null,
    status:          prop.select(p.Status)?.toLowerCase() ?? null,
    borrower:        prop.richText(p.Borrower),
    returnDate:      prop.date(p.ReturnDate),
    acquisitionDate: prop.date(p.AcquisitionDate),
    note:            prop.richText(p.Note),
    issueId:         prop.richText(p.IssueID),
    doe:             prop.richText(p.DOE),
    owner:           p.owner?.email ?? prop.richText(p.owner) ?? null,
    createdAt:       page.created_time,
    updatedAt:       page.last_edited_time,
  };
}

export async function getAllAssets(filters = {}) {
  const andFilters = [];
  if (filters.category) andFilters.push({ property: "Category", select: { equals: filters.category } });
  if (filters.status)   andFilters.push({ property: "Status",   select: { equals: filters.status } });

  if (filters.owner) {
    andFilters.push({
      property: "owner", 
      email: { equals: filters.owner } 
    });
  }

  const response = await notion.databases.query({
    database_id: DATABASE_ID,
    ...(andFilters.length > 0 && {
      filter: andFilters.length === 1 ? andFilters[0] : { and: andFilters },
    }),
    sorts: [{ property: "AssetCode", direction: "ascending" }],
  });
  return response.results.map(flattenPage);
}

export async function getAssetById(id) {
  const page = await notion.pages.retrieve({ page_id: id });
  return flattenPage(page);
}

export async function createAsset(data) {
  const page = await notion.pages.create({
    parent: { database_id: DATABASE_ID },
    properties: buildProperties(data),
  });
  return flattenPage(page);
}

export async function updateAsset(id, data) {
  const page = await notion.pages.update({
    page_id: id,
    properties: buildProperties(data),
  });
  return flattenPage(page);
}

export async function deleteAsset(id) {
  await notion.pages.update({ page_id: id, archived: true });
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
  
  return properties;
}