import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPlanningPreview, createPlanningPreviewHandler } from '../api/planning-preview.js';
import { baseProductCatalog, productCatalogFingerprint } from '../src/planner/planning-book/engine/productCatalog.js';
import { calculateCarts } from '../src/planner/planning-book/engine/planningRules.js';
import { toPublicProduct, createProductCatalogHttpHandler } from '../api/product-catalog.js';
import { buildAuthoritativeRecommendation } from '../api/planning-sessions.js';
import { createRecommendationSnapshot } from '../src/planner/planning-book/engine/planningHistory.js';
import { areRecommendationSnapshotsEquivalent, startPlanningSession } from '../src/planner/planning-book/planningSessionClient.js';
import { fetchWithTimeout } from '../src/planner/planning-book/planningPreviewClient.js';

const catalog = baseProductCatalog();
const input = { catalogFingerprint: productCatalogFingerprint(catalog), adults: 50, olderChildren: 0, children: 0, serviceHours: 4, selectedProductIds: ['mini-hot-dog', 'mini-x-burguer'], includeWaiters: true };

test('public catalog contract feeds preview and session with the same full fingerprint, including inactive SKUs', async () => {
  const complete = [...catalog, { ...catalog[0], id: 'inactive-test', active: false }];
  const response = { setHeader() {}, end(value) { this.body = JSON.parse(value); } };
  await createProductCatalogHttpHandler({ catalogStore: { async listCatalog() { return complete; } } })({ method: 'GET' }, response);
  assert.equal(response.body.products.length, catalog.length);
  assert.doesNotMatch(JSON.stringify(response.body.products), /productionPerHour|operationalGroup/);
  const browserInput = { ...input, catalogFingerprint: response.body.catalogFingerprint };
  const suggestion = buildPlanningPreview(browserInput, complete);
  const authoritative = buildAuthoritativeRecommendation({ ...browserInput, duration: 4 }, complete);
  assert.equal(response.body.catalogFingerprint, authoritative.inputSnapshot.catalogFingerprint);
  assert.ok(areRecommendationSnapshotsEquivalent(createRecommendationSnapshot({ suggestion, versions: suggestion.versions }), authoritative.recommendationSnapshot));
});

test('reproduces zero carts from public projection and returns authoritative cart with unchanged prices', () => {
  const items = [{ id: 'mini-hot-dog', quantity: 60 }, { id: 'mini-x-burguer', quantity: 65 }];
  const projected = items.map((item) => ({ ...toPublicProduct(catalog.find((p) => p.id === item.id)), quantity: item.quantity }));
  assert.equal(calculateCarts({ items: projected, serviceHours: 4, equivalentGuests: 50 }).totalCarts, 0);
  const result = buildPlanningPreview({ ...input, items }, catalog);
  assert.equal(result.carts.totalCarts, 1);
  assert.equal(result.preparers, 1);
  assert.equal(result.waiters.quantity, 3);
  assert.equal(result.investment.productsValue, 750);
  assert.equal(result.investment.total, 1650);
  for (const item of result.items) assert.equal(item.unitPrice, catalog.find((p) => p.id === item.id).unitPrice);
  assert.doesNotMatch(JSON.stringify(result), /productionPerHour|suggestedUnitsPerEquivalentGuest|countsAsMainCart|operationalGroup|totalLoadInHours/);
});

test('initial result matches the existing session authority and stale fingerprints fail closed', () => {
  const suggestion = buildPlanningPreview(input, catalog);
  const expected = buildAuthoritativeRecommendation({ ...input, duration: 4 }, catalog).recommendationSnapshot;
  assert.ok(areRecommendationSnapshotsEquivalent(createRecommendationSnapshot({ suggestion, versions: suggestion.versions }), expected));
  assert.throws(() => buildPlanningPreview({ ...input, catalogFingerprint: 'stale' }, catalog), /planning_catalog_changed/);
});

test('new catalog SKUs work without being bundled in the browser; tacho shares drinks cart', () => {
  // Fixture matches the read-only operational contract verified on 2026-10-31.
  const tacho = { id: 'brigadeiro-tacho-chocolate', name: 'Brigadeiro no tacho - Chocolate', commercialCategory: 'Brigadeiro no tacho', operationalGroup: 'tacho', countsAsMainCart: true, productionPerHour: null, suggestedUnitsPerEquivalentGuest: 1, lotSize: 1, priceUnit: 'portion80g', portionGrams: 80, unitPrice: 12, active: true, consignment: false };
  const dynamic = [...catalog, tacho];
  const fingerprint = productCatalogFingerprint(dynamic);
  const result = buildPlanningPreview({ ...input, catalogFingerprint: fingerprint, selectedProductIds: [...input.selectedProductIds, tacho.id] }, dynamic);
  assert.equal(result.items.find((p) => p.id === tacho.id).quantity, 50);
  assert.equal(result.carts.totalCarts, 2);
  const beverage = catalog.find((p) => p.consignment);
  const adjusted = buildPlanningPreview({ ...input, catalogFingerprint: fingerprint, items: [{ id: tacho.id, quantity: 50 }, { id: beverage.id, quantity: beverage.lotSize }] }, dynamic);
  assert.equal(adjusted.carts.totalCarts, 1);
});

test('preview handler uses only catalog reads and rejects untrusted requests', async () => {
  let reads = 0;
  const handler = createPlanningPreviewHandler({ catalogStore: { async listCatalog() { reads++; return catalog; } } });
  const res = { setHeader() {}, status(n) { this.code = n; return this; }, json(body) { this.body = body; } };
  await handler({ method: 'POST', headers: {}, body: input }, res);
  assert.equal(res.code, 403); assert.equal(reads, 0);
  await handler({ method: 'POST', headers: { host: 'localhost:4173', origin: 'http://localhost:4173' }, body: input }, res);
  assert.equal(res.code, 200); assert.equal(reads, 1);
});

test('retry preserves request ID and server fingerprint', async () => {
  const requests = [];
  const fetchImpl = async (_url, options) => { if (JSON.parse(options.body).action === "start") requests.push(JSON.parse(options.body)); return new Response(JSON.stringify({ ok: true })); };
  for (let n = 0; n < 2; n++) await startPlanningSession({ catalogFingerprint: input.catalogFingerprint }, { fetchImpl, clientRequestId: 'stable-request-123456789' });
  assert.equal(requests[0].clientRequestId, requests[1].clientRequestId);
  assert.equal(requests[0].catalogFingerprint, input.catalogFingerprint);
});

test('a stalled request aborts instead of leaving controls disabled indefinitely', async () => {
  const fetchImpl = (_url, { signal }) => new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new Error('aborted'))));
  await assert.rejects(fetchWithTimeout('/test', {}, fetchImpl, 10), /aborted/);
});
