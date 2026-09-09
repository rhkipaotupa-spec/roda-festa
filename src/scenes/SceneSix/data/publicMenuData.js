const FALLBACK_TEXT = "Consulte o Planning Book para ver o catálogo atualizado.";

function publicItem(product) {
  return {
    title: String(product?.name || "").trim(),
    subtitle: String(product?.description || "").trim(),
  };
}

export function applyPublicCatalogToMenu(menuData = [], products = []) {
  const active = Array.isArray(products) ? products.filter((product) => product?.active !== false) : [];
  const byCategory = new Map();
  for (const product of active) {
    const category = String(product?.commercialCategory || "");
    if (!byCategory.has(category)) byCategory.set(category, []);
    byCategory.get(category).push(product);
  }

  return menuData.map((section) => {
    const productsInCategory = byCategory.get(section.commercialCategory) || [];
    return {
      ...section,
      items: productsInCategory.map(publicItem).filter((item) => item.title),
      extraText: productsInCategory.length > 0
        ? "+ catálogo atualizado conforme as opções ativas"
        : FALLBACK_TEXT,
    };
  });
}

export function markPublicCatalogUnavailable(menuData = []) {
  return menuData.map((section) => ({ ...section, items: [], extraText: FALLBACK_TEXT }));
}
