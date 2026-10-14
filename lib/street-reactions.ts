import {z} from 'zod';
import {contentFor,scopes,type PostScope} from './activity';
import {reactionValues} from './reactions';
import {RoomError,type RoomDatabase} from './rooms';
const target=z.object({scope:z.enum(scopes),postId:z.string().min(1).max(100),street:z.enum(['preflop','flop','turn','river']).optional(),commentId:z.string().min(1).max(100).optional()});
async function allowed(db:RoomDatabase,uid:string,d:z.infer<typeof target>){
 await contentFor(db,uid,d.scope,d.postId);
 if(d.commentId&&!(await db.query('SELECT 1 FROM rail_activity_comments WHERE scope=$1 AND post_id=$2 AND id=$3 AND rail_unblocked(user_id,$4)',[d.scope,d.postId,d.commentId,uid])).rows.length)throw new RoomError('Comment unavailable.',404);
 if(d.street){
  const table={rail:'rail_posts',room:'rail_room_posts',table:'rail_table_posts',announcement:''}[d.scope];
  if(!table||!(await db.query(`SELECT 1 FROM ${table} WHERE id=$1 AND hand IS NOT NULL`,[d.postId])).rows.length)throw new RoomError('Hand review unavailable.',404);
 }
}
export async function reactionPeople(db:RoomDatabase,uid:string,input:unknown){
 const d=target.extend({offset:z.coerce.number().int().min(0).max(100000).default(0)}).parse(input);await allowed(db,uid,d);
 const result=d.street?await db.query('SELECT u.id,u.name,r.reaction FROM rail_street_reactions r JOIN "user" u ON u.id=r.user_id WHERE r.scope=$1 AND r.post_id=$2 AND r.street=$3 AND rail_unblocked(r.user_id,$4) ORDER BY u.name,u.id LIMIT 51 OFFSET $5',[d.scope,d.postId,d.street,uid,d.offset]):await db.query('SELECT u.id,u.name,r.reaction FROM rail_activity_reactions r JOIN "user" u ON u.id=r.user_id WHERE r.scope=$1 AND r.target_id=$2 AND r.is_comment=$3 AND rail_unblocked(r.user_id,$4) ORDER BY u.name,u.id LIMIT 51 OFFSET $5',[d.scope,d.commentId||d.postId,!!d.commentId,uid,d.offset]);
 return {people:result.rows.slice(0,50),nextOffset:result.rows.length>50?d.offset+50:null};
}
export async function streetState(db:RoomDatabase,uid:string,input:unknown){
 const d=target.required({street:true}).parse(input);await allowed(db,uid,d);
 const rows=(await db.query<{reaction:string;total:number}>('SELECT reaction,count(*)::int AS total FROM rail_street_reactions WHERE scope=$1 AND post_id=$2 AND street=$3 AND rail_unblocked(user_id,$4) GROUP BY reaction',[d.scope,d.postId,d.street,uid])).rows;
 const mine=(await db.query<{reaction:string}>('SELECT reaction FROM rail_street_reactions WHERE scope=$1 AND post_id=$2 AND street=$3 AND user_id=$4',[d.scope,d.postId,d.street,uid])).rows[0];
 const can=(await db.query('SELECT 1 WHERE rail_can_comment($1,$2,$3)',[d.scope,d.postId,uid])).rows.length>0;
 return {reactions:Object.fromEntries(rows.map(r=>[r.reaction,r.total])),myReaction:mine?.reaction||null,canReact:can};
}
export async function reactStreet(db:RoomDatabase,uid:string,input:unknown){
 const d=target.required({street:true}).extend({reaction:z.enum(reactionValues).nullable()}).parse(input);await allowed(db,uid,d);
 if(!(await db.query('SELECT 1 WHERE rail_can_comment($1,$2,$3)',[d.scope,d.postId,uid])).rows.length)throw new RoomError('Join this conversation to react.',403);
 if(d.reaction)await db.query('INSERT INTO rail_street_reactions(scope,post_id,street,user_id,reaction) VALUES($1,$2,$3,$4,$5) ON CONFLICT(scope,post_id,street,user_id) DO UPDATE SET reaction=EXCLUDED.reaction',[d.scope,d.postId,d.street,uid,d.reaction]);
 else await db.query('DELETE FROM rail_street_reactions WHERE scope=$1 AND post_id=$2 AND street=$3 AND user_id=$4',[d.scope,d.postId,d.street,uid]);
 return {ok:true};
}
