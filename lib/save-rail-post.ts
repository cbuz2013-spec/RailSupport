import {randomUUID} from 'node:crypto';
import type {Pool} from 'pg';
import {postSchema} from './validation';
import {decodePostImages} from './post-images';
import {validMentions} from './activity';
import {RoomError} from './rooms';
export async function saveRailPost(pool:Pool,userId:string,input:unknown,editingId?:string){
 const parsed=postSchema.safeParse(input);if(!parsed.success)throw new RoomError(parsed.error.issues[0].message);
 const p=parsed.data,client=await pool.connect();
 try{
  await client.query('BEGIN');
  if(!(await client.query('SELECT 1 FROM rail_members m JOIN rail_groups g ON g.id=m.group_id WHERE m.group_id=$1 AND m.user_id=$2 AND rail_unblocked($2,g.owner)',[p.groupId,userId])).rowCount)throw new RoomError('This rail is private.',403);
  const group=(await client.query('SELECT owner,tournament FROM rail_groups WHERE id=$1',[p.groupId])).rows[0];
  if(group.tournament&&group.owner!==userId)throw new RoomError('Only the tournament player can publish updates. Followers can comment and chat.',403);
  const old=editingId?(await client.query('SELECT * FROM rail_posts WHERE id=$1 AND user_id=$2 AND group_id=$3 FOR UPDATE',[editingId,userId,p.groupId])).rows[0]:null;
  if(editingId&&!old)throw new RoomError('Only the author can edit a post in this rail.',403);
  const id=editingId||randomUUID();let sessionId=old?.session_id||p.sessionId||null;
  if(group.tournament){
   if(p.startSession)throw new RoomError('This tournament already has a rail.');
   const game=(await client.query('SELECT id FROM rail_sessions WHERE group_id=$1 AND user_id=$2 ORDER BY created LIMIT 1',[p.groupId,userId])).rows[0];
   sessionId=game?.id||null;
  }
  if(old?.session_id&&p.startSession)throw new RoomError('This post already belongs to a session. Create a new update to start another rail.');
  if(p.startSession){
   sessionId=randomUUID();await client.query('INSERT INTO rail_sessions(id,user_id,group_id,kind,name,details) VALUES($1,$2,$3,$4,$5,$6::jsonb)',[sessionId,userId,p.groupId,p.startSession,p.tournament?.event||'',JSON.stringify(p.sessionDetails||{})]);
   await client.query("INSERT INTO rail_watches(user_id,scope,target_id) VALUES($1,'session',$2)",[userId,sessionId]);
  }else if(sessionId){
   if(!(await client.query('SELECT 1 FROM rail_sessions WHERE id=$1 AND user_id=$2 AND group_id=$3',[sessionId,userId,p.groupId])).rowCount)throw new RoomError('Choose one of your own rails in this group.',403);
  }
  const mentions=await validMentions(client,userId,p.body,p.mentions);
  const updatedTournament=p.tournament?{...old?.tournament,...p.tournament,...p.sessionDetails}:null;
  if(updatedTournament&&old)for(const key of ['chips','bigBlind','remaining','started','winnings'] as const){if(p.tournament?.[key]===undefined)delete updatedTournament[key];}
  const hand=p.hand?{...p.hand,revealed:!!(old?.hand?.revealed&&old.hand.result===p.hand.result)}:null;
  if(old)await client.query('UPDATE rail_posts SET kind=$2,body=$3,hand=$4,tournament=$5,session_id=$6,mentions=$7::jsonb,edited=now() WHERE id=$1',[id,p.kind,p.body,hand,updatedTournament,sessionId,JSON.stringify(mentions)]);
  else await client.query('INSERT INTO rail_posts(id,group_id,user_id,kind,body,hand,tournament,session_id,mentions) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb)',[id,p.groupId,userId,p.kind,p.body,hand,updatedTournament,sessionId,JSON.stringify(mentions)]);
  let images:ReturnType<typeof decodePostImages>;try{images=decodePostImages(p.images)}catch(e){throw new RoomError((e as Error).message)}
  const saved=old?(await client.query('SELECT position,mime,data FROM rail_post_images WHERE post_id=$1 ORDER BY position',[id])).rows:[];
  const keep=p.keepImages===undefined?saved.map(s=>s.position):[...new Set(p.keepImages)];
  if(keep.some(i=>!saved.some(s=>s.position===i)))throw new RoomError('A saved photo has changed. Refresh before editing.');
  const combined=[...saved.filter(s=>keep.includes(s.position)),...images];if(combined.length>3)throw new RoomError('Use up to three photos.');
  if(old)await client.query('DELETE FROM rail_post_images WHERE post_id=$1',[id]);
  for(const [position,image] of combined.entries())await client.query('INSERT INTO rail_post_images(post_id,position,mime,data) VALUES($1,$2,$3,$4)',[id,position,image.mime,image.data]);
  if(sessionId&&p.tournament)await client.query('UPDATE rail_sessions SET active=$2 WHERE id=$1',[sessionId,!['Cashed','Out'].includes(p.tournament.status)]);
  await client.query('COMMIT');return {ok:true,id,sessionId};
 }catch(e){await client.query('ROLLBACK');throw e}finally{client.release()}
}
