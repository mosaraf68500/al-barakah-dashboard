import { listReviews } from '@/lib/server/adminStore';
import { ok } from '@/lib/server/route';

export async function GET() {
  return ok(listReviews());
}
