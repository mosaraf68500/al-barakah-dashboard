'use client';

import { Edit3, Filter, Flame, Package, Plus, QrCode, Search, Sparkles, Trash2 } from 'lucide-react';
import { SafeImage } from '@/components/shared/SafeImage';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteProduct, updateProduct } from '@/lib/api';
import { qk, useCategories, useInvalidate, useProducts, useSettings } from '@/hooks/useAdminData';
import { availableProductCategories, filterProducts, productCategoryCounts } from '@/lib/domain/productFilters';
import { tabHref } from '@/lib/tabRoutes';
import { useToast } from '@/providers/ToastProvider';
import type { Product, ProductLandingPageConfig } from '@/types';
import { DeleteProductDialog } from '@/components/modals/DeleteProductDialog';
import { LandingPageAdminModal } from '@/components/landing/LandingPageAdminModal';
import { QRCodeGeneratorModal } from '@/components/qr/QRCodeGeneratorModal';

const STOREFRONT_URL = process.env.NEXT_PUBLIC_STOREFRONT_URL || 'http://localhost:3000';

export function ProductsTab() {
  const router = useRouter();
  const showToast = useToast();
  const invalidate = useInvalidate();
  const [showArchived, setShowArchived] = useState(false);
  const { data: products = [] } = useProducts(showArchived);
  const { data: categories = [] } = useCategories();
  const { data: settings } = useSettings();
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductCategoryFilter, setSelectedProductCategoryFilter] = useState<string>('all');
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrModalProduct, setQrModalProduct] = useState<Product | null>(null);
  const [landingProduct, setLandingProduct] = useState<Product | null>(null);
  const rate = 1;
  const symbol = '৳';

  const setActiveTab = (tab: string) => router.push(tabHref(tab));
  const openAddProductModal = () => router.push('/products/new');
  const openEditProductModal = (p: Product) => router.push(`/products/${encodeURIComponent(p.id)}/edit`);
  const handleOpenLandingCustomizer = (p: Product) => setLandingProduct(p);
  const handleDeleteProduct = (id: string) => {
    const prod = products.find((p) => p.id === id);
    if (prod) setProductToDelete(prod);
  };

  const categoryNames = useMemo(() => availableProductCategories(categories, products), [categories, products]);
  const availableProductCategoriesList = categoryNames;
  const counts = useMemo(() => productCategoryCounts(categoryNames, products), [categoryNames, products]);
  const filteredProductsList = useMemo(() => filterProducts(products, selectedProductCategoryFilter, productSearch), [products, selectedProductCategoryFilter, productSearch]);

  const handleConfirmDeleteProduct = async () => {
    if (!productToDelete) return;
    const name = productToDelete.name;
    try {
      await deleteProduct(productToDelete.id);
      await invalidate(qk.products);
      showToast(`"${name}" প্রোডাক্টটি ডাটাবেজ থেকে ডিলিট করা হয়েছে`);
    } finally {
      setProductToDelete(null);
    }
  };

  const handleSaveLandingPageConfig = async (productId: string, config: ProductLandingPageConfig) => {
    const target = products.find((p) => p.id === productId);
    if (!target) return;
    await updateProduct({ ...target, landingPage: config });
    await invalidate(qk.products);
    showToast('✅ ল্যান্ডিং পেজ ও ফেসবুক অ্যাড সেটিংস সফলভাবে সংরক্ষিত হয়েছে!');
  };

  return (
<>
          <div className="p-6 sm:p-8 space-y-6 w-full">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search products by title, category, ID..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-stone-200 text-xs sm:text-sm focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => {
                    setQrModalProduct(null);
                    setIsQrModalOpen(true);
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold shadow-xs transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <QrCode className="w-4 h-4 text-amber-700" />
                  <span>QR & Sticker Studio</span>
                </button>

                <button
                  onClick={() => setActiveTab('topSelling')}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-orange-200 bg-orange-50 hover:bg-orange-100 text-[#f38018] text-xs font-bold shadow-xs transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Flame className="w-4 h-4 fill-[#f38018]" />
                  <span>Edit Top Selling Items</span>
                </button>

                <button
                  onClick={openAddProductModal}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0a5c36] hover:bg-[#08482a] text-white text-xs font-bold shadow-xs transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Product</span>
                </button>
              </div>
            </div>

            {/* Category Filter Bar (Exact Match with Provided UI Screenshot - 100% Visible Multi-Row Wrap) */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-xs space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-950">
                  <Filter className="w-3.5 h-3.5 text-[#0a5c36]" />
                  <span>FILTER BY CATEGORY:</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {availableProductCategoriesList.length} Categories
                  </span>
                </div>
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-stone-600 cursor-pointer select-none">
                  <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} className="accent-[#0a5c36] cursor-pointer" />
                  <span>Show archived</span>
                </label>
                {(selectedProductCategoryFilter !== 'all' || productSearch.trim()) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProductCategoryFilter('all');
                      setProductSearch('');
                    }}
                    className="text-[11px] font-bold text-stone-500 hover:text-stone-900 underline cursor-pointer"
                  >
                    Reset All Filters (সব দেখুন)
                  </button>
                )}
              </div>

              {/* Multi-row wrapped Category Pills ensuring NO category is hidden or cut off */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 pt-0.5">
                {/* All Products Tab */}
                <button
                  type="button"
                  onClick={() => setSelectedProductCategoryFilter('all')}
                  className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    selectedProductCategoryFilter === 'all'
                      ? 'bg-[#0a5c36] text-white shadow-xs ring-2 ring-[#0a5c36]/20'
                      : 'bg-stone-100/90 hover:bg-stone-200/90 text-stone-700 border border-stone-200/70'
                  }`}
                >
                  <span>All Products</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                      selectedProductCategoryFilter === 'all'
                        ? 'bg-[#D4AF37] text-stone-950'
                        : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {products.length}
                  </span>
                </button>

                {/* Dynamic Category Pill Tabs */}
                {availableProductCategoriesList.map((catName) => {
                  const count = counts[catName] || 0;
                  const isSelected = selectedProductCategoryFilter.toLowerCase() === catName.toLowerCase();

                  return (
                    <button
                      key={catName}
                      type="button"
                      onClick={() => setSelectedProductCategoryFilter(catName)}
                      className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#0a5c36] text-white shadow-xs ring-2 ring-[#0a5c36]/20'
                          : 'bg-stone-100/90 hover:bg-stone-200/90 text-stone-700 border border-stone-200/70'
                      }`}
                    >
                      <span>{catName}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                          isSelected
                            ? 'bg-[#D4AF37] text-stone-950'
                            : 'bg-stone-200 text-stone-700'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-200">
                    <tr>
                      <th className="px-5 py-3.5">Product</th>
                      <th className="px-5 py-3.5">Category</th>
                      <th className="px-5 py-3.5">Price</th>
                      <th className="px-5 py-3.5">Stock</th>
                      <th className="px-5 py-3.5">Rating</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-medium">
                    {filteredProductsList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-10 text-center text-stone-400">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Package className="w-8 h-8 text-stone-300" />
                            <p className="text-xs font-semibold text-stone-600">
                              এই ক্যাটাগরিতে কোনো প্রোডাক্ট পাওয়া যায়নি
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedProductCategoryFilter('all');
                                setProductSearch('');
                              }}
                              className="mt-1 px-3 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold cursor-pointer transition-colors"
                            >
                              সব প্রোডাক্ট দেখুন (View All Products)
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredProductsList.map((product) => (
                        <tr key={product.id} className="hover:bg-stone-50/80 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <SafeImage
                                src={product.image || (product as any).imageUrl}
                                alt={product.name}
                                className="w-10 h-10 rounded-lg object-cover bg-stone-100 border border-stone-200"
                              />
                              <div>
                                <div className="font-bold text-stone-900 line-clamp-1">{product.name}</div>
                                <div className="text-[11px] text-stone-400">ID: {product.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex flex-col gap-1">
                              <span className="px-2.5 py-1 rounded-md bg-stone-100 text-stone-700 text-[11px] font-semibold inline-block w-max">
                                {product.category}
                              </span>
                              {product.subcategory && (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200 inline-block w-max">
                                  {product.subcategory}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 font-bold text-stone-900">
                            {symbol}{Math.round(product.price * rate).toLocaleString()}
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                product.inStock
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {product.inStock ? `${product.stockCount ?? 25} in stock` : 'Out of stock'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 font-bold text-amber-700">
                            ★ {product.rating} ({product.reviewCount})
                          </td>
                          <td className="px-5 py-3.5 text-right space-x-2">
                            <button
                              onClick={() => handleOpenLandingCustomizer(product)}
                              className={`p-1.5 rounded-lg cursor-pointer transition-all ${
                                product.landingPage?.enabled
                                  ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-bold'
                                  : 'bg-stone-100 hover:bg-amber-50 text-stone-600 hover:text-amber-800'
                              }`}
                              title={product.landingPage?.enabled ? "ফেসবুক ল্যান্ডিং পেজ কাস্টমাইজ করুন (সক্রিয়)" : "ফেসবুক ল্যান্ডিং পেজ তৈরি করুন"}
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                            </button>
                            <button
                              onClick={() => {
                                setQrModalProduct(product);
                                setIsQrModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 cursor-pointer transition-colors"
                              title="Generate QR Code & Bottle Sticker (কিউআর ও স্টিকার তৈরি করুন)"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => openEditProductModal(product)}
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 cursor-pointer"
                              title="Edit Product"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer"
                              title="Delete Product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
      {productToDelete && <DeleteProductDialog product={productToDelete} onCancel={() => setProductToDelete(null)} onConfirm={handleConfirmDeleteProduct} />}
      {landingProduct && (
        <LandingPageAdminModal
          isOpen
          onClose={() => setLandingProduct(null)}
          product={landingProduct}
          onSaveLandingPage={handleSaveLandingPageConfig}
          onPreviewLandingPage={(p) => window.open(`${STOREFRONT_URL}/product/${encodeURIComponent(p.slug || p.id)}`, '_blank')}
        />
      )}
      <QRCodeGeneratorModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        products={products}
        defaultProduct={qrModalProduct}
        customDomain={settings?.seoConfig?.canonicalUrl || 'https://albarakahpremium.com'}
      />
    </>
  );
}
