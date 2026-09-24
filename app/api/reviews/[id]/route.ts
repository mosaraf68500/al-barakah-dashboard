import type { NextRequest } from 'next/server';
import { removeReview } from '@/lib/server/adminStore';
import { audit, fail, ok, session } from '@/lib/server/route';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!removeReview(id)) return fail('Review not found', 404);
  audit(session(req), `Review deleted: ${id}`);
  return ok({ ok: true });
}
