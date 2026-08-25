import { buildAdminPrincipal } from "./admin-authorization-boundary.js";

export const DEFAULT_ADMIN_SESSION_COOKIE = "rf_admin_session";

function parseCookieHeader(cookieHeader) {
  const result = new Map();
  for (const segment of String(cookieHeader || "").split(";")) {
    const index = segment.indexOf("=");
    if (index <= 0) continue;
    const name = segment.slice(0, index).trim();
    const value = segment.slice(index + 1).trim();
    if (name && !result.has(name)) result.set(name, value);
  }
  return result;
}

function parseTimestamp(value, field) {
  const time = Date.parse(String(value || ""));
  if (!Number.isFinite(time)) throw new Error(`admin_session_invalid_${field}`);
  return time;
}

function normalizeTrustedSession(session, nowMs) {
  if (!session || typeof session !== "object") throw new Error("admin_session_invalid");

  const sessionId = String(session.sessionId || "").trim();
  if (!sessionId) throw new Error("admin_session_missing_id");

  const issuedAtMs = parseTimestamp(session.issuedAt, "issued_at");
  const expiresAtMs = parseTimestamp(session.expiresAt, "expires_at");
  if (expiresAtMs <= issuedAtMs) throw new Error("admin_session_invalid_lifetime");
  if (issuedAtMs > nowMs + 60_000) throw new Error("admin_session_not_yet_valid");
  if (expiresAtMs <= nowMs) throw new Error("admin_session_expired");

  const principal = buildAdminPrincipal({
    userId: session.userId,
    role: session.role,
    capabilities: session.capabilities,
    active: session.active !== false,
  });

  return Object.freeze({
    sessionId,
    issuedAt: new Date(issuedAtMs).toISOString(),
    expiresAt: new Date(expiresAtMs).toISOString(),
    principal,
  });
}

export function extractAdminSessionToken(
  cookieHeader,
  cookieName = DEFAULT_ADMIN_SESSION_COOKIE,
) {
  const name = String(cookieName || "").trim();
  if (!name) throw new Error("admin_session_cookie_name_required");
  const value = parseCookieHeader(cookieHeader).get(name);
  return value ? decodeURIComponent(value) : null;
}

export function buildAdminSessionCookieContract({
  cookieName = DEFAULT_ADMIN_SESSION_COOKIE,
  maxAgeSeconds = 60 * 60 * 8,
  production = false,
} = {}) {
  const name = String(cookieName || "").trim();
  const maxAge = Number(maxAgeSeconds);
  if (!name) throw new Error("admin_session_cookie_name_required");
  if (!Number.isInteger(maxAge) || maxAge <= 0) throw new Error("admin_session_cookie_max_age_invalid");

  return Object.freeze({
    name,
    httpOnly: true,
    sameSite: "Lax",
    secure: Boolean(production),
    path: "/admin",
    maxAgeSeconds: maxAge,
  });
}

export function createAdminAuthenticator({
  resolveSession,
  cookieName = DEFAULT_ADMIN_SESSION_COOKIE,
  now = () => new Date(),
} = {}) {
  if (typeof resolveSession !== "function") {
    throw new Error("admin_session_resolver_required");
  }
  if (typeof now !== "function") throw new Error("admin_clock_required");

  return Object.freeze({
    async authenticate({ cookieHeader } = {}) {
      const token = extractAdminSessionToken(cookieHeader, cookieName);
      if (!token) return null;

      const current = now();
      const nowMs = current instanceof Date ? current.getTime() : Date.parse(String(current));
      if (!Number.isFinite(nowMs)) throw new Error("admin_clock_invalid");

      const trustedSession = await resolveSession({ token, now: new Date(nowMs) });
      if (!trustedSession) return null;
      return normalizeTrustedSession(trustedSession, nowMs);
    },
  });
}
