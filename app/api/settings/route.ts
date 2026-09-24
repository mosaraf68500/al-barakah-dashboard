import type { NextRequest } from 'next/server';
import { getSettings, patchSettings } from '@/lib/server/adminStore';
import { audit, body, fail, ok, session } from '@/lib/server/route';
import { settingsPatchSchema } from '@/lib/validation/schemas';

// Admin-only: returns the FULL settings document including secrets (the UI masks them). The storefront never calls this.
export async function GET() {
  return ok(getSettings());
}

export async function PATCH(req: NextRequest) {
  const parsed = settingsPatchSchema.safeParse(await body(req));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message || 'Invalid settings');
  const saved = patchSettings(parsed.data as any);
  audit(session(req), `Settings updated: ${Object.keys(parsed.data).join(', ')}`);
  return ok(saved);
}
