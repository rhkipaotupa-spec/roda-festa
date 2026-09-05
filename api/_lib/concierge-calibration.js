const CLEARLY_OUT_OF_SCOPE_PATTERNS = Object.freeze([
  /\b(piada|poema|charada|reda[cç][aã]o|traduza|traduzir|jogo|quiz)\b/i,
  /\b(f[ií]sica|qu[ií]mica|pol[ií]tica|elei[cç][aã]o|not[ií]cia|previs[aã]o\s+do\s+tempo|bitcoin|criptomoeda)\b/i,
]);

const NATURAL_PUBLIC_SCOPE_PATTERNS = Object.freeze([
  /\broda\s*festa\b/i,
  /\b(cat[aá]logo|produt\w*|card[aá]pio|itens?|op[cç][oõ]es|salgad\w*|coxinh\w*|kib\w*|past[eé]is?|lanch\w*|mini\s*lanch\w*|tort\w*|bol\w*|brigadeir\w*|doces?|petiscos?|finger\s*food|bebidas?|refrigerantes?|sucos?|[aá]guas?)\b/i,
  /\b(vende|vendem|vender|oferece|oferecem)\b.{0,40}\b(itens?|op[cç][oõ]es|produt\w*|comidas?|salgad\w*|doces?|bebidas?)\b/i,
  /\b(festa|evento|anivers[aá]rio|casamento|batizado|noivado|bodas|formatura|corporativo|confraterniza[cç][aã]o|coffee\s*break|coquetel|recep[cç][aã]o|ch[aá]\s+(?:de\s+)?(?:beb[eê]|revela[cç][aã]o|bar))\b/i,
  /\b(planning\s*book|planejamento|or[cç]amento|proposta|consigna[cç][aã]o)\b/i,
  /\b(convidad\w*|adult\w*|crian[cç]\w*|pessoas?|quantidad\w*|por\s+pessoa)\b/i,
  /\b(carrinh\w*|gar[cç]o(?:m|ns)|estrutura|montagem|servi[cç]\w*|dura[cç][aã]o|horas?\s+de\s+evento)\b/i,
  /\b(pre[cç]os?|valores?|investimento|quanto\s+custa)\b/i,
  /\b(datas?|dias?|agenda|disponibilidade|reserv\w*|contratar|fechar|atendimento|whats(?:app)?)\b/i,
  /\b(no que|em que|como)\b.{0,25}\b(ajuda|ajudar|pode ajudar|consegue ajudar)\b/i,
]);

const HELP_PATTERNS = Object.freeze([
  /^\s*(no que|em que)\s+(voc[eê]\s+)?(pode|consegue)\s+me\s+ajudar\s*[?!. ]*$/i,
  /^\s*(o que|como)\s+voc[eê]\s+(pode|consegue)\s+me\s+ajudar\s*[?!. ]*$/i,
  /^\s*no que\s+pode\s+me\s+ajudar\s*[?!. ]*$/i,
]);

const CATALOG_NAVIGATION_PATTERNS = Object.freeze([
  /\bonde\b.{0,35}\b(ver|vejo|achar|encontrar|acessar)\b.{0,35}\b(cat[aá]logo|produt\w*|card[aá]pio|op[cç][oõ]es|planning\s*book)\b/i,
  /\b(ver|abrir|acessar|envie|enviar|manda|mandar|mostra|mostrar)\b.{0,35}\b(cat[aá]logo|card[aá]pio|produt\w*|planning\s*book)\b/i,
  /\blink\b.{0,35}\b(cat[aá]logo|card[aá]pio|produt\w*|planning\s*book)\b/i,
  /\b(cat[aá]logo|card[aá]pio|produt\w*|planning\s*book)\b.{0,35}\blink\b/i,
]);

const QUOTE_NAVIGATION_PATTERNS = Object.freeze([
  /\b(quero|gostaria\s+de|preciso\s+de)\b.{0,30}\b(or[cç]amento|proposta)\b/i,
  /\b(montar|fazer|come[cç]ar|simular)\b.{0,30}\b(or[cç]amento|planejamento|proposta)\b/i,
]);

const DATE_HANDOFF_PATTERNS = Object.freeze([
  /\bdisponibilidade\b/i,
  /\b(data|dia|agenda)\b.{0,45}\b(livre|dispon[ií]vel|vaga|reservar|reserva|confirmar)\b/i,
  /\b(livre|dispon[ií]vel|vaga)\b.{0,45}\b(data|dia|agenda|\d{1,2}[/-]\d{1,2})\b/i,
  /\b(tem|t[eê]m|teria|voc[eê]s\s+t[eê]m)\b.{0,25}\b(vaga|disponibilidade)\b/i,
  /\b(tem|t[eê]m|teria)\b.{0,20}\b\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b/i,
  /\b(tem|t[eê]m|teria)\b.{0,20}\bdia\s+\d{1,2}(?:[/-]\d{1,2}(?:[/-]\d{2,4})?)?\b/i,
  /\bdia\s+\d{1,2}(?:[/-]\d{1,2}(?:[/-]\d{2,4})?)?\b.{0,25}\b(tem|t[eê]m|livre|dispon[ií]vel|vaga)\b/i,
  /\b(tem|t[eê]m|teria)\b.{0,20}\b\d{1,2}\s+de\s+(janeiro|fevereiro|mar[cç]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\b/i,
  /\b\d{1,2}\s+de\s+(janeiro|fevereiro|mar[cç]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\b.{0,25}\b(tem|t[eê]m|livre|dispon[ií]vel|vaga)\b/i,
  /\b(atende|atendem|fazem|realizam)\w*\b.{0,25}\b(?:no\s+)?dia\s+\d{1,2}(?:[/-]\d{1,2}(?:[/-]\d{2,4})?)?\b/i,
  /\btem\s+como\s+(fazer|realizar|montar|ter)\b.{0,35}\b(evento|festa|anivers[aá]rio|casamento|batizado|confraterniza[cç][aã]o)?\b.{0,20}\b(?:no\s+)?dia\s+\d{1,2}(?:[/-]\d{1,2}(?:[/-]\d{2,4})?)?\b/i,
  /\b(posso|consigo|quero|gostaria\s+de)\b.{0,25}\b(reservar|fechar|confirmar)\b.{0,45}\b(data|dia|\d{1,2}[/-]\d{1,2}|janeiro|fevereiro|mar[cç]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\b/i,
  /\b(reservar|reserva)\b.{0,45}\b(data|dia|\d{1,2}[/-]\d{1,2}|janeiro|fevereiro|mar[cç]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\b/i,
]);

const PLANNING_ESTIMATE_PATTERNS = Object.freeze([
  /\b(quantos?|quantas?|quanto)\b.{0,90}\b(salgad\w*|coxinh\w*|kib\w*|past[eé]is?|lanch\w*|tort\w*|bol\w*|brigadeir\w*|doces?|bebidas?|carrinh\w*|gar[cç]o(?:m|ns))\b.{0,70}\b(pessoas?|convidad\w*)\b/i,
  /\b(quantos?|quantas?|quanto)\b.{0,50}\b(preciso|devo|recomenda|pedir|comprar)\b.{0,80}\b(pessoas?|convidad\w*|evento|festa)\b/i,
  /\b(quanto|quantos?|quantas?)\b.{0,80}\b(para|pra)\b\s*\d{1,4}\b.{0,25}\b(pessoas?|convidad\w*)\b/i,
]);

const CONTEXTUAL_QUANTITY_PATTERNS = Object.freeze([
  /^(e\s+)?(para|pra)\s+\d{1,4}\s*(pessoas?|convidad\w*|adult\w*|crian[cç]\w*)?[?!. ]*$/i,
  /^(e\s+)?\d{1,4}\s*(pessoas?|convidad\w*)[?!. ]*$/i,
]);

const CONTEXTUAL_FOLLOW_UP_PATTERNS = Object.freeze([
  /^(e\s+)?(para|pra)\s+\d{1,4}\s*(pessoas?|convidad\w*|adult\w*|crian[cç]\w*)?[?!. ]*$/i,
  /^(e\s+)?(com|sem|para|pra)\s+(bebidas?|crian[cç]\w*|adult\w*|doces?|salgad\w*|carrinh\w*)[?!. ]*$/i,
  /^e\s+(bebidas?|crian[cç]\w*|adult\w*|doces?|salgad\w*|carrinh\w*|consigna[cç][aã]o)[?!. ]*$/i,
  /^(e\s+)?(isso|esse|essa|esses|essas|tamb[eé]m)[?!. ]*$/i,
  /^(e\s+)?(o\s+)?valor[?!. ]*$/i,
  /^(e\s+)?quanto\s+custa[?!. ]*$/i,
  /^(e\s+)?voc[eê]s\s+(fazem|t[eê]m|atendem|levam|montam)\s+(isso|esse|essa)?[?!. ]*$/i,
]);

const HUMAN_ACTIONS = Object.freeze([
  Object.freeze({ type: "planning-book", label: "Abrir Planning Book" }),
  Object.freeze({ type: "whatsapp", label: "Falar com a equipe" }),
]);

const PLANNING_ACTION = Object.freeze([
  Object.freeze({ type: "planning-book", label: "Abrir Planning Book" }),
]);

function text(value) {
  return String(value || "").trim();
}

function hasPublicHistory(history) {
  if (!Array.isArray(history)) return false;
  return history.some((item) => {
    if (!item || item.role !== "user") return false;
    const content = text(item.content);
    return Boolean(content && isNaturalPublicConciergeTopic(content));
  });
}

export function isClearlyOutOfScope(message) {
  const value = text(message);
  return Boolean(value && CLEARLY_OUT_OF_SCOPE_PATTERNS.some((pattern) => pattern.test(value)));
}

export function isNaturalPublicConciergeTopic(message) {
  const value = text(message);
  if (!value || isClearlyOutOfScope(value)) return false;
  return NATURAL_PUBLIC_SCOPE_PATTERNS.some((pattern) => pattern.test(value));
}

export function isContextualPublicFollowUp(message, history = []) {
  const value = text(message);
  if (!value || !hasPublicHistory(history) || isClearlyOutOfScope(value)) return false;
  return CONTEXTUAL_FOLLOW_UP_PATTERNS.some((pattern) => pattern.test(value));
}

export function getConciergeCalibration(message) {
  const value = text(message);
  if (!value || isClearlyOutOfScope(value)) return null;

  if (HELP_PATTERNS.some((pattern) => pattern.test(value))) {
    return {
      mode: "guided-help",
      needsHuman: false,
      reply: "Posso te ajudar com cardápio e produtos, como funciona a Roda Festa, duração e consignação, dúvidas gerais do planejamento e o próximo passo do seu evento. Para quantidade oficial eu te levo ao Planning Book; para data, negociação, pagamento, alergênicos ou alguma exceção, eu encaminho para nossa equipe.",
      actions: PLANNING_ACTION,
    };
  }

  if (CATALOG_NAVIGATION_PATTERNS.some((pattern) => pattern.test(value))) {
    return {
      mode: "guided-navigation",
      needsHuman: false,
      reply: "Você pode abrir o Planning Book para ver as opções atuais e começar a montar seu evento. Se preferir, eu também posso continuar respondendo suas dúvidas por aqui.",
      actions: PLANNING_ACTION,
    };
  }

  if (QUOTE_NAVIGATION_PATTERNS.some((pattern) => pattern.test(value))) {
    return {
      mode: "guided-navigation",
      needsHuman: false,
      reply: "O Planning Book é o melhor caminho para começar seu orçamento: ele organiza o perfil do evento, as escolhas e uma recomendação inicial editável. Depois, a equipe pode confirmar os detalhes finais com você.",
      actions: PLANNING_ACTION,
    };
  }

  return null;
}

export function getConciergeHandoff(message, history = []) {
  const value = text(message);
  if (!value || isClearlyOutOfScope(value)) return null;

  if (DATE_HANDOFF_PATTERNS.some((pattern) => pattern.test(value))) {
    return {
      reason: "date_availability",
      reply: "Posso te ajudar a planejar o evento, mas a disponibilidade dessa data precisa ser confirmada pela nossa equipe. Você pode adiantar o planejamento no Planning Book e falar com a equipe para confirmar a agenda.",
      actions: HUMAN_ACTIONS,
    };
  }

  if (PLANNING_ESTIMATE_PATTERNS.some((pattern) => pattern.test(value))
      || (hasPublicHistory(history) && CONTEXTUAL_QUANTITY_PATTERNS.some((pattern) => pattern.test(value)))) {
    return {
      reason: "authoritative_quantity",
      reply: "Para essa quantidade, o Planning Book calcula uma recomendação inicial usando as regras atuais da Roda Festa. Você pode montar o cenário por lá e, se quiser validar a composição final, continuar com nossa equipe.",
      actions: HUMAN_ACTIONS,
    };
  }

  return null;
}
