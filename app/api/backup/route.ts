import type { NextRequest } from 'next/server';
import { getSettings, restoreSnapshot, snapshot } from '@/lib/server/adminStore';
import { audit, body, fail, ok, session } from '@/lib/server/route';
import { backupSchema } from '@/lib/validation/schemas';
import type { DatabaseBackupPayload } from '@/types/admin';

// WARNING: the backup includes customer PII (orders) and live credentials (settings). Handle the file like a password.
export async function GET(req: NextRequest) {
  const s = snapshot();
  const payload: DatabaseBackupPayload = {
    version: '1.0',
    backupDate: new Date().toISOString(),
    storeName: getSettings().storeName ?? 'Al Barakah Premium',
    data: { products: s.products, orders: s.orders, categories: s.categories, reviews: s.reviews, settings: s.settings },
  };
  audit(session(req), 'Full backup downloaded');
  return ok(payload);
}

export async function POST(req: NextRequest) {
  const parsed = backupSchema.safeParse(await body(req));
  if (!parsed.success) return fail('অবৈধ ব্যাকআপ ফাইল');
  restoreSnapshot(parsed.data.data as any);
  audit(session(req), 'Backup restored');
  return ok({ ok: true, counts: { products: parsed.data.data.products?.length ?? 0, orders: parsed.data.data.orders?.length ?? 0, categories: parsed.data.data.categories?.length ?? 0 } });
}
