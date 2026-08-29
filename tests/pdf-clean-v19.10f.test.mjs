import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

function ruleBody(css, selector) {
  const start = css.indexOf(`${selector}{`);
  assert.notEqual(start, -1, `regra ausente: ${selector}`);
  const bodyStart = start + selector.length + 1;
  const end = css.indexOf('}', bodyStart);
  assert.notEqual(end, -1, `regra sem fechamento: ${selector}`);
  return css.slice(bodyStart, end);
}

const source = fs.readFileSync('src/planner/planning-book/PlanningBook.jsx', 'utf8').replace(/\r\n/g, '\n');
const start = source.indexOf('function buildProposalHtml(snapshot) {');
const end = source.indexOf('\nfunction ', start + 1);
assert.notEqual(start, -1);
assert.notEqual(end, -1);
const pdfBuilder = source.slice(start, end);
const marker = pdfBuilder.indexOf('V19.10F_PDF_CLEAN_CONTINUITY');
assert.notEqual(marker, -1);
const clean = pdfBuilder.slice(marker);

test('V19.10F PDF aproxima capa da linguagem clean da pagina final', () => {
  const coverRule = ruleBody(clean, '.cover');
  const logoRule = ruleBody(clean, '.cover img');
  const titleRule = ruleBody(clean, '.cover h1');
  const chipsRule = ruleBody(clean, '.chips span');

  assert.ok(coverRule.includes('background:#fbf5e9'));
  assert.ok(coverRule.includes('color:#432b20'));
  assert.ok(logoRule.includes('background:#4c2c22'));
  assert.ok(logoRule.includes('border-radius:5mm'));
  assert.ok(titleRule.includes('color:#4c2c22'));
  assert.ok(chipsRule.includes('background:#fffaf1'));
  assert.ok(chipsRule.includes('color:#6d503d'));
});

test('V19.10F PDF clareia resumo e cardapio sem mexer na pagina de investimento', () => {
  const factRule = ruleBody(clean, '.fact');
  const menuRule = ruleBody(clean, '.menu-group');
  const menuTitleRule = ruleBody(clean, '.menu-group h3');

  assert.ok(factRule.includes('box-shadow:none'));
  assert.ok(factRule.includes('background:#fffdf8'));
  assert.ok(menuRule.includes('box-shadow:none'));
  assert.ok(menuRule.includes('border-left:1.2mm solid #4c2c22'));
  assert.ok(menuTitleRule.includes('color:#4c2c22'));
  assert.ok(menuTitleRule.includes('background:#f4e7d4'));

  assert.match(pdfBuilder, /\.money-card--contracted\{background:#4c2c22/);
  assert.match(pdfBuilder, /\.terms-head\{[\s\S]*?background:linear-gradient\(135deg,#4c2c22,#321c13\)/);
});

test('V19.10F impressao usa a capa clara como regra final da cascata', () => {
  const printCoverRule = ruleBody(clean, '.page.cover');
  assert.ok(printCoverRule.includes('background:#fbf5e9!important'));
  assert.ok(printCoverRule.includes('color:#432b20!important'));
  assert.ok(marker > pdfBuilder.indexOf('background:linear-gradient(145deg,#4c2c22,#2f1a12)!important'));
});
