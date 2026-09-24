import type { NextRequest } from 'next/server';
import { listStaff, saveStaff } from '@/lib/server/adminStore';
import { audit, body, fail, ok, session } from '@/lib/server/route';
import { staffSchema } from '@/lib/validation/schemas';

// TEMP: Phase 2 stub - fake staff data; grant/revoke only change the local list (no invitation is sent, no real access is granted).
export async function GET(req: NextRequest) {
  if (session(req)?.role !== 'super_admin') return fail('Forbidden', 403);
  return ok(listStaff());
}

export async function POST(req: NextRequest) {
  const who = session(req);
  if (who?.role !== 'super_admin') return fail('Forbidden', 403);
  const parsed = staffSchema.safeParse(await body(req));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message || 'Invalid staff');
  const email = parsed.data.email.toLowerCase();
  if (listStaff().some((s) => s.email.toLowerCase() === email)) return fail('এই ইমেইলটি ইতিমধ্যে তালিকায় আছে।', 409);
  const member = { id: `s-${Date.now()}`, name: parsed.data.name, email, role: parsed.data.role, status: 'Active' as const, createdAt: new Date().toISOString() };
  saveStaff([...listStaff(), member]);
  audit(who, `Staff access granted: ${email} (${member.role})`);
  return ok(member);
}
