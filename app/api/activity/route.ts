import {auth} from '@/lib/auth';
import {configured,db} from '@/lib/db';
import {RoomError} from '@/lib/rooms';
import {activityStates,activityComments,mutateActivity,mentionCandidates,userSessions,scopes} from '@/lib/activity';
import {notificationInbox,savePushDevice,pushConfigured,processActivityEvents} from '@/lib/notifications';
import {scheduleActivity} from '@/lib/activity-dispatch';
import {z} from 'zod';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=90;
const out=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
async function handle(req:Request,write:boolean){
 if(!configured())return out({error:'Account setup is incomplete.'},503);
 if(write&&req.headers.get('origin')!==new URL(process.env.BETTER_AUTH_URL!).origin)return out({error:'Invalid request origin.'},403);
 try{
  const user=(await auth().api.getSession({headers:req.headers}))?.user;if(!user)return out({error:'Sign in to view your activity.'},401);
  if(!write){
   const p=new URL(req.url).searchParams;
   if(p.has('mentions'))return out({people:await mentionCandidates(db(),user.id,p)});
   if(p.has('sessions'))return out({sessions:await userSessions(db(),user.id,(p.get('groupId')||'').slice(0,100))});
   if(p.has('comments'))return out(await activityComments(db(),user.id,z.enum(scopes).parse(p.get('scope')),z.string().min(1).max(100).parse(p.get('postId')),p.get('before')||undefined));
   await processActivityEvents(db(),20);scheduleActivity();return out(await notificationInbox(db(),user.id));
  }
  const raw=await req.text();if(raw.length>24000)return out({error:'This request is too large.'},413);
  const d=JSON.parse(raw);
  if(d.action==='states')return out({states:await activityStates(db(),user.id,d.targets)});
  if(d.action==='read'){
   const id=d.id===undefined?null:z.string().min(1).max(100).parse(d.id);
   await db().query('UPDATE rail_notifications SET read_at=now() WHERE recipient_id=$1 AND ($2::text IS NULL OR id=$2)',[user.id,id]);return out({ok:true});
  }
  if(d.action==='subscribe'){
   if(!pushConfigured())return out({error:'Push notifications are not configured yet. Your in-app notifications are still available.'},503);
   await savePushDevice(db(),user.id,d.subscription);return out({ok:true});
  }
  if(d.action==='unsubscribe'){
   const endpoint=z.string().max(4096).parse(d.endpoint);
   await db().query('DELETE FROM rail_push_devices WHERE user_id=$1 AND endpoint=$2',[user.id,endpoint]);return out({ok:true});
  }
  scheduleActivity();return out(await mutateActivity(db(),user.id,d));
 }catch(e){
  if(e instanceof RoomError)return out({error:e.message},e.status);
  if(e instanceof z.ZodError||e instanceof SyntaxError)return out({error:'Please check the form and try again.'},400);
  console.error('Activity request failed',e instanceof Error?e.name:'unknown');return out({error:'Could not load your activity. Please retry.'},503);
 }
}
export const GET=(req:Request)=>handle(req,false);
export const POST=(req:Request)=>handle(req,true);
