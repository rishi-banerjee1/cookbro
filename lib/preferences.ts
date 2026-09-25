import {z} from 'zod';
export const cuisineOptions=['Bengali','Punjabi','North Indian','Maharashtrian','South Indian','Indian','Italian-inspired','French-inspired','English-inspired','Asian-inspired','International'] as const;
export const dietOptions=['vegetarian','eggetarian','mixed'] as const;
export const proteinOptions=['veg','chicken','fish','mutton'] as const;
export const allergyOptions=['Milk','Egg','Wheat','Gluten','Soy','Fish','Mustard','Coconut'] as const;
export const preferencesSchema=z.object({
 adults:z.number().int().min(1).max(12),seniors:z.number().int().min(0).max(8),childAges:z.array(z.number().int().min(2).max(17)).max(8),
 servings:z.number().min(1).max(24),diet:z.enum(dietOptions),cuisines:z.array(z.enum(cuisineOptions)).min(1),
 weeklyProteins:z.array(z.enum(proteinOptions)).length(7),sharedCurry:z.boolean(),
 lunchStaple:z.enum(['rice','roti','paratha']),dinnerStaple:z.enum(['rice','roti','paratha']),includeDal:z.boolean(),includeSide:z.boolean(),
 repeatDays:z.number().int().min(3).max(20),allergies:z.array(z.enum(allergyOptions)),avoidIngredients:z.array(z.string().trim().min(2).max(60)).max(20),
 oilFactor:z.number().min(.5).max(1.5),saltFactor:z.number().min(0).max(1),
 timezone:z.string().min(1).max(60).refine(v=>{try{new Intl.DateTimeFormat('en',{timeZone:v});return true}catch{return false}},'Choose a valid IANA time zone.'),
 sharingTime:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),postalCode:z.string().regex(/^\d{6}$|^$/),city:z.string().max(100),budget:z.number().int().min(100).max(50000),orderMealsPerWeek:z.number().int().min(0).max(14),
 language:z.enum(['hindi','english'])
}).strict();
export type Preferences=z.infer<typeof preferencesSchema>;
export const defaultPreferences:Preferences={adults:2,seniors:0,childAges:[],servings:2,diet:'vegetarian',cuisines:[...cuisineOptions],weeklyProteins:['veg','veg','veg','veg','veg','veg','veg'],sharedCurry:true,lunchStaple:'rice',dinnerStaple:'roti',includeDal:true,includeSide:true,repeatDays:7,allergies:[],avoidIngredients:[],oilFactor:1,saltFactor:1,timezone:'Asia/Kolkata',sharingTime:'18:00',postalCode:'',city:'',budget:2000,orderMealsPerWeek:2,language:'hindi'};
export const preferences=(state?:{settings:{preferences?:Preferences}}|null):Preferences=>({...defaultPreferences,...state?.settings.preferences});
export function profileLabel(p:Preferences){return `${p.adults+p.seniors} adult${p.adults+p.seniors===1?'':'s'}${p.childAges.length?' + '+p.childAges.length+' children':''}`;}
export function localDate(offset=0,timezone='Asia/Kolkata',now=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(now.getTime()+offset*86400000));}
