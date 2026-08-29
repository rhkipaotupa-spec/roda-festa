import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

function read(path) {
  return fs.readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
}

function ruleBody(css, selector) {
  const start = css.indexOf(`${selector}{`);
  assert.notEqual(start, -1, `regra ausente: ${selector}`);
  const bodyStart = start + selector.length + 1;
  const end = css.indexOf('}', bodyStart);
  assert.notEqual(end, -1, `regra sem fechamento: ${selector}`);
  return css.slice(bodyStart, end);
}

const source = read('src/planner/planning-book/PlanningBook.jsx');
const start = source.indexOf('function buildProposalHtml(snapshot) {');
const end = source.indexOf('\nfunction ', start + 1);
assert.notEqual(start, -1);
assert.notEqual(end, -1);
const pdfBuilder = source.slice(start, end);
const marker = pdfBuilder.indexOf('V19.10G_PDF_SUMMARY_ONLY');
assert.notEqual(marker, -1);
const scoped = pdfBuilder.slice(marker, pdfBuilder.indexOf('</style>', marker));

test('V19.10G restaura integralmente a linguagem escura da capa anterior', () => {
  assert.equal(pdfBuilder.includes('V19.10F_PDF_CLEAN_CONTINUITY'), false);
  assert.match(pdfBuilder, /\.cover\{[^}]*background:linear-gradient\(145deg,#4c2c22,#2f1a12\);color:#f7ead4/);
  assert.match(pdfBuilder, /\.page\.cover\{[^}]*background:linear-gradient\(145deg,#4c2c22,#2f1a12\)!important;color:#f7ead4!important/);
  assert.equal(scoped.includes('.cover{'), false);
  assert.equal(scoped.includes('.page.cover{'), false);
});

test('V19.10G altera somente a pagina intermediaria do resumo e cardapio', () => {
  assert.ok(pdfBuilder.includes('<section class="page summary-page">'));
  assert.equal((pdfBuilder.match(/class="page summary-page"/g) || []).length, 1);

  const facts = ruleBody(scoped, '.summary-page .facts');
  const fact = ruleBody(scoped, '.summary-page .fact');
  const menu = ruleBody(scoped, '.summary-page .menu-group');
  const menuTitle = ruleBody(scoped, '.summary-page .menu-group h3');

  assert.ok(facts.includes('border-top:1px solid #d8bd96'));
  assert.ok(fact.includes('background:transparent'));
  assert.ok(fact.includes('box-shadow:none'));
  assert.ok(menu.includes('background:#fffaf1'));
  assert.ok(menu.includes('box-shadow:none'));
  assert.ok(menuTitle.includes('background:#f4e7d4'));
  assert.ok(menuTitle.includes('color:#4c2c22'));
});

test('V19.10G preserva a pagina final de investimento e condicoes', () => {
  assert.ok(pdfBuilder.includes('<section class="page investment-page">'));
  assert.match(pdfBuilder, /\.money-card--contracted\{background:#4c2c22;color:#fff1dd;border-color:#4c2c22\}/);
  assert.match(pdfBuilder, /\.terms-head\{[^}]*background:linear-gradient\(135deg,#4c2c22,#321c13\);color:#f7ead4\}/);
  assert.ok(pdfBuilder.includes('<h1>Investimento</h1>'));
  assert.ok(pdfBuilder.includes('<div class="terms-grid">'));
});

test('V19.10G mantem protecoes de impressao e espera por recursos', () => {
  assert.match(pdfBuilder, /Array\.from\(document\.images\)/);
  assert.match(pdfBuilder, /document\.fonts&&document\.fonts\.ready/);
  assert.match(pdfBuilder, /requestAnimationFrame/);
  assert.match(pdfBuilder, /window\.setTimeout\(\(\)=>\{window\.focus\(\);window\.print\(\);\},600\)/);
});
