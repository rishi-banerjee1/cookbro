'use client';
import {useEffect,useRef,useState} from 'react';
import {ChefHat,Smartphone,Check} from 'lucide-react';
export default function DeviceSignIn(){
 const started=useRef(false);const [token]=useState(()=>typeof window==='undefined'?null:new URLSearchParams(window.location.hash.slice(1)).get('key'));const [status,setStatus]=useState(()=>token?'Connecting this device…':'');const hasKey=!!token;
 useEffect(()=>{
  if(started.current)return;started.current=true;
  // Keep the one-time key out of browser history, referrers and any further navigation.
  window.history.replaceState(null,'','/sign-in');
  if(!token){void fetch('/api/auth/device').then(r=>{if(r.ok)window.location.replace('/');}).catch(()=>{});return;}
  const ua=navigator.userAgent;const label=/iPad/i.test(ua)?'iPad':/iPhone/i.test(ua)?'iPhone':/Android/i.test(ua)?'Android':/Mac/i.test(ua)?'Mac browser':/Windows/i.test(ua)?'Windows browser':'Browser';
  void fetch('/api/auth/device',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'claim',token,label})}).then(async r=>{const data=await r.json() as {error?:string};if(!r.ok)throw new Error(data.error||'Could not connect.');setStatus('Connected. Opening your household…');window.location.replace('/');}).catch(e=>setStatus(e.message));
 },[token]);
 return <main className="signin-shell"><section className="settings-card signin-card"><span className="brand-icon"><ChefHat size={28}/></span><p className="eyebrow">COOK BRO</p><h1>Your kitchen, connected.</h1>{hasKey?<p role="status">{status}</p>:<><p>Open a private device link to sign in with your saved household.</p><ol><li>On a device that is already signed in, open <strong>Account</strong>.</li><li>Choose <strong>Connect another device</strong> and open that link here.</li></ol><p className="small-note">Each link works once and expires after 10 minutes. Connected devices stay signed in for up to 90 days, unless you sign out, remove them or clear browser data.</p><div className="recipe-note"><Smartphone size={20}/><p>No password or payment card is needed. If you have no connected device, ask the person who manages this Cook Bro app for a fresh private link.</p></div></>}<p className="small-note"><Check size={14}/> Your household stays private.</p></section></main>;
}
