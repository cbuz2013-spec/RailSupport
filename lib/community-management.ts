import {randomBytes,randomUUID} from 'node:crypto';
import {z} from 'zod';
import {RoomError,type RoomDatabase} from './rooms';
import {mutateCommunity} from './community';
const id=z.string().min(1).max(100);
const input=z.object({action:z.enum(['deleteGroup','leaveGroup','removeMember','transferGroup','rotateInvite','revokeInvite','resendInvite','pinAnnouncement','transferRoom']),groupId:id.optional(),roomId:id.optional(),userId:id.optional(),invitationId:id.optional(),postId:id.optional(),enabled:z.boolean().optional(),confirmName:z.string().max(200).optional()});
const host=`(r.owner_id=$1 OR EXISTS(SELECT 1 FROM rail_room_hosts h WHERE h.room_id=r.id AND h.user_id=$1 AND h.accepted))`;
export async function managementState(db:RoomDatabase,uid:string,groupId?:string){
 let group=null,members:Record<string,unknown>[]=[];
 if(groupId){
  group=(await db.query('SELECT g.id,g.name,g.owner FROM rail_groups g JOIN rail_members m ON m.group_id=g.id WHERE g.id=$1 AND m.user_id=$2',[groupId,uid])).rows[0];
  if(!group)throw new RoomError('Group unavailable.',404);
  members=(await db.query('SELECT u.id,u.name FROM rail_members m JOIN "user" u ON u.id=m.user_id WHERE m.group_id=$1 AND rail_unblocked(u.id,$2) ORDER BY u.name',[groupId,uid])).rows;
 }
 const invitations=(await db.query(`SELECT i.id,i.group_id AS "groupId",i.room_id AS "roomId",u.name,COALESCE(g.name,r.name) AS destination,i.created,CASE WHEN i.created<now()-interval '30 days' THEN 'expired' ELSE 'pending' END AS status FROM rail_invitations i JOIN "user" u ON u.id=i.recipient_id LEFT JOIN rail_groups g ON g.id=i.group_id LEFT JOIN rail_rooms r ON r.id=i.room_id WHERE i.sender_id=$1 AND rail_unblocked(i.recipient_id,$1) ORDER BY i.created DESC LIMIT 100`,[uid])).rows;
 const history=(await db.query<{id:string;status:string;created:string;destination:string;name:string}>(`SELECT h.id,h.status,h.created,COALESCE(g.name,r.name,'Unavailable destination') AS destination,COALESCE(u.name,'Deleted member') AS name FROM rail_invitation_history h LEFT JOIN "user" u ON u.id=CASE WHEN h.sender_id=$1 THEN h.recipient_id ELSE h.sender_id END LEFT JOIN rail_groups g ON g.id=h.group_id LEFT JOIN rail_rooms r ON r.id=h.room_id WHERE (h.sender_id=$1 OR h.recipient_id=$1) AND (u.id IS NULL OR rail_unblocked(u.id,$1)) ORDER BY h.created DESC LIMIT 100`,[uid])).rows;
 return {group,members,invitations,history};
}
export async function manageCommunity(db:RoomDatabase,uid:string,raw:unknown){
 const d=input.parse(raw);let changed:Record<string,unknown>[]=[];
 if(['deleteGroup','leaveGroup','removeMember','transferGroup','rotateInvite'].includes(d.action)){
  if(!d.groupId)throw new RoomError('Choose a private group.');
  const g=(await db.query<{owner:string;name:string}>('SELECT owner,name FROM rail_groups WHERE id=$1 FOR UPDATE',[d.groupId])).rows[0];
  if(!g)throw new RoomError('Group unavailable.',404);
  if(d.action==='leaveGroup'){
   if(g.owner===uid)throw new RoomError('Transfer ownership before leaving this group.');
   changed=(await db.query('DELETE FROM rail_members WHERE group_id=$1 AND user_id=$2 RETURNING user_id',[d.groupId,uid])).rows;
  }else{
   if(g.owner!==uid)throw new RoomError('Only the group owner can do this.',403);
   if(d.action==='deleteGroup'){
    if(d.confirmName!==g.name)throw new RoomError('Type the rail name exactly to confirm deletion.');
    // Polymorphic activity references need cleanup before their source rows disappear.
    const targets=`(scope='rail' AND target_id IN(SELECT id FROM rail_posts WHERE group_id=$1 UNION SELECT c.id FROM rail_comments c JOIN rail_posts p ON p.id=c.post_id WHERE p.group_id=$1)) OR (scope IN ('session','game') AND target_id IN(SELECT id FROM rail_sessions WHERE group_id=$1)) OR (scope='invitation' AND target_id IN(SELECT id FROM rail_invitations WHERE group_id=$1))`;
    await db.query('DELETE FROM rail_watches WHERE '+targets,[d.groupId]);
    await db.query('DELETE FROM rail_notifications WHERE '+targets,[d.groupId]);
    await db.query('DELETE FROM rail_activity_events WHERE '+targets,[d.groupId]);
    await db.query("DELETE FROM rail_comment_likes WHERE scope='rail' AND comment_id IN(SELECT c.id FROM rail_comments c JOIN rail_posts p ON p.id=c.post_id WHERE p.group_id=$1)",[d.groupId]);
    await db.query("DELETE FROM rail_street_reactions WHERE scope='rail' AND post_id IN(SELECT id FROM rail_posts WHERE group_id=$1)",[d.groupId]);
    await db.query('DELETE FROM rail_invitation_history WHERE group_id=$1',[d.groupId]);
    // Separate tournament rails survive through parent_group_id ON DELETE SET NULL.
    changed=(await db.query('DELETE FROM rail_groups WHERE id=$1 AND owner=$2 RETURNING id',[d.groupId,uid])).rows;
   }
   if(d.action==='rotateInvite')changed=(await db.query('UPDATE rail_groups SET code=$2 WHERE id=$1 RETURNING id',[d.groupId,randomBytes(18).toString('hex')])).rows;
   if(d.action==='removeMember'){
    if(!d.userId||d.userId===uid)throw new RoomError('Choose another member.');
    changed=(await db.query('DELETE FROM rail_members WHERE group_id=$1 AND user_id=$2 RETURNING user_id',[d.groupId,d.userId])).rows;
   }
   if(d.action==='transferGroup'){
    if(!d.userId||d.userId===uid)throw new RoomError('Choose another member.');
    changed=(await db.query('UPDATE rail_groups SET owner=$2 WHERE id=$1 AND EXISTS(SELECT 1 FROM rail_members WHERE group_id=$1 AND user_id=$2) AND rail_unblocked($2,$3) RETURNING id',[d.groupId,d.userId,uid])).rows;
   }
  }
  if(['leaveGroup','removeMember'].includes(d.action)){
   const target=d.action==='leaveGroup'?uid:d.userId;
   await db.query("DELETE FROM rail_watches w WHERE user_id=$1 AND ((scope='session' AND target_id IN(SELECT id FROM rail_sessions WHERE group_id=$2)) OR (scope='rail' AND target_id IN(SELECT id FROM rail_posts WHERE group_id=$2)))",[target,d.groupId]);
   await db.query('DELETE FROM rail_invitations WHERE group_id=$1 AND (recipient_id=$2 OR sender_id=$2)',[d.groupId,target]);
  }
 }else if(d.action==='revokeInvite'||d.action==='resendInvite'){
  const invite=(await db.query<{id:string;recipient_id:string;group_id:string|null;room_id:string|null}>('SELECT * FROM rail_invitations WHERE id=$1 AND sender_id=$2 FOR UPDATE',[d.invitationId,uid])).rows[0];
  if(!invite)throw new RoomError('Invitation unavailable.',404);
  if(d.action==='resendInvite'){
   if((await db.query("SELECT 1 FROM rail_invitations WHERE id=$1 AND created>now()-interval '1 minute'",[invite.id])).rows.length)throw new RoomError('Wait one minute before resending.');
   await mutateCommunity(db,uid,{action:'invite',recipientId:invite.recipient_id,...(invite.group_id?{groupId:invite.group_id}:{roomId:invite.room_id})});return {ok:true};
  }
  await db.query("INSERT INTO rail_invitation_history(invitation_id,sender_id,recipient_id,group_id,room_id,status) SELECT id,sender_id,recipient_id,group_id,room_id,'withdrawn' FROM rail_invitations WHERE id=$1",[invite.id]);
  changed=(await db.query('DELETE FROM rail_invitations WHERE id=$1 RETURNING id',[invite.id])).rows;
 }else if(d.action==='pinAnnouncement'){
  changed=(await db.query(`UPDATE rail_room_announcements a SET pinned=$4 FROM rail_rooms r WHERE a.id=$3 AND a.room_id=r.id AND r.id=$2 AND ${host} RETURNING a.id`,[uid,d.roomId,d.postId,!!d.enabled])).rows;
 }else if(d.action==='transferRoom'){
  if(!d.userId||d.userId===uid)throw new RoomError('Choose an accepted co-host.');
  changed=(await db.query('UPDATE rail_rooms r SET owner_id=$3 WHERE id=$2 AND owner_id=$1 AND EXISTS(SELECT 1 FROM rail_room_hosts WHERE room_id=$2 AND user_id=$3 AND accepted) AND rail_unblocked($1,$3) RETURNING id',[uid,d.roomId,d.userId])).rows;
  if(changed.length){await db.query('INSERT INTO rail_room_hosts(room_id,user_id,accepted) VALUES($1,$2,true) ON CONFLICT(room_id,user_id) DO UPDATE SET accepted=true',[d.roomId,uid]);await db.query('DELETE FROM rail_room_hosts WHERE room_id=$1 AND user_id=$2',[d.roomId,d.userId]);}
 }
 if(!changed.length)throw new RoomError('This action is unavailable or your access has changed.',403);
 await db.query('INSERT INTO rail_audit(actor_id,kind,group_id,room_id,target_id) VALUES($1,$2,$3,$4,$5)',[uid,d.action,d.groupId||null,d.roomId||null,d.userId||d.postId||d.invitationId||null]);
 return {ok:true};
}
