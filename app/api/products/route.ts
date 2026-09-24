import type { NextRequest } from 'next/server';
import { listProducts, upsertProduct } from '@/lib/server/adminStore';
import { audit, body, fail, ok, session } from '@/lib/server/route';
import { productSchema } from '@/lib/validation/schemas';

export async function GET() {
  return ok(listProducts());
}

export async function POST(req: NextRequest) {
  const parsed = productSchema.safeParse(await body(req));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message || 'Invalid product');
  const saved = upsertProduct(parsed.data as any);
  audit(session(req), `Product saved: ${saved.name}`);
  return ok(saved);
}
