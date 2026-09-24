import { listOrders } from '@/lib/server/adminStore';
import { sortOrdersNewestFirst } from '@/lib/domain/metrics';
import { ok } from '@/lib/server/route';

export async function GET() {
  return ok(sortOrdersNewestFirst(listOrders()));
}
