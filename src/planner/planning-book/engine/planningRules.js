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
    maxCarts: 3,
  },

  limits: {
    maxAdults: 100,
    maxChildren: 100,
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
  coxinhaFrangoCatupiry: { id: "coxinha-frango-catupiry", name: "Coxinha de frango com catupiry", commercialCategory: "Petiscos", operationalGroup: "fried", productionPerHour: 120, suggestedUnitsPerEquivalentGuest: 1, lotSize: 25, unitPrice: 1.5, active: true },
  bolinhaQueijo: { id: "bolinha-queijo", name: "Bolinha de queijo", commercialCategory: "Petiscos", operationalGroup: "fried", productionPerHour: 120, suggestedUnitsPerEquivalentGuest: 1, lotSize: 25, unitPrice: 1.5, active: true },
  risolesPresuntoQueijo: { id: "risoles-presunto-queijo", name: "Risoles de presunto e queijo", commercialCategory: "Petiscos", operationalGroup: "fried", productionPerHour: 120, suggestedUnitsPerEquivalentGuest: 1, lotSize: 25, unitPrice: 1.5, active: true },
  kibeCarne: { id: "kibe-carne", name: "Kibe de carne", commercialCategory: "Petiscos", operationalGroup: "fried", productionPerHour: 120, suggestedUnitsPerEquivalentGuest: 1, lotSize: 25, unitPrice: 1.5, active: true },
  luaCalabresa: { id: "lua-calabresa", name: "Lua de Calabresa", commercialCategory: "Petiscos", operationalGroup: "fried", productionPerHour: 120, suggestedUnitsPerEquivalentGuest: 1, lotSize: 25, unitPrice: 1.5, active: true },
  pastelCarne: { id: "pastel-carne", name: "Pastelzinho de carne", commercialCategory: "Petiscos", operationalGroup: "fried", productionPerHour: 100, suggestedUnitsPerEquivalentGuest: 3, lotSize: 10, unitPrice: 1.5, active: true },
  pastelQueijo: { id: "pastel-queijo", name: "Pastelzinho de queijo", commercialCategory: "Petiscos", operationalGroup: "fried", productionPerHour: 100, suggestedUnitsPerEquivalentGuest: 3, lotSize: 10, unitPrice: 1.5, active: true },
  pastelPizza: { id: "pastel-pizza", name: "Pastelzinho de pizza", commercialCategory: "Petiscos", operationalGroup: "fried", productionPerHour: 100, suggestedUnitsPerEquivalentGuest: 1, lotSize: 10, unitPrice: 1.5, active: true },
  enroladinhoSalsicha: { id: "enroladinho-salsicha", name: "Enroladinho de salsicha", commercialCategory: "Petiscos", operationalGroup: "fried", productionPerHour: 120, suggestedUnitsPerEquivalentGuest: 1, lotSize: 25, unitPrice: 1.5, active: true },
  braxolaCarne: { id: "braxola-carne", name: "Braxola de carne", commercialCategory: "Petiscos", operationalGroup: "fried", productionPerHour: 120, suggestedUnitsPerEquivalentGuest: 1, lotSize: 25, unitPrice: 1.5, active: true },
  braxolaQueijo: { id: "braxola-queijo", name: "Braxola de queijo", commercialCategory: "Petiscos", operationalGroup: "fried", productionPerHour: 120, suggestedUnitsPerEquivalentGuest: 1, lotSize: 25, unitPrice: 1.5, active: true },
  bolinhaQueijoBacon: { id: "bolinha-queijo-bacon", name: "Bolinha de queijo com bacon", commercialCategory: "Petiscos", operationalGroup: "fried", productionPerHour: 120, suggestedUnitsPerEquivalentGuest: 1, lotSize: 25, unitPrice: 2, active: true },
  kibeQueijo: { id: "kibe-queijo", name: "Kibe com queijo", commercialCategory: "Petiscos", operationalGroup: "fried", productionPerHour: 120, suggestedUnitsPerEquivalentGuest: 1, lotSize: 25, unitPrice: 2, active: true },

  miniXBurguer: { id: "mini-x-burguer", name: "X-Burguer", description: "Pão, hambúrguer artesanal de contra-filé e queijo", commercialCategory: "Mini lanches", operationalGroup: "hotSandwiches", productionPerHour: 80, suggestedUnitsPerEquivalentGuest: 2, lotSize: 5, unitPrice: 6, active: true },
  miniXSalada: { id: "mini-x-salada", name: "X-Salada", description: "Pão, hambúrguer artesanal de contra-filé, alface, tomate e queijo", commercialCategory: "Mini lanches", operationalGroup: "hotSandwiches", productionPerHour: 80, suggestedUnitsPerEquivalentGuest: 2, lotSize: 5, unitPrice: 6, active: true },
  miniHotDog: { id: "mini-hot-dog", name: "Hot dog", description: "Pão, molho de tomate caseiro e salsichas cortadas", commercialCategory: "Mini lanches", operationalGroup: "hotSandwiches", productionPerHour: 100, suggestedUnitsPerEquivalentGuest: 2, lotSize: 5, unitPrice: 6, active: true },
  carneLouca: { id: "carne-louca", name: "Carne louca", description: "Pão com carne louca, sem pimentão", commercialCategory: "Mini lanches", operationalGroup: "hotSandwiches", productionPerHour: 80, suggestedUnitsPerEquivalentGuest: 2, lotSize: 5, unitPrice: 8, active: true },

  tortaCebolaCaramelizada: { id: "torta-cebola-caramelizada-queijo", name: "Cebola caramelizada com queijo", commercialCategory: "Tortas", operationalGroup: "hotSandwiches", productionPerHour: 40, suggestedUnitsPerEquivalentGuest: 1, lotSize: 1, unitPrice: 5, priceUnit: "portion150g", portionGrams: 150, active: true },
  tortaStrogonoffFrango: { id: "torta-strogonoff-frango", name: "Strogonoff de frango", commercialCategory: "Tortas", operationalGroup: "hotSandwiches", productionPerHour: 40, suggestedUnitsPerEquivalentGuest: 1, lotSize: 1, unitPrice: 5, priceUnit: "portion150g", portionGrams: 150, active: true },
  tortaFrangoCatupiry: { id: "torta-frango-catupiry", name: "Frango com catupiry", commercialCategory: "Tortas", operationalGroup: "hotSandwiches", productionPerHour: 40, suggestedUnitsPerEquivalentGuest: 1, lotSize: 1, unitPrice: 5, priceUnit: "portion150g", portionGrams: 150, active: true },
  tortaFrangoCreamCheese: { id: "torta-frango-cream-cheese-ervas", name: "Frango com cream cheese e ervas", commercialCategory: "Tortas", operationalGroup: "hotSandwiches", productionPerHour: 40, suggestedUnitsPerEquivalentGuest: 1, lotSize: 1, unitPrice: 5, priceUnit: "portion150g", portionGrams: 150, active: true },
  tortaPalmitoCatupiry: { id: "torta-palmito-catupiry", name: "Palmito com catupiry", commercialCategory: "Tortas", operationalGroup: "hotSandwiches", productionPerHour: 40, suggestedUnitsPerEquivalentGuest: 1, lotSize: 1, unitPrice: 5, priceUnit: "portion150g", portionGrams: 150, active: true },
  tortaCamaraoCatupiry: { id: "torta-camarao-catupiry", name: "Camarão com catupiry", commercialCategory: "Tortas", operationalGroup: "hotSandwiches", productionPerHour: 40, suggestedUnitsPerEquivalentGuest: 1, lotSize: 1, unitPrice: 13.5, priceUnit: "portion150g", portionGrams: 150, active: true },
  tortaCarneLoucaCheddar: { id: "torta-carne-louca-cheddar", name: "Carne louca com cheddar", commercialCategory: "Tortas", operationalGroup: "hotSandwiches", productionPerHour: 40, suggestedUnitsPerEquivalentGuest: 1, lotSize: 1, unitPrice: 13.5, priceUnit: "portion150g", portionGrams: 150, active: true },
  tortaBacalhauCatupiry: { id: "torta-bacalhau-catupiry", name: "Bacalhau com catupiry", commercialCategory: "Tortas", operationalGroup: "hotSandwiches", productionPerHour: 40, suggestedUnitsPerEquivalentGuest: 1, lotSize: 1, unitPrice: 13.5, priceUnit: "portion150g", portionGrams: 150, active: true },

  boloBeatriz: { id: "bolo-beatriz", name: '"Beatriz" — Leite condensado com morango', commercialCategory: "Bolos", operationalGroup: "cake", productionPerHour: 100, suggestedUnitsPerEquivalentGuest: 1, lotSize: 1, unitPrice: 10.8, priceUnit: "portion120g", portionGrams: 120, active: true, countsAsMainCart: false },
  boloBrigadeiroNinho: { id: "bolo-brigadeiro-leite-ninho", name: "Bolo de brigadeiro com leite ninho", commercialCategory: "Bolos", operationalGroup: "cake", productionPerHour: 100, suggestedUnitsPerEquivalentGuest: 1, lotSize: 1, unitPrice: 10.8, priceUnit: "portion120g", portionGrams: 120, active: true, countsAsMainCart: false },
  boloMousseNinho: { id: "bolo-mousse-leite-ninho", name: "Bolo mousse de leite ninho", commercialCategory: "Bolos", operationalGroup: "cake", productionPerHour: 100, suggestedUnitsPerEquivalentGuest: 1, lotSize: 1, unitPrice: 10.8, priceUnit: "portion120g", portionGrams: 120, active: true, countsAsMainCart: false },
  boloAbacaxiLeiteMoca: { id: "bolo-abacaxi-leite-moca", name: "Bolo de abacaxi com leite moça", commercialCategory: "Bolos", operationalGroup: "cake", productionPerHour: 100, suggestedUnitsPerEquivalentGuest: 1, lotSize: 1, unitPrice: 10.8, priceUnit: "portion120g", portionGrams: 120, active: true, countsAsMainCart: false },
  boloChocolateBrigadeiro: { id: "bolo-chocolate-brigadeiro", name: "Bolo de chocolate com brigadeiro", commercialCategory: "Bolos", operationalGroup: "cake", productionPerHour: 100, suggestedUnitsPerEquivalentGuest: 1, lotSize: 1, unitPrice: 10.8, priceUnit: "portion120g", portionGrams: 120, active: true, countsAsMainCart: false },

  brigadeiroChocolate: { id: "brigadeiro-chocolate", name: "Brigadeiro de chocolate", commercialCategory: "Doces", operationalGroup: "sweets", productionPerHour: 200, suggestedUnitsPerEquivalentGuest: 3, lotSize: 10, unitPrice: 3, active: true, countsAsMainCart: false },
  brigadeiroLeiteNinho: { id: "brigadeiro-leite-ninho", name: "Brigadeiro de leite ninho", commercialCategory: "Doces", operationalGroup: "sweets", productionPerHour: 200, suggestedUnitsPerEquivalentGuest: 3, lotSize: 10, unitPrice: 3, active: true, countsAsMainCart: false },

  refrigerante200ml: { id: "refrigerante-200ml", name: "Refrigerante 200 ml", commercialCategory: "Bebidas", operationalGroup: "beverages", productionPerHour: 150, suggestedUnitsPerEquivalentGuest: 1, lotSize: 10, unitPrice: 2.5, active: true, consignment: true, countsAsMainCart: true },
  sucoLaranja200ml: { id: "suco-laranja-200ml", name: "Suco de laranja natural 200 ml", commercialCategory: "Bebidas", operationalGroup: "beverages", productionPerHour: 150, suggestedUnitsPerEquivalentGuest: 1, lotSize: 10, unitPrice: 6, active: true, consignment: true, countsAsMainCart: true },
  aguaMineral: { id: "agua-mineral", name: "Água mineral sem gás", commercialCategory: "Bebidas", operationalGroup: "beverages", productionPerHour: 150, suggestedUnitsPerEquivalentGuest: 1, lotSize: 10, unitPrice: 2.5, active: true, consignment: true, countsAsMainCart: true },
};

export const DEFAULT_BEVERAGE_PRODUCT_IDS = [
  "refrigerante-200ml",
  "suco-laranja-200ml",
  "agua-mineral",
];

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

  if (equivalentGuests < 5 && product.id !== "bolo") {
    return product.lotSize;
  }

  const rawQuantity =
    equivalentGuests *
    product.suggestedUnitsPerEquivalentGuest;

  return roundUpToDecimalMultiple(
    rawQuantity,
    product.lotSize
  );
}

export function getAdaptiveProductIds({
  equivalentGuests,
  selectedProductIds = [],
}) {
  if (equivalentGuests >= 15) {
    return selectedProductIds;
  }

  // Eventos compactos começam com uma recomendação simples de frituras.
  // Mini lanches, doces e bolo podem ser acrescentados pelo cliente depois.
  const compactEventIds = ["pastel-carne"];

  return compactEventIds.filter((id) =>
    selectedProductIds.includes(id)
  );
}

export function buildSuggestedItems({
  equivalentGuests,
  selectedProductIds = [],
  includeBeverages = false,
}) {
  const selectedProducts = Object.values(PRODUCTS).filter((product) => {
    if (!product.active) return false;
    if (product.consignment && !includeBeverages) return false;
    return selectedProductIds.includes(product.id);
  });

  const byCategory = selectedProducts.reduce((groups, product) => {
    const key = product.commercialCategory;
    groups[key] = groups[key] ?? [];
    groups[key].push(product);
    return groups;
  }, {});

  const items = [];
  const categoryAllocations = [];

  Object.entries(byCategory).forEach(([category, products]) => {
    const unitsPerGuest = Math.max(
      ...products.map((product) => Number(product.suggestedUnitsPerEquivalentGuest) || 0)
    );
    const suggestedTotal = Math.max(0, equivalentGuests * unitsPerGuest);

    const quantities = products.map((product) => ({
      product,
      quantity: suggestedTotal > 0 ? Number(product.lotSize) || 1 : 0,
    }));

    let allocatedTotal = quantities.reduce((sum, entry) => sum + entry.quantity, 0);
    let cursor = 0;
    let guard = 0;

    while (allocatedTotal < suggestedTotal && quantities.length && guard < 100000) {
      const entry = quantities[cursor % quantities.length];
      const lot = Number(entry.product.lotSize) || 1;
      entry.quantity += lot;
      allocatedTotal += lot;
      cursor += 1;
      guard += 1;
    }

    quantities.forEach(({ product, quantity }) => {
      items.push({
        ...product,
        quantity,
        estimatedValue: product.consignment ? 0 : quantity * product.unitPrice,
      });
    });

    const excess = Math.max(0, allocatedTotal - suggestedTotal);
    categoryAllocations.push({
      category,
      selectedProducts: products.length,
      suggestedTotal,
      allocatedTotal,
      excess,
      hasLotAdjustment: excess > 0,
    });
  });

  return { items, categoryAllocations };
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
  equivalentGuests = 0,
}) {
  const includedHours =
    PLANNING_PARAMETERS.service.includedHours;

  const operationalHours = Math.max(
    includedHours,
    Number(serviceHours) || includedHours
  );

  const cartGroupOrder = [
    "fried",
    "hotSandwiches",
    "beverages",
  ];

  const groupedItems = items.reduce(
    (accumulator, item) => {
      if (
        item.countsAsMainCart === false ||
        !cartGroupOrder.includes(item.operationalGroup) ||
        item.quantity <= 0
      ) {
        return accumulator;
      }

      const group =
        accumulator[item.operationalGroup] ?? {
          operationalGroup: item.operationalGroup,
          items: [],
          totalLoadInHours: 0,
        };

      group.items.push(item);
      group.totalLoadInHours +=
        item.quantity / item.productionPerHour;

      accumulator[item.operationalGroup] = group;
      return accumulator;
    },
    {}
  );

  /*
   * Regra operacional Roda Festa:
   * - 1 carrinho exclusivo para frituras;
   * - 1 carrinho exclusivo para mini lanches ou tortas;
   * - 1 carrinho exclusivo para bebidas em consignação;
   * - doces e bolo não utilizam carrinho nem mesa fornecida.
   *
   * Os limites de 100 adultos e 100 crianças já representam
   * a capacidade máxima de produção planejada para um único
   * carrinho de cada categoria durante o evento. Por isso, o
   * volume não cria um segundo carrinho da mesma categoria.
   */
  let cartGroups = cartGroupOrder
    .filter((groupId) => groupedItems[groupId])
    .map((groupId) => {
      const group = groupedItems[groupId];
      const capacityUsage =
        operationalHours > 0
          ? group.totalLoadInHours / operationalHours
          : 0;

      return {
        ...group,
        cartsRequired: 1,
        capacityUsage,
        withinPlannedCapacity: capacityUsage <= 1,
      };
    });


  const maxCarts =
    PLANNING_PARAMETERS.service.maxCarts;

  const totalCarts = Math.min(
    cartGroups.length,
    maxCarts
  );

  return {
    totalCarts,
    groups: cartGroups.slice(0, maxCarts),
    maximumAvailable: maxCarts,
    reachedMaximum: totalCarts === maxCarts,
    allocationRule: "one-cart-per-operational-group",
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

  /*
   * Bebidas são fornecidas em consignação. O carrinho continua fazendo
   * parte da estrutura visual e operacional, mas não compõe o investimento
   * inicial estimado. Por isso, somente grupos de carrinho com itens não
   * consignados entram no valor-base e nas horas adicionais.
   */
  const billableCartGroups = new Set(
    items
      .filter(
        (item) =>
          Number(item.quantity) > 0 &&
          item.countsAsMainCart !== false &&
          !item.consignment
      )
      .map((item) => item.operationalGroup)
  );

  const billableTotalCarts = Math.min(
    Number(totalCarts) || 0,
    billableCartGroups.size
  );

  const cartsValue =
    billableTotalCarts *
    PLANNING_PARAMETERS.service
      .cartBasePrice;

  const additionalHours =
    calculateAdditionalHours({
      serviceHours,
      totalCarts: billableTotalCarts,
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
    billableTotalCarts,
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
  additionalProductIds = [],
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

  // Na V17 o cardápio nasce das escolhas do cliente. O motor recomenda
  // quantidades e não acrescenta produtos padrão nem substitui seleções.
  const recommendationProductIds = Array.from(
    new Set([...selectedProductIds, ...additionalProductIds])
  );

  const effectiveProductIds = recommendationProductIds;

  const builtSuggestion = buildSuggestedItems({
    equivalentGuests,
    selectedProductIds: effectiveProductIds,
    includeBeverages,
  });

  let items = builtSuggestion.items;
  const categoryAllocations = builtSuggestion.categoryAllocations;

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
    equivalentGuests,
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
    categoryAllocations,
  };
}