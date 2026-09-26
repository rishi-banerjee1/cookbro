import fs from 'node:fs';
import path from 'node:path';

// Non-secret deployment identifiers only. Personal defaults and owner email are host secrets.
const input=process.argv[2]||'cloudflare.local.json';
const profile=JSON.parse(fs.readFileSync(input,'utf8'));
for(const key of ['accountId','databaseId','workerName'])if(typeof profile[key]!=='string'||!profile[key])throw new Error(`Missing ${key} in ${input}`);
if(!/^[a-z0-9-]+$/.test(profile.workerName))throw new Error('Invalid Worker name');
const output='dist/server/wrangler.json';const config=JSON.parse(fs.readFileSync(output,'utf8'));
Object.assign(config,{name:profile.workerName,account_id:profile.accountId,workers_dev:true,preview_urls:false});
config.d1_databases=[{binding:'DB',database_name:profile.databaseName||'cookbro',database_id:profile.databaseId,migrations_dir:path.resolve('drizzle')}];
config.vars={COOKBRO_AUTH_MODE:'device-link'};
fs.writeFileSync(output,JSON.stringify(config,null,2)+'\n');
console.log('Cloudflare deployment configuration prepared. Set COOKBRO_OWNER_EMAIL and COOKBRO_INITIAL_PREFERENCES as Worker secrets before opening the app.');
