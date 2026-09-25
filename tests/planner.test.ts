import assert from 'node:assert/strict';
import {recipes,byId,generatePlan,emptyState,addDay,indiaDate,swapRecipe,shopping,cookMessage,alternatives,batchRecipe,batchCount,allowedRecipe,type Plan} from '../lib/food';
import {defaultPreferences,preferencesSchema,localDate} from '../lib/preferences';
import {basketItems,weekOrderCount} from '../lib/orders';
const ids=(p:Plan)=>[...p.breakfast,...p.lunch,...p.dinner];
assert.equal(new Set(recipes.map(r=>r.id)).size,recipes.length);
for(const r of recipes){assert(r.ingredients.length&&r.steps.length);assert(!/palong|kumro|fulkopi|begun|macher|shorshe|doi |bhaja|chire/i.test(r.name),r.name);for(const i of r.ingredients)assert(i.qty>0);}
for(const veg of [false,true]){
 const state=emptyState();state.settings.preferences={...defaultPreferences,servings:6,diet:'mixed',weeklyProteins:['veg','chicken','fish','veg','chicken','fish','chicken']};
 for(let day=0;day<90;day++){
  const date=addDay(indiaDate(),day);const plan=generatePlan(date,state,veg);
  assert.equal(plan.lunch[0],'rice');assert.equal(plan.dinner[0],'roti');assert.equal(plan.lunch.length,4);assert.equal(plan.dinner.length,4);
  assert.equal(plan.lunch[2],plan.dinner[2]);
  const fresh=[...new Set(ids(plan).filter(id=>byId[id].kind!=='grain'))];
  for(let prior=Math.max(0,day-6);prior<day;prior++)assert(!ids(state.plans[addDay(indiaDate(),prior)]).some(id=>fresh.includes(id)),`Weekly repeat ${day}`);
  if(veg)assert(ids(plan).every(id=>byId[id].protein==='veg'&&!byId[id].allergens.includes('Egg')));
  else assert.equal(byId[plan.lunch[2]].protein,state.settings.preferences.weeklyProteins[new Date(date+'T12:00:00Z').getUTCDay()]);
  state.plans[date]=plan;
 }
 const plan=state.plans[indiaDate()];const options=alternatives(plan,plan.lunch[2],state);assert(options.length);
 const swapped=swapRecipe(plan,plan.lunch[2],state,options[0].id);assert.equal(swapped.lunch[2],options[0].id);assert.equal(swapped.dinner[2],options[0].id);
 assert.throws(()=>swapRecipe({...plan,confirmed:true},plan.lunch[2],state));assert.throws(()=>swapRecipe(plan,plan.lunch[2],state,'roti'));
 const list=shopping(plan);assert.equal(new Set(list.map(i=>i.name+'|'+i.unit)).size,list.length);
 const oil=list.find(i=>i.name==='Cooking oil')!;const expected=ids(plan).flatMap(id=>byId[id].ingredients).filter(i=>i.name==='Cooking oil').reduce((n,i)=>n+i.qty,0);assert.equal(oil.qty,expected);
 const curry=byId[plan.lunch[2]];assert.equal(batchCount(plan,curry.id),2);assert.equal(batchRecipe(plan,curry).ingredients[0].qty,curry.ingredients[0].qty*2);
 const takeout:Plan={...plan,takeout:['dinner']};assert.equal(batchCount(takeout,curry.id),1);assert.equal(batchRecipe(takeout,curry).ingredients[0].qty,curry.ingredients[0].qty);assert(shopping(takeout).find(i=>i.name==='Cooking oil')!.qty<oil.qty);
 assert.equal(shopping({...plan,takeout:['breakfast','lunch','dinner']}).length,0);
 assert(!/metformin|diabet|hypertension|obes/i.test(cookMessage(plan,[],true)));
}
const state=emptyState();const today=indiaDate();
state.settings.preferences={...defaultPreferences,servings:3,saltFactor:0,oilFactor:.5,includeDal:false,includeSide:false,lunchStaple:'roti',dinnerStaple:'rice',sharedCurry:false,allergies:['Milk','Soy'],avoidIngredients:['mushroom']};
const custom=generatePlan(today,state);assert.equal(custom.lunch.length,2);assert.equal(custom.dinner.length,2);assert.notEqual(custom.lunch[1],custom.dinner[1]);assert.equal(custom.lunch[0],'roti');assert.equal(custom.dinner[0],'rice');
assert(ids(custom).every(id=>allowedRecipe(byId[id],state.settings.preferences!)));assert(!shopping(custom).some(i=>i.name==='Salt'));assert.equal(batchRecipe(custom,byId[custom.lunch[1]]).ingredients[0].qty,byId[custom.lunch[1]].ingredients[0].qty/2);
state.settings.preferences={...defaultPreferences,allergies:['Wheat']};assert.throws(()=>generatePlan(today,state),/staple/);
assert.equal(allowedRecipe(byId['coconut-veg'],{...defaultPreferences,allergies:['Coconut']}),false);
assert.equal(allowedRecipe(byId['roti'],{...defaultPreferences,allergies:['Gluten']}),false);
assert(!preferencesSchema.safeParse({...defaultPreferences,timezone:'not/a-zone'}).success);
assert.equal(localDate(0,'Asia/Kolkata',new Date(Date.UTC(2020,0,1,19))),'2020-01-02');
assert.equal(basketItems('south-indian',3)[0].startsWith('6 plain idlis'),true);
assert.equal(weekOrderCount({[today]:{date:today,takeout:['lunch','dinner']}},today),2);
console.log(`PASS: ${recipes.length} recipes; 180 plans; protein rhythm, variety, shared batches, swaps, order-in quantities, preferences, allergy tags, privacy and dates.`);
