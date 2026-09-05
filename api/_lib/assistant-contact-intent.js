const OFFICIAL_CONTACT_PATTERNS = Object.freeze([
  /\b(com|pra|para)\s+quem\s+(eu\s+)?falo\b/i,
  /\bcom\s+quem\s+(eu\s+)?(falo|converso)\b/i,
  /\bcomo\s+(eu\s+)?(falo|converso|entro\s+em\s+contato)\b.{0,35}\b(respons[aá]vel|equipe|atendente|voc[eê]s|algu[eé]m)\b/i,
  /\bcomo\s+(eu\s+)?falo\s+com\s+(o\s+|a\s+)?respons[aá]vel\b/i,
  /\bquero\s+falar\s+com\s+(o\s+|a\s+)?respons[aá]vel\b/i,
  /\bquem\s+procuro\b.{0,35}\b(equipe|atendimento|respons[aá]vel|evento)\b/i,
  /\b(contato|telefone|whats(?:app)?)\b.{0,30}\b(respons[aá]vel|equipe|atendimento|voc[eê]s)?\b/i,
]);

export function isOfficialContactIntent(message) {
  const value = String(message || "").trim();
  if (!value) return false;
  return OFFICIAL_CONTACT_PATTERNS.some((pattern) => pattern.test(value));
}

export function officialContactResponse() {
  return {
    mode: "handoff",
    needsHuman: true,
    reply: "Claro. Você pode falar diretamente com a equipe da Roda Festa pelo WhatsApp oficial (14) 99896-0208. Use o botão abaixo e continue o atendimento com a pessoa responsável.",
    actions: [{ type: "whatsapp", label: "Falar com a equipe" }],
  };
}
