import {randomBytes,randomUUID} from 'node:crypto';
import type {Pool} from 'pg';
import {z} from 'zod';
import {RoomError,type RoomDatabase} from './rooms';
import {tournamentSchema} from './validation';

const text=(max:number)=>z.string().trim().max(max).default('');
export const tournamentSetupSchema=z.object({groupId:z.string().min(1).max(100),event:text(120),location:text(120),buyIn:text(30),startingStack:text(30),guarantee:text(40),chips:tournamentSchema.shape.chips,bigBlind:tournamentSchema.shape.bigBlind,remaining:tournamentSchema.shape.remaining,started:tournamentSchema.shape.started,paid:tournamentSchema.shape.paid,status:z.enum(['Playing','Out']).default('Playing'),winnings:tournamentSchema.shape.winnings});

export async function startTournament(pool:Pool,userId:string,input:unknown){
 const parsed=tournamentSetupSchema.safeParse(input);if(!parsed.success)throw new RoomError(parsed.error.issues[0].message);
 const d=parsed.data,c=await pool.connect();
 try{
  await c.query('BEGIN');
  if(!(await c.query('SELECT 1 FROM rail_members m JOIN rail_groups g ON g.id=m.group_id WHERE m.group_id=$1 AND m.user_id=$2 AND rail_unblocked($2,g.owner)',[d.groupId,userId])).rowCount)throw new RoomError('Choose one of your private rails.',403);
  const id=randomUUID(),sessionId=randomUUID(),postId=randomUUID(),code=randomBytes(18).toString('hex');
  const name=d.event||'Tournament';
  await c.query("INSERT INTO rail_groups(id,name,description,kind,owner,code,tournament,parent_group_id) VALUES($1,$2,$3,'Friends & family',$4,$5,true,$6)",[id,name,'Follow the player’s tournament updates and join the rail chat.',userId,code,d.groupId]);
  await c.query('INSERT INTO rail_members(group_id,user_id) VALUES($1,$2)',[id,userId]);
  const {groupId:_,...details}=d;
  await c.query("INSERT INTO rail_sessions(id,group_id,user_id,kind,name,details) VALUES($1,$2,$3,'tournament',$4,$5::jsonb)",[sessionId,id,userId,name,JSON.stringify(details)]);
  await c.query("INSERT INTO rail_watches(user_id,scope,target_id) VALUES($1,'session',$2)",[userId,sessionId]);
  const tournament={...details,gameType:'tournament',stage:'Registration'};
  if(d.status==='Out')await c.query('UPDATE rail_sessions SET active=false WHERE id=$1',[sessionId]);
  await c.query("INSERT INTO rail_posts(id,group_id,user_id,kind,body,tournament,session_id) VALUES($1,$2,$3,'update','Tournament started',$4::jsonb,$5)",[postId,id,userId,JSON.stringify(tournament),sessionId]);
  await c.query('COMMIT');return {id,sessionId,postId};
 }catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}
}

export async function updateTournament(pool:Pool,userId:string,raw:unknown){
 const parsed=z.object({postId:z.string().min(1).max(100),part:z.enum(['stack','stage','status']),values:z.object({chips:tournamentSchema.shape.chips,bigBlind:tournamentSchema.shape.bigBlind,remaining:tournamentSchema.shape.remaining,started:tournamentSchema.shape.started,paid:tournamentSchema.shape.paid,stage:tournamentSchema.shape.stage,status:z.enum(['Playing','On break','Bagged','Cashed','Out']).optional(),winnings:tournamentSchema.shape.winnings}).strict()}).safeParse(raw);
 if(!parsed.success)throw new RoomError(parsed.error.issues[0].message);
 const d=parsed.data,allowed=d.part==='stack'?['chips','bigBlind','remaining','started','paid']:d.part==='stage'?['stage']:['status','winnings'];
 if(Object.keys(d.values).some(key=>!allowed.includes(key)))throw new RoomError('Choose only fields for this update.');
 if(d.part==='status'&&!d.values.status)throw new RoomError('Choose Still Playing, Finished, or Busted.');
 if(d.part==='stage'&&!d.values.stage)throw new RoomError('Choose a tournament stage.');
 const c=await pool.connect();try{
  await c.query('BEGIN');
  const p=(await c.query('SELECT p.* FROM rail_posts p JOIN rail_members m ON m.group_id=p.group_id AND m.user_id=$2 WHERE p.id=$1 AND p.user_id=$2 FOR UPDATE OF p',[d.postId,userId])).rows[0];
  if(!p?.tournament)throw new RoomError('Only the player can update this tournament.',403);
  const snapshot=p.session_id?(await c.query('SELECT stats FROM rail_game_updates WHERE session_id=$1 ORDER BY id DESC LIMIT 1',[p.session_id])).rows[0]?.stats:null;
  const next={...p.tournament};if(snapshot){for(const key of ['chips','bigBlind','remaining','started','paid','stage','status','winnings'])delete next[key];Object.assign(next,snapshot);}for(const key of allowed)delete next[key];Object.assign(next,d.values);
  const validated=tournamentSchema.safeParse(next);if(!validated.success)throw new RoomError(validated.error.issues[0].message);
  await c.query('UPDATE rail_posts SET tournament=$2::jsonb,edited=now() WHERE id=$1',[p.id,JSON.stringify({...next,...validated.data})]);
  if(p.session_id&&d.part==='status')await c.query('UPDATE rail_sessions SET active=$2 WHERE id=$1',[p.session_id,!['Out','Cashed'].includes(next.status)]);
  await c.query('COMMIT');return {ok:true};
 }catch(e){await c.query('ROLLBACK');throw e}finally{c.release()}
}

export async function requireTournament(database:RoomDatabase,userId:string,groupId:string){
 const g=(await database.query('SELECT g.id,g.owner FROM rail_groups g JOIN rail_members m ON m.group_id=g.id WHERE g.id=$1 AND g.tournament AND m.user_id=$2 AND rail_unblocked($2,g.owner)',[groupId,userId])).rows[0];
 if(!g)throw new RoomError('This tournament rail is private.',403);return g;
}

export async function readTournamentChat(database:RoomDatabase,userId:string,groupId:string){
 await requireTournament(database,userId,groupId);
 return (await database.query('SELECT c.id,c.user_id AS "userId",u.name,c.body,c.created FROM rail_tournament_chat c JOIN "user" u ON u.id=c.user_id WHERE c.group_id=$1 AND rail_unblocked($2,c.user_id) ORDER BY c.created DESC,c.id DESC LIMIT 100',[groupId,userId])).rows.reverse();
}

export async function sendTournamentChat(database:RoomDatabase,userId:string,raw:unknown){
 const parsed=z.object({groupId:z.string().min(1).max(100),body:z.string().trim().min(1).max(1000),id:z.string().uuid()}).safeParse(raw);
 if(!parsed.success)throw new RoomError('Write a message of 1–1,000 characters.');
 const d=parsed.data;await requireTournament(database,userId,d.groupId);
 // A stable client ID makes a retry safe after a lost response.
 await database.query('INSERT INTO rail_tournament_chat(id,group_id,user_id,body) VALUES($1,$2,$3,$4) ON CONFLICT(id) DO NOTHING',[d.id,d.groupId,userId,d.body]);return {ok:true};
}
