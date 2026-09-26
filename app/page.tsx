import {env} from 'cloudflare:workers';
import Planner from './planner';
import {requireChatGPTUser} from './chatgpt-auth';
export const dynamic='force-dynamic';
export default async function Home(){const user=await requireChatGPTUser('/');return <Planner accountEmail={user.email} authProvider={env.COOKBRO_AUTH_MODE==='device-link'?'Private device link':'ChatGPT'}/>}
