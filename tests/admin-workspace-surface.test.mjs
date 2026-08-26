import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const login = await readFile(
  new URL("../src/admin/AdminLogin.jsx", import.meta.url),
  "utf8",
);
const workspace = await readFile(
  new URL("../src/admin/AdminWorkspace.jsx", import.meta.url),
  "utf8",
);
const workspaceCss = await readFile(
  new URL("../src/admin/AdminWorkspace.css", import.meta.url),
  "utf8",
);

test("login autenticado abre workspace real em vez de tela tecnica", () => {
  assert.match(login, /import AdminWorkspace/);
  assert.match(login, /if \(isAuthenticated\)/);
  assert.match(login, /<AdminWorkspace sessionMessage=\{message\} \/>/);
});

test("workspace consulta somente endpoint admin same-origin", () => {
  assert.match(workspace, /const QUOTES_ENDPOINT = "\/api\/admin-quotes"/);
  assert.match(workspace, /fetch\(QUOTES_ENDPOINT/);
  assert.match(workspace, /credentials:\s*"same-origin"/);
  assert.equal(/SUPABASE_SERVICE_ROLE_KEY/.test(workspace), false);
  assert.equal(/SUPABASE_URL/.test(workspace), false);
});

test("workspace expoe novo orcamento e leitura sugestao-validacao", () => {
  assert.match(workspace, /Novo orçamento/);
  assert.match(workspace, /\/planning-book\?admin=1/);
  assert.match(workspace, /Sugestão do motor/);
  assert.match(workspace, /Versão validada/);
  assert.match(workspace, /Base para aprendizado/);
});

test("workspace nasce responsivo e coerente com paleta do Planning Book", () => {
  assert.match(workspaceCss, /#641d22/);
  assert.match(workspaceCss, /#c99a4d/);
  assert.match(workspaceCss, /#fbf3e6/);
  assert.match(workspaceCss, /@media \(max-width: 720px\)/);
});
