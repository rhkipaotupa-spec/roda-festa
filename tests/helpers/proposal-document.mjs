import fs from 'node:fs';
import vm from 'node:vm';
import { buildProposalComposition } from '../../src/planner/planning-book/proposalSummary.js';
import { buildProposalPresentation } from '../../src/planner/planning-book/proposalPresentation.js';

const source = fs.readFileSync(new URL('../../src/planner/planning-book/PlanningBook.jsx', import.meta.url), 'utf8');
const start = source.indexOf('function escapeHtml(');
const end = source.indexOf('function Progress(', start);
export const buildDocument = vm.runInNewContext(source.slice(start, end) + '\nbuildProposalHtml;', {
  buildProposalComposition, buildProposalPresentation,
  CATEGORY_ORDER: ['Petiscos', 'Mini lanches', 'Tortas', 'Doces', 'Bolos', 'Brigadeiro no tacho', 'Bebidas'],
  COMMERCIAL_TERMS: { contact: '(14) 99896-0208', instagram: '@rodafesta' },
  formatCurrency: (value) => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
});

export function proposalFixture() {
  const rows = [
    ['Petiscos', 'Coxinha', 125], ['Petiscos', 'Kibe', 125], ['Petiscos', 'Risole', 125], ['Petiscos', 'Bolinha de queijo', 125], ['Petiscos', 'Pastel', 125],
    ['Mini lanches', 'Hot dog', 65], ['Mini lanches', 'X-Burguer', 65], ['Mini lanches', 'Sanduíche', 65],
    ['Tortas', 'Torta de frango', 23, '150 g'], ['Tortas', 'Torta de palmito', 24, '150 g'],
    ['Bolos', 'Bolo de chocolate', 73, '120 g'], ['Bolos', 'Bolo de coco', 74, '120 g'],
    ['Bebidas', 'Suco 200 ml', 180], ['Bebidas', 'Refrigerante 200 ml', 90],
  ];
  return {
    code: 'RF-TESTE-LOCAL', clientName: 'Cliente de demonstração', phone: 'Não informado', eventLabel: 'Festa Infantil',
    eventDate: '2026-11-11', eventDateLabel: '11/11/2026', realGuests: 107, adults: 50, olderChildren: 32, children: 25,
    duration: 4, totalCarts: 3, preparers: 3, waiters: 6, includeDisposables: true,
    investmentTotal: 7249.10, consignmentTotal: 1305,
    investment: { productsValue: 4299.10, cartsValue: 900, waitersValue: 1200, disposablesValue: 850, additionalHoursValue: 0 },
    items: rows.map(([commercialCategory, name, quantity, portion], i) => ({ id: `test-${i}`, commercialCategory, name, quantity, quantityLabel: portion ? `${quantity} porções de ${portion}` : `${quantity} un.` })),
    changesFromRecommendation: [{ type: 'ITEM_QUANTITY_CHANGED', productId: 'test-8', before: 25, after: 23 }],
    logoUrl: '',
  };
}
