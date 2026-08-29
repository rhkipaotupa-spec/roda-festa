/* =========================================================
   RODA FESTA - R4 SHADOW SKU ALLOCATION PREVIEW

   Preview-only / non-authoritative.
   - Consumes category totals already produced by R4 shadow.
   - Splits only among SKUs explicitly selected by the operator.
   - Uses a neutral equal-share objective and respects commercial lots.
   - Does not persist, price, finalize, or mutate Production.
   ========================================================= */

export const R4_SKU_ALLOCATION_POLICY = Object.freeze({
  id: "RF-ALLOC-R4-PREVIEW-1",
  mode: "shadow-preview",
  authoritative: false,
  productionMutationAllowed: false,
  strategy: "equal-share-lot-aware-minimum-overage",
  calibrationStatus: "provisional-not-calibrated-from-consumption-by-sku",
});

function asPositiveInteger(value, fallback = 1) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return fallback;
  return Math.max(1, Math.round(number));
}

function normalizeCatalog(productCatalog = []) {
  if (Array.isArray(productCatalog)) return productCatalog;
  if (productCatalog && typeof productCatalog === "object") return Object.values(productCatalog);
  return [];
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function categoryTarget(category) {
  if (category.naturalUnit === "unit") {
    return {
      allocationUnit: "unit",
      targetUnits: asPositiveInteger(
        category.plannedRoundedCategoryUnits ?? category.plannedNaturalQuantity,
        0
      ),
      plannedNaturalQuantity: Number(category.plannedNaturalQuantity || 0),
      gramsPerAllocationUnit: null,
    };
  }

  const portions = asPositiveInteger(category.plannedRoundedNominalPortions, 0);
  const gramsPerPortion = Number(category.nominalPortionGrams || 0);
  return {
    allocationUnit: "nominal-portion",
    targetUnits: portions,
    plannedNaturalQuantity: Number(category.plannedNaturalQuantity || 0),
    gramsPerAllocationUnit: gramsPerPortion > 0 ? gramsPerPortion : null,
  };
}

function chooseBalancedAllocation(targetUnits, products) {
  const target = asPositiveInteger(targetUnits, 0);
  if (!target || products.length === 0) {
    return { totalAllocatedUnits: 0, quantities: products.map(() => 0) };
  }

  const normalized = products.map((product, index) => ({
    product,
    index,
    lot: asPositiveInteger(product.lotSize, 1),
  }));
  const ideal = target / normalized.length;
  const minimumTotal = sum(normalized.map((entry) => entry.lot));
  const maxLot = Math.max(...normalized.map((entry) => entry.lot));
  const searchLimit = Math.max(target, minimumTotal) + minimumTotal + maxLot;

  let states = new Map([[0, { cost: 0, quantities: [] }]]);

  for (const entry of normalized) {
    const next = new Map();
    for (const [currentTotal, state] of states.entries()) {
      for (let quantity = entry.lot; currentTotal + quantity <= searchLimit; quantity += entry.lot) {
        const nextTotal = currentTotal + quantity;
        const nextCost = state.cost + (quantity - ideal) ** 2;
        const existing = next.get(nextTotal);
        if (!existing || nextCost < existing.cost - 1e-9) {
          next.set(nextTotal, {
            cost: nextCost,
            quantities: [...state.quantities, quantity],
          });
        }
      }
    }
    states = next;
  }

  const feasibleTotals = [...states.keys()].filter((total) => total >= target).sort((a, b) => a - b);
  if (feasibleTotals.length === 0) {
    throw new Error("R4 preview allocation could not satisfy selected SKU lots.");
  }

  const totalAllocatedUnits = feasibleTotals[0];
  const best = states.get(totalAllocatedUnits);
  return {
    totalAllocatedUnits,
    quantities: best.quantities,
  };
}

function allocationLabelData(target, allocatedUnits) {
  if (target.allocationUnit === "unit") {
    return {
      targetCommercialUnits: target.targetUnits,
      allocatedCommercialUnits: allocatedUnits,
      targetGrams: null,
      allocatedGrams: null,
      overageCommercialUnits: allocatedUnits - target.targetUnits,
      overageGrams: null,
    };
  }

  const gramsPerUnit = Number(target.gramsPerAllocationUnit || 0);
  const allocatedGrams = gramsPerUnit > 0 ? allocatedUnits * gramsPerUnit : null;
  return {
    targetCommercialUnits: target.targetUnits,
    allocatedCommercialUnits: allocatedUnits,
    targetGrams: target.plannedNaturalQuantity,
    allocatedGrams,
    overageCommercialUnits: allocatedUnits - target.targetUnits,
    overageGrams: allocatedGrams == null ? null : allocatedGrams - target.plannedNaturalQuantity,
  };
}

export function allocateR4ShadowSkus({
  recommendation,
  selectedProductIds = [],
  productCatalog = [],
} = {}) {
  const catalog = normalizeCatalog(productCatalog);
  const selectedIds = new Set(selectedProductIds.map(String));
  const selectedProducts = catalog.filter(
    (product) => product && product.active !== false && selectedIds.has(String(product.id))
  );
  const contractedCategories = recommendation?.solids?.categories?.filter((category) => category.contracted) || [];
  const warnings = [];

  const categories = contractedCategories.map((category) => {
    const products = selectedProducts.filter(
      (product) => product.commercialCategory === category.category
    );
    const target = categoryTarget(category);

    if (products.length === 0) {
      warnings.push(`${category.category}: select at least one SKU before preview allocation.`);
      return {
        category: category.category,
        status: "needs-sku-selection",
        target,
        products: [],
        ...allocationLabelData(target, 0),
      };
    }

    const allocation = chooseBalancedAllocation(target.targetUnits, products);
    const totals = allocationLabelData(target, allocation.totalAllocatedUnits);
    const items = products.map((product, index) => {
      const quantity = allocation.quantities[index];
      const grams =
        target.allocationUnit === "nominal-portion" && target.gramsPerAllocationUnit
          ? quantity * target.gramsPerAllocationUnit
          : null;
      return {
        id: String(product.id),
        name: String(product.name || product.id),
        category: category.category,
        quantity,
        lotSize: asPositiveInteger(product.lotSize, 1),
        allocationUnit: target.allocationUnit,
        grams,
      };
    });

    return {
      category: category.category,
      status: "allocated-preview",
      policyId: R4_SKU_ALLOCATION_POLICY.id,
      target,
      items,
      ...totals,
    };
  });

  return {
    mode: R4_SKU_ALLOCATION_POLICY.mode,
    authoritative: false,
    productionMutationAllowed: false,
    policy: { ...R4_SKU_ALLOCATION_POLICY },
    categories,
    warnings,
  };
}
