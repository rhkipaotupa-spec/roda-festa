import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const workspace = await readFile(
  new URL("../src/admin/AdminWorkspace.jsx", import.meta.url),
  "utf8",
);
const agenda = await readFile(
  new URL("../src/admin/AdminAgendaView.jsx", import.meta.url),
  "utf8",
);
const agendaCss = await readFile(
  new URL("../src/admin/AdminAgenda.css", import.meta.url),
  "utf8",
);

test("V19.10C adiciona Agenda como segunda superficie real sem remover Orcamentos", () => {
  assert.match(workspace, /import AdminAgendaView from "\.\/AdminAgendaView\.jsx"/);
  assert.match(workspace, /initialSection = "quotes"/);
  assert.match(workspace, /useState\(initialSection\)/);
  assert.match(workspace, /setActiveSection\("quotes"\)/);
  assert.match(workspace, /setActiveSection\("agenda"\)/);
  assert.match(workspace, /data-admin-section="quotes"/);
  assert.match(workspace, /data-admin-section="agenda"/);
  assert.match(workspace, />Or\u00e7amentos</);
  assert.match(workspace, />Agenda</);
  assert.match(workspace, /<AdminAgendaView onOpenQuote=\{openQuote\}/);
});

test("V19.10C Agenda consulta somente endpoint admin same-origin por intervalo mensal", () => {
  assert.match(agenda, /const AGENDA_ENDPOINT = "\/api\/admin-agenda"/);
  assert.match(agenda, /\?from=\$\{encodeURIComponent\(range\.from\)\}&to=\$\{encodeURIComponent\(range\.to\)\}/);
  assert.match(agenda, /credentials:\s*"same-origin"/);
  assert.equal(/SUPABASE_SERVICE_ROLE_KEY/.test(agenda), false);
  assert.equal(/SUPABASE_URL/.test(agenda), false);
});

test("V19.10C calendario mensal deriva eventos da data autoritativa sem agenda paralela", () => {
  assert.match(agenda, /event\?\.event\?\.date/);
  assert.match(agenda, /eventsByDate/);
  assert.match(agenda, /buildCalendarCells/);
  assert.match(agenda, /dayEvents\.length === 1 \? "evento" : "eventos"/);
  assert.equal(/localStorage/.test(agenda), false);
  assert.equal(/agenda_events|create table|insert into/i.test(agenda), false);
});

test("V19.10C nao inventa conflito nem validacao humana na Agenda", () => {
  assert.match(agenda, /Proposta finalizada/);
  assert.match(agenda, /Em elabora\u00e7\u00e3o/);
  assert.match(agenda, /Mais de um evento/);
  assert.equal(/\bValidado\b/.test(agenda), false);
  assert.equal(/conflito/i.test(agenda), false);
});

test("V19.10C clique no evento reaproveita drawer de Orcamentos", () => {
  assert.match(agenda, /onClick=\{\(\) => onOpenQuote\?\.\(event\)\}/);
  assert.match(agenda, /Ver or\u00e7amento/);
  assert.match(workspace, /async function openQuote\(quote\)/);
  assert.match(workspace, /\$\{QUOTES_ENDPOINT\}\?id=/);
});

test("V19.10C/V19.10E mantem Agenda acessivel no mobile com navegacao evoluida para drawer", () => {
  assert.match(workspace, /rf-admin-mobile-menu-trigger/);
  assert.match(workspace, /rf-admin-mobile-drawer/);
  assert.match(workspace, /switchSection\("agenda"\)/);
  assert.match(agendaCss, /@media \(max-width: 980px\) and \(min-width: 721px\)/);
  assert.match(agendaCss, /button\[data-admin-section="agenda"\]::before/);
  assert.match(agendaCss, /@media \(max-width: 720px\)/);
  assert.match(agendaCss, /\.rf-admin-mobile-nav\s*\{[\s\S]*?display:\s*none\s*!important/);
  assert.match(agendaCss, /@media \(max-width: 420px\)/);
});

test("V19.10C preserva o conteudo funcional aprovado de Orcamentos", () => {
  assert.match(workspace, /Central de atendimento/);
  assert.match(workspace, /Or\u00e7amentos recentes/);
  assert.match(workspace, /Da sugest\u00e3o do motor \u00e0 proposta final/);
  assert.match(workspace, /Motor x vers\u00e3o final/);
  assert.match(workspace, /Servi\u00e7os escolhidos/);
  assert.match(workspace, /buildSelectedServices/);
  assert.match(workspace, /buildServiceHistory/);
});
