import test from 'node:test';
import assert from 'node:assert/strict';
import { baseProductCatalog, productCatalogFingerprint } from '../src/planner/planning-book/engine/productCatalog.js';
import { buildPlanningPreview } from '../api/planning-preview.js';
import { recommendAdditionalBeverage } from '../src/planner/planning-book/planningPreviewClient.js';
const catalog=baseProductCatalog();
const drinks=['agua-mineral','refrigerante-200ml','suco-laranja-200ml'];
const base={adults:80,olderChildren:80,children:80,serviceHours:4,selectedProductIds:['mini-hot-dog'],catalogFingerprint:productCatalogFingerprint(catalog)};
const recommend=(input,id,c=catalog)=>recommendAdditionalBeverage(input,c.find(p=>p.id===id),async i=>buildPlanningPreview(i,c));
for(const hours of [4,6,8])for(const guests of [80,50,1])test(`drink additions equal initial R4 recommendations at ${hours}h and ${guests} per age band`,async()=>{
 const input={...base,serviceHours:hours,adults:guests,olderChildren:guests,children:guests};
 let added=buildPlanningPreview(input,catalog);
 for(const id of drinks){
  const initial=buildPlanningPreview({...input,selectedProductIds:['mini-hot-dog',id]},catalog);
  const quantity=await recommend(input,id);
  assert.equal(quantity,initial.items.find(p=>p.id===id).quantity);
  const old=added.items.map(({id,quantity})=>({id,quantity}));
  added=buildPlanningPreview({...input,selectedProductIds:[...old.map(p=>p.id),id],items:[...old,{id,quantity}]},catalog);
  assert.deepEqual(added.items.slice(0,-1).map(({id,quantity})=>({id,quantity})),old);
 }
});
test('RF00004 defaults are 250 water and 190 soda; explicit 200 remains valid',async()=>{
 assert.equal(await recommend(base,'agua-mineral'),250);assert.equal(await recommend(base,'refrigerante-200ml'),190);
 const manual=buildPlanningPreview({...base,items:[{id:'agua-mineral',quantity:200},{id:'refrigerante-200ml',quantity:200}]},catalog);
 assert.deepEqual(manual.items.map(p=>p.quantity),[200,200]);
 assert.equal(manual.investment.ledger.totals.consignmentEstimate,1000);
});
test('RF00003 juice remains 230, no redistribution for absent drinks',async()=>{
 assert.equal(await recommend({...base,adults:50,olderChildren:50,children:50},'suco-laranja-200ml'),230);
});

test('unselected unresolved drink cannot break food or known drinks; selected drink fails closed',async()=>{
 const c=[...catalog,{...catalog.find(p=>p.id==='agua-mineral'),id:'unresolved-drink'}];
 const input={...base,catalogFingerprint:productCatalogFingerprint(c)};
 assert.deepEqual(buildPlanningPreview(input,c).items,buildPlanningPreview(base,catalog).items);
 assert.equal(await recommend(input,'agua-mineral',c),250);
 await assert.rejects(recommend(input,'unresolved-drink',c),/commercial_incomplete/);
 assert.throws(()=>buildPlanningPreview({...input,selectedProductIds:['unresolved-drink']},c),/commercial_incomplete/);
});

test('additional drink requests omit existing manual items and reject missing/invalid suggestions',async()=>{
 const input={...base,items:[{id:'mini-hot-dog',quantity:15}]};
 const before=structuredClone(input), product=catalog.find(p=>p.id==='agua-mineral');
 await recommendAdditionalBeverage(input,product,async request=>{
  assert.deepEqual(request.selectedProductIds,['agua-mineral']);assert.equal(request.items,undefined);
  return buildPlanningPreview(request,catalog);
 });
 assert.deepEqual(input,before);
 for(const quantity of [undefined,0,NaN,Infinity,251])await assert.rejects(
  recommendAdditionalBeverage(input,product,async()=>({items:[{id:product.id,quantity}]})),/unavailable/);
 await assert.rejects(recommendAdditionalBeverage(input,product,async()=>{throw new Error('timeout');}),/timeout/);
});
