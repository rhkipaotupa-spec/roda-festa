import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(
  new URL("../src/admin/AdminLogin.jsx", import.meta.url),
  "utf8",
);

test("frontend consulta sessao atual no carregamento", () => {
  assert.match(source, /useEffect/);
  assert.match(source, /const SESSION_ENDPOINT = "\/api\/admin-session"/);
  assert.match(source, /fetch\(SESSION_ENDPOINT/);
  assert.match(source, /method:\s*"GET"/);
  assert.match(source, /credentials:\s*"same-origin"/);
});

test("frontend restaura estado autenticado somente quando servidor confirma", () => {
  assert.match(source, /payload\.authenticated === true/);
  assert.match(source, /setStatus\("authenticated"\)/);
  assert.match(source, /Sessão administrativa restaurada com segurança/);
});

test("frontend mostra formulario quando sessao nao existe", () => {
  assert.match(source, /setStatus\("idle"\)/);
  assert.match(source, /Verificando sessão segura/);
  assert.match(source, /type="email"/);
  assert.match(source, /type="password"/);
});

test("frontend nao acessa cookie ou token administrativo diretamente", () => {
  assert.equal(/document\.cookie/.test(source), false);
  assert.equal(/rf_admin_session/.test(source), false);
  assert.equal(/localStorage/.test(source), false);
  assert.equal(/sessionStorage/.test(source), false);
});
