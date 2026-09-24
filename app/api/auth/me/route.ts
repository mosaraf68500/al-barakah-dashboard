import type { NextRequest } from 'next/server';
import { fail, ok, session } from '@/lib/server/route';

export async function GET(req: NextRequest) {
  const s = session(req);
  return s ? ok({ session: s }) : fail('Unauthorized', 401);
}
