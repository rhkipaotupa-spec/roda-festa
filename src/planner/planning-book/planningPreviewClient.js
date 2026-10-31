export async function fetchWithTimeout(url, options = {}, fetchImpl = globalThis.fetch, timeoutMs = 20000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchImpl(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function calculatePlanningPreview(input) {
  const response = await fetchWithTimeout('/api/planning-preview', {
    method: 'POST', credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const body = await response.json();
  if (!response.ok || !body.ok) throw new Error(body.error || 'planning_preview_unavailable');
  return body.suggestion;
}

// Resolve only the drink being added. Unselected catalog entries must never
// participate in this calculation, and existing/manual quantities stay intact.
export async function recommendAdditionalBeverage(input, product, calculate = calculatePlanningPreview) {
  const result = await calculate({ ...input, items: undefined,
    selectedProductIds: [product.id], includeBeverages: true });
  const quantity = Number(result?.items?.find((item) => item.id === product.id)?.quantity);
  const lot = Number(product.lotSize);
  if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(lot) || lot <= 0
      || Math.abs(quantity / lot - Math.round(quantity / lot)) > 1e-8) {
    throw new Error('planning_beverage_recommendation_unavailable');
  }
  return quantity;
}
