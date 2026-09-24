import type { Order } from '@/types';
import { getOrderStatus as getStatus } from './orderStatus';

/** Safe accessors - checkout versions wrote orders in several shapes (see ADMIN_MIGRATION_PLAN). Copied from legacy AdminDashboard. */
export const getOrderTotal = (o: Order): number => (o as any).totalAmount ?? o.total ?? o.subtotal ?? 0;
export const getCustomerName = (o: Order): string => (o as any).shippingAddress?.name || o.customer?.fullName || (o as any).customerName || 'Customer';
export const getCustomerPhone = (o: Order): string => (o as any).shippingAddress?.phone || o.customer?.phone || (o as any).customerPhone || 'N/A';
export const getCustomerAddress = (o: Order): string => (o as any).shippingAddress?.address || o.customer?.address || (o as any).deliveryAddress || 'N/A';
export const getCustomerZip = (o: Order): string => (o as any).shippingAddress?.zipCode || o.customer?.postalCode || 'N/A';
export const getPaymentMethod = (o: Order): string => o.paymentMethod || o.customer?.paymentMethod || 'COD';
export const getShippingZone = (o: Order): string => (o as any).shippingZone || o.customer?.city || 'Dhaka';
export const getOrderStatus = getStatus;
