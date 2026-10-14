import {guardMember} from '@/lib/safety';
import {scheduleActivity} from '@/lib/activity-dispatch';
import {auth} from '@/lib/auth';
import {configured,db} from '@/lib/db';
import {people,community,leagues,mutateCommunity} from '@/lib/community';
import {RoomError} from '@/lib/rooms';
export const runtime='nodejs';
export const maxDuration=90;
export const dynamic='force-dynamic';
const out=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store'}});
async function handle(req:Request,write:boolean){
 if(!configured())return out({error:'Account setup is incomplete.'},503);
 if(write&&req.headers.get('origin')!==new URL(process.env.BETTER_AUTH_URL!).origin)return out({error:'Invalid request origin.'},403);
 try{
  const user=(await auth().api.getSession({headers:req.headers}))?.user;if(!user)return out({error:'Sign in to connect with your people.'},401); await guardMember(db(),user.id,req.method==='POST');
  if(write){scheduleActivity();const raw=await req.text();if(raw.length>24000)return out({error:'Message is too long.'},413);const client=await db().connect();try{await client.query('BEGIN');await client.query("SELECT set_config('rail.actor',$1,true)",[user.id]);const result=await mutateCommunity(client,user.id,JSON.parse(raw));await client.query('COMMIT');return out(result)}catch(e){await client.query('ROLLBACK');throw e}finally{client.release()}}
  const params=new URL(req.url).searchParams;
  return out(await (params.get('kind')==='leagues'?leagues:params.has('roomId')?community:people)(db(),user.id,params));
 }catch(e){if(e instanceof Error&&e.message.startsWith('Community safety filter:'))return out({error:e.message},400);if(e instanceof RoomError)return out({error:e.message},e.status);if(e instanceof SyntaxError)return out({error:'Invalid request.'},400);console.error('Community request failed',e instanceof Error?e.name:'unknown');return out({error:'Could not load your community. Please retry.'},503);}
}
export const GET=(req:Request)=>handle(req,false);
export const POST=(req:Request)=>handle(req,true);
