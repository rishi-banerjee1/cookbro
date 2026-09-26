import fs from 'node:fs';
import http from 'node:http';
const file=new URL('../.sites-runtime/device-link.json',import.meta.url);const link=JSON.parse(fs.readFileSync(file,'utf8'));
if(link.expiresAt<=Date.now())throw new Error('Private link expired. Create a fresh link.');
let used=false;
const server=http.createServer((request,response)=>{
 if(used||request.method!=='GET'||request.url!=='/'||!['none',undefined].includes(request.headers['sec-fetch-site'])){response.writeHead(403);response.end();return;}
 used=true;response.writeHead(302,{'Location':link.url,'Cache-Control':'no-store','Referrer-Policy':'no-referrer'});response.end();fs.rmSync(file,{force:true});server.close();
});
server.listen(0,'127.0.0.1',()=>console.log('Open this local handoff once: http://127.0.0.1:'+server.address().port+'/'));
setTimeout(()=>server.close(),120000).unref();
