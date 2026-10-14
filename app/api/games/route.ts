import {auth} from '@/lib/auth';
import {configured,db} from '@/lib/db';
import {guardMember} from '@/lib/safety';
import {RoomError} from '@/lib/rooms';
import {activeGames} from '@/lib/active-games';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
export async function GET(req:Request){
 if(!configured())return Response.json({error:'Account setup is incomplete.'},{status:503,headers});
 try{
  const user=(await auth().api.getSession({headers:req.headers}))?.user;
  if(!user)return Response.json({error:'Sign in to see your active games.'},{status:401,headers});
  await guardMember(db(),user.id);
  return Response.json(await activeGames(db(),user.id,Object.fromEntries(new URL(req.url).searchParams)),{headers});
 }catch(e){return Response.json({error:e instanceof RoomError?e.message:'Could not load active games. Please retry.'},{status:e instanceof RoomError?e.status:503,headers})}
}
