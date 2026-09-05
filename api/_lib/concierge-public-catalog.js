const BLOCKED_PUBLIC_CATALOG_PATTERNS = Object.freeze([
  /```/,
  /\b(api key|token|senha|secret|segredo|credencial|\.env)\b/i,
  /\b(github|vercel|supabase|postgres|backend|reposit[oó]rio|deploy|prompt)\b/i,
  /\b(c[oó]digo|script|comando|terminal|sql|python|javascript)\b/i,
]);

const PLANNING_ACTION = Object.freeze([
  Object.freeze({ type: "planning-book", label: "Abrir Planning Book" }),
]);

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function safeMessage(message) {
  const value = String(message || "").trim();
  if (!value) return "";
  if (BLOCKED_PUBLIC_CATALOG_PATTERNS.some((pattern) => pattern.test(value))) return "";
  return value;
}

function compactPublicProducts(products = []) {
  return (Array.isArray(products) ? products : [])
    .filter((product) => product && product.active !== false)
    .map((product) => ({
      name: String(product.name || "").trim(),
      category: String(product.commercialCategory || "Outros").trim() || "Outros",
    }))
    .filter((product) => product.name);
}

export function isPublicCatalogQuestion(message) {
  const safe = safeMessage(message);
  if (!safe) return false;
  const text = normalize(safe);

  const explicitCatalog = /\b(catalogo|cardapio|produtos?|itens?|opcoes?)\b/.test(text);
  const sellingIntent = /\b(vende|vendem|vender|oferece|oferecem|tem|têm|possui|possuem)\b/.test(text);
  const listIntent = /\b(quais|qual|que|lista|listar|mostra|mostrar|envia|enviar|manda|mandar|opcoes?|itens?)\b/.test(text);
  const foodSubject = /\b(salgad\w*|doces?|bebidas?|lanches?|bolos?|tortas?|coxinh\w*|kib\w*|pasteis?)\b/.test(text);

  if (explicitCatalog && (listIntent || sellingIntent || /\bonde\b/.test(text))) return true;
  if (foodSubject && listIntent) return true;
  if (/\bo que\b.{0,30}\b(vende|vendem|oferece|oferecem|tem|têm)\b/.test(text)) return true;
  if (/\b(vende|vendem|oferece|oferecem)\b.{0,30}\b(o que|quais|que)\b/.test(text)) return true;
  return false;
}

export function formatPublicCatalogReply(products = []) {
  const active = compactPublicProducts(products);
  if (active.length === 0) return null;

  const groups = new Map();
  for (const product of active) {
    if (!groups.has(product.category)) groups.set(product.category, []);
    const names = groups.get(product.category);
    if (!names.includes(product.name)) names.push(product.name);
  }

  const parts = [];
  for (const [category, names] of groups.entries()) {
    parts.push(`${category}: ${names.slice(0, 6).join(", ")}`);
    if (parts.length >= 6) break;
  }

  return `Claro. Hoje o nosso catálogo inclui ${parts.join("; ")}. Essas são opções do catálogo atual; para ver a composição completa e montar seu evento, você pode abrir o Planning Book.`;
}

function findMentionedProduct(message, products) {
  const text = normalize(message);
  return products.find((product) => {
    const name = normalize(product.name);
    return name.length >= 4 && text.includes(name);
  }) || null;
}

function isPairingQuestion(message) {
  const safe = safeMessage(message);
  if (!safe) return false;
  const text = normalize(safe);
  return /\b(combina|combinar|acompanha|acompanhar|junto|juntos|vai bem|harmoniza|variar|variedade)\b/.test(text)
    && /\b(salgad\w*|coxinh\w*|kib\w*|pasteis?|lanch\w*|tort\w*|bol\w*|brigadeir\w*|doces?|bebidas?)\b/.test(text);
}

export function formatPublicPairingReply(message, products = []) {
  if (!isPairingQuestion(message)) return null;
  const active = compactPublicProducts(products);
  if (active.length < 2) return null;

  const mentioned = findMentionedProduct(message, active);
  if (!mentioned) return null;

  const alternatives = active
    .filter((product) => product.name !== mentioned.name && product.category === mentioned.category)
    .slice(0, 4);
  const fallback = alternatives.length > 0
    ? alternatives
    : active.filter((product) => product.name !== mentioned.name).slice(0, 4);
  if (fallback.length === 0) return null;

  return `Para variar junto com ${mentioned.name}, você pode considerar ${fallback.map((product) => product.name).join(", ")}. É uma sugestão com opções do catálogo atual, não uma composição obrigatória; no Planning Book você pode ajustar a combinação do evento.`;
}

export function getPublicCatalogResponse({ message, products = [] } = {}) {
  const pairingReply = formatPublicPairingReply(message, products);
  if (pairingReply) {
    return {
      mode: "catalog-suggestion",
      needsHuman: false,
      reply: pairingReply,
      actions: PLANNING_ACTION,
    };
  }

  if (!isPublicCatalogQuestion(message)) return null;
  const catalogReply = formatPublicCatalogReply(products);
  if (!catalogReply) return null;
  return {
    mode: "catalog",
    needsHuman: false,
    reply: catalogReply,
    actions: PLANNING_ACTION,
  };
}
