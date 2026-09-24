import type { Order } from '@/types';
import type { SendCourierResult } from '@/types/admin';
import { apiFetch, del, patch, post } from './http';

export interface OrderMutation {
  order: Order;
  stock: 'deducted' | 'restored' | 'none';
  courier?: SendCourierResult;
}

export const getOrders = () => apiFetch<Order[]>('/v1/admin/orders');
export const getOrder = (id: string) => apiFetch<Order>(`/v1/admin/orders/${encodeURIComponent(id)}`);
export const updateOrderStatus = (id: string, status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled') =>
  patch<OrderMutation>(`/v1/admin/orders/${encodeURIComponent(id)}`, { status });
export const updateDeliveryPaymentStatus = (id: string, deliveryPaymentStatus: string) =>
  patch<OrderMutation>(`/v1/admin/orders/${encodeURIComponent(id)}`, { deliveryPaymentStatus });
export const toggleFakeSuspicion = (id: string) => patch<OrderMutation>(`/v1/admin/orders/${encodeURIComponent(id)}`, { toggleFakeSuspicion: true });
export const deleteOrder = (id: string) => del<{ ok: true }>(`/v1/admin/orders/${encodeURIComponent(id)}`);
export const dispatchOrder = (id: string, provider?: 'steadfast' | 'pathao') =>
  post<Partial<OrderMutation> & { courier: SendCourierResult }>(`/v1/admin/orders/${encodeURIComponent(id)}/dispatch`, { provider });
