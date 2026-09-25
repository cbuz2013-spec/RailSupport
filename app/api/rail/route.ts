import {randomUUID,randomBytes} from 'node:crypto';
import {auth} from '@/lib/auth';
import {configured,db} from '@/lib/db';
import {postSchema} from '@/lib/validation';
import type {Post,Hand} from '@/lib/types';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const out=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store'}});
async function member(group:string,user:string){return (await db().query('SELECT 1 FROM rail_members WHERE group_id=$1 AND user_id=$2',[group,user])).rowCount!==0;}
export async function GET(req:Request){
 if(!configured())return out({error:'Shared accounts and data are not connected yet.'},503);
 try{
  const session=await auth().api.getSession({headers:req.headers});if(!session)return out({error:'Sign in to see your private rails.'},401);
  const uid=session.user.id,id=new URL(req.url).searchParams.get('group');
  if(!id){const groups=await db().query('SELECT g.id,g.name,g.description,g.kind,g.owner,g.code,(SELECT count(*)::int FROM rail_members WHERE group_id=g.id) members FROM rail_groups g JOIN rail_members m ON m.group_id=g.id WHERE m.user_id=$1 ORDER BY g.created',[uid]);return out({user:{id:uid,name:session.user.name},groups:groups.rows});}
  if(!await member(id,uid))return out({error:'You are not a member of this rail.'},403);
  const [posts,members]=await Promise.all([db().query('SELECT p.id,p.group_id AS "groupId",p.user_id AS "userId",u.name,p.kind,p.body,p.hand,p.tournament,p.created,(SELECT count(*)::int FROM rail_likes WHERE post_id=p.id) likes,EXISTS(SELECT 1 FROM rail_likes WHERE post_id=p.id AND user_id=$2) liked FROM rail_posts p JOIN "user" u ON u.id=p.user_id WHERE p.group_id=$1 ORDER BY p.created DESC LIMIT 100',[id,uid]),db().query('SELECT u.id,u.name FROM rail_members m JOIN "user" u ON u.id=m.user_id WHERE m.group_id=$1',[id])]);
  const ids=posts.rows.map(p=>p.id);const [comments,votes]=ids.length?await Promise.all([db().query('SELECT c.id,c.post_id,c.body,c.created,u.name FROM rail_comments c JOIN "user" u ON u.id=c.user_id WHERE c.post_id=ANY($1::text[]) ORDER BY c.created',[ids]),db().query('SELECT post_id,user_id,choice FROM rail_votes WHERE post_id=ANY($1::text[])',[ids])]):[{rows:[]},{rows:[]}];
  const result=posts.rows.map((p:Post)=>{if(p.hand&&!p.hand.revealed&&p.userId!==uid){p.hand={...p.hand};delete p.hand.result;}return {...p,comments:comments.rows.filter(c=>c.post_id===p.id),votes:{Fold:votes.rows.filter(v=>v.post_id===p.id&&v.choice==='Fold').length,Call:votes.rows.filter(v=>v.post_id===p.id&&v.choice==='Call').length,Raise:votes.rows.filter(v=>v.post_id===p.id&&v.choice==='Raise').length},myVote:votes.rows.find(v=>v.post_id===p.id&&v.user_id===uid)?.choice};});
  return out({posts:result,members:members.rows});
 }catch(e){console.error('Rail read failed',e);return out({error:'Could not load your rail. Please try again.'},503);}
}
export async function POST(req:Request){
 if(!configured())return out({error:'Shared accounts and data are not connected yet.'},503);
 try{
  if(req.headers.get('origin')!==new URL(process.env.BETTER_AUTH_URL!).origin)return out({error:'Invalid request origin.'},403);
  const session=await auth().api.getSession({headers:req.headers});if(!session)return out({error:'Please sign in.'},401);
  const raw=await req.text();if(raw.length>15000)return out({error:'This update is too long.'},413);
  const data=JSON.parse(raw);const uid=session.user.id;
  if(data.action==='create'){
   const name=String(data.name||'').trim(),kind=String(data.kind||'');if(!name||name.length>60||!['Friends & family','Study group','Backers'].includes(kind))return out({error:'Enter a rail name and type.'},400);
   const id=randomUUID(),code=randomBytes(18).toString('hex');const client=await db().connect();try{await client.query('BEGIN');await client.query('INSERT INTO rail_groups(id,name,description,kind,owner,code) VALUES($1,$2,$3,$4,$5,$6)',[id,name,String(data.description||'').slice(0,200),kind,uid,code]);await client.query('INSERT INTO rail_members VALUES($1,$2)',[id,uid]);await client.query('COMMIT');}catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}return out({id});
  }
  if(data.action==='join'){const g=await db().query('SELECT id FROM rail_groups WHERE code=$1',[String(data.code||'').trim().slice(0,100)]);if(!g.rowCount)return out({error:'That invite code was not found.'},404);await db().query('INSERT INTO rail_members VALUES($1,$2) ON CONFLICT DO NOTHING',[g.rows[0].id,uid]);return out({id:g.rows[0].id});}
  if(data.action==='post'){const parsed=postSchema.safeParse(data);if(!parsed.success)return out({error:parsed.error.issues[0].message},400);const p=parsed.data;if(!await member(p.groupId,uid))return out({error:'This rail is private.'},403);await db().query('INSERT INTO rail_posts(id,group_id,user_id,kind,body,hand,tournament) VALUES($1,$2,$3,$4,$5,$6,$7)',[randomUUID(),p.groupId,uid,p.kind,p.body,p.hand?JSON.stringify({...p.hand,revealed:false}):null,p.tournament?JSON.stringify(p.tournament):null]);return out({ok:true});}
  const found=await db().query('SELECT * FROM rail_posts WHERE id=$1',[String(data.postId||'')]);const p=found.rows[0];if(!p||!await member(p.group_id,uid))return out({error:'Post not found in your rails.'},404);
  if(data.action==='comment'){const body=String(data.body||'').trim();if(!body||body.length>2000)return out({error:'Comments must be 1–2,000 characters.'},400);await db().query('INSERT INTO rail_comments VALUES($1,$2,$3,$4,now())',[randomUUID(),p.id,uid,body]);}
  else if(data.action==='like'){if(data.liked)await db().query('INSERT INTO rail_likes VALUES($1,$2) ON CONFLICT DO NOTHING',[p.id,uid]);else await db().query('DELETE FROM rail_likes WHERE post_id=$1 AND user_id=$2',[p.id,uid]);}
  else if(data.action==='vote'){if(p.kind!=='hand'||!['Fold','Call','Raise'].includes(data.choice))return out({error:'Choose fold, call, or raise on a hand discussion.'},400);await db().query('INSERT INTO rail_votes VALUES($1,$2,$3) ON CONFLICT(post_id,user_id) DO UPDATE SET choice=EXCLUDED.choice',[p.id,uid,data.choice]);}
  else if(data.action==='reveal'){if(p.user_id!==uid)return out({error:'Only the author can reveal the result.'},403);if(p.kind!=='hand'||!(p.hand as Hand)?.result)return out({error:'This hand has no result to reveal.'},400);await db().query('UPDATE rail_posts SET hand=jsonb_set(hand,\'{revealed}\',\'true\') WHERE id=$1',[p.id]);}
  else if(data.action==='delete'){if(p.user_id!==uid)return out({error:'Only the author can delete a post.'},403);await db().query('DELETE FROM rail_posts WHERE id=$1',[p.id]);}
  else return out({error:'Unknown action.'},400);
  return out({ok:true});
 }catch(e){console.error('Rail write failed',e);return out({error:'Could not save. Please try again; your draft is unchanged.'},503);}
}
