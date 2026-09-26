'use client';

import { AlertTriangle, CheckCircle, Eye, Package, Send, Settings, ShieldCheck, ShoppingBag, Trash2, Truck, User, X } from 'lucide-react';
import { SafeImage } from '@/components/shared/SafeImage';
import { getCustomerAddress, getCustomerName, getCustomerPhone, getCustomerZip, getOrderTotal, getPaymentMethod, getShippingZone } from '@/lib/domain/orderAccessors';
import { getOrderStatus } from '@/lib/domain/orderStatus';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteOrder, dispatchOrder, saveSettings, toggleFakeSuspicion, updateDeliveryPaymentStatus, updateOrderStatus } from '@/lib/api';
import { qk, useInvalidate, useOrders, useProducts, useSettings } from '@/hooks/useAdminData';
import { buildWhatsAppReminderUrl } from '@/lib/domain/whatsapp';
import { useToast } from '@/providers/ToastProvider';
import type { Order } from '@/types';
import { DeleteOrderDialog } from '@/components/modals/DeleteOrderDialog';
import { CourierSettingsModal } from '@/components/settings/CourierSettingsModal';
import { DEFAULT_COURIER_CONFIG } from '@/lib/domain/constants';

export function OrdersTab({ detailsId, courierOpen = false }: { detailsId?: string; courierOpen?: boolean }) {
  const router = useRouter();
  const showToast = useToast();
  const invalidate = useInvalidate();
  const { data: orders = [] } = useOrders();
  const { data: products = [] } = useProducts();
  const { data: settings } = useSettings();
  const courierConfig = settings?.courierConfig;
  const rate = 1;
  const symbol = '৳';

  const [orderFilter, setOrderFilter] = useState<'all' | 'advance_paid' | 'advance_pending' | 'full_paid' | 'verified' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'fake'>('all');
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  // Courier settings live at /courier (routed modal over the orders list).
  const isCourierModalOpen = courierOpen;
  const setIsCourierModalOpen = (open: boolean) => router.push(open ? '/courier' : '/orders');
  const [courierDispatchingOrderId, setCourierDispatchingOrderId] = useState<string | null>(null);

  // The order-details modal is routed (/orders/[id]) so it is deep-linkable; the list stays rendered behind it as before.
  const selectedOrderDetails = detailsId ? orders.find((o) => o.id === detailsId) ?? null : null;
  const setSelectedOrderDetails = (o: Order | null) => router.push(o ? `/orders/${encodeURIComponent(o.id)}` : '/orders');
  const closeDetails = () => router.push('/orders');

  const refresh = () => invalidate(qk.orders, qk.products);

  const handleOrderStatusChange = async (orderId: string, newStatus: string) => {
    const res = await updateOrderStatus(orderId, newStatus as 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled');
    if (res.stock !== 'none') showToast(res.stock === 'deducted' ? '📦 অর্ডার অনুযায়ী স্টক থেকে মাইনাস করা হয়েছে!' : '🔄 ক্যানসেল হওয়ায় স্টক পুনরায় যোগ করা হয়েছে!');
    if (res.courier?.success) showToast(`✅ ${res.courier.message} (Consignment ID: ${res.courier.consignmentId})`);
    await refresh();
  };

  const handleSendOrderToCourier = async (order: Order, preferredProvider?: 'steadfast' | 'pathao') => {
    const cfg = courierConfig;
    const provider: 'steadfast' | 'pathao' = preferredProvider || (cfg?.defaultCourier === 'pathao' ? 'pathao' : 'steadfast');
    if (provider === 'steadfast' && (!cfg?.steadfast.apiKey || !cfg?.steadfast.secretKey)) {
      setIsCourierModalOpen(true);
      showToast('অনুগ্রহ করে আগে Steadfast API Key এবং Secret Key কনফিগার করুন');
      return;
    }
    if (provider === 'pathao' && (!cfg?.pathao.clientId || !cfg?.pathao.clientSecret || !cfg?.pathao.username || !cfg?.pathao.password)) {
      setIsCourierModalOpen(true);
      showToast('অনুগ্রহ করে আগে Pathao API ক্রেডেনশিয়াল কনফিগার করুন');
      return;
    }

    setCourierDispatchingOrderId(order.id);
    showToast(`${provider === 'steadfast' ? 'Steadfast' : 'Pathao'} কুরিয়ারে বুকিং পাঠানো হচ্ছে...`);
    try {
      const res = await dispatchOrder(order.id, provider);
      const c = res.courier;
      if (c.success && c.consignmentId) {
        if (res.stock === 'deducted') showToast('📦 অর্ডার অনুযায়ী স্টক থেকে মাইনাস করা হয়েছে!');
        await refresh();
        showToast(`✅ ${c.message} (Consignment ID: ${c.consignmentId})`);
      } else {
        showToast(`কুরিয়ার এন্ট্রি ব্যর্থ: ${c.message}`, 'error');
      }
    } catch (err: any) {
      showToast(`কুরিয়ার ত্রুটি: ${err.message}`, 'error');
    } finally {
      setCourierDispatchingOrderId(null);
    }
  };

  const handleUpdateDeliveryPaymentStatus = async (orderId: string, paymentStatus: string) => {
    await updateDeliveryPaymentStatus(orderId, paymentStatus);
    await refresh();
    showToast(`অর্ডারের পেমেন্ট স্ট্যাটাস '${paymentStatus}' এ আপডেট করা হয়েছে!`);
  };

  const handleToggleFakeSuspicion = async (orderId: string) => {
    await toggleFakeSuspicion(orderId);
    await refresh();
    showToast('অর্ডারের ঝুঁকি ও ফেক স্ট্যাটাস আপডেট করা হয়েছে');
  };

  const handleOpenWhatsAppReminder = (order: Order) => {
    window.open(buildWhatsAppReminderUrl(order, settings?.bkashConfig.personalNumber || '', settings?.deliveryConfig.insideDhakaCharge ?? 80), '_blank');
  };

  const handleConfirmDeleteOrder = async () => {
    if (!orderToDelete) return;
    try {
      await deleteOrder(orderToDelete.id);
      showToast(`অর্ডার #${orderToDelete.id.slice(-6).toUpperCase()} ডাটাবেজ থেকে ডিলিট করা হয়েছে`);
      if (selectedOrderDetails?.id === orderToDelete.id) closeDetails();
      await refresh();
    } finally {
      setOrderToDelete(null);
    }
  };

  return (
<>
          <div className="p-6 sm:p-8 space-y-6 w-full">
            {/* Filter Buttons & Controls */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-stone-900 font-serif flex items-center gap-2">
                    <Package className="w-5 h-5 text-[#0a5c36]" />
                    <span>অর্ডার ম্যানেজমেন্ট ও অগ্রিম ডেলিভারি ট্র্যাকিং</span>
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    অগ্রিম ডেলিভারি চার্জ TrxID ভেরিফিকেশন, ক্যাশ অন ডেলিভারি বাকি ব্যালেন্স এবং কুরিয়ার অটোমেশন
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setIsCourierModalOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-white border border-emerald-300 text-[#0a5c36] hover:bg-emerald-50 text-xs font-bold shadow-xs cursor-pointer transition-all flex items-center gap-1.5"
                  >
                    <Truck className="w-4 h-4 text-emerald-700" />
                    <span>Courier Settings</span>
                  </button>
                </div>
              </div>

              {/* Status Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 bg-stone-100/80 p-1.5 rounded-2xl border border-stone-200/80">
                {[
                  { id: 'all', label: 'সব অর্ডার (All)', count: orders.length, color: 'bg-[#0a5c36] text-white' },
                  {
                    id: 'advance_paid',
                    label: '৳ অগ্রিম পেইড (Paid)',
                    count: orders.filter((o) => o.deliveryPaymentStatus === 'ADVANCE_PAID' || (o.advanceAmount && o.advanceAmount > 0 && o.bkashTrxId)).length,
                    color: 'bg-emerald-700 text-white',
                  },
                  {
                    id: 'advance_pending',
                    label: '⏳ অগ্রিম বকেয়া (Pending)',
                    count: orders.filter((o) => o.deliveryPaymentStatus === 'ADVANCE_PENDING' || (o.advancePaymentType === 'DELIVERY_ONLY' && !o.bkashTrxId)).length,
                    color: 'bg-amber-600 text-white',
                  },
                  {
                    id: 'verified',
                    label: '✓ ভেরিফাইড (Verified)',
                    count: orders.filter((o) => o.deliveryPaymentStatus === 'VERIFIED').length,
                    color: 'bg-teal-700 text-white',
                  },
                  {
                    id: 'full_paid',
                    label: '৳ ফুল পেইড (bKash)',
                    count: orders.filter((o) => o.deliveryPaymentStatus === 'FULL_PAID' || o.advancePaymentType === 'FULL_PAYMENT').length,
                    color: 'bg-pink-700 text-white',
                  },
                  {
                    id: 'pending',
                    label: 'Pending',
                    count: orders.filter((o) => getOrderStatus(o) === 'pending').length,
                    color: 'bg-stone-700 text-white',
                  },
                  {
                    id: 'processing',
                    label: 'Processing',
                    count: orders.filter((o) => getOrderStatus(o) === 'processing').length,
                    color: 'bg-blue-700 text-white',
                  },
                  {
                    id: 'shipped',
                    label: 'Shipped',
                    count: orders.filter((o) => getOrderStatus(o) === 'shipped').length,
                    color: 'bg-indigo-700 text-white',
                  },
                  {
                    id: 'delivered',
                    label: 'Delivered',
                    count: orders.filter((o) => getOrderStatus(o) === 'delivered').length,
                    color: 'bg-emerald-800 text-white',
                  },
                  {
                    id: 'fake',
                    label: '⚠️ সন্দেহজনক/ফেক',
                    count: orders.filter((o) => o.deliveryPaymentStatus === 'FAKE_SUSPECTED' || o.isFakeSuspected).length,
                    color: 'bg-rose-700 text-white',
                  },
                  {
                    id: 'cancelled',
                    label: 'Cancelled',
                    count: orders.filter((o) => getOrderStatus(o) === 'cancelled').length,
                    color: 'bg-rose-800 text-white',
                  },
                ].map((pill) => {
                  const isActive = orderFilter === pill.id;
                  return (
                    <button
                      key={pill.id}
                      type="button"
                      onClick={() => setOrderFilter(pill.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isActive
                          ? `${pill.color} shadow-xs`
                          : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200/60'
                      }`}
                    >
                      <span>{pill.label}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                        isActive ? 'bg-white/25 text-white' : 'bg-stone-100 text-stone-600'
                      }`}>
                        {pill.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-200">
                    <tr>
                      <th className="px-4 py-3.5">Order ID & Date</th>
                      <th className="px-4 py-3.5">Customer & Phone</th>
                      <th className="px-4 py-3.5">Billing & Breakdown</th>
                      <th className="px-4 py-3.5">Delivery Payment Status</th>
                      <th className="px-4 py-3.5">Order Status</th>
                      <th className="px-4 py-3.5">Courier</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-medium">
                    {orders
                      .filter((order) => {
                        if (orderFilter === 'all') return true;
                        if (orderFilter === 'advance_paid') {
                          return order.deliveryPaymentStatus === 'ADVANCE_PAID' || (order.advanceAmount && order.advanceAmount > 0 && order.bkashTrxId);
                        }
                        if (orderFilter === 'advance_pending') {
                          return order.deliveryPaymentStatus === 'ADVANCE_PENDING' || (order.advancePaymentType === 'DELIVERY_ONLY' && !order.bkashTrxId);
                        }
                        if (orderFilter === 'full_paid') {
                          return order.deliveryPaymentStatus === 'FULL_PAID' || order.advancePaymentType === 'FULL_PAYMENT' || order.paymentMethod === 'FULL_BKASH';
                        }
                        if (orderFilter === 'verified') {
                          return order.deliveryPaymentStatus === 'VERIFIED';
                        }
                        if (orderFilter === 'fake') {
                          return order.deliveryPaymentStatus === 'FAKE_SUSPECTED' || order.isFakeSuspected;
                        }
                        return getOrderStatus(order) === orderFilter;
                      })
                      .map((order) => {
                        const total = Math.round(getOrderTotal(order) * rate);
                        const advance = order.advanceAmount || (order.advancePaymentType === 'DELIVERY_ONLY' ? (order.shipping || 80) : 0);
                        const due = order.dueAmountOnDelivery !== undefined ? order.dueAmountOnDelivery : Math.max(0, total - advance);
                        const isAdvancePaid = order.deliveryPaymentStatus === 'ADVANCE_PAID' || (advance > 0 && order.bkashTrxId);
                        const isVerified = order.deliveryPaymentStatus === 'VERIFIED';
                        const isFake = order.deliveryPaymentStatus === 'FAKE_SUSPECTED' || order.isFakeSuspected;

                        return (
                          <tr
                            key={order.id}
                            className={`hover:bg-stone-50/80 transition-colors ${
                              isFake ? 'bg-rose-50/40' : isVerified ? 'bg-emerald-50/20' : ''
                            }`}
                          >
                            {/* Order ID & Date */}
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-stone-900 font-mono">#{order.id.slice(-6).toUpperCase()}</span>
                                {isFake && (
                                  <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 text-[9px] font-black uppercase">
                                    Fake/Risk
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-stone-400">
                                {new Date(order.createdAt).toLocaleDateString()}
                              </div>
                            </td>

                            {/* Customer & Phone */}
                            <td className="px-4 py-3.5">
                              <div className="font-bold text-stone-900">{getCustomerName(order)}</div>
                              <div className="text-[11px] text-stone-600 flex items-center gap-1.5 mt-0.5">
                                <span>{getCustomerPhone(order)}</span>
                                <button
                                  type="button"
                                  onClick={() => handleOpenWhatsAppReminder(order)}
                                  className="text-emerald-700 hover:text-emerald-800 font-bold text-[10px] hover:underline flex items-center gap-0.5 cursor-pointer bg-emerald-50 px-1.5 py-0.5 rounded"
                                  title="WhatsApp Reminder Message"
                                >
                                  <span>WhatsApp</span>
                                </button>
                              </div>
                              <div className="text-[10px] text-stone-400 truncate max-w-[180px] mt-0.5" title={getCustomerAddress(order)}>
                                {getCustomerAddress(order)}
                              </div>

                              {/* Products ordered badges in table row */}
                              {order.items && order.items.length > 0 && (
                                <div className="mt-1.5 flex flex-wrap gap-1 max-w-[260px]">
                                  {order.items.map((it: any, i: number) => {
                                    const matched = products.find((p) => p.id === (it.id || it.productId || it.product?.id));
                                    const name = it.name || it.title || it.productName || it.product?.name || it.productNameSnapshot || matched?.name || 'পণ্য';
                                    const qty = it.quantity || 1;
                                    return (
                                      <span
                                        key={i}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 text-stone-800 text-[10px] font-medium border border-stone-200"
                                        title={`${name} (Qty: ${qty})`}
                                      >
                                        <span className="font-bold text-emerald-800 line-clamp-1 max-w-[150px]">{name}</span>
                                        <span className="text-stone-500 font-bold">×{qty}</span>
                                      </span>
                                    );
                                  })}
                                </div>
                              )}
                            </td>

                            {/* Billing & Breakdown */}
                            <td className="px-4 py-3.5">
                              <div className="font-bold text-stone-900 text-xs">
                                মোট: ৳{total.toLocaleString()}
                              </div>
                              {advance > 0 && (
                                <div className="text-[11px] text-[#e2136e] font-bold">
                                  অগ্রিম: ৳{advance.toLocaleString()}
                                </div>
                              )}
                              <div className="text-[11px] text-[#0a5c36] font-semibold">
                                COD বাকি: ৳{due.toLocaleString()}
                              </div>
                            </td>

                            {/* Delivery Payment Status */}
                            <td className="px-4 py-3.5">
                              <div className="space-y-1.5">
                                {order.deliveryPaymentStatus === 'ADVANCE_PAID' || isAdvancePaid ? (
                                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-bold text-[11px] border border-emerald-300">
                                    <CheckCircle className="w-3 h-3 text-emerald-700" />
                                    <span>Advance Paid (৳{advance})</span>
                                  </div>
                                ) : order.deliveryPaymentStatus === 'FULL_PAID' ? (
                                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-pink-100 text-pink-900 font-bold text-[11px] border border-pink-300">
                                    <span>Full Paid bKash</span>
                                  </div>
                                ) : order.deliveryPaymentStatus === 'VERIFIED' ? (
                                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-100 text-teal-900 font-bold text-[11px] border border-teal-300">
                                    <ShieldCheck className="w-3 h-3 text-teal-700" />
                                    <span>Verified Order</span>
                                  </div>
                                ) : isFake ? (
                                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-100 text-rose-900 font-bold text-[11px] border border-rose-300">
                                    <AlertTriangle className="w-3 h-3 text-rose-700" />
                                    <span>Suspected Fake</span>
                                  </div>
                                ) : (
                                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-bold text-[11px] border border-amber-300">
                                    <span>Advance Pending (৳{advance || 80})</span>
                                  </div>
                                )}

                                {/* bKash TrxID if available */}
                                {order.bkashTrxId && (
                                  <div className="flex items-center gap-1 text-[10px] text-[#e2136e] font-mono font-bold">
                                    <span>Trx: {order.bkashTrxId}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(order.bkashTrxId || '');
                                        showToast('TrxID কপি হয়েছে!');
                                      }}
                                      className="hover:underline text-[9px] text-stone-500 cursor-pointer"
                                    >
                                      (কপি)
                                    </button>
                                  </div>
                                )}

                                {/* Quick toggle status buttons */}
                                <div className="flex items-center gap-1 pt-0.5">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateDeliveryPaymentStatus(order.id, 'ADVANCE_PAID')}
                                    className="px-1.5 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold cursor-pointer"
                                    title="Mark Advance Paid"
                                  >
                                    পেইড
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateDeliveryPaymentStatus(order.id, 'VERIFIED')}
                                    className="px-1.5 py-0.5 rounded bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-[10px] font-bold cursor-pointer"
                                    title="Mark Verified"
                                  >
                                    ভেরিফাই
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleFakeSuspicion(order.id)}
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                                      isFake
                                        ? 'bg-stone-200 text-stone-700'
                                        : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200'
                                    }`}
                                    title={isFake ? 'Remove Fake Flag' : 'Flag as Fake Order'}
                                  >
                                    {isFake ? 'রিমুভ' : 'ফেক ফ্ল্যাগ'}
                                  </button>
                                </div>
                              </div>
                            </td>

                            {/* Order Status */}
                            <td className="px-4 py-3.5">
                              <select
                                value={getOrderStatus(order)}
                                onChange={(e) => handleOrderStatusChange(order.id, e.target.value)}
                                className="px-2 py-1 rounded-lg text-xs font-bold bg-stone-50 border border-stone-300 focus:outline-none focus:border-emerald-600 cursor-pointer"
                              >
                                <option value="pending">Pending</option>
                                <option value="processing">Processing</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </td>

                            {/* Courier Integration */}
                            <td className="px-4 py-3.5">
                              {order.courierConsignmentId ? (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                                      order.courierProvider === 'pathao'
                                        ? 'bg-red-100 text-red-800 border border-red-200'
                                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    }`}>
                                      {order.courierProvider || 'Courier'}
                                    </span>
                                    <span className="text-[10px] font-mono text-stone-600">
                                      #{String(order.courierConsignmentId).slice(-6)}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                                    <span>Dispatched</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    disabled={courierDispatchingOrderId === order.id}
                                    onClick={() => handleSendOrderToCourier(order, 'steadfast')}
                                    title="Send to Steadfast Courier"
                                    className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#0a5c36] border border-emerald-300 text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1 disabled:opacity-50"
                                  >
                                    <Send className="w-3 h-3" />
                                    <span>Steadfast</span>
                                  </button>
                                  <button
                                    type="button"
                                    disabled={courierDispatchingOrderId === order.id}
                                    onClick={() => handleSendOrderToCourier(order, 'pathao')}
                                    title="Send to Pathao Courier"
                                    className="px-2 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1 disabled:opacity-50"
                                  >
                                    <span>Pathao</span>
                                  </button>
                                </div>
                              )}
                            </td>

                            {/* View / Actions */}
                            <td className="px-4 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setSelectedOrderDetails(order)}
                                  className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 cursor-pointer transition-colors"
                                  title="অর্ডারের বিবরণ দেখুন (View Details)"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setOrderToDelete(order)}
                                  className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/80 hover:border-rose-300 cursor-pointer transition-colors"
                                  title="অর্ডার ডিলিট করুন (Delete Order)"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

      {/* Modal: Order Details (routed) */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] shadow-2xl border border-stone-200 flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 my-auto">
            {/* Header (Fixed Top) */}
            <div className="px-5 sm:px-6 py-4 border-b border-stone-200 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#0a5c36] border border-emerald-200 flex items-center justify-center font-bold shrink-0">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-stone-900 font-serif leading-tight">
                    Order #{selectedOrderDetails.id.slice(-6).toUpperCase()}
                  </h3>
                  <span className="text-[11px] text-stone-500 font-medium">
                    {new Date(selectedOrderDetails.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => closeDetails()}
                className="p-2 rounded-xl text-stone-400 hover:bg-stone-100 hover:text-stone-700 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content (Scrollable Middle Section) */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-3.5 text-xs">
              {/* Customer Details Box */}
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-1">
                <div className="font-bold text-stone-900 text-xs mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#0a5c36]" />
                  <span>Customer Details:</span>
                </div>
                <div className="text-stone-900 font-bold text-xs">{getCustomerName(selectedOrderDetails)}</div>
                <div className="text-stone-700 font-medium">Phone: {getCustomerPhone(selectedOrderDetails)}</div>
                <div className="text-stone-700">Address: {getCustomerAddress(selectedOrderDetails)}</div>
                <div className="text-stone-500 text-[11px]">Zip: {getCustomerZip(selectedOrderDetails)}</div>

                {/* bKash Payment Details if available */}
                {(selectedOrderDetails.bkashTrxId || selectedOrderDetails.senderBkashNumber) && (
                  <div className="mt-2 pt-2 border-t border-pink-200/60 bg-pink-50/70 p-2.5 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#e2136e] text-[11px] flex items-center gap-1">
                        <span>৳ bKash Payment Info</span>
                      </span>
                      {selectedOrderDetails.bkashTrxId && (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(selectedOrderDetails.bkashTrxId || '');
                            showToast('TrxID copied to clipboard!');
                          }}
                          className="text-[10px] font-bold text-[#e2136e] hover:underline cursor-pointer"
                        >
                          Copy TrxID
                        </button>
                      )}
                    </div>
                    {selectedOrderDetails.bkashTrxId && (
                      <div className="flex justify-between text-[11px]">
                        <span className="text-stone-600">TrxID:</span>
                        <span className="font-mono font-black text-[#e2136e]">{selectedOrderDetails.bkashTrxId}</span>
                      </div>
                    )}
                    {selectedOrderDetails.senderBkashNumber && (
                      <div className="flex justify-between text-[11px]">
                        <span className="text-stone-600">Sender Phone:</span>
                        <span className="font-mono font-bold text-stone-800">{selectedOrderDetails.senderBkashNumber}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* WhatsApp Follow-up Button */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleOpenWhatsAppReminder(selectedOrderDetails)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                  >
                    <span>হোয়াটসঅ্যাপে পেমেন্ট রিমাইন্ডার পাঠান (WhatsApp)</span>
                  </button>
                </div>
              </div>

              {/* Delivery Payment Status Selector Box */}
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#0a5c36]" />
                    <span>ডেলিভারি ও পেমেন্ট ভেরিফিকেশন স্ট্যাটাস:</span>
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'ADVANCE_PAID', label: '৳ Advance Paid', color: 'bg-emerald-600 text-white' },
                    { id: 'ADVANCE_PENDING', label: '⏳ Advance Pending', color: 'bg-amber-500 text-white' },
                    { id: 'VERIFIED', label: '✓ Verified Order', color: 'bg-teal-600 text-white' },
                    { id: 'FULL_PAID', label: '৳ Full bKash Paid', color: 'bg-pink-600 text-white' },
                    { id: 'COD_PENDING', label: '🚚 COD Pending', color: 'bg-stone-600 text-white' },
                    { id: 'FAKE_SUSPECTED', label: '⚠️ Suspected Fake', color: 'bg-rose-600 text-white' },
                  ].map((st) => {
                    const isSelected = selectedOrderDetails.deliveryPaymentStatus === st.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => handleUpdateDeliveryPaymentStatus(selectedOrderDetails.id, st.id as any)}
                        className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer text-center ${
                          isSelected
                            ? `${st.color} shadow-xs ring-2 ring-stone-900/20`
                            : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        {st.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Purchased Items List */}
              <div className="space-y-2">
                <div className="font-bold text-stone-900 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-[#0a5c36]" />
                    <span>অর্ডারকৃত পণ্যসমূহ (Purchased Items):</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-stone-100 border border-stone-200 text-stone-700 text-[11px] font-bold">
                    {selectedOrderDetails.items?.length || 0} item(s)
                  </span>
                </div>
                <div className="space-y-2 border border-stone-200 rounded-2xl p-3 bg-stone-50/70 max-h-60 overflow-y-auto">
                  {selectedOrderDetails.items?.map((it: any, idx: number) => {
                    const matchedProduct = products.find(
                      (p) => p.id === (it.id || it.productId || it.product?.id)
                    );
                    const itName =
                      it.name ||
                      it.title ||
                      it.productName ||
                      it.product?.name ||
                      it.productNameSnapshot ||
                      matchedProduct?.name ||
                      `পণ্য #${idx + 1}`;
                    const itImage =
                      it.image ||
                      it.productImageSnapshot ||
                      it.product?.image ||
                      (it.product?.images && it.product.images[0]) ||
                      matchedProduct?.image ||
                      (matchedProduct?.images && matchedProduct.images[0]) ||
                      'https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=800&auto=format&fit=crop&q=80';
                    const itPrice =
                      it.price ||
                      it.unitPriceSnapshot ||
                      it.product?.price ||
                      matchedProduct?.price ||
                      0;
                    const itQty = it.quantity || 1;
                    const variant =
                      it.selectedSize ||
                      it.selectedColor ||
                      it.variant ||
                      matchedProduct?.weight ||
                      '';
                    const category =
                      it.category ||
                      it.product?.category ||
                      matchedProduct?.category ||
                      '';

                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-stone-200 shadow-2xs"
                      >
                        <SafeImage
                          src={itImage}
                          alt={itName}
                          className="w-12 h-12 rounded-lg object-cover border border-stone-200 shrink-0 bg-stone-100"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-xs text-stone-900 line-clamp-1">
                            {itName}
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-stone-500 mt-0.5">
                            {variant && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-bold">
                                {variant}
                              </span>
                            )}
                            {category && (
                              <span className="text-[10px] text-stone-400">
                                {category}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs font-bold text-emerald-900">
                            ৳{Math.round(itPrice * rate).toLocaleString()} × {itQty}
                          </div>
                          <div className="text-xs font-black text-stone-900 mt-0.5">
                            = ৳{Math.round(itPrice * itQty * rate).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Total Amount & Balance Split Banner */}
              <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 space-y-2 text-xs">
                <div className="flex justify-between items-center font-bold text-stone-900 text-sm">
                  <span>সর্বমোট বিল (Total):</span>
                  <span className="text-emerald-900 font-black">৳{Math.round(getOrderTotal(selectedOrderDetails) * rate).toLocaleString()}</span>
                </div>
                {selectedOrderDetails.advanceAmount !== undefined && selectedOrderDetails.advanceAmount > 0 && (
                  <div className="flex justify-between items-center text-[#e2136e] font-bold">
                    <span>বিকাশে অগ্রিম প্রদেয় / পরিশোধিত:</span>
                    <span>৳{selectedOrderDetails.advanceAmount.toLocaleString()}</span>
                  </div>
                )}
                {selectedOrderDetails.dueAmountOnDelivery !== undefined && (
                  <div className="flex justify-between items-center text-[#0a5c36] font-bold pt-1 border-t border-emerald-200/60">
                    <span>ক্যাশ অন ডেলিভারি বাকি (কুরিয়ার সংগ্রহ করবে):</span>
                    <span className="text-sm font-black">৳{selectedOrderDetails.dueAmountOnDelivery.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Courier Automation Card in Order Details */}
              <div className="pt-1">
                <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-[#0a5c36]" />
                      <span className="font-bold text-xs text-stone-900">Courier Delivery Integration</span>
                    </div>
                    {selectedOrderDetails.courierConsignmentId ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase border border-emerald-200">
                        {selectedOrderDetails.courierProvider || 'Courier'} Dispatched
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase border border-amber-200">
                        Not Dispatched
                      </span>
                    )}
                  </div>

                  {selectedOrderDetails.courierConsignmentId ? (
                    <div className="bg-white p-3 rounded-xl border border-stone-200 space-y-1.5 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-stone-500">Consignment ID:</span>
                        <span className="font-mono font-bold text-stone-900">{selectedOrderDetails.courierConsignmentId}</span>
                      </div>
                      {selectedOrderDetails.courierTrackingCode && (
                        <div className="flex justify-between">
                          <span className="text-stone-500">Tracking Code:</span>
                          <span className="font-mono font-bold text-[#0a5c36]">{selectedOrderDetails.courierTrackingCode}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-stone-500">Courier Status:</span>
                        <span className="font-bold text-stone-800 capitalize">{selectedOrderDetails.courierStatus || 'in_review'}</span>
                      </div>
                      {selectedOrderDetails.courierSentAt && (
                        <div className="flex justify-between">
                          <span className="text-stone-500">Dispatched At:</span>
                          <span className="text-stone-700">{new Date(selectedOrderDetails.courierSentAt).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-[11px] text-stone-600">
                        এক ক্লিকে অর্ডারটি পছন্দের কুরিয়ার সার্ভিসে পাঠান:
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          disabled={courierDispatchingOrderId === selectedOrderDetails.id}
                          onClick={() => handleSendOrderToCourier(selectedOrderDetails, 'steadfast')}
                          className="py-2.5 px-3 rounded-xl bg-[#0a5c36] hover:bg-[#08482a] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all disabled:opacity-50"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{courierDispatchingOrderId === selectedOrderDetails.id ? 'Sending...' : 'Send to Steadfast'}</span>
                        </button>
                        <button
                          type="button"
                          disabled={courierDispatchingOrderId === selectedOrderDetails.id}
                          onClick={() => handleSendOrderToCourier(selectedOrderDetails, 'pathao')}
                          className="py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all disabled:opacity-50"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{courierDispatchingOrderId === selectedOrderDetails.id ? 'Sending...' : 'Send to Pathao'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer (Fixed Bottom) */}
            <div className="px-5 sm:px-6 py-3.5 border-t border-stone-200 flex items-center justify-between shrink-0 bg-stone-50/90">
              <button
                type="button"
                onClick={() => setIsCourierModalOpen(true)}
                className="text-[11px] font-bold text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Courier Settings</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setOrderToDelete(selectedOrderDetails);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="Delete this order"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>অর্ডার ডিলিট</span>
                </button>

                <button
                  type="button"
                  onClick={() => closeDetails()}
                  className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold cursor-pointer transition-colors shadow-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {orderToDelete && <DeleteOrderDialog order={orderToDelete} onCancel={() => setOrderToDelete(null)} onConfirm={handleConfirmDeleteOrder} />}

      {isCourierModalOpen && settings && (
      <CourierSettingsModal
        isOpen
        onClose={() => setIsCourierModalOpen(false)}
        config={settings?.courierConfig ?? DEFAULT_COURIER_CONFIG}
        onSave={async (newCfg) => {
          await saveSettings({ courierConfig: newCfg });
          await invalidate(qk.settings);
          setIsCourierModalOpen(false);
          showToast('Courier API credentials saved successfully!');
        }}
      />
      )}
    </>
  );
}
