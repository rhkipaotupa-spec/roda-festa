const BLOCKED_FALLBACK_PATTERNS = Object.freeze([
  /```/,
  /\b(python|javascript|typescript|node(?:\.js)?|java|c\+\+|c#|php|ruby|bash|shell|powershell|sql)\b/i,
  /\b(github|vercel|supabase|postgres|backend|frontend|reposit[oó]rio|branch|commit|deploy|deployment)\b/i,
  /\b(prompt|system prompt|instru[cç][oõ]es internas|mensagem de sistema|regra interna)\b/i,
  /\b(api key|token|senha|secret|segredo|credencial|cookie|connection string|\.env)\b/i,
  /\b(c[oó]digo|script|comando|terminal|endpoint|\/api\/|admin)\b/i,
  /\b(receita|ficha\s+t[eé]cnica|fornecedor|custo\s+interno|margem|markup|estoque\s+interno)\b/i,
]);

function normalized(message) {
  return String(message || "").trim().toLowerCase();
}

function isBlocked(message) {
  const text = normalized(message);
  return !text || BLOCKED_FALLBACK_PATTERNS.some((pattern) => pattern.test(text));
}

export function findPublicConciergeFallback(message) {
  if (isBlocked(message)) return null;
  const text = normalized(message);

  if (/^(oi|ol[aá]|opa|bom dia|boa tarde|boa noite)[!.? ]*$/.test(text)) {
    return "Olá! Sou o Concierge Roda Festa. Posso te ajudar com dúvidas sobre seu evento, cardápio, quantidades, consignação, duração e como funciona o nosso planejamento.";
  }

  if (/\bcrian[cç]a|\bcrian[cç]as/.test(text)) {
    return "No planejamento atual, adultos e crianças de 7 anos ou mais contam com fator 1,0. Crianças de 0 a 6 anos usam fator 0,35 para o cálculo de convidados equivalentes. A quantidade real de pessoas continua registrada separadamente.";
  }

  if (/consigna[cç][aã]o|consignado|consignada/.test(text)) {
    return "A consignação é uma estimativa variável conforme o consumo. Por isso, o planejamento separa o valor contratado da estimativa de consignação, em vez de tratar tudo como um único valor fixo.";
  }

  if (/\btacho\b|brigadeiro\s+no\s+tacho/.test(text)) {
    return "O Brigadeiro no Tacho considera 80 g por pessoa real e custa R$ 12,00 por porção de 80 g. Há Chocolate, Leite Ninho e Meio a Meio. Com bebidas, ele compartilha o carrinho de bebidas; sem bebidas, precisa de carrinho próprio.";
  }

  if (/\b(quantas|qto|quanto).*hora|\bdura[cç][aã]o\b|\b4\s*horas\b/.test(text)) {
    return "O planejamento-base da Roda Festa contempla 4 horas de evento. Se você quiser uma duração maior, a hora adicional é calculada conforme a estrutura e os carrinhos do seu evento.";
  }

  if (/como\s+funciona\s+(a\s+)?roda\s*festa|como\s+voc[eê]s\s+funcionam|o\s+que\s+[eé]\s+a\s+roda\s*festa/.test(text)) {
    return "A Roda Festa funciona como uma experiência guiada de planejamento: você informa o perfil do evento, escolhe o cardápio e recebe uma recomendação inicial que pode ajustar. O sistema organiza produtos, estrutura e investimento para facilitar a decisão antes de falar com a equipe.";
  }

  return null;
}

export function isPublicCatalogListQuestion(message) {
  if (isBlocked(message)) return false;
  const text = normalized(message);
  const asksForList = /\b(quais|que|lista|listar|mostra|mostrar|tem|t[eê]m|oferece|oferecem|op[cç][oõ]es)\b/.test(text);
  const catalogSubject = /\b(produto|produtos|card[aá]pio|op[cç][aã]o|op[cç][oõ]es)\b/.test(text);
  return asksForList && catalogSubject;
}

export function formatPublicCatalogReply(products = []) {
  const active = (Array.isArray(products) ? products : [])
    .filter((product) => product && product.active !== false)
    .map((product) => ({
      name: String(product.name || "").trim(),
      category: String(product.commercialCategory || "Outros").trim() || "Outros",
    }))
    .filter((product) => product.name);

  if (active.length === 0) return null;

  const groups = new Map();
  for (const product of active) {
    if (!groups.has(product.category)) groups.set(product.category, []);
    groups.get(product.category).push(product.name);
  }

  const parts = [];
  for (const [category, names] of groups.entries()) {
    parts.push(`${category}: ${names.slice(0, 6).join(", ")}`);
    if (parts.length >= 7) break;
  }

  return `Hoje o nosso catálogo inclui ${parts.join("; ")}. O Planning Book usa o catálogo atual para montar a composição do seu evento.`;
}
