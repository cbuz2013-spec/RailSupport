import { auth } from '@/lib/auth';
import { configured } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  if (!configured()) {
    return Response.json(
      { error: 'Account setup is incomplete.' },
      { status: 503 }
    );
  }

  return auth().handler(req);
}

export const POST = GET;
