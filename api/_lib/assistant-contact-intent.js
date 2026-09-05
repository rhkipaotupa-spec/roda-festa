const OFFICIAL_CONTACT_PATTERNS = Object.freeze([
  /\b(com|pra|para)\s+quem\s+(eu\s+)?falo\b/i,
  /\bcom\s+quem\s+(eu\s+)?(falo|converso)\b/i,
  /\bcomo\s+(eu\s+)?(falo|converso|entro\s+em\s+contato)\b.{0,35}\b(respons[aá]vel|equipe|atendente|voc[eê]s|algu[eé]m|humano|pessoa)\b/i,
  /\bcomo\s+(eu\s+)?falo\s+com\s+(o\s+|a\s+)?respons[aá]vel\b/i,
  /\b(quero|queria|gostaria|preciso)\b.{0,24}\bfalar\s+com\s+(o\s+|a\s+)?(respons[aá]vel|equipe|atendente|algu[eé]m|humano|pessoa)\b/i,
  /\b(quero|queria|gostaria|preciso)\b.{0,24}\b(um\s+)?(humano|atendente|respons[aá]vel|pessoa)\b/i,
  /\b(algu[eé]m|uma\s+pessoa|um\s+atendente|um\s+humano)\b.{0,24}\b(pode|consegue)\b.{0,18}\b(me\s+)?ajudar\b/i,
  /\b(pode|consegue)\b.{0,18}\b(algu[eé]m|uma\s+pessoa|um\s+atendente|um\s+humano)\b.{0,18}\b(me\s+)?ajudar\b/i,
  /\btem\s+(algu[eé]m|atendente|respons[aá]vel|uma\s+pessoa|um\s+humano)\b.{0,28}\b(ajudar|atender|falar|conversar)\b/i,
  /\bquem\s+procuro\b.{0,35}\b(equipe|atendimento|respons[aá]vel|evento)\b/i,
  /\b(qual|me\s+passa|me\s+manda|informa|informar)\b.{0,25}\b(contato|telefone|n[uú]mero|whats(?:app)?)\b/i,
  /\b(contato|telefone|n[uú]mero|whats(?:app)?)\b.{0,30}\b(respons[aá]vel|equipe|atendimento|voc[eê]s)?\b/i,
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
