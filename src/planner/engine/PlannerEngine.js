import { menuItems } from "../catalog/menuItems";
import { services } from "../catalog/services";

import {
  buildRecommendation,
} from "../rules/recommendationRules";

import {
  buildQuantityContext,
  calculateBrigadeiroQuantity,
  calculateCakeQuantity,
} from "../rules/quantityRules";

import {
  calculateRequiredStructures,
} from "../rules/productionRules";

/*
|--------------------------------------------------------------------------
| Identificadores e categorias especiais
|--------------------------------------------------------------------------
|
| As categorias são usadas para identificar brigadeiros e bolos sem
| depender exclusivamente do ID de cada produto.
|
*/

const DESSERT_CATEGORY_ID = "desserts";
const CAKE_CATEGORY_ID = "cakes";

/*
|--------------------------------------------------------------------------
| Funções auxiliares de normalização
|--------------------------------------------------------------------------
*/

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeObject(value) {
  return value && typeof value === "object"
    ? value
    : {};
}

function normalizeNumber(value, fallback = 0) {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue)) {
    return fallback;
  }

  return parsedValue;
}

function normalizePositiveNumber(value, fallback = 0) {
  return Math.max(
    0,
    normalizeNumber(value, fallback)
  );
}

/*
|--------------------------------------------------------------------------
| Catálogo
|--------------------------------------------------------------------------
*/

function getActiveItems() {
  return menuItems.filter(
    (item) => item.active !== false
  );
}

function getActiveServices() {
  return services.filter(
    (service) => service.active !== false
  );
}

function findItemById(itemId) {
  return (
    getActiveItems().find(
      (item) => item.id === itemId
    ) ?? null
  );
}

function findServiceById(serviceId) {
  return (
    getActiveServices().find(
      (service) => service.id === serviceId
    ) ?? null
  );
}

/*
|--------------------------------------------------------------------------
| Recomendação e seleção de produtos
|--------------------------------------------------------------------------
*/

function getItemsFromCategories(categoryIds = []) {
  const safeCategoryIds =
    normalizeArray(categoryIds);

  if (!safeCategoryIds.length) {
    return [];
  }

  return getActiveItems().filter((item) =>
    safeCategoryIds.includes(item.categoryId)
  );
}

function getItemsByIds(itemIds = []) {
  const safeItemIds = normalizeArray(itemIds);

  return getActiveItems().filter((item) =>
    safeItemIds.includes(item.id)
  );
}

function mergeItems(...itemGroups) {
  const itemsById = new Map();

  itemGroups
    .flat()
    .filter(Boolean)
    .forEach((item) => {
      itemsById.set(item.id, item);
    });

  return Array.from(itemsById.values());
}

function buildSelectedItems({
  mode,
  recommendedItems,
  selectedItemIds,
}) {
  const manuallySelectedItems =
    getItemsByIds(selectedItemIds);

  if (mode === "expert") {
    return manuallySelectedItems;
  }

  if (!manuallySelectedItems.length) {
    return recommendedItems;
  }

  return mergeItems(
    recommendedItems,
    manuallySelectedItems
  );
}

/*
|--------------------------------------------------------------------------
| Identificação de brigadeiros e bolos
|--------------------------------------------------------------------------
*/

function isBrigadeiroItem(item) {
  if (!item) {
    return false;
  }

  const normalizedName = String(
    item.name ?? ""
  ).toLowerCase();

  return (
    item.categoryId === DESSERT_CATEGORY_ID &&
    normalizedName.includes("brigadeiro")
  );
}

function isCakeItem(item) {
  if (!item) {
    return false;
  }

  return item.categoryId === CAKE_CATEGORY_ID;
}

/*
|--------------------------------------------------------------------------
| Distribuição de quantidades
|--------------------------------------------------------------------------
*/

function distributeIntegerQuantity({
  items,
  totalQuantity,
}) {
  const safeItems = normalizeArray(items);
  const safeTotalQuantity = Math.ceil(
    normalizePositiveNumber(totalQuantity)
  );

  if (
    !safeItems.length ||
    safeTotalQuantity <= 0
  ) {
    return {};
  }

  const baseQuantity = Math.floor(
    safeTotalQuantity / safeItems.length
  );

  const remainder =
    safeTotalQuantity % safeItems.length;

  return safeItems.reduce(
    (quantities, item, index) => {
      quantities[item.id] =
        baseQuantity +
        (index < remainder ? 1 : 0);

      return quantities;
    },
    {}
  );
}

/*
|--------------------------------------------------------------------------
| Quantidades sugeridas
|--------------------------------------------------------------------------
*/

function buildSuggestedQuantities({
  items,
  quantityContext,
}) {
  const selectedItems = normalizeArray(items);

  const brigadeiroItems =
    selectedItems.filter(isBrigadeiroItem);

  const cakeItems =
    selectedItems.filter(isCakeItem);

  const hasBrigadeiros =
    brigadeiroItems.length > 0;

  const quantities = {};

  if (hasBrigadeiros) {
    const totalBrigadeiros =
      calculateBrigadeiroQuantity({
        adults: quantityContext.adults,
        children: quantityContext.children,
      });

    Object.assign(
      quantities,
      distributeIntegerQuantity({
        items: brigadeiroItems,
        totalQuantity: totalBrigadeiros,
      })
    );
  }

  if (cakeItems.length) {
    const totalCakeKilograms =
      calculateCakeQuantity({
        adults: quantityContext.adults,
        children: quantityContext.children,
        hasBrigadeiros,
      });

    const kilogramsPerCake =
      totalCakeKilograms / cakeItems.length;

    cakeItems.forEach((item) => {
      quantities[item.id] =
        kilogramsPerCake;
    });
  }

  return {
    quantities,
    hasBrigadeiros,
  };
}

/*
|--------------------------------------------------------------------------
| Alterações manuais
|--------------------------------------------------------------------------
*/

function applyManualQuantities({
  suggestedQuantities,
  manualQuantities,
}) {
  const safeSuggestedQuantities =
    normalizeObject(suggestedQuantities);

  const safeManualQuantities =
    normalizeObject(manualQuantities);

  const normalizedManualQuantities =
    Object.entries(
      safeManualQuantities
    ).reduce(
      (result, [itemId, quantity]) => {
        const normalizedQuantity =
          normalizePositiveNumber(
            quantity,
            null
          );

        if (normalizedQuantity !== null) {
          result[itemId] =
            normalizedQuantity;
        }

        return result;
      },
      {}
    );

  return {
    ...safeSuggestedQuantities,
    ...normalizedManualQuantities,
  };
}

/*
|--------------------------------------------------------------------------
| Serviços utilizados
|--------------------------------------------------------------------------
*/

function getServicesFromItems(items = []) {
  const selectedItems = normalizeArray(items);

  const selectedServiceIds = new Set(
    selectedItems
      .map((item) => item.serviceId)
      .filter(Boolean)
  );

  return getActiveServices().filter(
    (service) =>
      selectedServiceIds.has(service.id)
  );
}

/*
|--------------------------------------------------------------------------
| Quantidade total por serviço
|--------------------------------------------------------------------------
*/

function calculateServiceProductQuantity({
  serviceId,
  items,
  quantities,
}) {
  const safeItems = normalizeArray(items);
  const safeQuantities =
    normalizeObject(quantities);

  return safeItems
    .filter(
      (item) =>
        item.serviceId === serviceId
    )
    .reduce((total, item) => {
      const itemQuantity =
        normalizePositiveNumber(
          safeQuantities[item.id],
          0
        );

      return total + itemQuantity;
    }, 0);
}

/*
|--------------------------------------------------------------------------
| Estruturas operacionais
|--------------------------------------------------------------------------
*/

function buildStructures({
  selectedServices,
  selectedItems,
  quantities,
  durationHours,
}) {
  return normalizeArray(
    selectedServices
  ).map((service) => {
    const productQuantity =
      calculateServiceProductQuantity({
        serviceId: service.id,
        items: selectedItems,
        quantities,
      });

    const productionResult =
      calculateRequiredStructures({
        serviceId: service.id,
        quantity: productQuantity,
        durationHours,
      });

    return {
      serviceId: service.id,
      name: service.name,
      type: service.type,

      quantity:
        productionResult.structures,

      productQuantity,

      productionPerHour:
        productionResult.productionPerHour,

      capacityPerStructure:
        productionResult.capacityPerStructure,

      reason:
        productionResult.reason,

      defaultAttendants:
        service.operation
          ?.defaultAttendants ?? 0,

      totalDefaultAttendants:
        (service.operation
          ?.defaultAttendants ?? 0) *
        productionResult.structures,

      allowsExtraHours:
        service.operation
          ?.allowsExtraHours ?? false,

      includesFurniture:
        service.operation
          ?.includesFurniture ?? null,
    };
  });
}

/*
|--------------------------------------------------------------------------
| Produtos da composição
|--------------------------------------------------------------------------
*/

function buildProducts({
  items,
  quantities,
}) {
  const safeQuantities =
    normalizeObject(quantities);

  return normalizeArray(items).map(
    (item) => ({
      id: item.id,
      name: item.name,
      categoryId: item.categoryId,
      serviceId: item.serviceId,

      measurementUnit:
        item.measurementUnit ?? "unit",

      quantity:
        safeQuantities[item.id] ?? null,
    })
  );
}

/*
|--------------------------------------------------------------------------
| Equipe operacional
|--------------------------------------------------------------------------
*/

function buildStaff(structures = []) {
  const serviceStaff =
    normalizeArray(structures)
      .filter(
        (structure) =>
          structure.totalDefaultAttendants >
          0
      )
      .map((structure) => ({
        serviceId: structure.serviceId,
        serviceName: structure.name,

        attendantsPerStructure:
          structure.defaultAttendants,

        structures:
          structure.quantity,

        quantity:
          structure.totalDefaultAttendants,
      }));

  const totalAttendants =
    serviceStaff.reduce(
      (total, staffItem) =>
        total + staffItem.quantity,
      0
    );

  return {
    byService: serviceStaff,
    totalAttendants,
  };
}

/*
|--------------------------------------------------------------------------
| Cena
|--------------------------------------------------------------------------
*/

function buildScene({
  services: selectedServices,
  structures,
  items,
}) {
  const safeStructures =
    normalizeArray(structures);

  const objects = normalizeArray(
    selectedServices
  )
    .filter(
      (service) =>
        service.scene?.visible
    )
    .map((service) => {
      const structure =
        safeStructures.find(
          (item) =>
            item.serviceId === service.id
        );

      return {
        id: `scene-${service.id}`,

        serviceId: service.id,

        serviceName: service.name,

        component:
          service.scene.component,

        quantity:
          structure?.quantity ?? 1,

        type:
          service.type,

        visualOnly:
          service.scene.visualOnly ??
          false,

        operation: {
          includesFurniture:
            service.operation
              ?.includesFurniture ?? null,

          defaultAttendants:
            service.operation
              ?.defaultAttendants ?? 0,
        },

        production: {
          productQuantity:
            structure?.productQuantity ?? 0,

          productionPerHour:
            structure?.productionPerHour ??
            null,

          capacityPerStructure:
            structure
              ?.capacityPerStructure ?? null,
        },

        visual: {
          variant:
            service.scene.variant ??
            "default",

          theme:
            service.scene.theme ??
            service.type ??
            "default",

          emphasis:
            service.scene.emphasis ??
            "normal",
        },
      };
    });

  return {
    objects,

    suppliedItems:
      normalizeArray(items).map(
        (item) => ({
          id: item.id,
          name: item.name,
          categoryId: item.categoryId,
          serviceId: item.serviceId,
        })
      ),

    notes: [
      {
        id: "dessert-table-furniture",

        visible:
          selectedServices.some(
            (service) =>
              service.id ===
                "desserts-and-cakes" &&
              service.operation
                ?.includesFurniture === false
          ),

        message:
          "A mesa exibida é apenas uma representação visual. O mobiliário e a decoração não estão incluídos.",
      },
    ].filter((note) => note.visible),
  };
}

/*
|--------------------------------------------------------------------------
| Avisos
|--------------------------------------------------------------------------
*/

function buildWarnings({
  quantityContext,
  selectedItems,
  recommendation,
  structures,
}) {
  const warnings = [
    ...normalizeArray(
      recommendation?.warnings
    ),
  ];

  if (
    quantityContext.totalGuests <= 0
  ) {
    warnings.push(
      "Informe a quantidade de adultos e crianças para calcular as sugestões."
    );
  }

  if (!selectedItems.length) {
    warnings.push(
      "Nenhum produto foi selecionado para o evento."
    );
  }

  normalizeArray(structures).forEach(
    (structure) => {
      if (
        structure.productQuantity <= 0
      ) {
        warnings.push(
          `A quantidade dos produtos vinculados ao serviço "${structure.name}" ainda não foi definida.`
        );
      }
    }
  );

  return Array.from(new Set(warnings));
}

/*
|--------------------------------------------------------------------------
| Mensagens explicativas
|--------------------------------------------------------------------------
*/

function buildExplanations({
  recommendation,
  structures,
  hasBrigadeiros,
  selectedItems,
}) {
  const explanations = [
    ...normalizeArray(
      recommendation?.messages
    ),
  ];

  const hasCake =
    normalizeArray(selectedItems).some(
      isCakeItem
    );

  if (hasCake && hasBrigadeiros) {
    explanations.push(
      "A quantidade de bolo foi reduzida porque o evento também possui brigadeiros."
    );
  }

  if (hasCake && !hasBrigadeiros) {
    explanations.push(
      "A quantidade de bolo foi ampliada porque o evento não possui brigadeiros."
    );
  }

  normalizeArray(structures).forEach(
    (structure) => {
      if (
        structure.productionPerHour &&
        structure.productQuantity > 0
      ) {
        explanations.push(
          `${structure.quantity} estrutura(s) de "${structure.name}" foram calculadas considerando uma produção média de ${structure.productionPerHour} unidades por hora.`
        );
      }
    }
  );

  return Array.from(
    new Set(explanations)
  );
}

/*
|--------------------------------------------------------------------------
| Recomendação padrão
|--------------------------------------------------------------------------
*/

function buildEmptyRecommendation() {
  return {
    ruleId: null,
    recommendedCategoryIds: [],
    optionalCategoryIds: [],
    messages: [],
    warnings: [],
  };
}

/*
|--------------------------------------------------------------------------
| Motor principal
|--------------------------------------------------------------------------
*/

export function buildPlannerResult(
  plannerState = {}
) {
  const safePlannerState =
    normalizeObject(plannerState);

  const mode =
    safePlannerState.mode === "expert"
      ? "expert"
      : "guided";

  const event = normalizeObject(
    safePlannerState.event
  );

  const guests = normalizeObject(
    safePlannerState.guests
  );

  const preferences = normalizeObject(
    safePlannerState.preferences
  );

  const selection = normalizeObject(
    safePlannerState.selection
  );

  const additionalServices =
    normalizeObject(
      safePlannerState.additionalServices
    );

  /*
  |--------------------------------------------------------------------------
  | 1. Contexto do evento
  |--------------------------------------------------------------------------
  */

  const quantityContext =
    buildQuantityContext({
      adults: guests.adults,
      children: guests.children,
      durationHours:
        event.durationHours,
    });

  /*
  |--------------------------------------------------------------------------
  | 2. Recomendação
  |--------------------------------------------------------------------------
  */

  const recommendation =
    mode === "guided"
      ? buildRecommendation({
          eventType: event.type,
          profileId:
            preferences.profile,
        })
      : buildEmptyRecommendation();

  /*
  |--------------------------------------------------------------------------
  | 3. Produtos recomendados e selecionados
  |--------------------------------------------------------------------------
  */

  const recommendedItems =
    getItemsFromCategories(
      recommendation
        .recommendedCategoryIds
    );

  const selectedItems =
    buildSelectedItems({
      mode,
      recommendedItems,
      selectedItemIds:
        selection.selectedItemIds,
    });

  /*
  |--------------------------------------------------------------------------
  | 4. Quantidades
  |--------------------------------------------------------------------------
  */

  const quantityResult =
    buildSuggestedQuantities({
      items: selectedItems,
      quantityContext,
    });

  const finalQuantities =
    applyManualQuantities({
      suggestedQuantities:
        quantityResult.quantities,

      manualQuantities:
        selection.itemQuantities,
    });

  /*
  |--------------------------------------------------------------------------
  | 5. Serviços
  |--------------------------------------------------------------------------
  */

  const selectedServices =
    getServicesFromItems(selectedItems);

  /*
  |--------------------------------------------------------------------------
  | 6. Estruturas
  |--------------------------------------------------------------------------
  */

  const structures =
    buildStructures({
      selectedServices,
      selectedItems,
      quantities: finalQuantities,
      durationHours:
        quantityContext.durationHours,
    });

  /*
  |--------------------------------------------------------------------------
  | 7. Produtos
  |--------------------------------------------------------------------------
  */

  const products = buildProducts({
    items: selectedItems,
    quantities: finalQuantities,
  });

  /*
  |--------------------------------------------------------------------------
  | 8. Equipe
  |--------------------------------------------------------------------------
  */

  const staff =
    buildStaff(structures);

  /*
  |--------------------------------------------------------------------------
  | 9. Cena
  |--------------------------------------------------------------------------
  */

  const scene = buildScene({
    services: selectedServices,
    structures,
    items: selectedItems,
  });

  /*
  |--------------------------------------------------------------------------
  | 10. Avisos e explicações
  |--------------------------------------------------------------------------
  */

  const warnings = buildWarnings({
    quantityContext,
    selectedItems,
    recommendation,
    structures,
  });

  const explanations =
    buildExplanations({
      recommendation,
      structures,
      hasBrigadeiros:
        quantityResult.hasBrigadeiros,
      selectedItems,
    });

  /*
  |--------------------------------------------------------------------------
  | 11. Resultado
  |--------------------------------------------------------------------------
  */

  return {
    mode,

    event: {
      ...event,
      durationHours:
        quantityContext.durationHours,
    },

    guests: quantityContext,

    recommendation,

    composition: {
      products,
      structures,
      staff,
    },

    additionalServices,

    pricing: {
      status: "pending",
      currency: "BRL",
      subtotal: 0,
      total: 0,
      breakdown: [],
    },

    scene,

    explanations,

    warnings,

    metadata: {
      hasBrigadeiros:
        quantityResult.hasBrigadeiros,

      selectedItemCount:
        selectedItems.length,

      selectedServiceCount:
        selectedServices.length,

      generatedAt:
        new Date().toISOString(),
    },
  };
}

/*
|--------------------------------------------------------------------------
| Exportação do motor
|--------------------------------------------------------------------------
*/

export const PlannerEngine = {
  build: buildPlannerResult,
};

export default PlannerEngine;