import {getChatGPTUser} from '@/app/chatgpt-auth';
import {loadState,saveState} from '@/db/store';
import {generatePlan,swapRecipe,indiaDate,addDay,shopping,ingredientKey, type Plan} from '@/lib/food';
import {z} from 'zod';
import {preferencesSchema,preferences,localDate} from '@/lib/preferences';
import {orderById} from '@/lib/orders';
export const dynamic='force-dynamic';
const date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>{const t=Date.parse(v+'T12:00:00Z');return Number.isFinite(t)&&new Date(t).toISOString().slice(0,10)===v&&v>=addDay(indiaDate(),-30)&&v<=addDay(indiaDate(),30)},'Choose a date within 30 days.');
const revision=z.number().int().nonnegative();
const phone=z.string().max(16).refine(v=>v===''||/^\+[1-9]\d{7,14}$/.test(v),'Use an international number, such as +91 followed by 10 digits.');
const action=z.discriminatedUnion('action',[
 z.object({action:z.literal('preferences'),preferences:preferencesSchema,revision}),
 z.object({action:z.literal('generate'),date,vegetarian:z.boolean(),revision}),
 z.object({action:z.literal('swap'),date,id:z.string().max(60),replacement:z.string().max(80).optional(),revision}),
 z.object({action:z.literal('confirm'),date,confirmed:z.boolean(),revision}),
 z.object({action:z.literal('pantry'),date,key:z.string().max(100),checked:z.boolean(),revision}),
 z.object({action:z.literal('takeout'),date,meal:z.enum(['breakfast','lunch','dinner']),enabled:z.boolean(),revision}),
 z.object({action:z.literal('order'),date,meal:z.enum(['breakfast','lunch','dinner']),idea:z.string().refine(id=>!!orderById[id]),revision}),
 z.object({action:z.literal('settings'),phone1:phone,phone2:phone,allowMutton:z.boolean(),revision}),
]);
const json=(v:unknown,status=200)=>Response.json(v,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(){try{const user=await getChatGPTUser();if(!user)return json({error:'Sign in to load your household.'},401);return json(await loadState(user.userId));}catch(error){console.error('household_load_failed',error instanceof Error?error.message:'unknown');return json({error:'Your saved menus are unavailable right now. Please retry.'},503);}}
export async function POST(request:Request){
 try{
  const user=await getChatGPTUser();if(!user)return json({error:'Sign in before saving your household.'},401);
  if(request.headers.get('sec-fetch-site')==='cross-site')return json({error:'Cross-site request rejected.'},403);
  const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return json({error:'Origin rejected.'},403);
  const body=await request.text();if(body.length>4096)return json({error:'Request too large.'},413);
  let data:unknown;try{data=JSON.parse(body)}catch{return json({error:'Invalid request.'},400)}
  const parsed=action.safeParse(data);if(!parsed.success)return json({error:parsed.error.issues[0].message},400);const a=parsed.data;
  const state=await loadState(user.userId);if(state.revision!==a.revision)return json({error:'This menu changed in another window. Reload to see the latest version.'},409);
  if(a.action==='preferences'){const previous=preferences(state);state.settings.preferences=a.preferences;for(const [d,p] of Object.entries(state.plans)){if(p.confirmed&&!p.preferences)p.preferences=previous;if(!p.confirmed&&d>=localDate(0,a.preferences.timezone)){delete state.plans[d];delete state.pantry[d]}}}
  else if(a.action==='settings')state.settings={...state.settings,phone1:a.phone1,phone2:a.phone2,allowMutton:a.allowMutton};
  else{
   const plan=state.plans[a.date] as Plan|undefined;
   if(a.action==='generate'){if(plan?.confirmed)return json({error:'Unlock this menu before changing it.'},409);try{state.plans[a.date]=generatePlan(a.date,state,a.vegetarian)}catch(e){return json({error:(e as Error).message},400)};if(a.vegetarian){for(const [meal,id] of Object.entries(state.plans[a.date].orders||{}))if(id&&orderById[id]?.protein!=='veg')delete state.plans[a.date].orders![meal as 'breakfast'|'lunch'|'dinner'];}}
   else if(!plan)return json({error:'Create a menu for this day first.'},404);
   else if(a.action==='takeout'||a.action==='order'){
    if(plan.confirmed)return json({error:'Unlock the menu before changing a meal.'},409);
    if(a.action==='order'&&(plan.vegetarian||preferences(state).diet!=='mixed')&&orderById[a.idea].protein!=='veg')return json({error:'Choose a vegetarian order for this vegetarian day.'},400);
    const takeout=new Set(plan.takeout||[]);
    if(a.action==='order'||a.enabled)takeout.add(a.meal);else takeout.delete(a.meal);
    const orders={...plan.orders};if(a.action==='order')orders[a.meal]=a.idea;else if(!a.enabled)delete orders[a.meal];
    state.plans[a.date]={...plan,takeout:[...takeout],orders};
   }
   else if(a.action==='swap'){try{state.plans[a.date]=swapRecipe(plan,a.id,state,a.replacement)}catch(e){return json({error:(e as Error).message},400)}}
   else if(a.action==='confirm')state.plans[a.date]={...plan,confirmed:a.confirmed};
   else if(a.action==='pantry'){if(!shopping(plan,plan.preferences||preferences(state)).some(i=>ingredientKey(i)===a.key))return json({error:'Unknown shopping item.'},400);const set=new Set(state.pantry[a.date]||[]);a.checked?set.add(a.key):set.delete(a.key);state.pantry[a.date]=[...set];}
  }
  const cutoff=addDay(indiaDate(),-30);for(const key of Object.keys(state.plans))if(key<cutoff){delete state.plans[key];delete state.pantry[key]}
  const saved=await saveState(user.userId,state,a.revision);if(!saved)return json({error:'Another window saved first. Reload and try again.'},409);return json(saved);
 }catch(error){console.error('household_save_failed',error instanceof Error?error.message:'unknown');return json({error:'We could not save this change. Your last saved menu is safe. Please retry.'},503)}
}
