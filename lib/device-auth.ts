export const sessionCookie='__Host-cookbro_session';
export const sessionSeconds=90*24*60*60;
export const linkSeconds=10*60;
export const ownerId='household-owner';
const validToken=(v:string)=>/^[a-f0-9]{64}$/.test(v);
export function randomToken(){return [...crypto.getRandomValues(new Uint8Array(32))].map(b=>b.toString(16).padStart(2,'0')).join('');}
export async function tokenHash(token:string){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token)))].map(b=>b.toString(16).padStart(2,'0')).join('');}
export function readSessionToken(cookie:string|null){const parts=(cookie||'').split(';').map(x=>x.trim()).filter(x=>x.startsWith(sessionCookie+'='));if(parts.length!==1)return null;const token=parts[0].slice(sessionCookie.length+1);return validToken(token)?token:null;}
export function cookieHeader(token:string,maxAge=sessionSeconds){return `${sessionCookie}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;}
export async function findSession(db:D1Database,token:string|null,now=Date.now()){if(!token||!validToken(token))return null;return db.prepare('SELECT token_hash,label,created_at,expires_at FROM device_sessions WHERE token_hash=? AND expires_at>?').bind(await tokenHash(token),now).first<{token_hash:string;label:string;created_at:number;expires_at:number}>();}
export async function issueDeviceLink(db:D1Database,now=Date.now()){
 const token=randomToken();const expiresAt=now+linkSeconds*1000;
 await db.batch([db.prepare('DELETE FROM device_links WHERE expires_at<=? OR redeemed_at IS NOT NULL').bind(now),db.prepare('DELETE FROM device_sessions WHERE expires_at<=?').bind(now),db.prepare('INSERT INTO device_links (token_hash,created_at,expires_at) VALUES (?,?,?)').bind(await tokenHash(token),now,expiresAt)]);
 return {token,expiresAt};
}
export async function claimDeviceLink(db:D1Database,token:string,label:string,now=Date.now()){
 if(!validToken(token))return null;
 // UPDATE ... RETURNING is the single atomic claim; two devices cannot redeem the same link.
 const claimed=await db.prepare('UPDATE device_links SET redeemed_at=? WHERE token_hash=? AND redeemed_at IS NULL AND expires_at>? RETURNING token_hash').bind(now,await tokenHash(token),now).first();
 if(!claimed)return null;
 const session=randomToken();await db.prepare('INSERT INTO device_sessions (token_hash,label,created_at,expires_at) VALUES (?,?,?,?)').bind(await tokenHash(session),label.slice(0,80)||'Browser',now,now+sessionSeconds*1000).run();
 return session;
}
