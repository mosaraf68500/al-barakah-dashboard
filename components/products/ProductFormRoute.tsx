'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getProduct } from '@/lib/api';
import { qk, useInvalidate } from '@/hooks/useAdminData';
import { ProductFormModal } from './ProductFormModal';
import { ProductsTab } from './ProductsTab';

/**
 * /products/new and /products/[id]/edit. The list stays rendered behind the form exactly like the legacy modal did,
 * but the form now has its own URL (deep-linkable / refresh-safe).
 */
export function ProductFormRoute({ productId }: { productId?: string }) {
  const router = useRouter();
  const invalidate = useInvalidate();
  const { data: product, isLoading, isError } = useQuery({ queryKey: ['product', productId], queryFn: () => getProduct(productId!), enabled: Boolean(productId) });

  const close = () => router.push('/products');
  const saved = async () => {
    await invalidate(qk.products);
    router.push('/products');
  };

  return (
    <>
      <ProductsTab />
      {productId ? (
        isError ? (
          <div className="fixed inset-0 z-50 bg-stone-950/75 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 text-sm text-stone-700 space-y-3 max-w-sm">
              <p>প্রোডাক্টটি পাওয়া যায়নি।</p>
              <button onClick={close} className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-xs font-bold cursor-pointer">Back to products</button>
            </div>
          </div>
        ) : isLoading || !product ? null : (
          <ProductFormModal key={product.id} product={product} onClose={close} onSaved={saved} />
        )
      ) : (
        <ProductFormModal product={null} onClose={close} onSaved={saved} />
      )}
    </>
  );
}
