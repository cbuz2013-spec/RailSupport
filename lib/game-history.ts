import {z} from 'zod';
import {RoomError,type RoomDatabase} from './rooms';
import {decodePostImages} from './post-images';
import type {Tournament} from './types';
export type GameSnapshot={id:string;stats:Partial<Tournament>;created:string;baseline:boolean};
export type GameHistory={sessionId:string;ownerId:string;current:Tournament;updates:GameSnapshot[];before:string|null;photo:string|null};
const id=z.string().min(1).max(100);
export async function requireGame(db:RoomDatabase,uid:string,sessionId:string,write=false){
 const game=(await db.query<{id:string;userId:string;name:string;kind:'cash'|'tournament';details:Record<string,unknown>}>(`SELECT id,user_id AS "userId",name,kind,details FROM rail_sessions WHERE id=$1 AND rail_visible_to('session',id,$2) AND (NOT $3::boolean OR user_id=$2)`,[sessionId,uid,write])).rows[0];
 if(!game)throw new RoomError(write?'Only the player can change this game.':'This game is private or no longer available.',403);return game;
}
export async function gameHistory(db:RoomDatabase,uid:string,input:unknown):Promise<GameHistory>{
 const parsed=z.object({session:id,before:z.string().regex(/^\d{1,18}$/).optional()}).safeParse(input);if(!parsed.success)throw new RoomError('Choose a valid game.');
 const {session,before}=parsed.data,game=await requireGame(db,uid,session);
 const [history,latest,photo]=await Promise.all([
  db.query<GameSnapshot>('SELECT id::text,stats,created,baseline FROM rail_game_updates WHERE session_id=$1 AND ($2::bigint IS NULL OR id<$2::bigint) ORDER BY rail_game_updates.id DESC LIMIT 101',[session,before||null]),
  db.query<{stats:Partial<Tournament>}>('SELECT stats FROM rail_game_updates WHERE session_id=$1 ORDER BY id DESC LIMIT 1',[session]),
  db.query<{revision:string}>('SELECT revision FROM rail_game_photos WHERE session_id=$1',[session])
 ]);
 const rows=history.rows.slice(0,100),metadata=Object.fromEntries(Object.entries(game.details||{}).filter(([key])=>['location','buyIn','guarantee','startingStack','stakes'].includes(key)));
 return {sessionId:session,ownerId:game.userId,current:{...metadata,event:game.name,status:'Playing',...latest.rows[0]?.stats,gameType:game.kind},updates:rows.reverse(),before:history.rows.length>100?rows[0].id:null,photo:photo.rows[0]?'/api/game-history?session='+encodeURIComponent(session)+'&photo='+encodeURIComponent(photo.rows[0].revision):null};
}
export async function saveGamePhoto(db:RoomDatabase,uid:string,input:unknown){
 const d=z.object({session:id,image:z.string().max(420000).nullable()}).safeParse(input);if(!d.success)throw new RoomError('Choose a photo for this game.');
 await requireGame(db,uid,d.data.session,true);
 if(d.data.image===null){await db.query('DELETE FROM rail_game_photos WHERE session_id=$1',[d.data.session]);return {ok:true}}
 let photo:ReturnType<typeof decodePostImages>[number];try{photo=decodePostImages([d.data.image])[0]}catch(e){throw new RoomError((e as Error).message)}
 await db.query(`INSERT INTO rail_game_photos(session_id,mime,data) VALUES($1,$2,$3) ON CONFLICT(session_id) DO UPDATE SET mime=EXCLUDED.mime,data=EXCLUDED.data,revision=gen_random_uuid()::text,updated=now()`,[d.data.session,photo.mime,photo.data]);return {ok:true};
}
export async function gamePhoto(db:RoomDatabase,uid:string,sessionId:string){
 await requireGame(db,uid,sessionId);
 const photo=(await db.query<{mime:string;data:Buffer}>('SELECT mime,data FROM rail_game_photos WHERE session_id=$1',[sessionId])).rows[0];if(!photo)throw new RoomError('Photo unavailable.',404);return photo;
}
