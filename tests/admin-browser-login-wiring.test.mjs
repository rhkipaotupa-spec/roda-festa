import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(
  new URL("../src/admin/AdminLogin.jsx", import.meta.url),
  "utf8",
);

test("login visual chama somente o endpoint administrativo same-origin", () => {
  assert.match(source, /const LOGIN_ENDPOINT = "\/api\/admin-login"/);
  assert.match(source, /fetch\(LOGIN_ENDPOINT/);
  assert.match(source, /credentials:\s*"same-origin"/);
});

test("login visual envia apenas identifier e credential em JSON", () => {
  assert.match(source, /JSON\.stringify\(\{\s*identifier,\s*credential,?\s*\}\)/s);
  assert.equal(/SUPABASE_SERVICE_ROLE_KEY/.test(source), false);
  assert.equal(/SUPABASE_URL/.test(source), false);
});

test("login visual exige resposta HTTP e contrato ok verdadeiro", () => {
  assert.match(source, /!response\.ok \|\| payload\?\.ok !== true/);
  assert.match(source, /setStatus\("authenticated"\)/);
});

test("falha de login permanece neutra e nao exibe erro interno", () => {
  assert.match(source, /GENERIC_LOGIN_ERROR/);
  assert.equal(/payload\?\.error/.test(source), false);
  assert.equal(/error\.message/.test(source), false);
});

test("senha e limpa da memoria React apos autenticacao", () => {
  assert.match(source, /setCredential\(""\)/);
});

test("formulario bloqueia submit durante verificacao, autenticacao ou sessao ativa", () => {
  assert.match(
    source,
    /if \(isChecking \|\| isSubmitting \|\| isAuthenticated\) return/,
  );
  assert.match(source, /disabled=\{isSubmitting\}/);
  assert.match(source, /aria-busy=\{isSubmitting\}/);
});

test("interface nao finge navegacao para dashboard inexistente", () => {
  assert.equal(/useNavigate/.test(source), false);
  assert.equal(/window\.location/.test(source), false);
  assert.match(source, /Sua sessão administrativa foi criada/);
});
