import { liveIntegrationsEnabled } from '@/lib/server/integrations';
import { listProducts } from '@/lib/server/adminStore';
import { ok } from '@/lib/server/route';
import type { HealthStatus } from '@/types/admin';

// Replaces the legacy "Firestore Live" badge probe.
export async function GET() {
  const t = Date.now();
  listProducts();
  const body: HealthStatus = { ok: true, latencyMs: Date.now() - t, mode: 'local-seed', liveIntegrations: liveIntegrationsEnabled() };
  return ok(body);
}
