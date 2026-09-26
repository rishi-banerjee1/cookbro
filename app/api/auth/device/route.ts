import {env} from 'cloudflare:workers';
import {z} from 'zod';
import {findSession,readSessionToken,issueDeviceLink,claimDeviceLink,cookieHeader} from '@/lib/device-auth';
export const dynamic='force-dynamic';
const response=(value:unknown,status=200,headers:Record<string,string>={})=>Response.json(value,{status,headers:{'Cache-Control':'no-store','Referrer-Policy':'no-referrer',...headers}});
const action=z.discriminatedUnion('action',[
 z.object({action:z.literal('claim'),token:z.string().regex(/^[a-f0-9]{64}$/),label:z.string().trim().min(1).max(80)}),
 z.object({action:z.literal('issue')}),z.object({action:z.literal('logout')}),
 z.object({action:z.literal('revoke'),id:z.string().regex(/^[a-f0-9]{64}$/)})
]);
export async function GET(request:Request){
 try{
  if(env.COOKBRO_AUTH_MODE!=='device-link'||!env.DB||!env.COOKBRO_OWNER_EMAIL)return response({error:'Device sign-in is unavailable.'},404);
  const current=await findSession(env.DB,readSessionToken(request.headers.get('cookie')));if(!current)return response({error:'Sign in first.'},401);
  const result=await env.DB.prepare('SELECT token_hash,label,created_at,expires_at FROM device_sessions WHERE expires_at>? ORDER BY created_at DESC').bind(Date.now()).all<{token_hash:string;label:string;created_at:number;expires_at:number}>();
  return response({devices:result.results.map(s=>({id:s.token_hash,label:s.label,createdAt:s.created_at,expiresAt:s.expires_at,current:s.token_hash===current.token_hash}))});
 }catch{return response({error:'Could not load devices. Please retry.'},503);}
}
export async function POST(request:Request){
 try{
  if(env.COOKBRO_AUTH_MODE!=='device-link'||!env.DB||!env.COOKBRO_OWNER_EMAIL)return response({error:'Device sign-in is unavailable.'},404);
  if(request.headers.get('origin')!==new URL(request.url).origin||request.headers.get('sec-fetch-site')==='cross-site')return response({error:'Origin rejected.'},403);
  const body=await request.text();if(body.length>2048)return response({error:'Request too large.'},413);
  let data:unknown;try{data=JSON.parse(body)}catch{return response({error:'Invalid request.'},400);}
  const parsed=action.safeParse(data);if(!parsed.success)return response({error:'Invalid request.'},400);const a=parsed.data;
  if(a.action==='claim'){
   const token=await claimDeviceLink(env.DB,a.token,a.label);if(!token)return response({error:'This link expired or was already used. Create a fresh link from a connected device.'},401);
   return response({ok:true},200,{'Set-Cookie':cookieHeader(token)});
  }
  const current=await findSession(env.DB,readSessionToken(request.headers.get('cookie')));
  if(a.action==='logout'){if(current)await env.DB.prepare('DELETE FROM device_sessions WHERE token_hash=?').bind(current.token_hash).run();return response({ok:true},200,{'Set-Cookie':cookieHeader('',0)});}
  if(!current)return response({error:'Sign in first.'},401);
  if(a.action==='issue'){const link=await issueDeviceLink(env.DB);return response({url:new URL('/sign-in',request.url).origin+'/sign-in#key='+link.token,expiresAt:link.expiresAt});}
  if(a.id===current.token_hash)return response({error:'Use Sign out for this device.'},400);
  await env.DB.prepare('DELETE FROM device_sessions WHERE token_hash=?').bind(a.id).run();return response({ok:true});
 }catch{return response({error:'Sign-in is unavailable right now. Please retry.'},503);}
}
