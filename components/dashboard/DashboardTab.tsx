'use client';

import { CheckCircle2, Flame, Layers, Package, RotateCcw, ShoppingBag, Sparkles, Users } from 'lucide-react';
import { TakaIcon } from '@/components/shared/TakaIcon';
import { useRouter } from 'next/navigation';
import { useCategories, useOrders, useProducts, useSettings } from '@/hooks/useAdminData';
import { computeMetrics, computeWeeklySales, sortOrdersNewestFirst } from '@/lib/domain/metrics';
import { getCustomerName, getCustomerPhone, getOrderTotal, getPaymentMethod } from '@/lib/domain/orderAccessors';
import { getOrderStatus } from '@/lib/domain/orderStatus';
import { tabHref } from '@/lib/tabRoutes';

export function DashboardTab() {
  const router = useRouter();
  const setActiveTab = (tab: string) => router.push(tabHref(tab));
  const { data: orders = [] } = useOrders();
  const { data: products = [] } = useProducts();
  const { data: categories = [] } = useCategories();
  const { data: settings } = useSettings();
  const topSellingConfig = settings?.topSelling ?? null;
  const rate = 1;
  const symbol = '৳';

  const deliveredOrders = orders.filter((o) => getOrderStatus(o) === 'delivered');
  const pendingOrders = orders.filter((o) => ['pending', 'processing'].includes(getOrderStatus(o)));
  const { deliveredSales, pendingRevenue, uniqueCustomers } = computeMetrics(orders);
  // Real weekly revenue (legacy showed a hard-coded fake series) and genuinely-newest-first recent orders (legacy sliced the raw array).
  const salesBarData = computeWeeklySales(orders);
  const recentOrders = sortOrdersNewestFirst(orders).slice(0, 5);

  return (
          <div className="p-6 sm:p-8 space-y-6 w-full">
            
            {/* 4 KPI Top Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              
              {/* Card 1: DELIVERED SALES */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs flex flex-col justify-between relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                      DELIVERED SALES
                    </span>
                    <div 
                      className="text-2xl sm:text-3xl font-black text-stone-900 mt-2 font-serif flex items-center gap-1"
                      style={{ fontFamily: "'Cinzel', Georgia, serif" }}
                    >
                      <TakaIcon className="text-xl sm:text-2xl text-emerald-600" />
                      {Math.round(deliveredSales).toLocaleString()}
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/60 shrink-0 font-bold text-lg font-sans">
                    ৳
                  </div>
                </div>
                <p className="text-[11px] text-stone-400 mt-3 font-medium">
                  Excluding pending/cancelled
                </p>
              </div>

              {/* Card 2: PENDING REVENUE */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs flex flex-col justify-between relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                      PENDING REVENUE
                    </span>
                    <div 
                      className="text-2xl sm:text-3xl font-black text-stone-900 mt-2 font-serif flex items-center gap-1"
                      style={{ fontFamily: "'Cinzel', Georgia, serif" }}
                    >
                      <TakaIcon className="text-xl sm:text-2xl text-[#f38018]" />
                      {Math.round(pendingRevenue).toLocaleString()}
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/60 shrink-0">
                    <RotateCcw className="w-5 h-5 stroke-[2.5]" />
                  </div>
                </div>
                <p className="text-[11px] text-stone-400 mt-3 font-medium">
                  Awaiting dispatch/COD delivery
                </p>
              </div>

              {/* Card 3: DELIVERED ORDERS */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs flex flex-col justify-between relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                      DELIVERED ORDERS
                    </span>
                    <div 
                      className="text-2xl sm:text-3xl font-black text-stone-900 mt-2 font-serif"
                      style={{ fontFamily: "'Cinzel', Georgia, serif" }}
                    >
                      {deliveredOrders.length}
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/60 shrink-0">
                    <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                  </div>
                </div>
                <p className="text-[11px] text-stone-400 mt-3 font-medium">
                  Shipped and completed
                </p>
              </div>

              {/* Card 4: TOTAL CUSTOMERS */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs flex flex-col justify-between relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                      TOTAL CUSTOMERS
                    </span>
                    <div 
                      className="text-2xl sm:text-3xl font-black text-stone-900 mt-2 font-serif"
                      style={{ fontFamily: "'Cinzel', Georgia, serif" }}
                    >
                      {uniqueCustomers}
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200/60 shrink-0">
                    <Users className="w-5 h-5 stroke-[2.5]" />
                  </div>
                </div>
                <p className="text-[11px] text-stone-400 mt-3 font-medium">
                  Unique client records
                </p>
              </div>
            </div>

            {/* Sales Overview Chart */}
            <div className="bg-white p-6 sm:p-7 rounded-2xl border border-stone-200/90 shadow-xs">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 
                    className="text-base sm:text-lg font-bold text-stone-900 font-serif"
                    style={{ fontFamily: "'Cinzel', Georgia, serif" }}
                  >
                    Weekly Sales Overview
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">Weekly revenue performance across store channels</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200/60">
                  Live Analytics
                </span>
              </div>

              {/* Bar Chart Container */}
              <div className="h-64 flex items-end justify-between gap-3 sm:gap-6 pt-8 pb-2 border-b border-stone-200">
                {salesBarData.map((item, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                    <div className="text-[10px] font-bold text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      {symbol}{item.amount.toLocaleString()}
                    </div>
                    <div 
                      className="w-full max-w-[50px] bg-[#0a5c36] hover:bg-[#FF6A00] transition-all rounded-t-lg shadow-xs cursor-pointer"
                      style={{ height: item.height }}
                    />
                    <span className="text-xs font-bold text-stone-600 mt-2">{item.day}</span>
                  </div>
                ))}
              </div>

              {/* Quick Actions Footer below chart */}
              <div className="mt-6 pt-4 flex flex-wrap items-center justify-between gap-4 border-t border-stone-100">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#0a5c36]"></div>
                  <span className="text-xs font-semibold text-stone-600">Storefront Orders (Cash on Delivery / bKash)</span>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setActiveTab('orders')}
                    className="text-xs font-bold text-[#0a5c36] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>View All Orders</span>
                    <span>&rarr;</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Orders Overview */}
            <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-stone-200 flex items-center justify-between">
                <h3 className="text-base font-bold text-stone-900 font-serif">Recent Store Orders</h3>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-xs font-bold text-[#0a5c36] hover:underline cursor-pointer"
                >
                  Manage All
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-200">
                    <tr>
                      <th className="px-5 py-3">Order ID</th>
                      <th className="px-5 py-3">Customer</th>
                      <th className="px-5 py-3">Items</th>
                      <th className="px-5 py-3">Total Amount</th>
                      <th className="px-5 py-3">Payment</th>
                      <th className="px-5 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-medium">
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-stone-50/80 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-stone-900">
                          #{order.id.slice(-6).toUpperCase()}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-stone-900">{getCustomerName(order)}</div>
                          <div className="text-[11px] text-stone-500">{getCustomerPhone(order)}</div>
                        </td>
                        <td className="px-5 py-3.5 text-stone-600">
                          {order.items?.length || 0} product(s)
                        </td>
                        <td className="px-5 py-3.5 font-bold text-stone-900">
                          {symbol}{Math.round(getOrderTotal(order) * rate).toLocaleString()}
                        </td>
                        <td className="px-5 py-3.5 uppercase font-bold text-[11px] text-stone-600">
                          {getPaymentMethod(order)}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                              getOrderStatus(order) === 'delivered'
                                ? 'bg-emerald-100 text-emerald-800'
                                : getOrderStatus(order) === 'pending'
                                ? 'bg-amber-100 text-amber-800'
                                : getOrderStatus(order) === 'processing'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-stone-100 text-stone-700'
                            }`}
                          >
                            {order.status || 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Management Shortcuts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div
                onClick={() => setActiveTab('banners')}
                className="p-5 bg-gradient-to-br from-amber-500/10 to-amber-600/5 rounded-2xl border border-amber-300/40 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold mb-3 shadow-xs group-hover:scale-105 transition-transform">
                  <Layers className="w-5 h-5 text-stone-950" />
                </div>
                <h4 className="text-sm font-bold text-stone-900 flex items-center justify-between">
                  <span>Hero & Banners</span>
                  <span className="text-amber-700 text-xs font-semibold group-hover:translate-x-0.5 transition-transform">&rarr;</span>
                </h4>
                <p className="text-xs text-stone-500 mt-1">
                  Customize main homepage slider & promo banners
                </p>
              </div>

              <div
                onClick={() => setActiveTab('products')}
                className="p-5 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 rounded-2xl border border-emerald-300/40 hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-[#0a5c36] text-white flex items-center justify-center font-bold mb-3 shadow-xs group-hover:scale-105 transition-transform">
                  <Package className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-stone-900 flex items-center justify-between">
                  <span>Products ({products.length})</span>
                  <span className="text-emerald-700 text-xs font-semibold group-hover:translate-x-0.5 transition-transform">&rarr;</span>
                </h4>
                <p className="text-xs text-stone-500 mt-1">
                  Add, edit, or adjust pricing & stock
                </p>
              </div>

              <div
                onClick={() => setActiveTab('orders')}
                className="p-5 bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-2xl border border-blue-300/40 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold mb-3 shadow-xs group-hover:scale-105 transition-transform">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-stone-900 flex items-center justify-between">
                  <span>Orders ({orders.length})</span>
                  <span className="text-blue-700 text-xs font-semibold group-hover:translate-x-0.5 transition-transform">&rarr;</span>
                </h4>
                <p className="text-xs text-stone-500 mt-1">
                  Process shipments, COD & delivery tracking
                </p>
              </div>

              <div
                onClick={() => setActiveTab('topSelling')}
                className="p-5 bg-gradient-to-br from-orange-500/10 to-orange-600/5 rounded-2xl border border-orange-300/40 hover:border-orange-400 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-[#f38018] text-white flex items-center justify-center font-bold mb-3 shadow-xs group-hover:scale-105 transition-transform">
                  <Flame className="w-5 h-5 fill-white" />
                </div>
                <h4 className="text-sm font-bold text-stone-900 flex items-center justify-between">
                  <span>Top Selling Items</span>
                  <span className="text-orange-700 text-xs font-semibold group-hover:translate-x-0.5 transition-transform">&rarr;</span>
                </h4>
                <p className="text-xs text-stone-500 mt-1">
                  Customize 4 top selling product cards & pricing
                </p>
              </div>

              <div
                onClick={() => setActiveTab('categories')}
                className="p-5 bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-2xl border border-purple-300/40 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold mb-3 shadow-xs group-hover:scale-105 transition-transform">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-stone-900 flex items-center justify-between">
                  <span>Categories & Offers</span>
                  <span className="text-purple-700 text-xs font-semibold group-hover:translate-x-0.5 transition-transform">&rarr;</span>
                </h4>
                <p className="text-xs text-stone-500 mt-1">
                  Manage categories & promotional badges
                </p>
              </div>
            </div>

          </div>
  );
}
