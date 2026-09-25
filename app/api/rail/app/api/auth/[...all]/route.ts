import {auth} from '@/lib/auth';
import {configured} from '@/lib/db';
export const runtime='nodejs';
export async function GET(req:Request){if(!configured())return Response.json({error:'Independent accounts are not connected yet.'},{status:503});return auth().handler(req);}
export const POST=GET;
