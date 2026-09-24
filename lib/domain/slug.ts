/**
 * Legacy `generateSlug` stripped every non-\w character, so Bengali-only names produced an empty slug.
 * Behaviour is kept for Latin names (same output); the empty-slug case is handled by callers (fall back to the product id).
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
