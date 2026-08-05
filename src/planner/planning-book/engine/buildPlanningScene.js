/* =========================================================
   BUILD PLANNING SCENE

   Converte o resultado do novo Planning Book para o formato
   que o EventScene antigo já sabe interpretar.
   ========================================================= */

const PRODUCT_SCENE_MAP = {
  "pastel-carne": {
    legacyId: "meat-pastel",
    serviceId: "fried-snack-cart",
    sceneAsset: "pastel",
    quantityRuleId: "manual-unit",
  },

  "pastel-queijo": {
    legacyId: "cheese-pastel",
    serviceId: "fried-snack-cart",
    sceneAsset: "pastel",
    quantityRuleId: "manual-unit",
  },

  "coxinha-frango-catupiry": {
    legacyId: "chicken-catupiry-coxinha",
    serviceId: "fried-snack-cart",
    sceneAsset: "pastel",
    quantityRuleId: "manual-unit",
  },

  "risoles-presunto-queijo": {
    legacyId: "ham-cheese-risoles",
    serviceId: "fried-snack-cart",
    sceneAsset: "pastel",
    quantityRuleId: "manual-unit",
  },

  "mini-x-burguer": {
    legacyId: "mini-x-burger",
    serviceId: "mini-snack-cart",
    sceneAsset: "burger",
    quantityRuleId: "manual-unit",
  },

  "mini-hot-dog": {
    legacyId: "mini-hot-dog",
    serviceId: "mini-snack-cart",
    sceneAsset: "hot-dog",
    quantityRuleId: "manual-unit",
  },

  "brigadeiro-chocolate": {
    legacyId: "chocolate-brigadeiro",
    serviceId: "desserts-and-cakes",
    sceneAsset: "brigadeiro",
    quantityRuleId: "party-sweets",
  },

  "brigadeiro-leite-ninho": {
    legacyId: "ninho-brigadeiro",
    serviceId: "desserts-and-cakes",
    sceneAsset: "brigadeiro",
    quantityRuleId: "party-sweets",
  },

  bolo: {
    legacyId: "custom-cake",
    serviceId: "desserts-and-cakes",
    sceneAsset: "cake",
    quantityRuleId: "cake-by-weight",
  },

  "refrigerante-200ml": {
    legacyId: "refrigerante-200ml",
    serviceId: "drinks-station",
    sceneAsset: null,
    quantityRuleId: "manual-unit",
  },

  "suco-laranja-200ml": {
    legacyId: "orange-juice-200ml",
    serviceId: "drinks-station",
    sceneAsset: null,
    quantityRuleId: "manual-unit",
  },

  "agua-mineral": {
    legacyId: "agua-mineral",
    serviceId: "drinks-station",
    sceneAsset: null,
    quantityRuleId: "manual-unit",
  },
};

const GROUP_SERVICE_MAP = {
  fried: {
    serviceId: "fried-snack-cart",
    serviceName: "Carrinho de Petiscos",
  },

  hotSandwiches: {
    serviceId: "mini-snack-cart",
    serviceName: "Carrinho de Mini Lanches",
  },

  beverages: {
    serviceId: "drinks-station",
    serviceName: "Estação de Bebidas",
  },
};

function mapPlanningProduct(item) {
  const sceneMapping =
    PRODUCT_SCENE_MAP[item.id];

  if (!sceneMapping) {
    console.warn(
      `Produto sem mapeamento de cena: ${item.id}`
    );

    return null;
  }

  return {
    ...item,

    id: sceneMapping.legacyId,
    originalId: item.id,

    serviceId:
      sceneMapping.serviceId,

    quantityRuleId:
      sceneMapping.quantityRuleId,

    assets: {
      scene:
        sceneMapping.sceneAsset,
    },
  };
}

function buildCartObjects(suggestion) {
  const groups =
    suggestion?.carts?.groups ?? [];

  return groups
    .map((group) => {
      const service =
        GROUP_SERVICE_MAP[
          group.operationalGroup
        ];

      if (!service) {
        return null;
      }

      return {
        id: `scene-${service.serviceId}`,

        component: "Cart",

        serviceId:
          service.serviceId,

        serviceName:
          service.serviceName,

        quantity:
          Math.max(
            1,
            Number(
              group.cartsRequired
            ) || 1
          ),

        visual: {
          variant:
            group.operationalGroup,

          theme: "roda-festa",
        },
      };
    })
    .filter(Boolean);
}

function buildDessertObject(products) {
  const hasDesserts =
    products.some(
      (product) =>
        product.serviceId ===
        "desserts-and-cakes"
    );

  if (!hasDesserts) {
    return null;
  }

  return {
    id: "scene-dessert-table",

    component: "DessertTable",

    serviceId:
      "desserts-and-cakes",

    serviceName:
      "Mesa de Doces",

    quantity: 1,

    visual: {
      variant: "dessert-table",
      theme: "roda-festa",
    },
  };
}

function buildSceneNotes(suggestion) {
  const notes = [];

  const totalCarts =
    suggestion?.carts?.totalCarts ?? 0;

  if (totalCarts > 0) {
    notes.push({
      id: "scene-note-carts",

      message:
        totalCarts === 1
          ? "1 carrinho recomendado para o atendimento."
          : `${totalCarts} carrinhos recomendados para manter o fluxo de atendimento.`,
    });
  }

  if (
    suggestion?.beverages?.requested
  ) {
    notes.push({
      id: "scene-note-beverages",

      message:
        "Bebidas solicitadas em sistema de consignação.",
    });
  }

  return notes;
}

export function buildPlanningScene({
  suggestion,
  eventType,
}) {
  if (!suggestion) {
    return null;
  }

  const products =
    (suggestion.items ?? [])
      .map(mapPlanningProduct)
      .filter(Boolean);

  const cartObjects =
    buildCartObjects(suggestion);

  // Doces e bolo continuam fora da contagem de carrinhos, mas entram
  // como uma referência visual separada na Cena Viva. A mesa exibida
  // representa apenas a apresentação dos itens, cuja estrutura e montagem
  // permanecem sob responsabilidade do cliente.
  const dessertObject = buildDessertObject(products);

  const sceneObjects = [
    ...cartObjects,
    ...(dessertObject ? [dessertObject] : []),
  ];

  return {
    event: {
      type: eventType || "neutral",
    },

    composition: {
      products,

      structures: cartObjects.map(
        (cartObject) => ({
          id: cartObject.id,

          serviceId:
            cartObject.serviceId,

          name:
            cartObject.serviceName,

          quantity:
            cartObject.quantity,
        })
      ),
    },

    scene: {
      objects: sceneObjects,

      notes:
        buildSceneNotes(
          suggestion
        ),
    },
  };
}

export default buildPlanningScene;