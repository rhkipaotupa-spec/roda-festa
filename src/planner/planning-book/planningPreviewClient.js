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
