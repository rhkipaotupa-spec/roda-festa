import { createAdminAuthenticator } from "./admin-authentication-contract.js";
import { buildAdminPrincipal } from "./admin-authorization-boundary.js";

function assertRepository(repository) {
  if (!repository || typeof repository.resolveSession !== "function") {
    throw new Error("admin_auth_composition_session_repository_required");
  }
}

function assertBoundary(boundary) {
  if (!boundary || typeof boundary.assert !== "function" || typeof boundary.can !== "function") {
    throw new Error("admin_auth_composition_authorization_boundary_required");
  }
}

function assertIdentityResolver(resolveIdentityByUserId) {
  if (typeof resolveIdentityByUserId !== "function") {
    throw new Error("admin_auth_composition_identity_resolver_required");
  }
}

export function createAdminAuthenticationComposition({
  sessionRepository,
  authorizationBoundary,
  resolveIdentityByUserId,
  cookieName,
  now = () => new Date(),
} = {}) {
  assertRepository(sessionRepository);
  assertBoundary(authorizationBoundary);
  assertIdentityResolver(resolveIdentityByUserId);

  const authenticator = createAdminAuthenticator({
    resolveSession: async ({ token }) => sessionRepository.resolveSession(token),
    cookieName,
    now,
  });

  async function authenticate({ cookieHeader } = {}) {
    const session = await authenticator.authenticate({ cookieHeader });
    if (!session) return null;

    const userId = String(session?.principal?.userId || "").trim();
    if (!userId) return null;

    const identity = await resolveIdentityByUserId(userId);
    if (!identity || identity.active !== true) return null;
    if (String(identity.userId || "").trim() !== userId) return null;

    const principal = buildAdminPrincipal({
      userId: identity.userId,
      role: identity.role,
      capabilities: identity.capabilities,
      active: identity.active,
    });

    if (!authorizationBoundary.can(principal, null)) return null;

    return Object.freeze({
      sessionId: session.sessionId,
      issuedAt: session.issuedAt,
      expiresAt: session.expiresAt,
      principal,
      metadata: session.metadata ?? null,
    });
  }

  async function authorize({
    cookieHeader,
    requiredCapability = null,
  } = {}) {
    const session = await authenticate({ cookieHeader });
    authorizationBoundary.assert(session?.principal || null, requiredCapability);

    return Object.freeze({
      sessionId: session.sessionId,
      issuedAt: session.issuedAt,
      expiresAt: session.expiresAt,
      principal: session.principal,
    });
  }

  async function can({
    cookieHeader,
    requiredCapability = null,
  } = {}) {
    const session = await authenticate({ cookieHeader });
    if (!session) return false;
    return authorizationBoundary.can(session.principal, requiredCapability);
  }

  return Object.freeze({
    authenticate,
    authorize,
    can,
  });
}
