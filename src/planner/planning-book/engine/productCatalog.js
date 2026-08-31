import { PRODUCTS } from "./planningRules.js";

export const PRODUCT_CATALOG_SCHEMA_VERSION = 1;
export const PRODUCT_CATALOG_ALLOWED_CATEGORIES = Object.freeze([
  "Petiscos",
  "Mini lanches",
  "Tortas",
  "Doces",
  "Bolos",
  "Brigadeiro no tacho",
  "Bebidas",
]);
export const PRODUCT_CATALOG_ALLOWED_GROUPS = Object.freeze([
  "fried",
  "hotSandwiches",
  "sweets",
  "cake",
  "tacho",
  "beverages",
]);
export const PRODUCT_CATALOG_ALLOWED_PRICE_UNITS = Object.freeze([
  "unit",
  "portion80g",
  "portion120g",
  "portion150g",
  "kg",
]);

const CATEGORY_SET = new Set(PRODUCT_CATALOG_ALLOWED_CATEGORIES);
const GROUP_SET = new Set(PRODUCT_CATALOG_ALLOWED_GROUPS);
const PRICE_UNIT_SET = new Set(PRODUCT_CATALOG_ALLOWED_PRICE_UNITS);

function finitePositive(value, field, { allowZero = false } = {}) {
  const number = Number(value);
  if (!Number.isFinite(number) || (allowZero ? number < 0 : number <= 0)) {
    throw new Error(`product_catalog_invalid_${field}`);
  }
  return number;
}

function text(value, field, max = 160) {
  const normalized = String(value ?? "").trim();
  if (!normalized || normalized.length > max) {
    throw new Error(`product_catalog_invalid_${field}`);
  }
  return normalized;
}

export function normalizeProductCatalogRecord(input = {}, { existing = null } = {}) {
  const id = text(input.id ?? existing?.id, "id", 120).toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
    throw new Error("product_catalog_invalid_id");
  }

  const name = text(input.name ?? existing?.name, "name", 180);
  const commercialCategory = text(
    input.commercialCategory ?? existing?.commercialCategory,
    "commercial_category",
    80,
  );
  if (!CATEGORY_SET.has(commercialCategory)) {
    throw new Error("product_catalog_invalid_commercial_category");
  }

  const operationalGroup = text(
    input.operationalGroup ?? existing?.operationalGroup,
    "operational_group",
    80,
  );
  if (!GROUP_SET.has(operationalGroup)) {
    throw new Error("product_catalog_invalid_operational_group");
  }

  const priceUnit = String(input.priceUnit ?? existing?.priceUnit ?? "unit").trim();
  if (!PRICE_UNIT_SET.has(priceUnit)) {
    throw new Error("product_catalog_invalid_price_unit");
  }

  const portionGramsRaw = input.portionGrams ?? existing?.portionGrams ?? null;
  const portionGrams = portionGramsRaw == null || portionGramsRaw === ""
    ? null
    : finitePositive(portionGramsRaw, "portion_grams");

  const descriptionValue = input.description ?? existing?.description ?? "";
  const description = String(descriptionValue || "").trim().slice(0, 500);

  return Object.freeze({
    id,
    name,
    description,
    commercialCategory,
    operationalGroup,
    productionPerHour: finitePositive(
      input.productionPerHour ?? existing?.productionPerHour,
      "production_per_hour",
    ),
    suggestedUnitsPerEquivalentGuest: finitePositive(
      input.suggestedUnitsPerEquivalentGuest
        ?? existing?.suggestedUnitsPerEquivalentGuest
        ?? 1,
      "suggested_units_per_equivalent_guest",
      { allowZero: true },
    ),
    lotSize: finitePositive(input.lotSize ?? existing?.lotSize ?? 1, "lot_size"),
    unitPrice: finitePositive(input.unitPrice ?? existing?.unitPrice, "unit_price", { allowZero: true }),
    priceUnit,
    portionGrams,
    active: input.active == null ? Boolean(existing?.active ?? true) : Boolean(input.active),
    consignment: input.consignment == null
      ? Boolean(existing?.consignment)
      : Boolean(input.consignment),
    countsAsMainCart: input.countsAsMainCart == null
      ? Boolean(existing?.countsAsMainCart ?? true)
      : Boolean(input.countsAsMainCart),
    catalogSchemaVersion: PRODUCT_CATALOG_SCHEMA_VERSION,
  });
}

export function baseProductCatalog() {
  return Object.freeze(
    Object.values(PRODUCTS).map((product) => normalizeProductCatalogRecord(product)),
  );
}

export function mergeProductCatalogOverrides(overrides = []) {
  const byId = new Map(baseProductCatalog().map((product) => [product.id, product]));

  for (const override of Array.isArray(overrides) ? overrides : []) {
    const raw = override?.productData ?? override?.product_data ?? override?.product ?? override;
    if (!raw?.id) continue;
    const existing = byId.get(String(raw.id));
    const normalized = normalizeProductCatalogRecord(
      {
        ...raw,
        active: override?.active ?? raw.active,
      },
      { existing },
    );
    byId.set(normalized.id, normalized);
  }

  return Object.freeze([...byId.values()].sort((a, b) => (
    a.commercialCategory.localeCompare(b.commercialCategory, "pt-BR")
    || a.name.localeCompare(b.name, "pt-BR")
  )));
}

export function productCatalogById(catalog = []) {
  return new Map((Array.isArray(catalog) ? catalog : []).map((product) => [product.id, product]));
}
