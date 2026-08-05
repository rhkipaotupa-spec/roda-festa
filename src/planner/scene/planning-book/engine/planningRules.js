/* =========================================================
   RODA FESTA — MOTOR DE RECOMENDAÇÕES

   Este arquivo concentra:
   - parâmetros operacionais;
   - preços;
   - produtos;
   - cálculo de convidados equivalentes;
   - carrinhos;
   - profissionais;
   - garçons;
   - descartáveis;
   - horas adicionais;
   - investimento estimado.

   Para atualizar preços ou capacidades, altere somente
   os objetos PLANNING_PARAMETERS e PRODUCTS.
   ========================================================= */

/* =========================================================
   PARÂMETROS GERAIS
   ========================================================= */

export const PLANNING_PARAMETERS = {
  attendedCity: "Tupã/SP",

  guestWeights: {
    adult: 1,
    child: 0.5,
  },

  service: {
    includedHours: 4,
    cartBasePrice: 300,
    additionalHourPerCart: 150,
    preparersPerCart: 1,
  },

  disposables: {
    baseEquivalentGuests: 13.5,
    basePrice: 120,
    pricePerEquivalentGuest: 8.89,
    roundingMultiple: 10,
  },

  waiters: {
    realGuestsPerWaiter: 20,
    pricePerWaiter: 200,
  },

  cake: {
    baseEquivalentGuests: 13.5,
    kilogramsWithBrigadeiros: 2,
    kilogramsWithoutBrigadeiros: 3,
    roundingKilograms: 0.5,
  },

  beverages: {
    consignmentOnly: true,
    includedByDefault: false,
  },
};

/* =========================================================
   CADASTRO DE PRODUTOS

   productionPerHour:
   capacidade operacional por carrinho em uma hora.

   suggestedUnitsPerEquivalentGuest:
   quantidade inicial usada na recomendação.

   lotSize:
   arredondamento mínimo para produção/orçamento.

   operationalGroup:
   produtos do mesmo grupo compartilham carrinho.
   ========================================================= */

export const PRODUCTS = {
  pastelCarne: {
    id: "pastel-carne",
    name: "Pastel de carne",
    commercialCategory: "Frituras",
    operationalGroup: "fried",
    productionPerHour: 100,
    suggestedUnitsPerEquivalentGuest: 3,
    lotSize: 10,
    unitPrice: 1.5,
    active: true,
  },

  pastelQueijo: {
    id: "pastel-queijo",
    name: "Pastel de queijo",
    commercialCategory: "Frituras",
    operationalGroup: "fried",
    productionPerHour: 100,
    suggestedUnitsPerEquivalentGuest: 3,
    lotSize: 10,
    unitPrice: 1.5,
    active: true,
  },

  coxinhaFrangoCatupiry: {
    id: "coxinha-frango-catupiry",
    name: "Coxinha de frango com catupiry",
    commercialCategory: "Frituras",
    operationalGroup: "fried",
    productionPerHour: 120,
    suggestedUnitsPerEquivalentGuest: 1,
    lotSize: 25,
    unitPrice: 1.5,
    active: true,
  },

  risolesPresuntoQueijo: {
    id: "risoles-presunto-queijo",
    name: "Risoles de presunto e queijo",
    commercialCategory: "Frituras",
    operationalGroup: "fried",
    productionPerHour: 120,
    suggestedUnitsPerEquivalentGuest: 1,
    lotSize: 25,
    unitPrice: 1.5,
    active: true,
  },

  miniXBurguer: {
    id: "mini-x-burguer",
    name: "Mini X-Burguer",
    commercialCategory: "Mini lanches",
    operationalGroup: "hotSandwiches",
    productionPerHour: 80,
    suggestedUnitsPerEquivalentGuest: 2,
    lotSize: 5,
    unitPrice: 6,
    active: true,
  },

  miniHotDog: {
    id: "mini-hot-dog",
    name: "Mini Hot Dog",
    commercialCategory: "Mini lanches",
    operationalGroup: "hotSandwiches",
    productionPerHour: 100,
    suggestedUnitsPerEquivalentGuest: 2,
    lotSize: 5,
    unitPrice: 6,
    active: true,
  },

  brigadeiroChocolate: {
    id: "brigadeiro-chocolate",
    name: "Brigadeiro de chocolate",
    commercialCategory: "Doces",
    operationalGroup: "sweets",
    productionPerHour: 200,
    suggestedUnitsPerEquivalentGuest: 3,
    lotSize: 10,
    unitPrice: 3,
    active: true,
    countsAsMainCart: false,
  },

  brigadeiroLeiteNinho: {
    id: "brigadeiro-leite-ninho",
    name: "Brigadeiro de leite ninho",
    commercialCategory: "Doces",
    operationalGroup: "sweets",
    productionPerHour: 200,
    suggestedUnitsPerEquivalentGuest: 3,
    lotSize: 10,
    unitPrice: 3,
    active: true,
    countsAsMainCart: false,
  },

  bolo: {
    id: "bolo",
    name: "Bolo",
    commercialCategory: "Bolos",
    operationalGroup: "cake",
    productionPerHour: 100,
    suggestedUnitsPerEquivalentGuest: 0.1481,
    lotSize: 0.5,
    unitPrice: 90,
    priceUnit: "kg",
    active: true,
    countsAsMainCart: false,
  },

  refrigerante200ml: {
    id: "refrigerante-200ml",
    name: "Refrigerante 200 ml",
    commercialCategory: "Bebidas",
    operationalGroup: "beverages",
    productionPerHour: 150,
    suggestedUnitsPerEquivalentGuest: 1,
    lotSize: 10,
    unitPrice: 2.5,
    active: true,
    consignment: true,
    countsAsMainCart: false,
  },

  sucoLaranja200ml: {
    id: "suco-laranja-200ml",
    name: "Suco de laranja natural 200 ml",
    commercialCategory: "Bebidas",
    operationalGroup: "beverages",
    productionPerHour: 150,
    suggestedUnitsPerEquivalentGuest: 1,
    lotSize: 10,
    unitPrice: 6,
    active: true,
    consignment: true,
    countsAsMainCart: false,
  },

  aguaMineral: {
    id: "agua-mineral",
    name: "Água mineral sem gás",
    commercialCategory: "Bebidas",
    operationalGroup: "beverages",
    productionPerHour: 150,
    suggestedUnitsPerEquivalentGuest: 1,
    lotSize: 10,
    unitPrice: 2.5,
    active: true,
    consignment: true,
    countsAsMainCart: false,
  },
};

/* =========================================================
   FUNÇÕES AUXILIARES
   ========================================================= */

export function roundUpToMultiple(value, multiple) {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  if (!Number.isFinite(multiple) || multiple <= 0) {
    return value;
  }

  return Math.ceil(value / multiple) * multiple;
}

export function roundUpToDecimalMultiple(value, multiple) {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  const precision = 1000;

  return (
    Math.ceil(
      (value * precision) /
        (multiple * precision)
    ) * multiple
  );
}

export function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value) || 0);
}

/* =========================================================
   CONVIDADOS
   ========================================================= */

export function calculateEquivalentGuests({
  adults = 0,
  children = 0,
}) {
  const safeAdults = Math.max(
    0,
    Number(adults) || 0
  );

  const safeChildren = Math.max(
    0,
    Number(children) || 0
  );

  return (
    safeAdults *
      PLANNING_PARAMETERS.guestWeights.adult +
    safeChildren *
      PLANNING_PARAMETERS.guestWeights.child
  );
}

export function calculateRealGuests({
  adults = 0,
  children = 0,
}) {
  return (
    Math.max(0, Number(adults) || 0) +
    Math.max(0, Number(children) || 0)
  );
}

/* =========================================================
   QUANTIDADES DE PRODUTOS
   ========================================================= */

export function calculateSuggestedProductQuantity({
  product,
  equivalentGuests,
}) {
  if (!product?.active) {
    return 0;
  }

  const rawQuantity =
    equivalentGuests *
    product.suggestedUnitsPerEquivalentGuest;

  return roundUpToDecimalMultiple(
    rawQuantity,
    product.lotSize
  );
}

export function buildSuggestedItems({
  equivalentGuests,
  selectedProductIds = [],
  includeBeverages = false,
}) {
  const products = Object.values(PRODUCTS);

  return products
    .filter((product) => {
      if (!product.active) {
        return false;
      }

      if (
        product.consignment &&
        !includeBeverages
      ) {
        return false;
      }

      return selectedProductIds.includes(
        product.id
      );
    })
    .map((product) => {
      const quantity =
        calculateSuggestedProductQuantity({
          product,
          equivalentGuests,
        });

      return {
        ...product,
        quantity,
        estimatedValue:
          quantity * product.unitPrice,
      };
    });
}

/* =========================================================
   BOLO
   ========================================================= */

export function calculateCakeQuantity({
  equivalentGuests,
  hasBrigadeiros,
}) {
  if (equivalentGuests <= 0) {
    return 0;
  }

  const baseKilograms = hasBrigadeiros
    ? PLANNING_PARAMETERS.cake
        .kilogramsWithBrigadeiros
    : PLANNING_PARAMETERS.cake
        .kilogramsWithoutBrigadeiros;

  const rawKilograms =
    (equivalentGuests /
      PLANNING_PARAMETERS.cake
        .baseEquivalentGuests) *
    baseKilograms;

  return roundUpToDecimalMultiple(
    rawKilograms,
    PLANNING_PARAMETERS.cake
      .roundingKilograms
  );
}

/* =========================================================
   CARRINHOS

   A carga é calculada por grupo operacional.

   Exemplo:
   - frituras compartilham estrutura;
   - Mini X-Burguer e Mini Hot Dog compartilham estrutura;
   - bebidas compartilham estrutura;
   - doces e bolo não contam automaticamente como carrinho
     principal nesta primeira versão.
   ========================================================= */

export function calculateCarts({
  items = [],
  serviceHours,
}) {
  const includedHours =
    PLANNING_PARAMETERS.service.includedHours;

  const operationalHours = Math.max(
    includedHours,
    Number(serviceHours) || includedHours
  );

  const groups = items.reduce(
    (accumulator, item) => {
      if (
        item.countsAsMainCart === false ||
        !item.operationalGroup ||
        item.quantity <= 0
      ) {
        return accumulator;
      }

      const group =
        accumulator[item.operationalGroup] ?? {
          operationalGroup:
            item.operationalGroup,
          items: [],
          totalLoadInHours: 0,
        };

      const productLoadInHours =
        item.quantity /
        item.productionPerHour;

      group.items.push(item);
      group.totalLoadInHours +=
        productLoadInHours;

      accumulator[item.operationalGroup] =
        group;

      return accumulator;
    },
    {}
  );

  const cartGroups = Object.values(
    groups
  ).map((group) => {
    const cartsRequired = Math.max(
      1,
      Math.ceil(
        group.totalLoadInHours /
          operationalHours
      )
    );

    return {
      ...group,
      cartsRequired,
    };
  });

  const totalCarts = cartGroups.reduce(
    (total, group) =>
      total + group.cartsRequired,
    0
  );

  return {
    totalCarts,
    groups: cartGroups,
  };
}

/* =========================================================
   PROFISSIONAIS
   ========================================================= */

export function calculatePreparers(
  totalCarts
) {
  return (
    Math.max(0, Number(totalCarts) || 0) *
    PLANNING_PARAMETERS.service
      .preparersPerCart
  );
}

export function calculateWaiters({
  realGuests,
  includeWaiters,
}) {
  if (!includeWaiters || realGuests <= 0) {
    return {
      quantity: 0,
      value: 0,
    };
  }

  const quantity = Math.ceil(
    realGuests /
      PLANNING_PARAMETERS.waiters
        .realGuestsPerWaiter
  );

  return {
    quantity,
    value:
      quantity *
      PLANNING_PARAMETERS.waiters
        .pricePerWaiter,
  };
}

/* =========================================================
   DESCARTÁVEIS
   ========================================================= */

export function calculateDisposables({
  equivalentGuests,
  includeDisposables,
}) {
  if (
    !includeDisposables ||
    equivalentGuests <= 0
  ) {
    return {
      included: false,
      value: 0,
    };
  }

  const rawValue =
    equivalentGuests *
    PLANNING_PARAMETERS.disposables
      .pricePerEquivalentGuest;

  const value = roundUpToMultiple(
    rawValue,
    PLANNING_PARAMETERS.disposables
      .roundingMultiple
  );

  return {
    included: true,
    value,
  };
}

/* =========================================================
   DURAÇÃO E HORAS ADICIONAIS
   ========================================================= */

export function calculateAdditionalHours({
  serviceHours,
  totalCarts,
}) {
  const includedHours =
    PLANNING_PARAMETERS.service.includedHours;

  const additionalHours = Math.max(
    0,
    (Number(serviceHours) ||
      includedHours) - includedHours
  );

  const value =
    additionalHours *
    totalCarts *
    PLANNING_PARAMETERS.service
      .additionalHourPerCart;

  return {
    additionalHours,
    value,
  };
}

/* =========================================================
   INVESTIMENTO
   ========================================================= */

export function calculateInvestment({
  items,
  totalCarts,
  serviceHours,
  waiters,
  disposables,
}) {
  const productsValue = items.reduce(
    (total, item) =>
      total +
      (Number(item.estimatedValue) || 0),
    0
  );

  const cartsValue =
    totalCarts *
    PLANNING_PARAMETERS.service
      .cartBasePrice;

  const additionalHours =
    calculateAdditionalHours({
      serviceHours,
      totalCarts,
    });

  const waitersValue =
    Number(waiters?.value) || 0;

  const disposablesValue =
    Number(disposables?.value) || 0;

  const total =
    productsValue +
    cartsValue +
    additionalHours.value +
    waitersValue +
    disposablesValue;

  return {
    productsValue,
    cartsValue,
    additionalHoursValue:
      additionalHours.value,
    waitersValue,
    disposablesValue,
    total,
  };
}

/* =========================================================
   CLASSIFICAÇÃO DA SUGESTÃO

   Esta classificação é apenas informativa.
   Depois poderemos aprimorá-la com a composição do cardápio.
   ========================================================= */

export function evaluateSuggestion({
  equivalentGuests,
  items,
  totalCarts,
}) {
  if (
    equivalentGuests <= 0 ||
    items.length === 0 ||
    totalCarts <= 0
  ) {
    return {
      status: "incomplete",
      label: "Planejamento incompleto",
      message:
        "Complete as informações para gerarmos uma sugestão.",
    };
  }

  const totalFoodUnits = items
    .filter(
      (item) =>
        !item.consignment &&
        item.id !== "bolo"
    )
    .reduce(
      (total, item) =>
        total + (Number(item.quantity) || 0),
      0
    );

  const unitsPerEquivalentGuest =
    totalFoodUnits / equivalentGuests;

  if (unitsPerEquivalentGuest < 4) {
    return {
      status: "light",
      label: "Sugestão leve",
      message:
        "A quantidade pode ser pequena para o porte do evento.",
    };
  }

  if (unitsPerEquivalentGuest > 10) {
    return {
      status: "generous",
      label: "Sugestão generosa",
      message:
        "O cardápio está acima da média e oferece bastante variedade.",
    };
  }

  return {
    status: "balanced",
    label: "Sugestão equilibrada",
    message:
      "As quantidades estão coerentes com o porte inicial do evento.",
  };
}

/* =========================================================
   MOTOR PRINCIPAL
   ========================================================= */

export function generatePlanningSuggestion({
  adults = 0,
  children = 0,
  serviceHours = 4,
  selectedProductIds = [],
  includeWaiters = false,
  includeDisposables = false,
  includeBeverages = false,
}) {
  const realGuests =
    calculateRealGuests({
      adults,
      children,
    });

  const equivalentGuests =
    calculateEquivalentGuests({
      adults,
      children,
    });

  let items = buildSuggestedItems({
    equivalentGuests,
    selectedProductIds,
    includeBeverages,
  });

  const hasBrigadeiros = items.some(
    (item) =>
      item.id ===
        "brigadeiro-chocolate" ||
      item.id ===
        "brigadeiro-leite-ninho"
  );

  items = items.map((item) => {
    if (item.id !== "bolo") {
      return item;
    }

    const quantity =
      calculateCakeQuantity({
        equivalentGuests,
        hasBrigadeiros,
      });

    return {
      ...item,
      quantity,
      estimatedValue:
        quantity * item.unitPrice,
    };
  });

  const carts = calculateCarts({
    items,
    serviceHours,
  });

  const preparers =
    calculatePreparers(
      carts.totalCarts
    );

  const waiters = calculateWaiters({
    realGuests,
    includeWaiters,
  });

  const disposables =
    calculateDisposables({
      equivalentGuests,
      includeDisposables,
    });

  const investment =
    calculateInvestment({
      items,
      totalCarts: carts.totalCarts,
      serviceHours,
      waiters,
      disposables,
    });

  const evaluation =
    evaluateSuggestion({
      equivalentGuests,
      items,
      totalCarts: carts.totalCarts,
    });

  return {
    guests: {
      adults,
      children,
      realGuests,
      equivalentGuests,
    },

    service: {
      hours: serviceHours,
      includedHours:
        PLANNING_PARAMETERS.service
          .includedHours,
    },

    items,
    carts,
    preparers,
    waiters,
    disposables,
    beverages: {
      requested: includeBeverages,
      consignment: includeBeverages,
    },
    investment,
    evaluation,
  };
}