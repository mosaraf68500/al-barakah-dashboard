import type { NextRequest } from 'next/server';
import { dispatchCourier } from '@/lib/server/integrations';
import { getOrder, getSettings, patchOrder, removeOrder, setOrderStatus } from '@/lib/server/adminStore';
import { audit, body, fail, ok, session } from '@/lib/server/route';
import { orderPatchSchema } from '@/lib/validation/schemas';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: Ctx) {
  const o = getOrder((await params).id);
  return o ? ok(o) : fail('Order not found', 404);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const order = getOrder(id);
  if (!order) return fail('Order not found', 404);
  const parsed = orderPatchSchema.safeParse(await body(req));
  if (!parsed.success) return fail('Invalid order update');
  const { status, deliveryPaymentStatus, toggleFakeSuspicion } = parsed.data;
  const who = session(req);

  if (status) {
    const result = setOrderStatus(id, status)!;
    audit(who, `Order ${id} status -> ${status}`);
    // Auto-dispatch on confirm (legacy behaviour). SIMULATED unless ENABLE_LIVE_INTEGRATIONS=true - see lib/server/integrations.ts.
    const cfg = getSettings().courierConfig;
    let courier;
    if (cfg.autoSendOnConfirm && (status === 'shipped' || status === 'processing') && !result.order.courierConsignmentId) {
      const provider = cfg.defaultCourier === 'pathao' ? 'pathao' : 'steadfast';
      courier = await dispatchCourier(result.order, cfg, provider);
      if (courier.success) {
        const after = setOrderStatus(id, 'shipped', {
          courierProvider: courier.provider,
          courierConsignmentId: courier.consignmentId,
          courierTrackingCode: courier.trackingCode,
          courierStatus: courier.status || 'in_review',
          courierSentAt: new Date().toISOString(),
          courierResponse: courier.raw,
        })!;
        audit(who, `Order ${id} auto-dispatched via ${provider}${courier.simulated ? ' (SIMULATED)' : ''}`);
        return ok({ order: after.order, stock: result.stock !== 'none' ? result.stock : after.stock, courier });
      }
    }
    return ok({ order: result.order, stock: result.stock, courier });
  }

  if (deliveryPaymentStatus) {
    const advance = order.advanceAmount || order.shipping || 80;
    const extra = deliveryPaymentStatus === 'ADVANCE_PAID' ? { advanceAmount: advance, dueAmountOnDelivery: Math.max(0, (order.total || 0) - advance) } : {};
    const updated = patchOrder(id, { deliveryPaymentStatus: deliveryPaymentStatus as any, ...extra })!;
    audit(who, `Order ${id} payment status -> ${deliveryPaymentStatus}`);
    return ok({ order: updated, stock: 'none' });
  }

  if (toggleFakeSuspicion) {
    const next = !order.isFakeSuspected;
    // Un-flagging restores a sensible status instead of leaving FAKE_SUSPECTED behind (BUG_FIXES.md).
    const restored = order.deliveryPaymentStatus === ('FAKE_SUSPECTED' as any) ? 'COD_PENDING' : order.deliveryPaymentStatus;
    const updated = patchOrder(id, { isFakeSuspected: next, deliveryPaymentStatus: (next ? 'FAKE_SUSPECTED' : restored) as any })!;
    audit(who, `Order ${id} fake-suspicion ${next ? 'flagged' : 'cleared'}`);
    return ok({ order: updated, stock: 'none' });
  }

  return fail('Nothing to update');
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  if (!removeOrder(id)) return fail('Order not found', 404);
  audit(session(req), `Order deleted: ${id}`);
  return ok({ ok: true });
}
