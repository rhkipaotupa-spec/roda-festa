import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const routes = fs.readFileSync("src/routes/AppRoutes.jsx", "utf8");
const login = fs.readFileSync("src/admin/AdminLogin.jsx", "utf8");
const css = fs.readFileSync("src/admin/AdminLogin.css", "utf8");

test("rota admin nasce isolada sem alterar rotas publicas", () => {
  for (const route of ["/", "/planner", "/planner-sandbox", "/book-cover", "/planning-book", "/admin"]) {
    assert.match(routes, new RegExp(`path="${route.replace("/", "\\/")}"`));
  }
  assert.match(routes, /import AdminLogin from "\.\.\/admin\/AdminLogin"/);
});

test("login visual nao contem credencial ou secret fixo", () => {
  assert.doesNotMatch(login, /valid-secret|service_role|SUPABASE_SERVICE|password\s*[:=]\s*["'][^"']+/i);
  assert.match(login, /type="password"/);
  assert.match(login, /autoComplete="current-password"/);
});

test("login visual ainda nao finge autenticacao real", () => {
  assert.doesNotMatch(login, /\bfetch\s*\(/);
  assert.match(login, /ativação de credenciais reais será feita em uma etapa segura posterior/);
});

test("shell admin e mobile-first e acessivel", () => {
  assert.match(login, /aria-labelledby="admin-login-title"/);
  assert.match(login, /role="status"/);
  assert.match(css, /min-height:\s*100dvh/);
  assert.match(css, /width:\s*min\(100%,\s*430px\)/);
  assert.match(css, /@media \(min-width:\s*720px\)/);
});
