import test from 'node:test';
import assert from 'node:assert/strict';
import { generateR4ProductionSuggestion } from '../src/planner/planning-book/engine/r4ProductionRecommendation.js';
import { baseProductCatalog, productCatalogFingerprint } from '../src/planner/planning-book/engine/productCatalog.js';
import { buildPlanningPreview } from '../api/planning-preview.js';
import { getOperationalCapacityWarnings } from '../src/admin/operationalCapacity.js';

const catalog = baseProductCatalog();
const pies = ['torta-camarao-catupiry', 'torta-carne-louca-cheddar', 'torta-frango-catupiry'];
const cakes = catalog.filter(p => p.commercialCategory === 'Bolos').map(p => p.id);
const ids = ['bolinha-queijo-bacon', 'braxola-carne', 'braxola-queijo', 'coxinha-frango-catupiry', 'enroladinho-salsicha', ...pies.slice(0, 2), 'brigadeiro-chocolate', 'suco-laranja-200ml'];
const input = { adults: 50, olderChildren: 50, children: 50, serviceHours: 4, includeWaiters: true, includeDisposables: true, selectedProductIds: ids, productCatalog: catalog };
const total = (result, category) => result.items.filter(p => p.commercialCategory === category).reduce((sum, p) => sum + p.quantity, 0);

for (const guests of [{adults:50,olderChildren:50,children:50},{adults:30,olderChildren:10,children:10}]) {
  for (const hours of [4, 6]) {
    for (const [category, flavors] of [['Tortas', pies], ['Bolos', cakes]]) {
      test(`${category} total invariant across 1/2/3 flavors at ${Object.values(guests).reduce((a,b)=>a+b)} guests, ${hours}h`, () => {
        const results = [1,2,3].map(n => generateR4ProductionSuggestion({...input,...guests,serviceHours:hours, selectedProductIds:['coxinha-frango-catupiry','brigadeiro-chocolate',...flavors.slice(0,n)]}));
        assert.equal(total(results[0],category), total(results[1],category));
        assert.equal(total(results[1],category), total(results[2],category));
        for (const r of results) {
          const quantities = r.items.filter(p=>p.commercialCategory===category).map(p=>p.quantity);
          assert.ok(Math.max(...quantities)-Math.min(...quantities)<=1);
          assert.ok(r.investment.reconciliation.ok);
        }
      });
    }
  }
}
test('sweets retain five per equivalent guest regardless of cake presence or flavors', () => {
  for (const n of [0,1,2,3]) {
    const r=generateR4ProductionSuggestion({...input,selectedProductIds:[...ids,...cakes.slice(0,n)]});
    assert.equal(total(r,'Doces'),630);
    assert.equal(total(r,'Bebidas'),230);
  }
});
test('RF00003 before/after changes only intended categories and reconciles every charge', () => {
  const r=generateR4ProductionSuggestion(input);
  assert.equal(total(r,'Petiscos'),1000); assert.equal(total(r,'Tortas'),72);
  assert.deepEqual(r.items.filter(p=>p.commercialCategory==='Tortas').map(p=>p.quantity),[36,36]);
  assert.equal(total(r,'Doces'),630); assert.equal(total(r,'Bebidas'),230);
  assert.equal(r.carts.totalCarts,3); assert.equal(r.preparers,3); assert.equal(r.waiters.quantity,8);
  assert.equal(r.disposables.value,1120); assert.equal(r.investment.productsValue,4570);
  assert.equal(r.investment.total,8190); assert.equal(r.investment.ledger.totals.consignmentEstimate,1380);
});
test('lot constraints use the smallest feasible total, never multiply demand by flavor count', () => {
  const custom=catalog.map(p=>pies.includes(p.id)?{...p,lotSize:5}:p);
  const r=generateR4ProductionSuggestion({...input,productCatalog:custom,selectedProductIds:[...ids,...pies]});
  assert.equal(total(r,'Tortas'),75); // target 72; minimum feasible multiple of 5
  assert.ok(r.items.filter(p=>p.commercialCategory==='Tortas').every(p=>p.quantity%5===0));
  const tiny=generateR4ProductionSuggestion({...input,adults:1,olderChildren:0,children:0,selectedProductIds:pies,productCatalog:custom});
  assert.equal(total(tiny,'Tortas'),15); // explicit minimum: one lot per selected SKU
  const onlyDrink=generateR4ProductionSuggestion({...input,selectedProductIds:['suco-laranja-200ml']});
  assert.equal(total(onlyDrink,'Tortas'),0); assert.equal(total(onlyDrink,'Doces'),0);
  assert.equal(total(onlyDrink,'Bebidas'),230);
});
test('manual quantities and historical amounts are not replaced by new recommendations', () => {
  const quantities=[200,200,200,200,200,71,72,870,230];
  const r=buildPlanningPreview({...input,catalogFingerprint:productCatalogFingerprint(catalog),items:ids.map((id,i)=>({id,quantity:quantities[i]}))},catalog);
  assert.deepEqual(r.items.map(p=>p.quantity),quantities);
  assert.equal(r.investment.total,9975);
  assert.ok(r.investment.reconciliation.ok);
  assert.equal(JSON.stringify(r).includes('productionPerHour'),false);
  assert.equal(JSON.stringify(r).includes('capacityUsage'),false);
});
test('capacity warning is advisory, reacts to quantities, and is absent from public output', () => {
  const items=[{id:'coxinha-frango-catupiry',quantity:1000}];
  const before=JSON.stringify(items);
  assert.deepEqual(getOperationalCapacityWarnings({items,products:catalog,duration:4}),[{group:'fried',usagePercent:208,loadHours:8.33,serviceHours:4}]);
  assert.equal(JSON.stringify(items),before);
  assert.deepEqual(getOperationalCapacityWarnings({items:[{...items[0],quantity:200}],products:catalog,duration:4}),[]);
  assert.deepEqual(getOperationalCapacityWarnings({items,products:[],duration:4}),[]);
  const publicResult=buildPlanningPreview({...input,catalogFingerprint:productCatalogFingerprint(catalog)},catalog);
  assert.deepEqual(publicResult.carts,{totalCarts:3});
  assert.equal(JSON.stringify(publicResult).includes('capacityUsage'),false);
});

test('unmeasured tacho never hides overload already proven by beverages', () => {
  const tacho = { id: 'test-tacho', operationalGroup: 'tacho', countsAsMainCart: true, productionPerHour: null };
  const products = [...catalog, tacho];
  const items = [{id:'suco-laranja-200ml',quantity:800},{id:tacho.id,quantity:150}];
  assert.deepEqual(getOperationalCapacityWarnings({items,products,duration:4}), [{
    group:'beverages',usagePercent:133,loadHours:5.33,serviceHours:4,isLowerBound:true,
  }]);
  assert.deepEqual(getOperationalCapacityWarnings({items:[{...items[0],quantity:600},items[1]],products,duration:4}), []);
  assert.deepEqual(getOperationalCapacityWarnings({items:[items[1]],products,duration:4}), []);
  assert.equal(tacho.productionPerHour,null);
});
