'use client';
import { deleteProduct, updateProduct } from '@/lib/api';
import { qk, useInvalidate, useOrders, useProducts } from '@/hooks/useAdminData';
import { useToast } from '@/providers/ToastProvider';
import { ProfitAnalyticsReports } from './ProfitAnalyticsReports';

export function ReportsTab() {
  const showToast = useToast();
  const invalidate = useInvalidate();
  const { data: products = [] } = useProducts();
  const { data: orders = [] } = useOrders();

  return (
      <ProfitAnalyticsReports
        products={products}
        orders={orders}
        currency="BDT"
        onUpdateProductCostPrice={async (prodId, newCost) => {
          const target = products.find((p) => p.id === prodId);
          if (!target) return;
          await updateProduct({ ...target, costPrice: newCost });
          await invalidate(qk.products);
          showToast('✅ প্রোডাক্টের কেনা দাম (Cost Price) সফলভাবে সংরক্ষিত হয়েছে!');
        }}
        // The report already shows its own confirmation dialog, so delete directly (legacy stacked a second confirm dialog on top).
        onDeleteProduct={async (id) => {
          const target = products.find((p) => p.id === id);
          await deleteProduct(id);
          await invalidate(qk.products);
          showToast(`"${target?.name ?? 'প্রোডাক্ট'}" প্রোডাক্টটি ডাটাবেজ থেকে ডিলিট করা হয়েছে`);
        }}
      />
  );
}
