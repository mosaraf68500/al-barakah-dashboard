import type { NextRequest } from 'next/server';
import { dispatchCourier } from '@/lib/server/integrations';
import { getOrder, getSettings, setOrderStatus } from '@/lib/server/adminStore';
import { audit, body, fail, ok, session } from '@/lib/server/route';
import { dispatchSchema } from '@/lib/validation/schemas';

/** One-click courier dispatch. SIMULATED (mock `SIMULATED-...` consignment, nothing booked) unless ENABLE_LIVE_INTEGRATIONS=true. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = getOrder(id);
  if (!order) return fail('Order not found', 404);
  const parsed = dispatchSchema.safeParse(await body(req));
  if (!parsed.success) return fail('Invalid provider');
  const cfg = getSettings().courierConfig;
  const provider = parsed.data.provider ?? (cfg.defaultCourier === 'pathao' ? 'pathao' : 'steadfast');

  const result = await dispatchCourier(order, cfg, provider);
  if (!result.success) return ok({ courier: result }); // the UI shows the failure message (legacy alert + toast)

  const after = setOrderStatus(id, 'shipped', {
    courierProvider: result.provider,
    courierConsignmentId: result.consignmentId,
    courierTrackingCode: result.trackingCode,
    courierStatus: result.status || 'in_review',
    courierSentAt: new Date().toISOString(),
    courierResponse: result.raw,
  })!;
  audit(session(req), `Order ${id} dispatched via ${provider}${result.simulated ? ' (SIMULATED)' : ''}`);
  return ok({ order: after.order, stock: after.stock, courier: result });
}
