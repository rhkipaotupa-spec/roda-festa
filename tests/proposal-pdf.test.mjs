import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createProposalPdf } from '../src/planner/planning-book/proposalPdf.js';

const model = JSON.parse(fs.readFileSync(new URL('./fixtures/proposal-pdf-model.json', import.meta.url), 'utf8'));
test('Safari wedding regression generates real A4 PDF pages without browser printing', () => {
  const before = JSON.stringify(model);
  const pdf = createProposalPdf(model);
  assert.match(pdf.output(), /^%PDF-/);
  assert.equal(pdf.output('blob').type, 'application/pdf');
  assert.equal(pdf.getNumberOfPages(), 4);
  assert.ok(Math.abs(pdf.internal.pageSize.getWidth() - 210) < 0.01);
  assert.ok(Math.abs(pdf.internal.pageSize.getHeight() - 297) < 0.01);
  assert.equal(JSON.stringify(model), before, 'generation must not mutate final snapshot content');
});
test('large menu flows across physical pages while empty categories add no pages', () => {
  const rows = Array.from({length: 90}, (_, i) => [`Item ${i}`, '125 un.']);
  const large = createProposalPdf({...model, groups: [{title: 'Petiscos', rows}]});
  assert.ok(large.getNumberOfPages() > 4);
  const empty = createProposalPdf({...model, groups: []});
  const emptyGroup = createProposalPdf({...model, groups: [{title: 'Vazio', rows: []}]});
  assert.equal(empty.getNumberOfPages(), emptyGroup.getNumberOfPages());
});
