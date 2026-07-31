export const recommendationRules = [
  {
    id: "childrens-birthday-balanced",

    eventTypes: ["childrens-birthday"],
    profileIds: ["balanced"],

    recommendedCategoryIds: [
      "mini-snacks",
      "fried-snacks",
      "drinks",
      "desserts",
      "cakes",
    ],

    optionalCategoryIds: [
      "pies",
    ],

    messages: [
      "Para aniversários infantis, recomendamos uma combinação equilibrada de mini lanches, petiscos, bebidas, doces e bolo.",
    ],

    warnings: [],

    active: true,
  },

  {
    id: "childrens-birthday-snacks",

    eventTypes: ["childrens-birthday"],
    profileIds: ["snacks"],

    recommendedCategoryIds: [
      "mini-snacks",
      "fried-snacks",
      "drinks",
    ],

    optionalCategoryIds: [
      "desserts",
      "cakes",
      "pies",
    ],

    messages: [
      "Este perfil prioriza mini lanches, petiscos e bebidas.",
    ],

    warnings: [],

    active: true,
  },

  {
    id: "childrens-birthday-complete",

    eventTypes: ["childrens-birthday"],
    profileIds: ["complete"],

    recommendedCategoryIds: [
      "mini-snacks",
      "fried-snacks",
      "drinks",
      "desserts",
      "cakes",
      "pies",
    ],

    optionalCategoryIds: [],

    messages: [
      "Este perfil oferece uma composição mais completa para o evento.",
    ],

    warnings: [],

    active: true,
  },
];

function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

export function findRecommendationRule({
  eventType,
  profileId,
}) {
  const normalizedEventType =
    normalizeText(eventType);

  const normalizedProfileId =
    normalizeText(profileId);

  return (
    recommendationRules.find((rule) => {
      if (rule.active === false) {
        return false;
      }

      const matchesEventType =
        rule.eventTypes
          .map(normalizeText)
          .includes(normalizedEventType);

      const matchesProfile =
        rule.profileIds
          .map(normalizeText)
          .includes(normalizedProfileId);

      return (
        matchesEventType &&
        matchesProfile
      );
    }) ?? null
  );
}

export function buildRecommendation({
  eventType,
  profileId,
}) {
  const rule = findRecommendationRule({
    eventType,
    profileId,
  });

  if (!eventType) {
    return {
      ruleId: null,
      recommendedCategoryIds: [],
      optionalCategoryIds: [],
      messages: [],
      warnings: [
        "Selecione o tipo de evento para receber uma recomendação.",
      ],
    };
  }

  if (!profileId) {
    return {
      ruleId: null,
      recommendedCategoryIds: [],
      optionalCategoryIds: [],
      messages: [],
      warnings: [
        "Selecione o perfil desejado para receber uma recomendação.",
      ],
    };
  }

  if (!rule) {
    return {
      ruleId: null,
      recommendedCategoryIds: [],
      optionalCategoryIds: [],
      messages: [],
      warnings: [
        "Ainda não existe uma recomendação cadastrada para esta combinação de evento e perfil.",
      ],
    };
  }

  return {
    ruleId: rule.id,

    recommendedCategoryIds: [
      ...rule.recommendedCategoryIds,
    ],

    optionalCategoryIds: [
      ...rule.optionalCategoryIds,
    ],

    messages: [
      ...rule.messages,
    ],

    warnings: [
      ...rule.warnings,
    ],
  };
}