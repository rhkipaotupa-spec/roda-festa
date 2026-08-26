import { createAdminAuthorizationBoundary } from "./admin-authorization-boundary.js";
import { createAdminAuthenticationComposition } from "./admin-authentication-composition.js";
import { createAdminCredentialVerifier } from "./admin-credential-verification.js";
import { createSupabaseAdminIdentityStore } from "./admin-identity-adapters/supabase.js";
import { createAdminLoginComposition } from "./admin-login-composition.js";
import { createAdminSessionRepository } from "./admin-session-repository.js";
import { createSupabaseAdminSessionAdapter } from "./admin-session-adapters/supabase.js";

function assertRuntimeConfig(env) {
  const url = String(env?.SUPABASE_URL || "").trim();
  const serviceRoleKey = String(env?.SUPABASE_SERVICE_ROLE_KEY || "").trim();

  if (!url || !serviceRoleKey) {
    throw new Error("admin_runtime_persistence_not_configured");
  }
}

function assertFetch(fetchImpl) {
  if (typeof fetchImpl !== "function") {
    throw new Error("admin_runtime_fetch_required");
  }
}

export function createAdminRuntime({
  env = process.env,
  fetchImpl = globalThis.fetch,
  now = () => new Date(),
  tokenFactory,
  allowedRoles = ["OWNER", "ADMIN"],
  cookieName,
  sessionTtlMs,
  production = env.NODE_ENV === "production",
  createIdentityStore = createSupabaseAdminIdentityStore,
  createSessionAdapter = createSupabaseAdminSessionAdapter,
  createSessionRepository = createAdminSessionRepository,
  createAuthorizationBoundary = createAdminAuthorizationBoundary,
  createAuthenticationComposition = createAdminAuthenticationComposition,
  createCredentialVerifier = createAdminCredentialVerifier,
  createLoginComposition = createAdminLoginComposition,
} = {}) {
  assertRuntimeConfig(env);
  assertFetch(fetchImpl);

  const identityStore = createIdentityStore({
    env,
    fetchImpl,
  });

  if (!identityStore || typeof identityStore.findByIdentifier !== "function") {
    throw new Error("admin_runtime_identity_store_invalid");
  }

  const verifyCredential = createCredentialVerifier({
    findByIdentifier: identityStore.findByIdentifier,
  });

  const sessionAdapter = createSessionAdapter({
    env,
    fetchImpl,
  });

  const sessionRepository = createSessionRepository(sessionAdapter, {
    now,
    ...(tokenFactory ? { tokenFactory } : {}),
  });

  const authorizationBoundary = createAuthorizationBoundary({
    allowedRoles,
  });

  const authenticationComposition = createAuthenticationComposition({
    sessionRepository,
    authorizationBoundary,
    cookieName,
    now,
  });

  const loginComposition = createLoginComposition({
    verifyCredential,
    sessionRepository,
    authenticationComposition,
    env,
    production,
    cookieName,
    sessionTtlMs,
  });

  return Object.freeze({
    loginComposition,
    authenticationComposition,
    authorizationBoundary,
  });
}
