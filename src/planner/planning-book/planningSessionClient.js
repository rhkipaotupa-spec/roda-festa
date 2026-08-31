import { PRODUCTS } from "./engine/planningRules.js";
import { productCatalogFingerprint } from "./engine/productCatalog.js";

function createClientRequestId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  const random = Math.random().toString(36).slice(2);
  return `rf-${Date.now().toString(36)}-${random}-${random}`;
}

async function postPlanningSession(payload, fetchImpl = globalThis.fetch) {
  const response = await fetchImpl("/api/planning-sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(payload),
  });

  let body = null;
  try {
    body = await response.json();
  } catch {
    // Non-JSON responses are handled by the HTTP status checks below.
  }

  if (response.status === 503 && body?.error === "planning_persistence_unavailable") {
    return { available: false, reason: "planning_persistence_unavailable" };
  }
  if (!response.ok) {
    const error = new Error(body?.error || `planning_session_http_${response.status}`);
    error.status = response.status;
    throw error;
  }
  return { available: true, ...body };
}

function comparableRecommendation(snapshot) {
  return {
    versions: snapshot?.versions || null,
    items: [...(snapshot?.items || [])].map((item) => ({
      id: item.id,
      quantity: Number(item.quantity) || 0,
      unitPrice: Number(item.unitPrice) || 0,
      consignment: Boolean(item.consignment),
    })).sort((a, b) => String(a.id).localeCompare(String(b.id))),
    totalCarts: Number(snapshot?.totalCarts) || 0,
    investmentTotal: Number(snapshot?.investmentTotal) || 0,
  };
}

export function areRecommendationSnapshotsEquivalent(clientSnapshot, serverSnapshot) {
  return JSON.stringify(comparableRecommendation(clientSnapshot)) === JSON.stringify(comparableRecommendation(serverSnapshot));
}

export function isPlanningSessionPersistenceEnabled(env = import.meta.env) {
  return String(env?.VITE_PLANNING_SESSION_PERSISTENCE_ENABLED || "").toLowerCase() === "true";
}

export async function startPlanningSession(input, { fetchImpl = globalThis.fetch, clientRequestId = createClientRequestId() } = {}) {
  const catalogFingerprint = productCatalogFingerprint(Object.values(PRODUCTS));
  return postPlanningSession({ action: "start", clientRequestId, catalogFingerprint, ...input }, fetchImpl);
}

export async function finalizePlanningSession({ sessionId, expectedVersion, finalSnapshot }, { fetchImpl = globalThis.fetch } = {}) {
  return postPlanningSession({ action: "finalize", sessionId, expectedVersion, finalSnapshot }, fetchImpl);
}

export async function recordPlanningChanges({ sessionId, expectedVersion, changes }, { fetchImpl = globalThis.fetch } = {}) {
  return postPlanningSession({ action: "changes", sessionId, expectedVersion, changes }, fetchImpl);
}

export async function readPlanningJourney(sessionId, { fetchImpl = globalThis.fetch } = {}) {
  return postPlanningSession({ action: "read", sessionId }, fetchImpl);
}
