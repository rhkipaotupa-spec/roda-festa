const NATURAL_PUBLIC_SCOPE_PATTERNS = Object.freeze([
  /\b(cat[aá]logo|produtos?|card[aá]pio|salgad\w*|coxinh\w*|kib\w*|past[eé]is?|lanch\w*|tort\w*|bol\w*|brigadeir\w*|doces?|bebidas?|refrigerantes?|sucos?|[aá]guas?)\b/i,
  /\b(festa|evento|anivers[aá]rio|casamento|batizado|ch[aá]\s+de\s+beb[eê]|confraterniza[cç][aã]o|coffee\s*break|recep[cç][aã]o)\b/i,
  /\b(planning\s*book|planejamento|or[cç]amento|proposta|consigna[cç][aã]o)\b/i,
]);

const CATALOG_NAVIGATION_PATTERNS = Object.freeze([
  /\b(cat[aá]logo)\b/i,
  /\bonde\b.{0,35}\b(ver|vejo|achar|encontrar)\b.{0,35}\b(produtos?|card[aá]pio|op[cç][oõ]es)\b/i,
  /\b(produtos?|card[aá]pio|op[cç][oõ]es)\b.{0,35}\b(dispon[ií]veis?|ver|vejo|achar|encontrar)\b/i,
  /\b(envie|enviar|manda|mandar|mostra|mostrar)\b.{0,35}\b(cat[aá]logo|produtos?|card[aá]pio)\b/i,
]);

const DATE_HANDOFF_PATTERNS = Object.freeze([
  /\bdisponibilidade\b/i,
  /\b(data|dia|agenda)\b.{0,35}\b(livre|dispon[ií]vel|vaga|tem|ter|reservar|reserva)\b/i,
  /\b(tem|t[eê]m|teria|voc[eê]s\s+t[eê]m)\b.{0,20}\b(data|dia|vaga)\b/i,
  /\b\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b/,
  /\b(janeiro|fevereiro|mar[cç]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\b/i,
]);

const HUMAN_ACTIONS = Object.freeze([
  Object.freeze({ type: "planning-book", label: "Abrir Planning Book" }),
  Object.freeze({ type: "whatsapp", label: "Falar com a equipe" }),
]);

const PLANNING_ACTION = Object.freeze([
  Object.freeze({ type: "planning-book", label: "Ver no Planning Book" }),
]);

function text(value) {
  return String(value || "").trim();
}

export function isNaturalPublicConciergeTopic(message) {
  const value = text(message);
  return Boolean(value && NATURAL_PUBLIC_SCOPE_PATTERNS.some((pattern) => pattern.test(value)));
}

export function getConciergeCalibration(message) {
  const value = text(message);
  if (!value) return null;

  if (CATALOG_NAVIGATION_PATTERNS.some((pattern) => pattern.test(value))) {
    return {
      mode: "guided-navigation",
      needsHuman: false,
      reply: "Você pode ver o catálogo atual e montar seu evento pelo Planning Book. Ele mostra as opções disponíveis para o planejamento e permite começar a composição antes de falar com a equipe.",
      actions: PLANNING_ACTION,
    };
  }

  return null;
}

export function getConciergeHandoff(message) {
  const value = text(message);
  if (!value) return null;

  if (DATE_HANDOFF_PATTERNS.some((pattern) => pattern.test(value))) {
    return {
      reason: "date_availability",
      reply: "A disponibilidade da data precisa ser confirmada pela nossa equipe. Você pode adiantar o perfil do evento no Planning Book e, para confirmar a data, seguir para o atendimento humano.",
      actions: HUMAN_ACTIONS,
    };
  }

  return null;
}
