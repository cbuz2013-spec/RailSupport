import {randomUUID} from 'node:crypto';
import {auth} from '@/lib/auth';
import {configured,db} from '@/lib/db';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const out=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store'}});
// Every read and interaction applies this same policy. $1 is always the viewer.
const visible=`NOT EXISTS(SELECT 1 FROM rail_blocks b WHERE (b.blocker_id=$1 AND b.blocked_id=p.user_id) OR (b.blocker_id=p.user_id AND b.blocked_id=$1)) AND (p.user_id=$1 OR p.audience='public' OR (EXISTS(SELECT 1 FROM rail_follows f WHERE f.follower_id=$1 AND f.followed_id=p.user_id) AND EXISTS(SELECT 1 FROM rail_follows f WHERE f.follower_id=p.user_id AND f.followed_id=$1)))`;
const unblocked=(alias:string)=>`NOT EXISTS(SELECT 1 FROM rail_blocks b WHERE (b.blocker_id=$1 AND b.blocked_id=${alias}.user_id) OR (b.blocker_id=${alias}.user_id AND b.blocked_id=$1))`;

export async function GET(req:Request){
 if(!configured())return out({error:'Account setup is incomplete.'},503);
 try{
  const uid=(await auth().api.getSession({headers:req.headers}))?.user.id;
  if(!uid)return out({error:'Sign in to read Table Talk.'},401);
  const params=new URL(req.url).searchParams,owner=params.get('id')||uid;
  const profile=await db().query('SELECT id FROM "user" WHERE id=$1',[owner]);
  if(!profile.rowCount)return out({error:'Profile unavailable.'},404);
  const blocked=await db().query('SELECT 1 FROM rail_blocks WHERE (blocker_id=$1 AND blocked_id=$2) OR (blocker_id=$2 AND blocked_id=$1)',[uid,owner]);
  if(blocked.rowCount)return out({posts:[],hasMore:false});
  const cursor=params.get('before');
  const result=await db().query(`SELECT p.id,p.user_id AS "userId",u.name,pr.photo,p.kind,p.audience,p.body,p.location,p.created,
   (SELECT count(*)::int FROM rail_table_likes l WHERE l.post_id=p.id AND ${unblocked('l')}) AS likes,
   EXISTS(SELECT 1 FROM rail_table_likes l WHERE l.post_id=p.id AND l.user_id=$1) AS liked,
   COALESCE((SELECT jsonb_agg(c ORDER BY c.created,c.id) FROM (SELECT c.id,c.user_id AS "userId",u.name,c.body,c.created FROM rail_table_comments c JOIN "user" u ON u.id=c.user_id WHERE c.post_id=p.id AND ${unblocked('c')} ORDER BY c.created DESC,c.id DESC LIMIT 100) c),'[]'::jsonb) AS comments
   FROM rail_table_posts p JOIN "user" u ON u.id=p.user_id LEFT JOIN rail_profiles pr ON pr.user_id=p.user_id
   WHERE p.user_id=$2 AND ${visible} AND ($3::text IS NULL OR (p.created,p.id)<(SELECT created,id FROM rail_table_posts WHERE id=$3 AND user_id=$2))
   ORDER BY p.created DESC,p.id DESC LIMIT 21`,[uid,owner,cursor]);
  return out({posts:result.rows.slice(0,20),hasMore:result.rows.length>20});
 }catch(e){console.error('Table Talk read failed',e);return out({error:'Could not load Table Talk. Please retry.'},503)}
}

export async function POST(req:Request){
 if(!configured())return out({error:'Account setup is incomplete.'},503);
 if(req.headers.get('origin')!==new URL(process.env.BETTER_AUTH_URL!).origin)return out({error:'Invalid request origin.'},403);
 try{
  const uid=(await auth().api.getSession({headers:req.headers}))?.user.id;
  if(!uid)return out({error:'Sign in first.'},401);
  const raw=await req.text();if(raw.length>16000)return out({error:'This post is too long.'},413);
  const data=JSON.parse(raw);if(!data||typeof data!=='object')return out({error:'Invalid request.'},400);
  if(data.action==='post'){
   const body=typeof data.body==='string'?data.body.trim():'';
   const location=typeof data.location==='string'?data.location.trim():'';
   if(!body||body.length>5000||location.length>120||!['status','location','news','topic'].includes(data.kind)||!['public','friends'].includes(data.audience))return out({error:'Add a post (up to 5,000 characters), a valid type and an audience.'},400);
   const id=randomUUID();await db().query('INSERT INTO rail_table_posts(id,user_id,kind,audience,body,location) VALUES($1,$2,$3,$4,$5,$6)',[id,uid,data.kind,data.audience,body,location]);return out({id},201);
  }
  if(typeof data.postId!=='string'||data.postId.length>100)return out({error:'Choose a post.'},400);
  if(data.action==='delete'){
   const r=await db().query('DELETE FROM rail_table_posts WHERE id=$1 AND user_id=$2 RETURNING id',[data.postId,uid]);return r.rowCount?out({ok:true}):out({error:'Post unavailable.'},404);
  }
  if(data.action==='like'){
   const r=await db().query(`INSERT INTO rail_table_likes(post_id,user_id) SELECT p.id,$1 FROM rail_table_posts p WHERE p.id=$2 AND ${visible} ON CONFLICT DO NOTHING RETURNING post_id`,[uid,data.postId]);
   if(!r.rowCount){const allowed=await db().query(`SELECT 1 FROM rail_table_posts p WHERE p.id=$2 AND ${visible}`,[uid,data.postId]);if(!allowed.rowCount)return out({error:'Post unavailable.'},404)}
  }else if(data.action==='unlike'){
   const allowed=await db().query(`SELECT 1 FROM rail_table_posts p WHERE p.id=$2 AND ${visible}`,[uid,data.postId]);if(!allowed.rowCount)return out({error:'Post unavailable.'},404);
   await db().query('DELETE FROM rail_table_likes WHERE post_id=$1 AND user_id=$2',[data.postId,uid]);
  }else if(data.action==='comment'){
   const body=typeof data.body==='string'?data.body.trim():'';if(!body||body.length>2000)return out({error:'Comments must be 1–2,000 characters.'},400);
   const r=await db().query(`INSERT INTO rail_table_comments(id,post_id,user_id,body) SELECT $3,p.id,$1,$4 FROM rail_table_posts p WHERE p.id=$2 AND ${visible} RETURNING id`,[uid,data.postId,randomUUID(),body]);if(!r.rowCount)return out({error:'Post unavailable.'},404);
  }else return out({error:'Unknown action.'},400);
  return out({ok:true});
 }catch(e){if(e instanceof SyntaxError)return out({error:'Invalid request.'},400);console.error('Table Talk write failed',e);return out({error:'Could not save. Your draft is unchanged.'},503)}
}
