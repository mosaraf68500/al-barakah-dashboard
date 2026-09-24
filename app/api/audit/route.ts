import type { NextRequest } from 'next/server';
import { listAudit } from '@/lib/server/adminStore';
import { fail, ok, session } from '@/lib/server/route';

export async function GET(req: NextRequest) {
  if (session(req)?.role !== 'super_admin') return fail('Forbidden', 403);
  const limit = Number(req.nextUrl.searchParams.get('limit')) || 25;
  return ok(listAudit(Math.min(limit, 200)));
}
