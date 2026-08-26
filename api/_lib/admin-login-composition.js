import { createAdminAuthHttpBoundary } from "./admin-auth-http-boundary.js";

function assertVerifier(verifyCredential) {
  if (typeof verifyCredential !== "function") {
    throw new Error("admin_login_credential_verifier_required");
  }
}

function assertBoundaryFactory(createHttpBoundary) {
  if (typeof createHttpBoundary !== "function") {
    throw new Error("admin_login_http_boundary_factory_required");
  }
}

export function createAdminLoginComposition({
  verifyCredential,
  sessionRepository,
  authenticationComposition,
  env = process.env,
  production = env.NODE_ENV === "production",
  cookieName,
  sessionTtlMs,
  createHttpBoundary = createAdminAuthHttpBoundary,
} = {}) {
  assertVerifier(verifyCredential);
  assertBoundaryFactory(createHttpBoundary);

  const authHttpBoundary = createHttpBoundary({
    sessionRepository,
    authenticationComposition,
    credentialVerifier: verifyCredential,
    env,
    production,
    cookieName,
    sessionTtlMs,
  });

  if (!authHttpBoundary || typeof authHttpBoundary.login !== "function") {
    throw new Error("admin_login_http_boundary_required");
  }

  return Object.freeze({
    login(request) {
      return authHttpBoundary.login(request);
    },
  });
}
