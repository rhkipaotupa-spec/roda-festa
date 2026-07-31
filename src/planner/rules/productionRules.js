export const productionRules = [
  {
    serviceId: "mini-snack-cart",

    production: {
      unit: "unit",
      perHour: 100,
    },

    description:
      "Produção limitada pelo preparo dos mini lanches durante o evento.",

    active: true,
  },

  {
    serviceId: "fried-snack-cart",

    production: {
      unit: "unit",
      perHour: 200,
    },

    description:
      "Produção de petiscos fritos realizada em pequenos lotes durante o evento.",

    active: true,
  },

  {
    serviceId: "drinks-station",

    production: {
      unit: "unit",
      perHour: 300,
    },

    description:
      "Bebidas parcialmente expostas e reabastecidas continuamente.",

    active: true,
  },

  {
    serviceId: "desserts-and-cakes",

    production: null,

    description:
      "Doces e bolos são fornecidos prontos e não possuem limitação de produção durante o evento.",

    active: true,
  },

  {
    serviceId: "pies-service",

    production: null,

    description:
      "Tortas são fornecidas prontas e não possuem limitação de produção durante o evento.",

    active: true,
  },
];

export function findProductionRule(serviceId) {
  return (
    productionRules.find(
      (rule) =>
        rule.active &&
        rule.serviceId === serviceId
    ) ?? null
  );
}

export function calculateRequiredStructures({
  serviceId,
  quantity,
  durationHours,
}) {
  const rule = findProductionRule(serviceId);

  if (!rule) {
    return {
      structures: 1,
      productionPerHour: null,
      capacityPerStructure: null,
      reason: "Nenhuma regra operacional cadastrada.",
    };
  }

  if (!rule.production) {
    return {
      structures: 1,
      productionPerHour: null,
      capacityPerStructure: null,
      reason: rule.description,
    };
  }

  const capacityPerStructure =
    rule.production.perHour * durationHours;

  return {
    structures: Math.max(
      1,
      Math.ceil(quantity / capacityPerStructure)
    ),

    productionPerHour: rule.production.perHour,

    capacityPerStructure,

    reason: rule.description,
  };
}