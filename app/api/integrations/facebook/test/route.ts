import type { NextRequest } from 'next/server';
import { testFacebookEvent } from '@/lib/server/integrations';
import { getSettings } from '@/lib/server/adminStore';
import { body, fail, ok } from '@/lib/server/route';
import { facebookTestSchema } from '@/lib/validation/schemas';

// SIMULATED unless ENABLE_LIVE_INTEGRATIONS=true. The saved config (incl. CAPI token) is read server-side; the browser never sends it.
export async function POST(req: NextRequest) {
  const parsed = facebookTestSchema.safeParse(await body(req));
  if (!parsed.success) return fail('Invalid event');
  return ok(await testFacebookEvent(getSettings().facebookPixelConfig, parsed.data.eventName, parsed.data.customData ?? {}));
}
