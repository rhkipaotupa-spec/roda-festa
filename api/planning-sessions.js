import crypto from "node:crypto";
import {
  ENGINE_VERSIONS,
  PRODUCTS,
  generatePlanningSuggestion,
} from "../src/planner/planning-book/engine/planningRules.js";
import {
  compareRecommendationToFinal,
  createRecommendationSnapshot,
} from "../src/planner/planning-book/engine/planningHistory.js";
import { rebuildAuthoritativeSnapshot } from "./planning-submissions.js";
import {
  buildPlanningSessionCookie,
  createOpaqueSessionToken,
  getPlanningSessionToken,
  hashSessionToken,
  isTrustedMutationRequest,
} from "./_lib/planning-session-security.js";
import { createPlanningSessionRuntime } from "./_lib/planning-session-runtime.js";

const MAX_BODY_BYTES = 120_000;
const MAX_PRODUCTS = 100;
const EVENT_TYPES = new Set(["infantil", "casamento", "corporativo"]);
const PRODUCT_BY_ID = new Map(Object.values(PRODUCTS).map((product) => [product.id, product]));
const PLANNING_CHANGE_TYPES = new Set([
  "ITEM_QUANTITY_CHANGED", "ITEM_ADDED", "ITEM_REMOVED", "ITEM_REPLACED",
  "CATEGORY_ADDED", "CATEGORY_REMOVED", "SERVICE_ADDED", "SERVICE_REMOVED",
]);
const PLANNING_SERVICES = new Set(["WAITERS", "DISPOSABLES"]);
const MAX_CHANGE_BATCH = 50;

function localBusinessDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${byType.year}-${byType.month}-${byType.day}`;
}

function normalizeEventDate(value, now = new Date()) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return value >= localBusinessDate(now) ? value : null;
}

function normalizeNonNegativeInteger(value, max = 1000) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0 || number > max) return null;
  return number;
}

function normalizeStartInput(body) {
  const clientRequestId = String(body.clientRequestId || "").trim();
  if (!/^[a-zA-Z0-9_-]{16,120}$/.test(clientRequestId)) throw new Error("invalid_client_request_id");

  const eventDate = normalizeEventDate(body.eventDate);
  if (!eventDate) throw new Error("invalid_event_date");

  const adults = normalizeNonNegativeInteger(body.adults, 500);
  const olderChildren = normalizeNonNegativeInteger(body.olderChildren, 500);
  const children = normalizeNonNegativeInteger(body.children, 500);
  const duration = normalizeNonNegativeInteger(body.duration, 24);
  if ([adults, olderChildren, children, duration].some((value) => value === null) || adults + olderChildren + children <= 0 || duration < 4) {
    throw new Error("invalid_event_context");
  }

  const selectedProductIds = Array.isArray(body.selectedProductIds) ? [...new Set(body.selectedProductIds.map(String))] : [];
  if (selectedProductIds.length === 0 || selectedProductIds.length > MAX_PRODUCTS) throw new Error("invalid_product_selection");
  for (const id of selectedProductIds) {
    if (!PRODUCT_BY_ID.get(id)?.active) throw new Error(`unknown_product:${id}`);
  }

  const clientName = String(body.clientName || "").trim().slice(0, 160);
  const phone = String(body.phone || "").trim().slice(0, 80);
  const phoneDigits = phone.replace(/\D/g, "");
  const email = String(body.email || "").trim().slice(0, 254) || null;
  const eventType = String(body.eventType || "").trim();
  if (clientName.length < 2 || phoneDigits.length < 10) throw new Error("invalid_contact");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("invalid_email");
  if (!EVENT_TYPES.has(eventType)) throw new Error("invalid_event_type");

  return {
    clientRequestId,
    clientName,
    phone,
    email,
    eventType,
    eventDate,
    adults,
    olderChildren,
    children,
    duration,
    selectedProductIds,
    includeWaiters: Boolean(body.includeWaiters),
    includeDisposables: Boolean(body.includeDisposables),
  };
}

export function buildAuthoritativeRecommendation(input) {
  const includeBeverages = input.selectedProductIds.some((id) => PRODUCT_BY_ID.get(id)?.consignment);
  const planningAdults = input.adults + input.olderChildren;
  const realGuests = planningAdults + input.children;
  const equivalentGuests = planningAdults + input.children * 0.5;
  const suggestion = generatePlanningSuggestion({
    adults: planningAdults,
    children: input.children,
    serviceHours: input.duration,
    selectedProductIds: input.selectedProductIds,
    includeWaiters: input.includeWaiters,
    includeDisposables: input.includeDisposables,
    includeBeverages,
    additionalProductIds: [],
  });

  const context = {
    eventType: input.eventType,
    eventDate: input.eventDate,
    adults: input.adults,
    olderChildren: input.olderChildren,
    children: input.children,
    realGuests,
    equivalentGuests,
    duration: input.duration,
  };

  return {
    inputSnapshot: {
      ...context,
      selectedProductIds: [...input.selectedProductIds],
      includeWaiters: input.includeWaiters,
      includeDisposables: input.includeDisposables,
    },
    recommendationSnapshot: createRecommendationSnapshot({
      suggestion,
      context,
      versions: suggestion.versions || ENGINE_VERSIONS,
    }),
  };
}

export async function startPlanningSessionCommand({ body, token, repository, idFactory = () => crypto.randomUUID() }) {
  const input = normalizeStartInput(body || {});
  if (!token) throw new Error("planning_session_token_required");
  const authoritative = buildAuthoritativeRecommendation(input);
  const created = await repository.create({
    id: idFactory(),
    clientRequestId: input.clientRequestId,
    tokenHash: hashSessionToken(token),
    source: "planner-web",
    inputSnapshot: authoritative.inputSnapshot,
    recommendationSnapshot: authoritative.recommendationSnapshot,
  });
  await repository.touchContact({
    sessionId: created.session.id,
    tokenHash: hashSessionToken(token),
    clientName: input.clientName,
    phone: input.phone,
    email: input.email,
  });
  return {
    sessionId: created.session.id,
    version: Number(created.session.version) || 1,
    created: created.created,
    recommendation: authoritative.recommendationSnapshot,
  };
}

function normalizePlanningChange(change, { now = new Date(), idFactory = () => crypto.randomUUID() } = {}) {
  const type = String(change?.type || "");
  if (!PLANNING_CHANGE_TYPES.has(type)) throw new Error("invalid_planning_change_type");
  const normalized = { id: idFactory(), type, actor: "CLIENT", recordedAt: now.toISOString() };

  if (type.startsWith("ITEM_")) {
    const productId = String(change.productId || "").trim();
    const fromProductId = String(change.fromProductId || "").trim();
    const toProductId = String(change.toProductId || "").trim();
    for (const id of [productId, fromProductId, toProductId].filter(Boolean)) {
      if (!PRODUCT_BY_ID.has(id)) throw new Error(`unknown_product:${id}`);
    }
    if (type === "ITEM_REPLACED") {
      if (!fromProductId || !toProductId || fromProductId === toProductId) throw new Error("invalid_item_replacement");
      normalized.fromProductId = fromProductId;
      normalized.toProductId = toProductId;
    } else {
      if (!productId) throw new Error("invalid_product_change");
      normalized.productId = productId;
    }
    if (change.beforeQuantity != null) normalized.beforeQuantity = normalizeNonNegativeInteger(change.beforeQuantity, 100000);
    if (change.afterQuantity != null) normalized.afterQuantity = normalizeNonNegativeInteger(change.afterQuantity, 100000);
    if ((change.beforeQuantity != null && normalized.beforeQuantity === null) || (change.afterQuantity != null && normalized.afterQuantity === null)) throw new Error("invalid_change_quantity");
  }

  if (type.startsWith("CATEGORY_")) {
    const category = String(change.category || "").trim().slice(0, 120);
    if (!category) throw new Error("invalid_change_category");
    normalized.category = category;
  }

  if (type.startsWith("SERVICE_")) {
    const service = String(change.service || "").trim().toUpperCase();
    if (!PLANNING_SERVICES.has(service)) throw new Error("invalid_change_service");
    normalized.service = service;
  }
  return normalized;
}

export async function appendPlanningChangesCommand({ body, token, repository, now = new Date(), idFactory = () => crypto.randomUUID() }) {
  const sessionId = String(body?.sessionId || "").trim();
  const expectedVersion = Number(body?.expectedVersion);
  const rawChanges = Array.isArray(body?.changes) ? body.changes : [];
  if (!sessionId || !Number.isInteger(expectedVersion) || expectedVersion < 1 || !token) throw new Error("invalid_change_context");
  if (rawChanges.length === 0 || rawChanges.length > MAX_CHANGE_BATCH) throw new Error("invalid_change_batch");
  const tokenHash = hashSessionToken(token);
  const owned = await repository.getOwned({ sessionId, tokenHash });
  if (!owned) throw new Error("planning_session_not_found");
  const changes = rawChanges.map((change) => normalizePlanningChange(change, { now, idFactory }));
  const result = await repository.appendChanges({ sessionId, tokenHash, changes, expectedVersion });
  return { sessionId, version: Number(result.session.version), appended: result.appended, changes };
}

export async function readPlanningJourneyCommand({ body, token, repository }) {
  const sessionId = String(body?.sessionId || "").trim();
  if (!sessionId || !token) throw new Error("invalid_read_context");

  const journey = await repository.getJourney({
    sessionId,
    tokenHash: hashSessionToken(token),
  });
  if (!journey) throw new Error("planning_session_not_found");

  return {
    sessionId,
    journey,
  };
}

export async function finalizePlanningSessionCommand({ body, token, repository }) {
  const sessionId = String(body?.sessionId || "").trim();
  const expectedVersion = Number(body?.expectedVersion);
  if (!sessionId || !Number.isInteger(expectedVersion) || expectedVersion < 1 || !token) throw new Error("invalid_finalize_context");

  const tokenHash = hashSessionToken(token);
  const owned = await repository.getOwned({ sessionId, tokenHash });
  if (!owned) throw new Error("planning_session_not_found");
  if (!owned.recommendation_snapshot) throw new Error("planning_session_recommendation_missing");

  const submittedFinal = { ...(body.finalSnapshot || {}) };
  // proposal code is server-owned; never trust/reuse the browser sequence as authority.
  delete submittedFinal.code;
  if (!Array.isArray(submittedFinal.items) || !normalizeEventDate(submittedFinal.eventDate)) throw new Error("invalid_final_snapshot");
  const origin = owned.input_snapshot || {};
  for (const field of ["eventDate", "eventType", "adults", "olderChildren", "children", "duration"]) {
    if (String(submittedFinal[field] ?? "") !== String(origin[field] ?? "")) throw new Error(`planning_context_mismatch:${field}`);
  }
  if (owned.client_name && String(submittedFinal.clientName || "").trim() !== String(owned.client_name).trim()) throw new Error("planning_context_mismatch:clientName");
  if (owned.phone && String(submittedFinal.phone || "").trim() !== String(owned.phone).trim()) throw new Error("planning_context_mismatch:phone");

  const authoritativeFinal = rebuildAuthoritativeSnapshot(submittedFinal);
  const changes = compareRecommendationToFinal(owned.recommendation_snapshot, authoritativeFinal.items);
  const finalized = await repository.finalize({
    sessionId,
    tokenHash,
    finalSnapshot: {
      ...authoritativeFinal,
      recommendationOriginal: owned.recommendation_snapshot,
      changesFromRecommendation: changes,
    },
    changes,
    expectedVersion,
  });

  const proposalCode = String(finalized.session?.final_proposal_snapshot?.code || "");
  if (!/^RF-\d{6}-\d{5}$/.test(proposalCode)) throw new Error("planning_proposal_code_missing");

  return {
    sessionId,
    version: Number(finalized.session.version),
    finalized: finalized.finalized,
    idempotent: finalized.idempotent,
    proposalCode,
    authoritativeTotal: authoritativeFinal.investmentTotal,
    changes,
  };
}

function sendError(response, status, error) {
  return response.status(status).json({ error });
}

export default async function handler(request, response) {
  if (request.method !== "POST") return sendError(response, 405, "method_not_allowed");
  if (!isTrustedMutationRequest(request)) return sendError(response, 403, "untrusted_origin");

  const raw = JSON.stringify(request.body || {});
  if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) return sendError(response, 413, "payload_too_large");

  let repository;
  try {
    repository = createPlanningSessionRuntime();
  } catch (error) {
    if (["planning_persistence_disabled", "planning_persistence_not_configured"].includes(error?.message)) {
      return sendError(response, 503, "planning_persistence_unavailable");
    }
    console.error("planning_session_runtime_error", error?.message || error);
    return sendError(response, 500, "planning_persistence_configuration_error");
  }

  const action = String(request.body?.action || "");
  let token = getPlanningSessionToken(request);
  let setCookie = false;
  if (!token && action === "start") {
    token = createOpaqueSessionToken();
    setCookie = true;
  }

  try {
    if (action === "start") {
      const result = await startPlanningSessionCommand({ body: request.body, token, repository });
      if (setCookie) {
        const secure = process.env.NODE_ENV === "production";
        response.setHeader("Set-Cookie", buildPlanningSessionCookie(token, { secure }));
      }
      return response.status(result.created ? 201 : 200).json({ ok: true, ...result });
    }

    if (action === "changes") {
      const result = await appendPlanningChangesCommand({ body: request.body, token, repository });
      return response.status(200).json({ ok: true, ...result });
    }

    if (action === "read") {
      const result = await readPlanningJourneyCommand({ body: request.body, token, repository });
      return response.status(200).json({ ok: true, ...result });
    }

    if (action === "finalize") {
      const result = await finalizePlanningSessionCommand({ body: request.body, token, repository });
      return response.status(200).json({ ok: true, ...result });
    }

    return sendError(response, 400, "unsupported_action");
  } catch (error) {
    const message = String(error?.message || "");
    if (message.includes("not_found")) return sendError(response, 404, "planning_session_not_found");
    if (message.includes("concurrent_update")) return sendError(response, 409, "planning_session_concurrent_update");
    if (message.includes("already_finalized")) return sendError(response, 409, "planning_session_already_finalized");
    if (message.startsWith("commercial_")) return sendError(response, 409, "commercial_validation_failed");
    console.error("planning_session_command_error", message || error);
    return sendError(response, 400, "invalid_planning_session_request");
  }
}
