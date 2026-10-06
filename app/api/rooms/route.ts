import {auth} from '@/lib/auth';
import {configured,db} from '@/lib/db';
import {listRooms,readRoom,mutateRoom,RoomError} from '@/lib/rooms';

export const runtime='nodejs';
export const dynamic='force-dynamic';
const out=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store'}});
function failure(error:unknown) {
  if(error instanceof RoomError)return out({error:error.message},error.status);
  if(error instanceof SyntaxError)return out({error:'Invalid request.'},400);
  console.error('Room Pages request failed',error instanceof Error?error.name:'Unknown error');
  return out({error:'Room Pages is temporarily unavailable. Please retry.'},503);
}
export async function GET(req:Request) {
  if(!configured())return out({error:'Account setup is incomplete.'},503);
  try {
    const user=(await auth().api.getSession({headers:req.headers}))?.user;
    if(!user)return out({error:'Sign in to explore rooms.'},401);
    const params=new URL(req.url).searchParams,id=params.get('id');
    if((id?.length||0)>100||(params.get('before')?.length||0)>100)throw new RoomError('Invalid room link.');
    return out(id?await readRoom(db(),user.id,id,params.get('before')):await listRooms(db(),user.id,params));
  } catch(error) {return failure(error);}
}
export async function POST(req:Request) {
  if(!configured())return out({error:'Account setup is incomplete.'},503);
  if(req.headers.get('origin')!==new URL(process.env.BETTER_AUTH_URL!).origin)return out({error:'Invalid request origin.'},403);
  try {
    const user=(await auth().api.getSession({headers:req.headers}))?.user;
    if(!user)return out({error:'Sign in first.'},401);
    const raw=await req.text();
    if(raw.length>16000)return out({error:'Room details are too long.'},413);
    return out(await mutateRoom(db(),user.id,JSON.parse(raw)));
  } catch(error) {return failure(error);}
}
