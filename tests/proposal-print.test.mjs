import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDocument, proposalFixture } from './helpers/proposal-document.mjs';
import { buildProposalComposition, captureProposalSnapshot } from '../src/planner/planning-book/proposalSummary.js';
import { buildProposalPresentation } from '../src/planner/planning-book/proposalPresentation.js';

test('final proposal composition preserves manually edited portions, history and all totals', () => {
  const draft = proposalFixture();
  const captured = captureProposalSnapshot(draft);
  draft.items[8].quantity = 999;
  assert.equal(captured.items[8].quantity, 23);
  assert.equal(captured.changesFromRecommendation[0].after, 23);
  assert.ok(Object.isFrozen(captured.items[8]));
  const lines = buildProposalComposition(captured);
  assert.equal(lines.reduce((sum, line) => sum + (line.value || 0), 0), 7249.10);
  const money = buildProposalPresentation(captured);
  assert.equal(money.estimatedEventTotal, 8554.10);
  assert.equal(money.estimatedEventPerPerson, 79.94);
  const html = buildDocument(captured);
  for (const text of ['23 porções de 150 g', '74 porções de 120 g', '6 garçons incluídos', 'Descartáveis incluídos', '4.299,10', '7.249,10', '1.305,00', '8.554,10', '79,94']) assert.ok(html.includes(text), text);
});

test('service inclusion follows final selection rather than a positive stored amount', () => {
  const snapshot = { ...proposalFixture(), waiters: 0, includeDisposables: false };
  const lines = buildProposalComposition(snapshot);
  assert.equal(lines[2].label, 'Garçons: não incluídos');
  assert.equal(lines[2].value, null);
  assert.equal(lines[3].label, 'Descartáveis: não incluídos');
  assert.equal(lines[3].value, null);
});

test('print groups omit empty categories, escape text and allow long tables to paginate', () => {
  const snapshot = proposalFixture();
  snapshot.items = [{ ...snapshot.items[0], name: '<script>alert(1)</script>' }, { ...snapshot.items[8], quantity: 0 }];
  const html = buildDocument(snapshot);
  assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
  assert.equal((html.match(/<table class="menu-group">/g) || []).length, 1);
  assert.ok(html.includes('.menu-group thead{display:table-header-group}'));
  assert.ok(html.includes('min-height:230mm'));
  assert.ok(!html.includes('min-height:297mm;padding:18mm;background:linear-gradient'));
  assert.ok(html.includes('font-size:10pt'));
});
