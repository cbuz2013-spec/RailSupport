import {auth} from '@/lib/auth';
import {configured,db} from '@/lib/db';
export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function GET(req:Request){
 if(!configured())return new Response(null,{status:503});
 try{
  const session=await auth().api.getSession({headers:req.headers});
  if(!session)return new Response(null,{status:401});
  const url=new URL(req.url),post=url.searchParams.get('post')||'',position=Number(url.searchParams.get('position'));
  if(!post||!Number.isInteger(position)||position<0||position>2)return new Response(null,{status:400});
  const result=await db().query('SELECT i.mime,i.data FROM rail_post_images i JOIN rail_posts p ON p.id=i.post_id JOIN rail_members m ON m.group_id=p.group_id AND m.user_id=$3 WHERE i.post_id=$1 AND i.position=$2 AND NOT EXISTS(SELECT 1 FROM rail_blocks b WHERE (b.blocker_id=$3 AND b.blocked_id=p.user_id) OR (b.blocker_id=p.user_id AND b.blocked_id=$3))',[post,position,session.user.id]);
  if(!result.rowCount)return new Response(null,{status:404,headers:{'Cache-Control':'private, no-store'}});
  return new Response(new Uint8Array(result.rows[0].data),{headers:{'Content-Type':result.rows[0].mime,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox"}});
 }catch(e){console.error('Post image read failed',e);return new Response(null,{status:503});}
}
