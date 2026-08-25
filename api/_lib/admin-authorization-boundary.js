const DEFAULT_ADMIN_ROLES = Object.freeze(["OWNER", "ADMIN"]);

function normalizeRole(value) {
  return String(value || "").trim().toUpperCase();
}

function normalizeCapability(value) {
  return String(value || "").trim();
}

export function buildAdminPrincipal({
  userId,
  role,
  capabilities = [],
  active = true,
} = {}) {
  const normalizedUserId = String(userId || "").trim();
  if (!normalizedUserId) throw new Error("admin_principal_missing_user_id");

  const normalizedRole = normalizeRole(role);
  if (!normalizedRole) throw new Error("admin_principal_missing_role");

  const normalizedCapabilities = [...new Set(
    (Array.isArray(capabilities) ? capabilities : [])
      .map(normalizeCapability)
      .filter(Boolean),
  )].sort();

  return Object.freeze({
    userId: normalizedUserId,
    role: normalizedRole,
    capabilities: Object.freeze(normalizedCapabilities),
    active: Boolean(active),
  });
}

export function canAccessAdmin(principal, {
  allowedRoles = DEFAULT_ADMIN_ROLES,
  requiredCapability = null,
} = {}) {
  if (!principal?.active) return false;

  const roles = new Set(
    (Array.isArray(allowedRoles) ? allowedRoles : [])
      .map(normalizeRole)
      .filter(Boolean),
  );

  if (!roles.has(normalizeRole(principal.role))) return false;

  if (!requiredCapability) return true;

  const capability = normalizeCapability(requiredCapability);
  return Array.isArray(principal.capabilities)
    && principal.capabilities.includes(capability);
}

export function assertAdminAccess(principal, options = {}) {
  if (!principal) throw new Error("admin_authentication_required");
  if (!principal.active) throw new Error("admin_account_inactive");
  if (!canAccessAdmin(principal, options)) throw new Error("admin_forbidden");
  return true;
}

export function createAdminAuthorizationBoundary({
  allowedRoles = DEFAULT_ADMIN_ROLES,
} = {}) {
  const roles = Object.freeze(
    [...new Set(
      (Array.isArray(allowedRoles) ? allowedRoles : [])
        .map(normalizeRole)
        .filter(Boolean),
    )],
  );

  if (roles.length === 0) throw new Error("admin_boundary_requires_role");

  return Object.freeze({
    allowedRoles: roles,
    assert(principal, requiredCapability = null) {
      return assertAdminAccess(principal, {
        allowedRoles: roles,
        requiredCapability,
      });
    },
    can(principal, requiredCapability = null) {
      return canAccessAdmin(principal, {
        allowedRoles: roles,
        requiredCapability,
      });
    },
  });
}
