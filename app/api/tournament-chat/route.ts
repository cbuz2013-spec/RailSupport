import {auth} from '@/lib/auth';
import {db} from '@/lib/db';
import {guardMember} from '@/lib/safety';
import {RoomError} from '@/lib/rooms';
import {readTournamentChat,sendTournamentChat} from '@/lib/tournament-rails';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=60;
const headers={'Cache-Control':'private, no-store'};
export async function GET(req:Request){
 try{
  const uid=(await auth().api.getSession({headers:req.headers}))?.user.id;
  if(!uid)return Response.json({error:'Sign in to join the chat.'},{status:401,headers});
  const userId=uid;
  await guardMember(db(),uid);
  const group=new URL(req.url).searchParams.get('group')||'';
  const first=await readTournamentChat(db(),uid,group);
  if(!req.headers.get('accept')?.includes('text/event-stream'))return Response.json({messages:first},{headers});
  const encoder=new TextEncoder();let stopped=false,timer:ReturnType<typeof setTimeout>|undefined;
  const stream=new ReadableStream({
   start(controller){
    const started=Date.now();let last=JSON.stringify(first);
    const close=()=>{if(stopped)return;stopped=true;clearTimeout(timer);req.signal.removeEventListener('abort',close);controller.close()};
    req.signal.addEventListener('abort',close,{once:true});
    if(req.signal.aborted){close();return;}
    controller.enqueue(encoder.encode('retry: 1500\ndata: '+last+'\n\n'));
    async function tick(){
     if(stopped)return;if(Date.now()-started>45000){close();return;}
     try{
      await guardMember(db(),userId);
      const next=JSON.stringify(await readTournamentChat(db(),userId,group));
      if(stopped)return;
      controller.enqueue(encoder.encode(next!==last?'data: '+next+'\n\n':': heartbeat\n\n'));last=next;
      timer=setTimeout(tick,2000);
     }catch{if(!stopped){controller.enqueue(encoder.encode('event: unavailable\ndata: {}\n\n'));close();}}
    }
    timer=setTimeout(tick,2000);
   },
   cancel(){stopped=true;clearTimeout(timer)}
  });
  return new Response(stream,{headers:{...headers,'Content-Type':'text/event-stream','X-Accel-Buffering':'no'}});
 }catch(e){return Response.json({error:e instanceof RoomError?e.message:'Chat could not connect.'},{status:e instanceof RoomError?e.status:503,headers})}
}
export async function POST(req:Request){
 try{
  if(req.headers.get('origin')!==new URL(process.env.BETTER_AUTH_URL!).origin)return Response.json({error:'Invalid request origin.'},{status:403});
  const uid=(await auth().api.getSession({headers:req.headers}))?.user.id;if(!uid)return Response.json({error:'Sign in first.'},{status:401});
  await guardMember(db(),uid,true);const raw=await req.text();if(raw.length>6000)return Response.json({error:'Message is too long.'},{status:413});
  return Response.json(await sendTournamentChat(db(),uid,JSON.parse(raw)),{headers});
 }catch(e){return Response.json({error:e instanceof RoomError?e.message:'Message was not sent. Try again.'},{status:e instanceof RoomError?e.status:503,headers})}
}
