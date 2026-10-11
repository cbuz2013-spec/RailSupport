import {auth} from '@/lib/auth';
import {configured,db} from '@/lib/db';
import {RoomError} from '@/lib/rooms';
import {guardMember,reportContent,moderationQueue,moderate,requireModerator} from '@/lib/safety';
import {managementState,manageCommunity} from '@/lib/community-management';
import {z} from 'zod';
export const runtime='nodejs';export const dynamic='force-dynamic';
const out=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
async function handle(req:Request,write:boolean){
 if(!configured())return out({error:'Account setup is incomplete.'},503);
 if(write&&req.headers.get('origin')!==new URL(process.env.BETTER_AUTH_URL!).origin)return out({error:'Invalid request origin.'},403);
 try{
  const session=await auth().api.getSession({headers:req.headers});if(!session)return out({error:'Sign in first.'},401);
  const uid=session.user.id,p=new URL(req.url).searchParams;
  if(!write){if(p.has('account'))return out({user:{id:uid,name:session.user.name,email:session.user.email,emailVerified:session.user.emailVerified},moderator:(await db().query('SELECT 1 FROM rail_admins WHERE user_id=$1',[uid])).rows.length>0});await guardMember(db(),uid);if(p.has('moderation'))return out(await moderationQueue(db(),uid));if(p.has('reportImage')){await requireModerator(db(),uid);const position=Number(p.get('position'));if(!Number.isInteger(position)||position<0||position>2)throw new RoomError('Invalid photo.');const image=(await db().query(`SELECT i.mime,i.data FROM rail_reports r JOIN rail_post_images i ON i.post_id=r.target_id WHERE r.id=$1 AND r.scope='rail' AND i.position=$2`,[p.get('reportImage'),position])).rows[0];if(!image)throw new RoomError('Photo unavailable.',404);return new Response(new Uint8Array(image.data),{headers:{'Content-Type':image.mime,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});}return out(await managementState(db(),uid,p.get('groupId')||undefined));}
  const raw=await req.text();if(raw.length>16000)return out({error:'Request too large.'},413);const d=JSON.parse(raw);
  if(d.action==='report'&&d.scope==='support')return out(await reportContent(db(),uid,d));
  await guardMember(db(),uid,true);
  const client=await db().connect();try{await client.query('BEGIN');await client.query("SELECT set_config('rail.actor',$1,true)",[uid]);const result=d.action==='report'?await reportContent(client,uid,d):d.action==='moderate'?await moderate(client,uid,d):await manageCommunity(client,uid,d);await client.query('COMMIT');return out(result);}catch(e){await client.query('ROLLBACK');throw e}finally{client.release()}
 }catch(e){if(e instanceof Error&&e.message.startsWith('Community safety filter:'))return out({error:e.message},400);if(e instanceof RoomError)return out({error:e.message},e.status);if(e instanceof z.ZodError||e instanceof SyntaxError)return out({error:'Please check the form.'},400);console.error('Management request failed',e instanceof Error?e.name:'unknown');return out({error:'Could not save. Please retry.'},503);}
}
export const GET=(r:Request)=>handle(r,false);export const POST=(r:Request)=>handle(r,true);
