import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {randomBytes,createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));process.chdir(root);
const input=process.argv[2];if(!input)throw new Error('Pass the HTTPS origin of your deployed Cook Bro app.');
const origin=new URL(input);if(origin.protocol!=='https:'||origin.username||origin.password||origin.pathname!=='/'||origin.search||origin.hash)throw new Error('Use only your app HTTPS origin.');
const token=randomBytes(32).toString('hex'),hash=createHash('sha256').update(token).digest('hex');
const now=Date.now(),expiresAt=now+600000;const temp=fs.mkdtempSync(path.join(os.tmpdir(),'cookbro-link-'));
try{
 const sql=path.join(temp,'issue.sql');fs.writeFileSync(sql,`DELETE FROM device_links WHERE expires_at<=${now} OR redeemed_at IS NOT NULL;\nINSERT INTO device_links (token_hash,created_at,expires_at) VALUES ('${hash}',${now},${expiresAt});\n`,{mode:0o600});
 const result=spawnSync(process.execPath,['--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--remote','--config','dist/server/wrangler.json','--file',sql],{stdio:'inherit'});
 if(result.status!==0)throw new Error('Could not issue the private device link.');
 fs.mkdirSync('.sites-runtime',{recursive:true});const file='.sites-runtime/device-link.json';fs.writeFileSync(file,JSON.stringify({url:origin.origin+'/sign-in#key='+token,expiresAt}),{mode:0o600});fs.chmodSync(file,0o600);
 console.log('Private link saved to '+file+'. It expires in 10 minutes. Run node scripts/open-device-link.mjs to open it without exposing the link in terminal output.');
}finally{fs.rmSync(temp,{recursive:true,force:true});}
