import { createAdminAuthenticator } from "./admin-authentication-contract.js";

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

export function createAdminAuthenticationComposition({
  sessionRepository,
  authorizationBoundary,
  cookieName,
  now = () => new Date(),
} = {}) {
  assertRepository(sessionRepository);
  assertBoundary(authorizationBoundary);

  const authenticator = createAdminAuthenticator({
    resolveSession: async ({ token }) => sessionRepository.resolveSession(token),
    cookieName,
    now,
  });

  async function authenticate({ cookieHeader } = {}) {
    return authenticator.authenticate({ cookieHeader });
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
