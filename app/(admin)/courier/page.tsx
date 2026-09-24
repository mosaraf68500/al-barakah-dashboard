import { OrdersTab } from '@/components/orders/OrdersTab';

/** Courier settings (Steadfast / Pathao / default courier / auto-send) - the legacy modal, now with its own URL. */
export default function Page() {
  return <OrdersTab courierOpen />;
}
