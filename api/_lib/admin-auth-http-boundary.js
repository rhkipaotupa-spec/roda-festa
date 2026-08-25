import {
  DEFAULT_ADMIN_SESSION_COOKIE,
  buildAdminSessionCookieContract,
  extractAdminSessionToken,
} from "./admin-authentication-contract.js";

function normalizeOrigin(value) {
  try {
    return new URL(String(value || "")).origin;
  } catch {
    return "";
  }
}

export function isTrustedAdminMutationRequest(request, env = process.env) {
  const origin = normalizeOrigin(request?.headers?.origin || "");
  if (!origin) return false;

  const configured = String(env.RODA_FESTA_ADMIN_ALLOWED_ORIGINS || "")
    .split(",")
    .map((value) => normalizeOrigin(value.trim()))
    .filter(Boolean);

  if (configured.includes(origin)) return true;

  const host = String(
    request?.headers?.["x-forwarded-host"] ||
    request?.headers?.host ||
    "",
  ).trim();
  if (!host) return false;

  const proto = String(
    request?.headers?.["x-forwarded-proto"] ||
    (host.startsWith("localhost") ? "http" : "https"),
  );

  return origin === `${proto}://${host}`;
}

function serializeCookie({
  name,
  value,
  httpOnly,
  sameSite,
  secure,
  path,
  maxAgeSeconds,
}) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    `Path=${path}`,
    `SameSite=${sameSite}`,
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (httpOnly) parts.push("HttpOnly");
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export function buildAdminSessionSetCookie(token, {
  production = false,
  cookieName = DEFAULT_ADMIN_SESSION_COOKIE,
  maxAgeSeconds = 60 * 60 * 8,
} = {}) {
  const contract = buildAdminSessionCookieContract({
    cookieName,
    maxAgeSeconds,
    production,
  });
  return serializeCookie({
    ...contract,
    value: token,
  });
}

export function buildAdminSessionClearCookie({
  production = false,
  cookieName = DEFAULT_ADMIN_SESSION_COOKIE,
} = {}) {
  const contract = buildAdminSessionCookieContract({
    cookieName,
    maxAgeSeconds: 1,
    production,
  });
  return serializeCookie({
    ...contract,
    value: "",
    maxAgeSeconds: 0,
  });
}

function assertPost(request) {
  if (String(request?.method || "").toUpperCase() !== "POST") {
    throw new Error("admin_auth_http_method_not_allowed");
  }
}

function assertTrustedOrigin(request, env) {
  if (!isTrustedAdminMutationRequest(request, env)) {
    throw new Error("admin_auth_http_untrusted_origin");
  }
}

function assertCredentialVerifier(credentialVerifier) {
  if (typeof credentialVerifier !== "function") {
    throw new Error("admin_auth_http_credential_verifier_required");
  }
}

function assertSessionRepository(sessionRepository) {
  const required = ["createSession", "resolveSession", "revokeSession", "rotateSession"];
  for (const method of required) {
    if (typeof sessionRepository?.[method] !== "function") {
      throw new Error(`admin_auth_http_session_repository_missing:${method}`);
    }
  }
}

function assertComposition(composition) {
  if (typeof composition?.authenticate !== "function") {
    throw new Error("admin_auth_http_composition_required");
  }
}

function publicSession(session) {
  return Object.freeze({
    sessionId: session.sessionId,
    issuedAt: session.issuedAt,
    expiresAt: session.expiresAt,
    principal: session.principal,
  });
}

export function createAdminAuthHttpBoundary({
  sessionRepository,
  authenticationComposition,
  credentialVerifier,
  env = process.env,
  production = env.NODE_ENV === "production",
  cookieName = DEFAULT_ADMIN_SESSION_COOKIE,
  sessionTtlMs = 8 * 60 * 60 * 1000,
} = {}) {
  assertSessionRepository(sessionRepository);
  assertComposition(authenticationComposition);
  assertCredentialVerifier(credentialVerifier);

  const ttlMs = Number(sessionTtlMs);
  if (!Number.isFinite(ttlMs) || ttlMs <= 0) {
    throw new Error("admin_auth_http_session_ttl_invalid");
  }

  async function login(request) {
    assertPost(request);
    assertTrustedOrigin(request, env);

    const identifier = String(request?.body?.identifier || "").trim();
    const credential = String(request?.body?.credential || "");
    if (!identifier || !credential) {
      throw new Error("admin_auth_http_credentials_required");
    }

    const identity = await credentialVerifier({ identifier, credential });
    if (!identity || typeof identity !== "object") {
      throw new Error("admin_auth_http_invalid_credentials");
    }

    const created = await sessionRepository.createSession({
      userId: identity.userId,
      role: identity.role,
      capabilities: identity.capabilities || [],
      ttlMs,
      metadata: identity.metadata ?? null,
    });

    const authenticated = await authenticationComposition.authenticate({
      cookieHeader: `${cookieName}=${encodeURIComponent(created.token)}`,
    });

    if (!authenticated) {
      await sessionRepository.revokeSession(created.session.id);
      throw new Error("admin_auth_http_session_bootstrap_failed");
    }

    return Object.freeze({
      status: 200,
      setCookie: buildAdminSessionSetCookie(created.token, {
        production,
        cookieName,
        maxAgeSeconds: Math.floor(ttlMs / 1000),
      }),
      body: Object.freeze({
        ok: true,
        session: publicSession(authenticated),
      }),
    });
  }

  async function logout(request) {
    assertPost(request);
    assertTrustedOrigin(request, env);

    const authenticated = await authenticationComposition.authenticate({
      cookieHeader: request?.headers?.cookie || "",
    });

    if (authenticated) {
      await sessionRepository.revokeSession(authenticated.sessionId);
    }

    return Object.freeze({
      status: 200,
      setCookie: buildAdminSessionClearCookie({
        production,
        cookieName,
      }),
      body: Object.freeze({ ok: true }),
    });
  }

  async function refresh(request) {
    assertPost(request);
    assertTrustedOrigin(request, env);

    const cookieHeader = request?.headers?.cookie || "";
    const authenticated = await authenticationComposition.authenticate({
      cookieHeader,
    });
    if (!authenticated) {
      throw new Error("admin_authentication_required");
    }

    const currentToken = extractAdminSessionToken(cookieHeader, cookieName);
    if (!currentToken) throw new Error("admin_authentication_required");

    const rotated = await sessionRepository.rotateSession({
      sessionId: authenticated.sessionId,
      currentToken,
    });

    const nextAuthenticated = await authenticationComposition.authenticate({
      cookieHeader: `${cookieName}=${encodeURIComponent(rotated.token)}`,
    });
    if (!nextAuthenticated) {
      throw new Error("admin_auth_http_refresh_bootstrap_failed");
    }

    return Object.freeze({
      status: 200,
      setCookie: buildAdminSessionSetCookie(rotated.token, {
        production,
        cookieName,
        maxAgeSeconds: Math.floor(ttlMs / 1000),
      }),
      body: Object.freeze({
        ok: true,
        session: publicSession(nextAuthenticated),
      }),
    });
  }

  return Object.freeze({
    login,
    logout,
    refresh,
  });
}
