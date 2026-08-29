import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

function read(path) {
  return fs.readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
}

function ruleBody(css, selector, marker) {
  const scopeStart = css.indexOf(marker);
  assert.notEqual(scopeStart, -1, `marker ausente: ${marker}`);
  const scope = css.slice(scopeStart);
  const start = scope.indexOf(`${selector} {`);
  assert.notEqual(start, -1, `regra ausente: ${selector}`);
  const bodyStart = start + selector.length + 2;
  const end = scope.indexOf('}', bodyStart);
  assert.notEqual(end, -1, `regra sem fechamento: ${selector}`);
  return scope.slice(bodyStart, end);
}

const globalCss = read('src/styles/global.css');
const workspaceCss = read('src/admin/AdminWorkspace.css');
const agendaCss = read('src/admin/AdminAgenda.css');
const workspaceJsx = read('src/admin/AdminWorkspace.jsx');

const workspaceMarker = '/* V19.10G_COMPACT_MOBILE_SECTIONS */';
const agendaMarker = '/* V19.10G_COMPACT_AGENDA_SECTIONS */';

test('V19.10G neutraliza padding global de section nos resumos mobile', () => {
  assert.match(globalCss, /section\s*\{\s*padding:\s*var\(--spacing-2xl\) 0;/);

  const metric = ruleBody(workspaceCss, '.rf-admin-metrics', workspaceMarker);
  const agendaMetric = ruleBody(agendaCss, '.rf-admin-agenda__metrics', agendaMarker);

  assert.ok(metric.includes('padding: 0 !important;'));
  assert.ok(agendaMetric.includes('padding: 0 !important;'));
});

test('V19.10G mantem indicadores compactos sem altura editorial artificial', () => {
  const metricArticle = ruleBody(workspaceCss, '.rf-admin-metrics article', workspaceMarker);
  const agendaArticle = ruleBody(agendaCss, '.rf-admin-agenda__metrics article', agendaMarker);

  assert.ok(metricArticle.includes('min-height: 62px;'));
  assert.ok(metricArticle.includes('align-content: center;'));
  assert.ok(agendaArticle.includes('min-height: 60px;'));
  assert.ok(agendaArticle.includes('align-content: center;'));
});

test('V19.10G remove o grande vazio antes do calendario no mobile', () => {
  const board = ruleBody(agendaCss, '.rf-admin-agenda__board', agendaMarker);
  assert.ok(board.includes('padding: 0 !important;'));
});

test('V19.10G nao exibe sessionId tecnico abaixo do nome do cliente', () => {
  assert.equal(workspaceJsx.includes('<p>{selectedQuote.sessionId}</p>'), false);
  assert.ok(workspaceJsx.includes('<h2>{selectedQuote?.client?.name || "Cliente"}</h2>'));
});
