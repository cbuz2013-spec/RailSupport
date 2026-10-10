import {z} from 'zod';

const id = z.string().min(1).max(100);
const website = z.string().trim().max(400).refine(value => {
  if (!value) return true;
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password; }
  catch { return false; }
}, 'Use a full https:// website address.');
export const roomFields = z.object({
  name: z.string().trim().min(2).max(100),
  city: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000),
  address: z.string().trim().max(240),
  website,
});
export type RoomFields = z.infer<typeof roomFields>;
export const roomAction = z.discriminatedUnion('action', [
  roomFields.extend({action: z.literal('create')}),
  roomFields.extend({action: z.literal('edit'), roomId: id}),
  z.object({action: z.literal('publish'), roomId: id, published: z.boolean()}),
  z.object({action: z.literal('follow'), roomId: id, following: z.boolean()}),
  z.object({action: z.literal('announce'), roomId: id, body: z.string().trim().min(1).max(3000), mentions:z.array(id).max(20).optional()}),
  z.object({action: z.literal('removeAnnouncement'), roomId: id, announcementId: id}),
  z.object({action: z.literal('inviteHost'), roomId: id, email: z.email().max(254).transform(v => v.toLowerCase())}),
  z.object({action: z.literal('acceptHost'), roomId: id}),
  z.object({action: z.literal('declineHost'), roomId: id}),
  z.object({action: z.literal('removeHost'), roomId: id, userId: id}),
]);
export type RoomAction = z.infer<typeof roomAction>;
export type Room = RoomFields & {
  id: string; published: boolean; followers: number; following: boolean;
  role: 'owner' | 'host' | 'member';
};
export type RoomHost = {id: string; name: string; role: 'owner' | 'host' | 'invited'};
export type Announcement = {userId:string;mentions:string[];edited?:string;id: string; body: string; name: string; created: string};
export type RoomDetail = {room: Room; hosts: RoomHost[]; announcements: Announcement[]; nextBefore: string | null};
export type RoomDirectory = {
  rooms: Room[]; nextOffset: number | null; canCreate: boolean;
  invitations: {id: string; name: string}[];
};
