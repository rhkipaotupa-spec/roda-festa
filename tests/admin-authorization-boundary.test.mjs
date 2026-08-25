import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAdminPrincipal,
  canAccessAdmin,
  assertAdminAccess,
  createAdminAuthorizationBoundary,
} from "../api/_lib/admin-authorization-boundary.js";

test("principal administrativo normaliza role e capabilities", () => {
  const principal = buildAdminPrincipal({
    userId: "adrielly",
    role: "owner",
    capabilities: ["journey:read", "journey:read", "pricing:write"],
  });

  assert.equal(principal.role, "OWNER");
  assert.deepEqual(principal.capabilities, ["journey:read", "pricing:write"]);
  assert.equal(principal.active, true);
});

test("acesso admin falha fechado sem principal", () => {
  assert.equal(canAccessAdmin(null), false);
  assert.throws(() => assertAdminAccess(null), /admin_authentication_required/);
});

test("role nao administrativa e bloqueada", () => {
  const principal = buildAdminPrincipal({
    userId: "cliente-1",
    role: "customer",
  });

  assert.equal(canAccessAdmin(principal), false);
  assert.throws(() => assertAdminAccess(principal), /admin_forbidden/);
});

test("conta administrativa inativa e bloqueada antes de capability", () => {
  const principal = buildAdminPrincipal({
    userId: "admin-1",
    role: "admin",
    active: false,
    capabilities: ["journey:read"],
  });

  assert.equal(canAccessAdmin(principal, { requiredCapability: "journey:read" }), false);
  assert.throws(
    () => assertAdminAccess(principal, { requiredCapability: "journey:read" }),
    /admin_account_inactive/,
  );
});

test("capability explicita e exigida quando definida", () => {
  const principal = buildAdminPrincipal({
    userId: "owner-1",
    role: "owner",
    capabilities: ["journey:read"],
  });

  assert.equal(canAccessAdmin(principal, { requiredCapability: "journey:read" }), true);
  assert.equal(canAccessAdmin(principal, { requiredCapability: "pricing:write" }), false);
});

test("boundary permite roles configuradas sem espalhar regra pela API", () => {
  const boundary = createAdminAuthorizationBoundary({
    allowedRoles: ["OWNER", "ADMIN"],
  });

  const owner = buildAdminPrincipal({
    userId: "owner-1",
    role: "OWNER",
    capabilities: ["journey:read"],
  });

  const manager = buildAdminPrincipal({
    userId: "manager-1",
    role: "MANAGER",
    capabilities: ["journey:read"],
  });

  assert.equal(boundary.can(owner, "journey:read"), true);
  assert.equal(boundary.can(manager, "journey:read"), false);
  assert.equal(boundary.assert(owner, "journey:read"), true);
});

test("boundary nao nasce sem pelo menos uma role administrativa", () => {
  assert.throws(
    () => createAdminAuthorizationBoundary({ allowedRoles: [] }),
    /admin_boundary_requires_role/,
  );
});
