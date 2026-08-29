import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("V19.10D mantem identidade do operador derivada da sessao e sem nomes hardcoded no workspace", async () => {
  const [login, workspace, sessionEndpoint] = await Promise.all([
    read("src/admin/AdminLogin.jsx"),
    read("src/admin/AdminWorkspace.jsx"),
    read("api/admin-session.js"),
  ]);

  assert.match(login, /setOperator\(payload\.operator \|\| null\)/);
  assert.match(workspace, /operatorName/);
  assert.match(workspace, /rf-admin-operator-chip/);
  assert.match(workspace, /const firstOperatorName = rawOperatorName\.split\(\/\\s\+\/\)/);
  const quotesNav = workspace.match(/data-admin-section="quotes"[\s\S]*?<\/button>/)?.[0] || "";
  const agendaNav = workspace.match(/data-admin-section="agenda"[\s\S]*?<\/button>/)?.[0] || "";
  assert.equal(/<small>/.test(quotesNav), false);
  assert.equal(/<small>/.test(agendaNav), false);
  assert.match(sessionEndpoint, /operator:/);
  assert.match(sessionEndpoint, /metadataOperatorName/);
  assert.equal(/Adrielly/.test(workspace), false);
  assert.equal(/J[uú]lio/.test(workspace), false);
  assert.equal(/Adrielly/.test(sessionEndpoint), false);
  assert.equal(/J[uú]lio/.test(sessionEndpoint), false);
});

test("V19.10D cria orcamento a partir da data selecionada e Planner aceita somente prefill valido", async () => {
  const [agenda, planner] = await Promise.all([
    read("src/admin/AdminAgendaView.jsx"),
    read("src/planner/planning-book/PlanningBook.jsx"),
  ]);

  assert.match(agenda, /Criar orçamento para esta data/);
  assert.match(agenda, /eventDate: dateKey/);
  assert.match(agenda, /selectedDate >= today/);
  assert.match(planner, /getPrefilledEventDate/);
  assert.match(planner, /URLSearchParams\(window\.location\.search\)\.get\("eventDate"\)/);
  assert.match(planner, /candidate < getToday\(\)/);
  assert.match(planner, /useState\(\(\) => getPrefilledEventDate\(\)\)/);
});

test("V19.10D mostra proximos orcamentos sem inventar conflito operacional", async () => {
  const agenda = await read("src/admin/AdminAgendaView.jsx");

  assert.match(agenda, /Próximos orçamentos/);
  assert.match(agenda, /UPCOMING_WINDOW_DAYS = 21/);
  assert.match(agenda, /Hoje/);
  assert.match(agenda, /Amanhã/);
  assert.match(agenda, /Em \$\{days\} dias/);
  assert.match(agenda, /atenção operacional/);
  assert.equal(/conflito/i.test(agenda), false);
});

test("V19.10D reduz densidade vertical no Admin e mantem resumo mobile compacto", async () => {
  const [workspaceCss, agendaCss] = await Promise.all([
    read("src/admin/AdminWorkspace.css"),
    read("src/admin/AdminAgenda.css"),
  ]);

  assert.match(workspaceCss, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);/);
  assert.match(workspaceCss, /\.rf-admin-metric-help \{\s*display: none;/s);
  assert.match(agendaCss, /\.rf-admin-agenda__upcoming-list/);
  assert.match(agendaCss, /\.rf-admin-agenda-day__create/);
  assert.match(agendaCss, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);/);
});
