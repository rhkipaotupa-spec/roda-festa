function isOpaqueSupabaseApiKey(value) {
  return /^sb_(?:publishable|secret)_/.test(String(value || "").trim());
}

export function buildSupabaseRestHeaders(serverKey, { prefer } = {}) {
  const key = String(serverKey || "").trim();
  const headers = {
    "Content-Type": "application/json",
    apikey: key,
  };

  if (!isOpaqueSupabaseApiKey(key)) {
    headers.Authorization = `Bearer ${key}`;
  }

  if (prefer) headers.Prefer = prefer;
  return headers;
}
