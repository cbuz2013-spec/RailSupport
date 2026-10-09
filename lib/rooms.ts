import {validMentions} from './activity';
import {randomUUID} from 'node:crypto';
import {roomAction, type Room, type RoomDirectory, type RoomDetail, type RoomHost, type Announcement} from './rooms-validation';

// Structural interface keeps the production pg pool and isolated PostgreSQL tests on the same path.
export interface RoomDatabase {
  query<T extends Record<string, unknown> = Record<string, unknown>>(sql: string, values?: unknown[]): Promise<{rows: T[]}>;
}
export class RoomError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export function canCreateRoom(userId: string, approvedIds = process.env.RAILSOCIAL_ROOM_CREATOR_IDS || '') {
  return approvedIds.split(',').map(id => id.trim()).filter(Boolean).includes(userId);
}
const host = `(r.owner_id=$1 OR EXISTS(SELECT 1 FROM rail_room_hosts h WHERE h.room_id=r.id AND h.user_id=$1 AND h.accepted))`;
const visible = `(r.published OR ${host})`;
const fields = `r.id,r.name,r.city,r.description,r.address,r.website,r.published,
  (SELECT count(*)::int FROM rail_room_follows f WHERE f.room_id=r.id) AS followers,
  EXISTS(SELECT 1 FROM rail_room_follows f WHERE f.room_id=r.id AND f.user_id=$1) AS following,
  CASE WHEN r.owner_id=$1 THEN 'owner' WHEN ${host} THEN 'host' ELSE 'member' END AS role`;

export async function listRooms(database: RoomDatabase, userId: string, params: URLSearchParams): Promise<RoomDirectory> {
  const search = (params.get('q') || '').trim().slice(0,120);
  const scope = params.get('scope') || 'all';
  const offset = Number(params.get('offset') || 0);
  if (!['all','following','hosting'].includes(scope) || !Number.isSafeInteger(offset) || offset < 0 || offset > 10000) throw new RoomError('Invalid room filter.');
  const [result, invitations] = await Promise.all([
    database.query<Room>(`SELECT ${fields} FROM rail_rooms r WHERE ${visible}
      AND ($2='' OR strpos(lower(r.name||' '||r.city),lower($2))>0)
      AND ($3='all' OR ($3='following' AND EXISTS(SELECT 1 FROM rail_room_follows f WHERE f.room_id=r.id AND f.user_id=$1)) OR ($3='hosting' AND ${host}))
      ORDER BY lower(r.name),r.id LIMIT 25 OFFSET $4`, [userId,search,scope,offset]),
    database.query<{id:string;name:string}>(`SELECT r.id,r.name FROM rail_rooms r JOIN rail_room_hosts h ON h.room_id=r.id WHERE h.user_id=$1 AND NOT h.accepted ORDER BY h.created DESC LIMIT 50`, [userId]),
  ]);
  return {rooms:result.rows.slice(0,24), nextOffset:result.rows.length>24?offset+24:null, invitations:invitations.rows, canCreate:canCreateRoom(userId)};
}

export async function readRoom(database: RoomDatabase, userId: string, roomId: string, before: string | null = null, focus = ''): Promise<RoomDetail> {
  const result = await database.query<Room>(`SELECT ${fields} FROM rail_rooms r WHERE r.id=$2 AND ${visible}`, [userId,roomId]);
  const room = result.rows[0];
  if (!room) throw new RoomError('Room unavailable.',404);
  const [hosts, announcements] = await Promise.all([
    database.query<RoomHost>(`SELECT u.id,u.name,'owner' AS role FROM rail_rooms r JOIN "user" u ON u.id=r.owner_id WHERE r.id=$1
      UNION ALL SELECT u.id,u.name,CASE WHEN h.accepted THEN 'host' ELSE 'invited' END AS role
      FROM rail_room_hosts h JOIN "user" u ON u.id=h.user_id WHERE h.room_id=$1 AND (h.accepted OR $2) ORDER BY role,name`,[roomId,room.role==='owner']),
    database.query<Announcement>(`SELECT a.id,a.body,u.name,a.created,a.user_id AS "userId",a.edited,a.mentions FROM rail_room_announcements a JOIN "user" u ON u.id=a.user_id
      WHERE a.room_id=$2 AND NOT EXISTS(SELECT 1 FROM rail_blocks b WHERE (b.blocker_id=$1 AND b.blocked_id=a.user_id) OR (b.blocker_id=a.user_id AND b.blocked_id=$1))
      AND ($3::text IS NULL OR (a.created,a.id)<(SELECT created,id FROM rail_room_announcements WHERE id=$3 AND room_id=$2))
      ORDER BY (a.id=$4) DESC,a.created DESC,a.id DESC LIMIT 21`,[userId,roomId,before,focus]),
  ]);
  return {room,hosts:hosts.rows,announcements:announcements.rows.slice(0,20),nextBefore:announcements.rows.length>20?announcements.rows[19].id:null};
}

export async function mutateRoom(database: RoomDatabase, userId: string, raw: unknown) {
  const parsed = roomAction.safeParse(raw);
  if (!parsed.success) throw new RoomError(parsed.error.issues[0].message);
  const data = parsed.data;
  if (data.action === 'create') {
    if (!canCreateRoom(userId)) throw new RoomError('Room creation is available to approved room hosts.',403);
    const id=randomUUID();
    await database.query(`INSERT INTO rail_rooms(id,owner_id,name,city,description,address,website) VALUES($1,$2,$3,$4,$5,$6,$7)`,[id,userId,data.name,data.city,data.description,data.address,data.website]);
    return {id};
  }
  // Authorization is repeated inside each write so a stale client cannot retain revoked host rights.
  let result: {rows: Record<string, unknown>[]};
  const values: unknown[]=[userId,data.roomId];
  switch (data.action) {
    case 'edit':
      result=await database.query(`UPDATE rail_rooms r SET name=$3,city=$4,description=$5,address=$6,website=$7,updated=now() WHERE r.id=$2 AND ${host} RETURNING id`,[...values,data.name,data.city,data.description,data.address,data.website]); break;
    case 'publish':
      result=await database.query('UPDATE rail_rooms SET published=$3,updated=now() WHERE id=$2 AND owner_id=$1 RETURNING id',[...values,data.published]); break;
    case 'follow':
      if (!data.following) {
        await database.query('DELETE FROM rail_room_follows WHERE user_id=$1 AND room_id=$2',values);
        return {ok:true};
      }
      result=await database.query(`INSERT INTO rail_room_follows(room_id,user_id) SELECT r.id,$1 FROM rail_rooms r WHERE r.id=$2 AND r.published ON CONFLICT(room_id,user_id) DO UPDATE SET user_id=EXCLUDED.user_id RETURNING room_id`,values); break;
    case 'announce':
      result=await database.query(`INSERT INTO rail_room_announcements(id,room_id,user_id,body,mentions) SELECT $3,r.id,$1,$4,$5::jsonb FROM rail_rooms r WHERE r.id=$2 AND ${host} RETURNING id`,[...values,randomUUID(),data.body,JSON.stringify(await validMentions(database,userId,data.body,data.mentions))]); break;
    case 'removeAnnouncement':
      result=await database.query(`DELETE FROM rail_room_announcements a USING rail_rooms r WHERE a.id=$3 AND a.room_id=r.id AND r.id=$2 AND ${host} RETURNING a.id`,[...values,data.announcementId]); break;
    case 'inviteHost':
      result=await database.query(`INSERT INTO rail_room_hosts(room_id,user_id) SELECT r.id,u.id FROM rail_rooms r JOIN "user" u ON lower(u.email)=$3
        WHERE r.id=$2 AND r.owner_id=$1 AND u.id<>$1
        AND NOT EXISTS(SELECT 1 FROM rail_blocks b WHERE (b.blocker_id=$1 AND b.blocked_id=u.id) OR (b.blocker_id=u.id AND b.blocked_id=$1))
        ON CONFLICT(room_id,user_id) DO UPDATE SET user_id=EXCLUDED.user_id RETURNING room_id`,[...values,data.email]);
      if (!result.rows.length) throw new RoomError('Invitation unavailable. Check that the person has a Rail Social account and that you own this room.');
      return {ok:true};
    case 'acceptHost':
      result=await database.query('UPDATE rail_room_hosts SET accepted=true WHERE user_id=$1 AND room_id=$2 RETURNING room_id',values); break;
    case 'declineHost':
      result=await database.query('DELETE FROM rail_room_hosts WHERE user_id=$1 AND room_id=$2 AND NOT accepted RETURNING room_id',values); break;
    case 'removeHost':
      result=await database.query('DELETE FROM rail_room_hosts h USING rail_rooms r WHERE h.room_id=r.id AND r.id=$2 AND r.owner_id=$1 AND h.user_id=$3 RETURNING h.user_id',[...values,data.userId]); break;
  }
  if (!result.rows.length) throw new RoomError('Room unavailable or you do not have permission for this action.',404);
  return {ok:true};
}
