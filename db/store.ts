import {env} from 'cloudflare:workers';
import {preferencesSchema,defaultPreferences,localDate} from '@/lib/preferences';
import {emptyState, type State} from '@/lib/food';
function db(){if(!env.DB)throw new Error('Database unavailable');return env.DB;}
function initialPreferences(){try{return preferencesSchema.parse(JSON.parse(env.COOKBRO_INITIAL_PREFERENCES||'null'))}catch{return {...defaultPreferences}}}
export async function loadState(user:string):Promise<State>{
 await db().prepare('INSERT OR IGNORE INTO households (user_id,state,revision,updated_at) VALUES (?,?,0,?)').bind(user,JSON.stringify({...emptyState(),settings:{...emptyState().settings,preferences:initialPreferences()}}),new Date().toISOString()).run();
 const row=await db().prepare('SELECT state,revision FROM households WHERE user_id=?').bind(user).first<{state:string;revision:number}>();
 if(!row)throw new Error('Household unavailable');const state=JSON.parse(row.state) as State;if(!state.settings.preferences){const initial=initialPreferences();for(const [date,plan] of Object.entries(state.plans)){if(!plan.confirmed&&date>=localDate(0,initial.timezone)){delete state.plans[date];delete state.pantry[date];}else if(!plan.preferences)plan.preferences=initial;}}return {...state,settings:{...state.settings,preferences:state.settings.preferences||initialPreferences()},revision:row.revision};
}
export async function saveState(user:string,state:State,revision:number){
 const next={...state,revision:revision+1};
 const result=await db().prepare('UPDATE households SET state=?,revision=revision+1,updated_at=? WHERE user_id=? AND revision=?').bind(JSON.stringify(next),new Date().toISOString(),user,revision).run();
 if(!result.meta.changes)return null;return next;
}
