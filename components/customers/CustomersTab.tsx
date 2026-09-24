'use client';
import { useOrders } from '@/hooks/useAdminData';
import { groupCustomers } from '@/lib/domain/customers';

export function CustomersTab() {
  const { data: orders = [] } = useOrders();
  // One row per customer with a real order count and total (legacy listed one row per ORDER with a hard-coded "1 Order").
  const customers = groupCustomers(orders);
  const rate = 1;
  const symbol = '৳';

  return (
          <div className="p-6 sm:p-8 space-y-6 w-full">
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6">
              <h3 className="text-base font-bold text-stone-900 font-serif mb-4">Customer Directory</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-200">
                    <tr>
                      <th className="px-4 py-3">Customer Name</th>
                      <th className="px-4 py-3">Contact Phone</th>
                      <th className="px-4 py-3">City / Address</th>
                      <th className="px-4 py-3">Total Orders</th>
                      <th className="px-4 py-3">Total Spent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-medium">
                    {customers.map((c) => (
                      <tr key={c.key} className="hover:bg-stone-50/80">
                        <td className="px-4 py-3 font-bold text-stone-900">{c.name}</td>
                        <td className="px-4 py-3 text-stone-600">{c.phone}</td>
                        <td className="px-4 py-3 text-stone-500">{c.address}</td>
                        <td className="px-4 py-3 font-bold text-emerald-800">{c.orderCount} {c.orderCount === 1 ? 'Order' : 'Orders'}</td>
                        <td className="px-4 py-3 font-bold text-stone-900">{symbol}{Math.round(c.totalSpent * rate).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
  );
}
