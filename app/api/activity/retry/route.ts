import {timingSafeEqual} from 'node:crypto';
import {db,configured} from '@/lib/db';
import {flushActivity} from '@/lib/notifications';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=90;
export async function GET(req:Request){
 const expected=process.env.CRON_SECRET?'Bearer '+process.env.CRON_SECRET:'';
 const supplied=req.headers.get('authorization')||'';
 if(!expected||expected.length!==supplied.length||!timingSafeEqual(Buffer.from(expected),Buffer.from(supplied)))return new Response('Unauthorized',{status:401});
 if(!configured())return new Response('Unavailable',{status:503});
 return Response.json(await flushActivity(db()),{headers:{'Cache-Control':'no-store'}});
}
