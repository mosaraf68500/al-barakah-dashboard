import type { NextRequest } from 'next/server';
import { listCategories, saveCategoriesList } from '@/lib/server/adminStore';
import { audit, body, fail, ok, session } from '@/lib/server/route';
import { categoryListSchema, categorySchema } from '@/lib/validation/schemas';

export async function GET() {
  return ok(listCategories());
}

/** Create one category (appended). */
export async function POST(req: NextRequest) {
  const parsed = categorySchema.safeParse(await body(req));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message || 'Invalid category');
  const next = saveCategoriesList([...listCategories(), parsed.data as any]);
  audit(session(req), `Category created: ${parsed.data.name}`);
  return ok(next);
}

/** Replace the whole ordered list (reorder / turn all on-off / reset defaults). */
export async function PUT(req: NextRequest) {
  const parsed = categoryListSchema.safeParse(await body(req));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message || 'Invalid category list');
  const next = saveCategoriesList(parsed.data.categories as any);
  audit(session(req), 'Categories list replaced (reorder / bulk toggle / reset)');
  return ok(next);
}
