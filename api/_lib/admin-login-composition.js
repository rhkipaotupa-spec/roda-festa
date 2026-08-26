export function createAdminLoginComposition({
  verifyCredential,
  authHttpBoundary,
} = {}) {
  if (typeof verifyCredential !== "function") {
    throw new Error("admin_login_credential_verifier_required");
  }

  if (!authHttpBoundary || typeof authHttpBoundary.login !== "function") {
    throw new Error("admin_login_http_boundary_required");
  }

  return Object.freeze({
    async login(request) {
      return authHttpBoundary.login(request, {
        verifyCredential,
      });
    },
  });
}
