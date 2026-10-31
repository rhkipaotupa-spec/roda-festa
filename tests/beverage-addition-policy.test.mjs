import test from 'node:test';
import assert from 'node:assert/strict';
import { baseProductCatalog, productCatalogFingerprint } from '../src/planner/planning-book/engine/productCatalog.js';
import { buildPlanningPreview } from '../api/planning-preview.js';
const catalog=baseProductCatalog();
const drinks=['agua-mineral','refrigerante-200ml','suco-laranja-200ml'];
const base={adults:80,olderChildren:80,children:80,serviceHours:4,selectedProductIds:['mini-hot-dog'],catalogFingerprint:productCatalogFingerprint(catalog)};
for(const hours of [4,6,8])for(const guests of [80,50,1])test(`drink additions equal initial R4 recommendations at ${hours}h and ${guests} per age band`,()=>{
 const input={...base,serviceHours:hours,adults:guests,olderChildren:guests,children:guests};
 let added=buildPlanningPreview(input,catalog);
 for(const id of drinks){
  const initial=buildPlanningPreview({...input,selectedProductIds:['mini-hot-dog',id]},catalog);
  const quantity=added.suggestedQuantities[id];
  assert.equal(quantity,initial.items.find(p=>p.id===id).quantity);
  const old=added.items.map(({id,quantity})=>({id,quantity}));
  added=buildPlanningPreview({...input,selectedProductIds:[...old.map(p=>p.id),id],items:[...old,{id,quantity}]},catalog);
  assert.deepEqual(added.items.slice(0,-1).map(({id,quantity})=>({id,quantity})),old);
 }
});
test('RF00004 defaults are 250 water and 190 soda; explicit 200 remains valid',()=>{
 const r=buildPlanningPreview(base,catalog);
 assert.equal(r.suggestedQuantities['agua-mineral'],250);assert.equal(r.suggestedQuantities['refrigerante-200ml'],190);
 const manual=buildPlanningPreview({...base,items:[{id:'agua-mineral',quantity:200},{id:'refrigerante-200ml',quantity:200}]},catalog);
 assert.deepEqual(manual.items.map(p=>p.quantity),[200,200]);
 assert.equal(manual.investment.ledger.totals.consignmentEstimate,1000);
});
test('RF00003 juice remains 230, no redistribution for absent drinks',()=>{
 const r=buildPlanningPreview({...base,adults:50,olderChildren:50,children:50},catalog);
 assert.equal(r.suggestedQuantities['suco-laranja-200ml'],230);
});
