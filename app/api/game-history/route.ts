import {auth} from '@/lib/auth';
import {configured,db} from '@/lib/db';
import {guardMember} from '@/lib/safety';
import {RoomError} from '@/lib/rooms';
import {gameHistory,gamePhoto,saveGamePhoto} from '@/lib/game-history';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
async function handle(req:Request,write:boolean){
 if(!configured())return Response.json({error:'Account setup is incomplete.'},{status:503,headers});
 if(write&&req.headers.get('origin')!==new URL(process.env.BETTER_AUTH_URL!).origin)return Response.json({error:'Invalid request origin.'},{status:403,headers});
 try{
  const uid=(await auth().api.getSession({headers:req.headers}))?.user.id;if(!uid)return Response.json({error:'Sign in to view this game.'},{status:401,headers});
  await guardMember(db(),uid,write);const p=new URL(req.url).searchParams;
  if(write){const raw=await req.text();if(raw.length>430000)throw new RoomError('Choose a smaller photo.',413);return Response.json(await saveGamePhoto(db(),uid,JSON.parse(raw)),{headers})}
  if(p.has('photo')){const photo=await gamePhoto(db(),uid,(p.get('session')||'').slice(0,100));return new Response(new Uint8Array(photo.data),{headers:{...headers,'Content-Type':photo.mime,'X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox"}})}
  return Response.json(await gameHistory(db(),uid,Object.fromEntries(p)),{headers});
 }catch(e){return Response.json({error:e instanceof RoomError?e.message:e instanceof SyntaxError?'Invalid request.':'Could not load this game. Please retry.'},{status:e instanceof RoomError?e.status:e instanceof SyntaxError?400:503,headers})}
}
export const GET=(req:Request)=>handle(req,false);
export const POST=(req:Request)=>handle(req,true);
