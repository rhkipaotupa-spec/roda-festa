import { createProductCatalogStore } from './_lib/product-catalog-store.js';
import { isTrustedMutationRequest } from './_lib/planning-session-security.js';
import { productCatalogFingerprint } from '../src/planner/planning-book/engine/productCatalog.js';
import { generateR4ProductionSuggestion } from '../src/planner/planning-book/engine/r4ProductionRecommendation.js';
import { calculatePreparers, calculateWaiters, calculateDisposables, calculateInvestment, evaluateSuggestion, calculateSuggestedProductQuantity } from '../src/planner/planning-book/engine/planningRules.js';
import { calculateTachoAwareCarts } from './planning-submissions.js';
import { toPublicProduct } from './product-catalog.js';

// Calculation only: no session, contact, proposal, email or database writes.
export function buildPlanningPreview(input, catalog) {
  if (input.catalogFingerprint !== productCatalogFingerprint(catalog)) throw new Error('planning_catalog_changed');
  const counts = ['adults', 'olderChildren', 'children'].map((key) => Number(input[key]));
  if (counts.some((n) => !Number.isInteger(n) || n < 0 || n > 500) || !counts.some(Boolean)) throw new Error('invalid_guests');
  const hours = Number(input.serviceHours);
  if (!Number.isInteger(hours) || hours < 4 || hours > 8) throw new Error('invalid_duration');
  const byId = new Map(catalog.filter((p) => p.active).map((p) => [p.id, p]));
  const ids = input.selectedProductIds;
  if (!Array.isArray(ids) || ids.length > 100 || ids.some((id) => !byId.has(id))) throw new Error('invalid_selection');
  let suggestion;
  if (!Array.isArray(input.items)) {
    if (!ids.length) throw new Error('invalid_selection');
    suggestion = generateR4ProductionSuggestion({ ...input, productCatalog: catalog });
  } else {
    if (input.items.length > 100) throw new Error('invalid_items');
    const seen = new Set();
    const items = input.items.map((item) => {
      const product = byId.get(item.id);
      if (!product || seen.has(item.id)) throw new Error('invalid_product');
      seen.add(item.id);
      const quantity = Number(item.quantity);
      if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 10000 || Math.abs(quantity / product.lotSize - Math.round(quantity / product.lotSize)) > 1e-8) throw new Error('invalid_quantity');
      return { ...product, quantity, estimatedValue: product.consignment ? 0 : quantity * product.unitPrice };
    });
    const realGuests = counts.reduce((a, b) => a + b, 0);
    const equivalentGuests = counts[0] + counts[1] + counts[2] * 0.5;
    const carts = calculateTachoAwareCarts({ items, serviceHours: hours });
    const waiters = calculateWaiters({ realGuests, includeWaiters: Boolean(input.includeWaiters) });
    const disposables = calculateDisposables({ equivalentGuests, includeDisposables: Boolean(input.includeDisposables) });
    suggestion = { guests: { realGuests, equivalentGuests }, items, carts,
      preparers: calculatePreparers(carts.totalCarts), waiters, disposables,
      investment: calculateInvestment({ items, totalCarts: carts.totalCarts, serviceHours: hours, waiters, disposables }),
      evaluation: evaluateSuggestion({ equivalentGuests, items, totalCarts: carts.totalCarts }) };
  }
  return {
    versions: suggestion.versions,
    guests: suggestion.guests,
    items: suggestion.items.map((item) => ({ ...toPublicProduct(item), quantity: item.quantity, estimatedValue: item.estimatedValue })),
    carts: { totalCarts: suggestion.carts.totalCarts },
    preparers: suggestion.preparers, waiters: suggestion.waiters, disposables: suggestion.disposables,
    investment: suggestion.investment, evaluation: suggestion.evaluation,
    suggestedQuantities: Object.fromEntries([...byId.values()].map((product) => [product.id,
      product.commercialCategory === 'Brigadeiro no tacho' ? suggestion.guests.realGuests
        : calculateSuggestedProductQuantity({ product, equivalentGuests: suggestion.guests.equivalentGuests })])),
  };
}

export function createPlanningPreviewHandler({ catalogStore }) {
  return async (request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    if (request.method !== 'POST') return response.status(405).json({ ok: false, error: 'method_not_allowed' });
    if (!isTrustedMutationRequest(request)) return response.status(403).json({ ok: false, error: 'untrusted_origin' });
    if (!request.body || Buffer.byteLength(JSON.stringify(request.body)) > 20000) return response.status(400).json({ ok: false, error: 'invalid_body' });
    let catalog;
    try { catalog = await catalogStore.listCatalog({ includeInactive: true }); }
    catch { return response.status(503).json({ ok: false, error: 'product_catalog_unavailable' }); }
    try { return response.status(200).json({ ok: true, suggestion: buildPlanningPreview(request.body, catalog) }); }
    catch (error) { return response.status(error.message === 'planning_catalog_changed' ? 409 : 400).json({ ok: false, error: error.message === 'planning_catalog_changed' ? error.message : 'invalid_planning_preview' }); }
  };
}

export default createPlanningPreviewHandler({ catalogStore: createProductCatalogStore() });
