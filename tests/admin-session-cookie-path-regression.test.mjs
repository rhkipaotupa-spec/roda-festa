import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAdminSessionSetCookie,
  buildAdminSessionClearCookie,
} from "../api/_lib/admin-auth-http-boundary.js";

function cookiePathMatches(cookiePath, requestPath) {
  if (cookiePath === "/") return requestPath.startsWith("/");
  if (!requestPath.startsWith(cookiePath)) return false;
  if (requestPath.length === cookiePath.length) return true;
  if (cookiePath.endsWith("/")) return true;
  return requestPath[cookiePath.length] === "/";
}

test("cookie administrativo alcanca tanto /admin quanto /api/admin-session", () => {
  const cookie = buildAdminSessionSetCookie("opaque", { production: true });
  const path = /(?:^|;\s*)Path=([^;]+)/.exec(cookie)?.[1];

  assert.equal(path, "/");
  assert.equal(cookiePathMatches(path, "/admin"), true);
  assert.equal(cookiePathMatches(path, "/api/admin-session"), true);
});

test("path legado /admin nao alcancaria endpoint de restauracao", () => {
  assert.equal(cookiePathMatches("/admin", "/admin"), true);
  assert.equal(cookiePathMatches("/admin", "/api/admin-session"), false);
});

test("cookie de limpeza usa o mesmo path do cookie de sessao atual", () => {
  const setCookie = buildAdminSessionSetCookie("opaque");
  const clearCookie = buildAdminSessionClearCookie();

  assert.match(setCookie, /(?:^|;\s*)Path=\//);
  assert.match(clearCookie, /(?:^|;\s*)Path=\//);
  assert.match(clearCookie, /Max-Age=0/);
});
