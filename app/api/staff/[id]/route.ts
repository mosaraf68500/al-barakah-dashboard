import type { NextRequest } from 'next/server';
import { listStaff, saveStaff } from '@/lib/server/adminStore';
import { audit, fail, ok, session } from '@/lib/server/route';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const who = session(req);
  if (who?.role !== 'super_admin') return fail('Forbidden', 403);
  const { id } = await params;
  const target = listStaff().find((s) => s.id === id);
  if (!target) return fail('Staff not found', 404);
  if (target.isPrimary) return fail('প্রাইমারি সুপার অ্যাডমিনের অ্যাক্সেস বাতিল করা যাবে না।', 403);
  saveStaff(listStaff().filter((s) => s.id !== id));
  audit(who, `Staff access revoked: ${target.email}`);
  return ok({ ok: true });
}
