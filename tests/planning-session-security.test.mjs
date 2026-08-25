import test from "node:test";
import assert from "node:assert/strict";
import {
  buildPlanningSessionCookie,
  createOpaqueSessionToken,
  hashSessionToken,
  isTrustedMutationRequest,
  parseCookies,
} from "../api/_lib/planning-session-security.js";

test("token anonimo tem alta entropia e somente hash deterministico e persistivel", () => {
  const a = createOpaqueSessionToken();
  const b = createOpaqueSessionToken();
  assert.notEqual(a, b);
  assert.ok(a.length >= 40);
  assert.match(hashSessionToken(a), /^[a-f0-9]{64}$/);
  assert.equal(hashSessionToken(a), hashSessionToken(a));
});

test("cookie de sessao e HttpOnly SameSite e Secure em producao", () => {
  const cookie = buildPlanningSessionCookie("segredo", { secure: true });
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Lax/);
  assert.match(cookie, /Secure/);
  assert.equal(parseCookies("a=1; rf_planning_session=abc%201").rf_planning_session, "abc 1");
});

test("mutacao exige origin confiavel", () => {
  const env = { RODA_FESTA_ALLOWED_ORIGINS: "https://rodafesta.example" };
  assert.equal(isTrustedMutationRequest({ headers: { origin: "https://rodafesta.example", host: "rodafesta.example" } }, env), true);
  assert.equal(isTrustedMutationRequest({ headers: { origin: "https://evil.example", host: "rodafesta.example" } }, env), false);
  assert.equal(isTrustedMutationRequest({ headers: { host: "rodafesta.example" } }, env), false);
});
