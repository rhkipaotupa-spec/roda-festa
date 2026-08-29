import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync('src/admin/AdminWorkspace.css', 'utf8').replace(/\r\n/g, '\n');
const jsx = fs.readFileSync('src/admin/AdminWorkspace.jsx', 'utf8').replace(/\r\n/g, '\n');

function cssBlock(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return css.match(new RegExp(`${escaped} \\{([\\s\\S]*?)\\}`))?.[0] || '';
}

test('drawer mobile continua expondo acao Sair da conta', () => {
  assert.match(jsx, /className="rf-admin-mobile-drawer__logout"/);
  assert.match(jsx, /Sair da conta/);
  assert.match(jsx, /onClick=\{requestLogout\}/);
});

test('logout mobile tem contraste visivel sobre drawer claro', () => {
  const block = cssBlock('.rf-admin-mobile-drawer__logout');
  assert.ok(block, 'bloco CSS do logout mobile deve existir');
  assert.match(block, /width: 100%;/);
  assert.match(block, /margin: 12px 0 0;/);
  assert.match(block, /background: var\(--rf-admin-ink\);/);
  assert.match(block, /color: #fff4df;/);
});

test('abas administrativas selecionadas usam o marrom de identidade', () => {
  const block = cssBlock('.rf-admin-quote-views button.is-active');
  assert.ok(block, 'bloco CSS da aba ativa deve existir');
  assert.match(block, /background: var\(--rf-admin-ink\);/);
  assert.doesNotMatch(block, /#5c1a20/);
});

test('marcador da microcorrecao esta presente', () => {
  assert.match(css, /V19\.10J_R5_MOBILE_VISIBILITY_AND_BROWN_TABS/);
});
