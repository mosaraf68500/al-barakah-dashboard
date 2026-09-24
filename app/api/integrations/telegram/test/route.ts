import type { NextRequest } from 'next/server';
import { testTelegram } from '@/lib/server/integrations';
import { body, fail, ok } from '@/lib/server/route';
import { telegramTestSchema } from '@/lib/validation/schemas';

// SIMULATED unless ENABLE_LIVE_INTEGRATIONS=true.
export async function POST(req: NextRequest) {
  const parsed = telegramTestSchema.safeParse(await body(req));
  if (!parsed.success) return fail('বট টোকেন এবং চ্যাট আইডি দিন');
  return ok(await testTelegram(parsed.data.botToken, parsed.data.chatId));
}
