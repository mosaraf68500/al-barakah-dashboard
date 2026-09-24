import type { NextRequest } from 'next/server';
import { getProduct, removeProduct, upsertProduct } from '@/lib/server/adminStore';
import { audit, body, fail, ok, session } from '@/lib/server/route';
import { productSchema } from '@/lib/validation/schemas';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: Ctx) {
  const p = getProduct((await params).id);
  return p ? ok(p) : fail('Product not found', 404);
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const parsed = productSchema.safeParse({ ...(await body(req)), id });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message || 'Invalid product');
  const saved = upsertProduct(parsed.data as any);
  audit(session(req), `Product updated: ${saved.name}`);
  return ok(saved);
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const p = getProduct(id);
  if (!p || !removeProduct(id)) return fail('Product not found', 404);
  audit(session(req), `Product deleted: ${p.name}`);
  return ok({ ok: true });
}
