import crypto from "node:crypto";

export const PLANNING_SESSION_COOKIE = "rf_planning_session";
const TOKEN_BYTES = 32;

export function createOpaqueSessionToken() {
  return crypto.randomBytes(TOKEN_BYTES).toString("base64url");
}

export function hashSessionToken(token) {
  return crypto.createHash("sha256").update(String(token || ""), "utf8").digest("hex");
}

export function parseCookies(cookieHeader = "") {
  return Object.fromEntries(String(cookieHeader).split(";").map((part) => {
    const index = part.indexOf("=");
    if (index < 0) return null;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (!key) return null;
    try { return [key, decodeURIComponent(value)]; } catch { return [key, value]; }
  }).filter(Boolean));
}

export function getPlanningSessionToken(request) {
  return parseCookies(request?.headers?.cookie || "")[PLANNING_SESSION_COOKIE] || "";
}

export function buildPlanningSessionCookie(token, { secure = true, maxAgeSeconds = 60 * 60 * 24 * 30 } = {}) {
  const parts = [
    `${PLANNING_SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

function normalizeOrigin(value) {
  try { return new URL(value).origin; } catch { return ""; }
}

export function isTrustedMutationRequest(request, env = process.env) {
  const origin = normalizeOrigin(request?.headers?.origin || "");
  if (!origin) return false;

  const configured = String(env.RODA_FESTA_ALLOWED_ORIGINS || "")
    .split(",")
    .map((value) => normalizeOrigin(value.trim()))
    .filter(Boolean);
  if (configured.includes(origin)) return true;

  const host = String(request?.headers?.["x-forwarded-host"] || request?.headers?.host || "").trim();
  if (!host) return false;
  const proto = String(request?.headers?.["x-forwarded-proto"] || (host.startsWith("localhost") ? "http" : "https"));
  return origin === `${proto}://${host}`;
}
