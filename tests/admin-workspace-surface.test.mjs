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
const enhancementCss = await readFile(
  new URL("../src/admin/AdminJourneyEnhancements.css", import.meta.url),
  "utf8",
);

test("login autenticado abre workspace real em vez de tela tecnica", () => {
  assert.match(login, /AdminWorkspace/);
});

test("workspace consulta somente endpoint admin same-origin", () => {
  assert.match(workspace, /const QUOTES_ENDPOINT = "\/api\/admin-quotes"/);
  assert.match(workspace, /fetch\(\s*`\$\{QUOTES_ENDPOINT\}\?/);
  assert.match(workspace, /credentials:\s*"same-origin"/);
  assert.equal(/SUPABASE_SERVICE_ROLE_KEY/.test(workspace), false);
  assert.equal(/SUPABASE_URL/.test(workspace), false);
});

test("cards explicam acompanhado aguardando validacao e validados", () => {
  assert.match(workspace, /Todo orçamento que entrou no histórico/);
  assert.match(workspace, /Tem sugestão do motor salva/);
  assert.match(workspace, /Já têm proposta final concluída/);
});

test("detalhe separa produtos do motor e servicos opcionais", () => {
  assert.match(workspace, /crianças 7\+/);
  assert.match(workspace, /crianças 0–6/);
  assert.match(workspace, /Da sugestão do motor à proposta final/);
  assert.match(workspace, /Motor x versão final/);
  assert.match(workspace, /somente os produtos que pertencem ao domínio/);
  assert.match(workspace, /Serviços escolhidos/);
  assert.match(workspace, /não recomendações do motor/);
  assert.match(workspace, /buildSelectedServices/);
  assert.match(workspace, /buildServiceHistory/);
  assert.match(workspace, /Histórico de serviços/);
  assert.match(workspace, /changeLabel\(item\.change\)/);
});

test("workspace continua responsivo com comparacao e servicos", () => {
  assert.match(enhancementCss, /\.rf-admin-item-comparison/);
  assert.match(enhancementCss, /\.rf-admin-service-state/);
  assert.match(enhancementCss, /\.rf-admin-service-history/);
  assert.match(enhancementCss, /@media \(max-width: 720px\)/);
  assert.match(enhancementCss, /@media \(max-width: 420px\)/);
});
