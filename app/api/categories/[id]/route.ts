import type { NextRequest } from 'next/server';
import { listCategories, listProducts, saveCategoriesList, saveProductsList } from '@/lib/server/adminStore';
import { audit, body, fail, ok, session } from '@/lib/server/route';
import { categorySchema } from '@/lib/validation/schemas';

type Ctx = { params: Promise<{ id: string }> };

/** Update one category. A rename cascades to the products that carried the old name (legacy left them orphaned - BUG_FIXES.md). */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const current = listCategories().find((c) => c.id === id);
  if (!current) return fail('Category not found', 404);
  const parsed = categorySchema.safeParse({ ...current, ...(await body(req)), id });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message || 'Invalid category');
  const updated = parsed.data;

  if (updated.name !== current.name) {
    const products = listProducts();
    if (products.some((p) => p.category === current.name)) {
      saveProductsList(products.map((p) => (p.category === current.name ? { ...p, category: updated.name } : p)));
    }
  }
  const next = saveCategoriesList(listCategories().map((c) => (c.id === id ? (updated as any) : c)));
  audit(session(req), `Category updated: ${updated.name}`);
  return ok(next);
}

/** Deleting a category that still has products is blocked (legacy orphaned the products silently). */
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const current = listCategories().find((c) => c.id === id);
  if (!current) return fail('Category not found', 404);
  const count = listProducts().filter((p) => p.category === current.name).length;
  if (count > 0) {
    return fail(`এই ক্যাটাগরিতে ${count} টি প্রোডাক্ট আছে। আগে প্রোডাক্টগুলো অন্য ক্যাটাগরিতে সরান, তারপর ডিলিট করুন।`, 409);
  }
  const next = saveCategoriesList(listCategories().filter((c) => c.id !== id));
  audit(session(req), `Category deleted: ${current.name}`);
  return ok(next);
}
