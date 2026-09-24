import type { Order } from '@/types';
import { getCustomerName, getOrderTotal } from './orderAccessors';

/** Builds the wa.me reminder link asking for the advance delivery charge. */
export function buildWhatsAppReminderUrl(order: Order, bkashNumber: string, insideDhakaCharge: number): string {
  const rawPhone = (order.customer?.phone || (order as any).shippingAddress?.phone || (order as any).customerPhone || '').replace(/\D/g, '');
  const cleanPhone = rawPhone.startsWith('880') ? rawPhone : `880${rawPhone.replace(/^0/, '')}`;
  const orderTotal = Math.round(getOrderTotal(order));
  const advance = order.advanceAmount || order.shipping || (insideDhakaCharge ?? 80);
  const due = Math.max(0, orderTotal - advance);
  const bkashNum = bkashNumber || '01316534171';

  // BUG_FIXES.md: legacy template had `(#{order.id...})` - missing `$`, so the literal text was sent instead of the order id.
  const message = `আসসালামু আলাইকুম ${getCustomerName(order)},\nআল-বারাকাহ প্রিমিয়ামে আপনার অর্ডারটি (#${order.id.slice(-6).toUpperCase()}) কনফার্ম করতে অনুগ্রহ করে অগ্রিম ডেলিভারি চার্জ ৳${advance} টাকা বিকাশ করুন।\n\nবিকাশ নম্বর: ${bkashNum} (Personal - Send Money)\n\nডেলিভারি চার্জ বিকাশ করার পর TrxID টি আমাদের মেসেজ দিয়ে জানালে আমরা পার্সেলটি দ্রুত কুরিয়ারে পাঠিয়ে দেব।\nপণ্য হাতে পেয়ে বাকি ৳${due} টাকা ক্যাশ অন ডেলিভারিতে পরিশোধ করবেন।\nধন্যবাদ!`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
