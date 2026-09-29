import {auth} from '@/lib/auth';
import {configured,db} from '@/lib/db';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const out=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store'}});
const domains:Record<string,string[]>={wsop:['wsop.com'],mspt:['msptpoker.com'],hendon:['thehendonmob.com'],sharkscope:['sharkscope.com']};
function link(value:unknown,key:string){const text=String(value||'').trim();if(!text)return '';if(text.length>400)throw Error('Profile link is too long.');let url:URL;try{url=new URL(text)}catch{throw Error('Enter a full https:// link for '+key+'.')};if(url.protocol!=='https:'||url.username||url.password||!domains[key].some(d=>url.hostname===d||url.hostname.endsWith('.'+d)))throw Error('Use a '+domains[key][0]+' link for '+key+'.');return url.toString();}
async function session(req:Request){return (await auth().api.getSession({headers:req.headers}))?.user.id;}
export async function GET(req:Request){
 if(!configured())return out({error:'Account setup is incomplete.'},503);
 try{const uid=await session(req);if(!uid)return out({error:'Sign in first.'},401);
  const id=new URL(req.url).searchParams.get('id')||uid;
  const user=await db().query('SELECT id,name FROM "user" WHERE id=$1',[id]);if(!user.rowCount)return out({error:'Profile not found.'},404);
  const relation=await db().query('SELECT blocker_id,blocked_id FROM rail_blocks WHERE (blocker_id=$1 AND blocked_id=$2) OR (blocker_id=$2 AND blocked_id=$1)',[uid,id]);
  const blockedBy=relation.rows.some(r=>r.blocker_id===id&&id!==uid),isBlocked=relation.rows.some(r=>r.blocker_id===uid&&id!==uid);
  if(blockedBy)return out({error:'Profile unavailable.'},404);
  const [profile,stats,following]=await Promise.all([
   db().query('SELECT bio,photo,wsop,mspt,hendon,sharkscope FROM rail_profiles WHERE user_id=$1',[id]),
   db().query('SELECT (SELECT count(*)::int FROM rail_follows WHERE followed_id=$1) followers,(SELECT count(*)::int FROM rail_follows WHERE follower_id=$1) following',[id]),
   db().query('SELECT 1 FROM rail_follows WHERE follower_id=$1 AND followed_id=$2',[uid,id])]);
  return out({profile:{id,name:user.rows[0].name,bio:'',photo:'',wsop:'',mspt:'',hendon:'',sharkscope:'',...profile.rows[0],...stats.rows[0],isFollowing:!!following.rowCount,isBlocked}});
 }catch(e){console.error('Profile read failed',e);return out({error:'Could not load this profile.'},503)}
}
export async function POST(req:Request){
 if(!configured())return out({error:'Account setup is incomplete.'},503);
 if(req.headers.get('origin')!==new URL(process.env.BETTER_AUTH_URL!).origin)return out({error:'Invalid request origin.'},403);
 try{const uid=await session(req);if(!uid)return out({error:'Sign in first.'},401);
  const raw=await req.text();if(raw.length>250000)return out({error:'Profile photo is too large.'},413);
  const data=JSON.parse(raw);const action=String(data.action||'');
  if(action==='profile'){
   const name=String(data.name||'').trim(),bio=String(data.bio||'').trim(),photo=String(data.photo||'');
   if(name.length<2||name.length>60||bio.length>500)return out({error:'Name must be 2–60 characters and bio at most 500.'},400);
   if(photo&&(!/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(photo)||photo.length>220000))return out({error:'Choose a smaller JPEG, PNG, or WebP photo.'},400);
   const links={wsop:link(data.wsop,'wsop'),mspt:link(data.mspt,'mspt'),hendon:link(data.hendon,'hendon'),sharkscope:link(data.sharkscope,'sharkscope')};
   const client=await db().connect();try{await client.query('BEGIN');await client.query('UPDATE "user" SET name=$1 WHERE id=$2',[name,uid]);await client.query('INSERT INTO rail_profiles(user_id,bio,photo,wsop,mspt,hendon,sharkscope) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(user_id) DO UPDATE SET bio=EXCLUDED.bio,photo=EXCLUDED.photo,wsop=EXCLUDED.wsop,mspt=EXCLUDED.mspt,hendon=EXCLUDED.hendon,sharkscope=EXCLUDED.sharkscope,updated=now()',[uid,bio,photo,links.wsop,links.mspt,links.hendon,links.sharkscope]);await client.query('COMMIT')}catch(e){await client.query('ROLLBACK');throw e}finally{client.release()};return out({ok:true});
  }
  const target=String(data.id||'');if(!target||target===uid||target.length>100)return out({error:'Select another player.'},400);
  if(action==='follow'){
   const inserted=await db().query('INSERT INTO rail_follows(follower_id,followed_id) SELECT $1,u.id FROM "user" u WHERE u.id=$2 AND NOT EXISTS(SELECT 1 FROM rail_blocks WHERE (blocker_id=$1 AND blocked_id=$2) OR (blocker_id=$2 AND blocked_id=$1)) ON CONFLICT DO NOTHING',[uid,target]);
   if(!inserted.rowCount){const existing=await db().query('SELECT 1 FROM rail_follows WHERE follower_id=$1 AND followed_id=$2',[uid,target]);if(!existing.rowCount)return out({error:'This player cannot be followed.'},403)}
  }else if(action==='unfollow')await db().query('DELETE FROM rail_follows WHERE follower_id=$1 AND followed_id=$2',[uid,target]);
  else if(action==='block'){
   const client=await db().connect();try{await client.query('BEGIN');const exists=await client.query('SELECT 1 FROM "user" WHERE id=$1',[target]);if(!exists.rowCount){await client.query('ROLLBACK');return out({error:'Player not found.'},404)}await client.query('INSERT INTO rail_blocks(blocker_id,blocked_id) VALUES($1,$2) ON CONFLICT DO NOTHING',[uid,target]);await client.query('DELETE FROM rail_follows WHERE (follower_id=$1 AND followed_id=$2) OR (follower_id=$2 AND followed_id=$1)',[uid,target]);await client.query('COMMIT')}catch(e){await client.query('ROLLBACK');throw e}finally{client.release()}
  }else if(action==='unblock')await db().query('DELETE FROM rail_blocks WHERE blocker_id=$1 AND blocked_id=$2',[uid,target]);
  else return out({error:'Unknown profile action.'},400);
  return out({ok:true});
 }catch(e){if(e instanceof SyntaxError)return out({error:'Invalid request.'},400);if(e instanceof Error&&(/link|https|smaller|long/.test(e.message)))return out({error:e.message},400);console.error('Profile write failed',e);return out({error:'Could not save profile changes.'},503)}
}
