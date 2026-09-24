'use client';

import { AlertTriangle, Check, Crop, Layers, Loader2, Package, Upload, X, ZoomIn } from 'lucide-react';
import { SafeImage } from '@/components/shared/SafeImage';
import { useState } from 'react';
import { ApiError, createProduct, updateProduct, uploadImageDataUrl } from '@/lib/api';
import { useCategories } from '@/hooks/useAdminData';
import { compressDataUrl } from '@/lib/imageCompressor';
import { QUICK_ADD_PRESETS } from '@/lib/domain/constants';
import { generateSlug } from '@/lib/domain/slug';
import { getSubcategoriesForCategory } from '@/lib/constants/subcategories';
import { useToast } from '@/providers/ToastProvider';
import type { Product } from '@/types';
import { ImageCropZoomModal } from '@/components/shared/ImageCropZoomModal';

const IMAGE_SLOT_LABELS = ['main image (ছবি ১)', 'image 2 (ছবি ২)', 'image 3 (ছবি ৩)'];

function productSaveError(err: unknown): string {
  if (!(err instanceof ApiError)) {
    return err instanceof Error && err.message ? err.message : 'প্রোডাক্ট সেভ হয়নি। আবার চেষ্টা করুন।';
  }
  const code = err.code || err.message;
  if (code === 'CATEGORY_NOT_FOUND') return 'Please select a category. এই ক্যাটাগরি খুঁজে পাওয়া যায়নি।';
  if (code === 'INVALID_SLUG') return 'Please fix the product link. লিংকে শুধু অক্ষর, সংখ্যা ও হাইফেন ব্যবহার করুন।';
  if (code === 'SLUG_TAKEN') return 'This product link is already used. অন্য একটি লিংক দিন।';
  if (code === 'PRODUCT_ARCHIVED') return 'This product is archived. আগে রিস্টোর করুন, তারপর এডিট করুন।';
  if (code === 'MEDIA_NOT_CONFIGURED') return 'Image upload is not ready. ছবি আপলোডের সেটআপ এখনো হয়নি।';
  if (code === 'IMAGE_NOT_REGISTERED') return 'Please select the image again. ছবি সেভ হয়নি।';
  if (code === 'VALIDATION_ERROR') return 'Please check the form. কিছু তথ্য সঠিকভাবে দেওয়া হয়নি।';
  if (err.message && err.message !== code) return err.message;
  return 'প্রোডাক্ট সেভ হয়নি। আবার চেষ্টা করুন।';
}

export function ProductFormModal({ product, onClose, onSaved }: { product: Product | null; onClose: () => void; onSaved: () => void | Promise<void> }) {
  const showToast = useToast();
  const { data: categories = [] } = useCategories();

  const [prodFormId] = useState<string | null>(product?.id ?? null);
  const [prodFormName, setProdFormName] = useState(product?.name ?? '');
  const [prodFormSlug, setProdFormSlug] = useState(product ? product.slug || generateSlug(product.name) : '');
  const [prodFormCategory, setProdFormCategory] = useState(product?.category ?? (categories.length > 0 ? categories[0].name : 'Organic Foods'));
  const [prodFormSubcategory, setProdFormSubcategory] = useState(product?.subcategory || '');
  const [prodFormPrice, setProdFormPrice] = useState(product ? String(product.price) : '');
  const [prodFormCostPrice, setProdFormCostPrice] = useState(product?.costPrice ? String(product.costPrice) : '');
  const [prodFormOriginalPrice, setProdFormOriginalPrice] = useState(product?.originalPrice ? String(product.originalPrice) : '');
  const [prodFormImages, setProdFormImages] = useState<string[]>(() => {
    if (!product) return ['', '', ''];
    const existing = product.images && product.images.length > 0 ? product.images : [product.image || ''];
    return [existing[0] || product.image || '', existing[1] || '', existing[2] || ''];
  });
  const [prodFormDescription, setProdFormDescription] = useState(product?.description || '');
  const [prodFormStock, setProdFormStock] = useState(product ? String(product.stockCount ?? 25) : '30');
  const [prodFormBadge, setProdFormBadge] = useState<string>(product ? product.badge || '' : 'NEW');
  const [prodFormSizes, setProdFormSizes] = useState<string[]>(product ? (product.sizes && product.sizes.length > 0 ? product.sizes : product.weight ? [product.weight] : []) : []);
  const [customVariantInput, setCustomVariantInput] = useState<string>('');
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [productFormError, setProductFormError] = useState<string | null>(null);
  const [cropModal, setCropModal] = useState<{ isOpen: boolean; slotIndex: number; imageSrc: string }>({ isOpen: false, slotIndex: 0, imageSrc: '' });

  const handleApplyQuickAdd = (variants: string[]) => setProdFormSizes(Array.from(new Set([...prodFormSizes, ...variants])));
  const handleAddCustomVariant = () => {
    const trimmed = customVariantInput.trim();
    if (!trimmed) return;
    if (!prodFormSizes.includes(trimmed)) setProdFormSizes([...prodFormSizes, trimmed]);
    setCustomVariantInput('');
  };
  const handleRemoveVariant = (v: string) => setProdFormSizes(prodFormSizes.filter((x) => x !== v));

  const handleProductImageSlotUpload = (slotIndex: number, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) setCropModal({ isOpen: true, slotIndex, imageSrc: e.target.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleCropApply = (croppedDataUrl: string) => {
    const updated = [...prodFormImages];
    updated[cropModal.slotIndex] = croppedDataUrl;
    setProdFormImages(updated);
    showToast('ছবি সফলভাবে ক্রপ ও জুম করে সেট করা হয়েছে!');
  };

  const handleSaveProductForm = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setProductFormError(null);

    const fail = (message: string) => {
      setProductFormError(message);
      showToast(message, 'error');
    };

    const cleanName = prodFormName.trim();
    if (!cleanName) {
      fail('Please enter the product name. প্রোডাক্টের নাম এখনো লেখা হয়নি।');
      return;
    }
    if (!prodFormCategory.trim()) {
      fail('Please select a category. ক্যাটাগরি এখনো সিলেক্ট করা হয়নি।');
      return;
    }
    const missingImages = prodFormImages
      .map((img, index) => ({ index, empty: !img?.trim() }))
      .filter((slot) => slot.empty);
    if (missingImages.length > 0) {
      const which = missingImages.map((slot) => IMAGE_SLOT_LABELS[slot.index] ?? `image ${slot.index + 1}`).join(', ');
      fail(`Please select the image. ${which} এখনো সিলেক্ট করা হয়নি।`);
      return;
    }
    if (!prodFormPrice.trim()) {
      fail('Please enter the selling price. বিক্রয় মূল্য এখনো দেওয়া হয়নি।');
      return;
    }
    const priceNum = parseFloat(prodFormPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      fail('Please enter a valid selling price. বিক্রয় মূল্য ০ বা তার বেশি হতে হবে।');
      return;
    }
    if (prodFormCostPrice.trim()) {
      const cost = parseFloat(prodFormCostPrice);
      if (isNaN(cost) || cost < 0) {
        fail('Please enter a valid cost price. কেনা দাম সংখ্যায় দিন, অথবা ঘরটি খালি রাখুন।');
        return;
      }
    }
    if (prodFormOriginalPrice.trim()) {
      const original = parseFloat(prodFormOriginalPrice);
      if (isNaN(original) || original < 0) {
        fail('Please enter a valid original price. পূর্বের মূল্য সংখ্যায় দিন, অথবা ঘরটি খালি রাখুন।');
        return;
      }
    }
    if (prodFormStock.trim()) {
      const stock = Number(prodFormStock);
      if (!Number.isInteger(stock) || stock < 0) {
        fail('Please enter a valid stock count. মজুদ সংখ্যা ০ বা তার বেশি পূর্ণসংখ্যা হতে হবে।');
        return;
      }
    }

    setIsSavingProduct(true);
    try {
      const compressedImages = await Promise.all(
        prodFormImages.map(async (img) => {
          if (img && img.startsWith('data:image/') && img.length > 50000) {
            try {
              return await Promise.race([compressDataUrl(img, 700, 700, 0.75), new Promise<string>((resolve) => setTimeout(() => resolve(img), 600))]);
            } catch {
              return img;
            }
          }
          return img;
        }),
      );
      const validImages = compressedImages.filter((img) => Boolean(img && img.trim()));
      const uploadedImages = await Promise.all(validImages.map((img) => uploadImageDataUrl(img, 'products')));
      const primaryImg = uploadedImages[0] || '';
      const allImages = uploadedImages;
      const id = prodFormId ?? `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      // Empty slug (e.g. a Bengali-only name - generateSlug strips non-latin characters) falls back to the product id.
      const finalSlug = prodFormSlug.trim() || generateSlug(cleanName) || id;
      // 0 is a valid stock value (legacy turned a typed 0 into 25 and left inStock inconsistent - BUG_FIXES.md).
      const parsedStock = parseInt(prodFormStock, 10);
      const stockNum = Number.isNaN(parsedStock) ? 25 : Math.max(0, parsedStock);

      if (product) {
        await updateProduct({
          ...product,
          name: cleanName,
          slug: finalSlug,
          category: prodFormCategory,
          subcategory: prodFormSubcategory.trim() || undefined,
          price: priceNum,
          costPrice: prodFormCostPrice ? parseFloat(prodFormCostPrice) : undefined,
          originalPrice: prodFormOriginalPrice ? parseFloat(prodFormOriginalPrice) : undefined,
          image: primaryImg,
          images: allImages,
          description: prodFormDescription.trim(),
          stockCount: stockNum,
          inStock: stockNum > 0,
          badge: (prodFormBadge as Product['badge']) || undefined,
          sizes: prodFormSizes.length > 0 ? prodFormSizes : undefined,
        });
        showToast(`"${cleanName}" তথ্য সফলভাবে আপডেট হয়েছে!`);
      } else {
        const newP: Product = {
          id,
          name: cleanName,
          slug: finalSlug,
          category: prodFormCategory,
          subcategory: prodFormSubcategory.trim() || undefined,
          price: priceNum,
          costPrice: prodFormCostPrice ? parseFloat(prodFormCostPrice) : undefined,
          originalPrice: prodFormOriginalPrice ? parseFloat(prodFormOriginalPrice) : undefined,
          rating: 5.0,
          reviewCount: 1,
          image: primaryImg,
          images: allImages,
          description: prodFormDescription.trim(),
          features: ['100% Genuine Certified', 'Fast Cash on Delivery', 'Premium Packaging'],
          inStock: stockNum > 0,
          stockCount: stockNum,
          badge: (prodFormBadge as Product['badge']) || undefined,
          sizes: prodFormSizes.length > 0 ? prodFormSizes : undefined,
          tags: [prodFormCategory.toLowerCase(), 'new-product'],
        };
        await createProduct(newP);
        showToast(`নতুন প্রোডাক্ট "${newP.name}" সফলভাবে যোগ করা হয়েছে!`);
      }
      await onSaved();
    } catch (err) {
      console.error('Failed to save product:', err);
      fail(productSaveError(err));
    } finally {
      setIsSavingProduct(false);
    }
  };

  return (
<>
        <div className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 lg:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-6xl h-full max-h-[96vh] shadow-2xl flex flex-col overflow-hidden border border-stone-200">
            {/* Top Header */}
            <div className="px-6 py-4 bg-white border-b border-stone-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base sm:text-lg text-stone-900 font-serif">
                      {prodFormId ? 'Edit Product (প্রোডাক্ট এডিট করুন)' : 'Add New Product (নতুন প্রোডাক্ট যোগ করুন)'}
                    </h3>
                    {prodFormId && (
                      <span className="text-[10px] font-mono font-bold bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full border border-stone-200">
                        ID: {prodFormId}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-500">
                    প্রোডাক্টের বিবরণ, মূল্য, ছবি ও লিংক পরিবর্তন করে সরাসরি লাইভ স্টোরে আপডেট করুন
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Scrollable Body - 2 Columns */}
            <form onSubmit={handleSaveProductForm} className="flex-1 overflow-y-auto flex flex-col justify-between bg-stone-50/50">
              <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Column (7 cols): Basic Details & Pricing */}
                <div className="lg:col-span-7 space-y-5">
                  
                  {/* Card 1: Product Title & Auto-generated Slug */}
                  <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                      <span>General Information</span>
                    </h4>
                    
                    <div>
                      <label className="block font-bold text-stone-800 text-xs mb-1.5">
                        Product Title / Name (প্রোডাক্টের নাম) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Deshi Authentic Mustard Oil 5 liter"
                        value={prodFormName}
                        onChange={(e) => {
                          const val = e.target.value;
                          setProdFormName(val);
                          if (!prodFormId || !prodFormSlug) {
                            setProdFormSlug(generateSlug(val));
                          }
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm font-semibold text-stone-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all"
                      />
                    </div>

                    {/* Auto URL (Slug) Section */}
                    <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block font-bold text-stone-700 text-xs">
                          Auto-generated Product URL (Slug)
                        </label>
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          SEO Friendly Clean URL
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-lg border border-stone-200">
                        <span className="text-xs font-mono text-stone-400 select-none">
                          /product/
                        </span>
                        <input
                          type="text"
                          placeholder="auto-generated-slug"
                          value={prodFormSlug}
                          onChange={(e) => setProdFormSlug(generateSlug(e.target.value))}
                          className="w-full text-xs font-mono font-medium text-emerald-900 focus:outline-none bg-transparent"
                        />
                      </div>
                      <p className="text-[11px] text-stone-500">
                        কাস্টমার সরাসরি এই লিংকের মাধ্যমে প্রোডাক্ট পেজটি ব্রাউজ করতে পারবে।
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-stone-700 text-xs mb-1.5">
                          Category (ক্যাটাগরি) *
                        </label>
                        <select
                          value={prodFormCategory}
                          onChange={(e) => {
                            setProdFormCategory(e.target.value);
                            // Clear subcategory if new category has no subcategories
                            const subs = getSubcategoriesForCategory(e.target.value);
                            if (subs.length === 0) {
                              setProdFormSubcategory('');
                            }
                          }}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold text-stone-800 focus:outline-none focus:border-emerald-600"
                        >
                          {categories && categories.length > 0
                            ? categories.map((c) => (
                                <option key={c.id || c.name} value={c.name}>{c.name}</option>
                              ))
                            : [
                                'Organic Foods',
                                'Premium Watches',
                                'Luxury Attar',
                                'Sunnah Products',
                                'Women Collection',
                                'Medicine & Health',
                                'Baby Toys',
                                'Combo',
                                'Offer Zone'
                              ].map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-stone-700 text-xs mb-1.5">
                          Promotional Badge (প্রোমো ব্যাজ)
                        </label>
                        <select
                          value={prodFormBadge}
                          onChange={(e) => setProdFormBadge(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold text-stone-800 focus:outline-none focus:border-emerald-600"
                        >
                          <option value="">None (কোনো ব্যাজ নেই)</option>
                          <option value="BESTSELLER">BESTSELLER (বেস্টসেলার)</option>
                          <option value="HOT">HOT (হট আইটেম)</option>
                          <option value="SALE">SALE (বিশেষ ছাড়)</option>
                          <option value="NEW">NEW (নতুন আগমন)</option>
                        </select>
                      </div>
                    </div>

                    {/* Subcategory Selector */}
                    {(() => {
                      const availableSubs = getSubcategoriesForCategory(prodFormCategory);
                      if (availableSubs.length === 0) return null;

                      return (
                        <div className="pt-2">
                          <label className="block font-bold text-emerald-900 text-xs mb-1.5 flex items-center justify-between">
                            <span>Sub-category</span>
                            <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              Medicine & Health Filter
                            </span>
                          </label>
                          <select
                            value={prodFormSubcategory}
                            onChange={(e) => setProdFormSubcategory(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-emerald-50/40 border border-emerald-300 text-xs font-bold text-emerald-950 focus:outline-none focus:border-emerald-600 focus:bg-white"
                          >
                            <option value="">-- No Sub-category (General Item) --</option>
                            {availableSubs.map((sub) => (
                              <option key={sub.id} value={sub.name}>
                                {sub.name}
                              </option>
                            ))}
                          </select>
                          <p className="text-[11px] text-stone-500 mt-1">
                            Options: Medicines & Wellness, Surgical & First Aid, Women's Care & Napkins, Baby Care & Diapers, Protection.
                          </p>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Card 2: Pricing & Stock */}
                  <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                      Pricing & Inventory (মূল্য ও স্টক)
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block font-bold text-stone-800 text-xs mb-1.5">
                          Selling Price (৳ বিক্রয় মূল্য) *
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-stone-400">৳</span>
                          <input
                            type="number"
                            step="0.01"
                            required
                            value={prodFormPrice}
                            onChange={(e) => setProdFormPrice(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold text-stone-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-emerald-800 text-xs mb-1.5 flex items-center justify-between">
                          <span>কেনা দাম (Cost Price)</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">লাভের হিসাব</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-emerald-600">৳</span>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="ক্রয় / উৎপাদন খরচ"
                            value={prodFormCostPrice}
                            onChange={(e) => setProdFormCostPrice(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 rounded-xl bg-emerald-50/40 border border-emerald-300 text-xs font-bold text-emerald-950 focus:outline-none focus:border-emerald-600 focus:bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-stone-700 text-xs mb-1.5">
                          Original Price (৳ পূর্বের মূল্য)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-stone-400">৳</span>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="ঐচ্ছিক"
                            value={prodFormOriginalPrice}
                            onChange={(e) => setProdFormOriginalPrice(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium text-stone-700 focus:outline-none focus:border-emerald-600 focus:bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-stone-700 text-xs mb-1.5">
                          Stock Units (মজুদ সংখ্যা)
                        </label>
                        <input
                          type="number"
                          value={prodFormStock}
                          onChange={(e) => setProdFormStock(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold text-stone-800 focus:outline-none focus:border-emerald-600 focus:bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Weight & Size Variants with 1-Click Quick Add Presets (Optional) */}
                  <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-emerald-600" />
                          Weight & Size Variants (ওজন ও সাইজ ভ্যারিয়েন্ট)
                        </h4>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          (ঐচ্ছিক / Optional) একাধিক ওজন বা সাইজ থাকলে নিচের Quick Add বাটন চাপুন
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Optional / ঐচ্ছিক
                      </span>
                    </div>

                    {/* Quick Add Presets (Matching user screenshot exactly) */}
                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/90 space-y-2.5">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span className="text-xs font-bold text-stone-700 select-none mr-1">
                          Quick Add:
                        </span>
                        {QUICK_ADD_PRESETS.map((preset, pIdx) => (
                          <button
                            key={pIdx}
                            type="button"
                            onClick={() => handleApplyQuickAdd(preset.variants)}
                            className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-50 text-stone-700 hover:text-emerald-800 text-[11px] font-medium border border-stone-200 hover:border-emerald-300 transition-all shadow-2xs cursor-pointer active:scale-95 whitespace-nowrap"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Variant Input & Active Variants Pills */}
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="কাস্টম সাইজ লিখুন (যেমন: 250g, 3 Litre, XL)..."
                          value={customVariantInput}
                          onChange={(e) => setCustomVariantInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddCustomVariant();
                            }
                          }}
                          className="flex-1 px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium text-stone-800 focus:outline-none focus:border-emerald-600 focus:bg-white"
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomVariant}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                        >
                          + Add
                        </button>
                        {prodFormSizes.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setProdFormSizes([])}
                            className="px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-rose-50 text-stone-500 hover:text-rose-600 text-xs font-semibold transition-colors cursor-pointer"
                            title="সব ভ্যারিয়েন্ট মুছুন"
                          >
                            Clear All
                          </button>
                        )}
                      </div>

                      {/* Active Variants List */}
                      {prodFormSizes.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <span className="text-[11px] font-bold text-stone-500">যুক্ত সাইজসমূহ:</span>
                          {prodFormSizes.map((variant, vIdx) => (
                            <span
                              key={vIdx}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200"
                            >
                              <span>{variant}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveVariant(variant)}
                                className="text-emerald-600 hover:text-rose-600 p-0.5 rounded-full cursor-pointer transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-stone-400 italic">
                          কোনো ভ্যারিয়েন্ট যোগ করা হয়নি (প্রোডাক্টটি সাধারণ একক পণ্য হিসেবে প্রদর্শিত হবে)।
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Card 4: Description */}
                  <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-2">
                    <label className="block font-bold text-stone-800 text-xs">
                      Product Description (প্রোডাক্টের বিস্তারিত বিবরণ)
                    </label>
                    <textarea
                      rows={4}
                      value={prodFormDescription}
                      onChange={(e) => setProdFormDescription(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-800 focus:outline-none focus:border-emerald-600 focus:bg-white"
                      placeholder="প্রোডাক্টের গুণাগুণ, প্রস্তুত প্রণালী, ব্যবহারবিধি ও বিশেষত্ব লিখুন..."
                    />
                  </div>

                </div>

                {/* Right Column (5 cols): 3 Photo Uploads & Live Customer Storefront Card Preview */}
                <div className="lg:col-span-5 space-y-5">
                  
                  {/* 3 Photos Upload Card */}
                  <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block font-bold text-stone-800 text-xs">
                        প্রোডাক্টের ছবি (৩টি ছবি আপলোড করুন) *
                      </label>
                      <span className="text-[10px] text-stone-500 font-semibold">
                        মেইন ছবি + ২টি গ্যালারি
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      {[0, 1, 2].map((slotIdx) => {
                        const imgUrl = prodFormImages[slotIdx] || '';
                        const isPrimary = slotIdx === 0;

                        return (
                          <div key={slotIdx} className="bg-stone-50 p-2 rounded-xl border border-stone-200 space-y-1.5 flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                isPrimary ? 'bg-orange-100 text-[#f38018]' : 'bg-stone-200 text-stone-700'
                              }`}>
                                {isPrimary ? 'ছবি ১ (মেইন)' : `ছবি ${slotIdx + 1}`}
                              </span>
                              {imgUrl && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...prodFormImages];
                                    updated[slotIdx] = '';
                                    setProdFormImages(updated);
                                  }}
                                  className="text-[9px] text-rose-500 hover:underline cursor-pointer"
                                >
                                  রিমুভ
                                </button>
                              )}
                            </div>

                            {/* Image Preview Box */}
                            <div className="relative w-full h-24 rounded-lg bg-white border border-stone-200 flex items-center justify-center overflow-hidden group">
                              {imgUrl ? (
                                <>
                                  <SafeImage
                                    src={imgUrl}
                                    alt={`Slot ${slotIdx + 1}`}
                                    className="w-full h-full object-contain mix-blend-multiply"
                                    referrerPolicy="no-referrer"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCropModal({
                                        isOpen: true,
                                        slotIndex: slotIdx,
                                        imageSrc: imgUrl
                                      });
                                    }}
                                    className="absolute inset-0 bg-stone-950/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 text-[10px] font-bold transition-opacity cursor-pointer backdrop-blur-2xs"
                                    title="জুম ও ক্রপ করুন"
                                  >
                                    <Crop className="w-3 h-3 text-emerald-400" />
                                    <span>জুম / ক্রপ</span>
                                  </button>
                                </>
                              ) : (
                                <span className="text-[10px] text-stone-400 font-medium">ছবি নেই</span>
                              )}
                            </div>

                            {/* Upload and Zoom Action Buttons */}
                            <div className="flex items-center gap-1">
                              <label className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[10px] font-bold cursor-pointer transition-colors">
                                <Upload className="w-3 h-3" />
                                <span>আপলোড</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                      handleProductImageSlotUpload(slotIdx, e.target.files[0]);
                                    }
                                  }}
                                />
                              </label>

                              {imgUrl && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCropModal({
                                      isOpen: true,
                                      slotIndex: slotIdx,
                                      imageSrc: imgUrl
                                    });
                                  }}
                                  className="p-1.5 rounded-lg bg-stone-100 hover:bg-emerald-50 hover:text-emerald-800 border border-stone-200 text-stone-700 cursor-pointer transition-colors"
                                  title="ছবি জুম ইন/আউট ও ক্রপ করুন"
                                >
                                  <ZoomIn className="w-3 h-3" />
                                </button>
                              )}
                            </div>

                            {/* URL input */}
                            <input
                              type="text"
                              value={imgUrl}
                              onChange={(e) => {
                                const updated = [...prodFormImages];
                                updated[slotIdx] = e.target.value;
                                setProdFormImages(updated);
                              }}
                              placeholder="URL দিন..."
                              className="w-full px-2 py-1 rounded-md bg-white border border-stone-200 text-[10px] text-stone-800 focus:outline-none focus:border-emerald-600"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Live Storefront Card Preview */}
                  <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                        Live Storefront Preview
                      </h4>
                      <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                        কাস্টমার যেভাবে দেখবে
                      </span>
                    </div>

                    <div className="max-w-[240px] mx-auto bg-white rounded-2xl border border-stone-200 p-3 shadow-sm space-y-2.5">
                      <div className="relative w-full h-36 bg-stone-50 rounded-xl overflow-hidden flex items-center justify-center">
                        {prodFormBadge && (
                          <span className="absolute top-2 left-2 z-10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md shadow-xs bg-[#0a5c36] text-white">
                            {prodFormBadge}
                          </span>
                        )}
                        <SafeImage
                          src={prodFormImages[0] || 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=800&auto=format&fit=crop&q=80'}
                          alt="Preview"
                          className="w-full h-full object-contain mix-blend-multiply"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      <div>
                        <div className="text-[10px] font-semibold text-emerald-800 uppercase">
                          {prodFormCategory}
                        </div>
                        <div className="text-xs font-bold text-stone-900 line-clamp-1">
                          {prodFormName || 'প্রোডাক্টের নাম লিখুন'}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5 text-amber-500 text-[10px] font-bold">
                          <span>★ 5.0 (1)</span>
                        </div>
                      </div>

                      <div className="flex items-baseline gap-2 pt-1 border-t border-stone-100">
                        <span className="text-sm font-black text-emerald-900">
                          ৳{prodFormPrice || '0'}
                        </span>
                        {prodFormOriginalPrice && (
                          <span className="text-[11px] text-stone-400 line-through">
                            ৳{prodFormOriginalPrice}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                </div>

              </div>

              {/* Sticky Bottom Action Bar */}
              <div className="px-6 py-4 bg-white border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                <div className="text-xs text-stone-500 w-full sm:w-auto">
                  {productFormError ? (
                    <div className="flex items-center gap-1.5 text-rose-600 font-bold text-xs bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{productFormError}</span>
                    </div>
                  ) : (
                    <span className="hidden sm:inline">প্রোডাক্টটি সেভ করার সাথে সাথে লাইভ ওয়েবসাইটে তথ্য হালনাগাদ হবে।</span>
                  )}
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    disabled={isSavingProduct}
                    onClick={() => {
                      setProductFormError(null);
                      onClose();
                    }}
                    className="px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold cursor-pointer transition-colors disabled:opacity-50"
                  >
                    Cancel (বাতিল)
                  </button>
                  <button
                    id="btn-admin-save-product"
                    type="button"
                    disabled={isSavingProduct}
                    onClick={() => handleSaveProductForm()}
                    className="px-6 py-2.5 rounded-xl bg-[#0a5c36] hover:bg-[#08482a] text-white text-xs font-bold shadow-md cursor-pointer transition-all flex items-center gap-1.5 disabled:opacity-60"
                  >
                    {isSavingProduct ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>সংরক্ষণ হচ্ছে...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>{prodFormId ? 'Save Changes (সেভ করুন)' : 'Add Product to Store (যোগ করুন)'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      <ImageCropZoomModal
        isOpen={cropModal.isOpen}
        imageSrc={cropModal.imageSrc}
        onClose={() => setCropModal((m) => ({ ...m, isOpen: false }))}
        onApply={handleCropApply}
        title="প্রোডাক্ট ছবির সাইজ, জুম ও ক্রপ ঠিক করুন"
      />
    </>
  );
}
