import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

function read(path) {
  return fs.readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
}

function ruleBody(css, selector, marker = '') {
  const scopeStart = marker ? css.indexOf(marker) : 0;
  assert.notEqual(scopeStart, -1, `marker ausente: ${marker}`);
  const scope = css.slice(scopeStart);
  const start = scope.indexOf(`${selector} {`);
  assert.notEqual(start, -1, `regra ausente: ${selector}`);
  const bodyStart = start + selector.length + 2;
  const end = scope.indexOf('}', bodyStart);
  assert.notEqual(end, -1, `regra sem fechamento: ${selector}`);
  return scope.slice(bodyStart, end);
}

const workspaceJsx = read('src/admin/AdminWorkspace.jsx');
const workspaceCss = read('src/admin/AdminWorkspace.css');
const agendaCss = read('src/admin/AdminAgenda.css');

const workspaceMarker = '/* V19.10F_MOBILE_BREATHING_ROOM */';
const agendaMarker = '/* V19.10F_AGENDA_PRIORITY */';

test('V19.10F mobile devolve respiro lateral real sem apertar telas estreitas', () => {
  assert.ok(workspaceCss.includes(workspaceMarker));
  assert.match(workspaceCss, /@media \(max-width: 720px\)[\s\S]*?\.rf-admin-main \{\s*padding: 0 20px 34px;/);
  assert.match(workspaceCss, /@media \(max-width: 390px\)[\s\S]*?\.rf-admin-main \{\s*padding-inline: 18px;/);
  assert.match(workspaceCss, /\.rf-admin-detail__content \{\s*padding: 18px 20px 92px;/);
});

test('V19.10F resumo mobile fica compacto e sem textos auxiliares gigantes', () => {
  const metricRule = ruleBody(workspaceCss, '.rf-admin-metrics', workspaceMarker);
  const metricArticleRule = ruleBody(workspaceCss, '.rf-admin-metrics article', workspaceMarker);
  const agendaMetricRule = ruleBody(agendaCss, '.rf-admin-agenda__metrics', agendaMarker);
  const agendaArticleRule = ruleBody(agendaCss, '.rf-admin-agenda__metrics article', agendaMarker);

  assert.ok(metricRule.includes('min-height: 0 !important;'));
  assert.ok(metricRule.includes('height: auto !important;'));
  assert.ok(metricArticleRule.includes('min-height: 62px;'));
  assert.ok(metricArticleRule.includes('align-content: center;'));
  assert.match(workspaceCss.slice(workspaceCss.indexOf(workspaceMarker)), /\.rf-admin-metrics \.rf-admin-metric-help \{\s*display: none !important;/);

  assert.ok(agendaMetricRule.includes('min-height: 0 !important;'));
  assert.ok(agendaMetricRule.includes('height: auto !important;'));
  assert.ok(agendaArticleRule.includes('min-height: 60px;'));
  assert.ok(agendaArticleRule.includes('align-content: center;'));
  assert.match(agendaCss.slice(agendaCss.indexOf(agendaMarker)), /\.rf-admin-agenda__metrics small \{\s*display: none !important;/);
});

test('V19.10F identidade logada aparece discretamente ao lado do menu mobile', () => {
  assert.ok(workspaceJsx.includes('className="rf-admin-mobile-session"'));
  assert.ok(workspaceJsx.includes('<small>Logado</small>'));
  assert.ok(workspaceJsx.includes('<strong>{operatorName}</strong>'));
  assert.match(workspaceCss.slice(workspaceCss.indexOf(workspaceMarker)), /\.rf-admin-mobile-session \{[\s\S]*?display: grid !important;/);
});

test('V19.10F calendario ganha prioridade vertical no mobile', () => {
  const agendaScope = agendaCss.slice(agendaCss.indexOf(agendaMarker));
  const boardOrder = agendaScope.match(/\.rf-admin-agenda__board \{[\s\S]*?order: 3;/);
  const upcomingOrder = agendaScope.match(/\.rf-admin-agenda__upcoming \{[\s\S]*?order: 4;/);
  assert.ok(boardOrder);
  assert.ok(upcomingOrder);
  assert.match(agendaScope, /\.rf-admin-agenda \{[\s\S]*?gap: 7px;/);
});

test('V19.10F retorno do detalhe vira acao flutuante inferior direita no celular', () => {
  assert.ok(workspaceJsx.includes('className="rf-admin-detail__back-icon"'));
  assert.ok(workspaceJsx.includes('className="rf-admin-detail__back-label"'));
  assert.ok(workspaceJsx.includes('Voltar para {activeSection === "agenda" ? "agenda" : "orçamentos"}'));
  const backRule = ruleBody(workspaceCss, '.rf-admin-detail__back', workspaceMarker);
  assert.ok(backRule.includes('position: fixed;'));
  assert.ok(backRule.includes('right: 18px;'));
  assert.ok(backRule.includes('bottom: calc(18px + env(safe-area-inset-bottom));'));
  assert.match(workspaceCss.slice(workspaceCss.indexOf(workspaceMarker)), /\.rf-admin-detail__back-label \{\s*display: none;/);
});
