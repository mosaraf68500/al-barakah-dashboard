'use client';

import { ArrowDown, ArrowUp, Edit3, Eye, EyeOff, Plus, RotateCcw, Search, Sparkles, Trash2, X } from 'lucide-react';
import { SafeImage } from '@/components/shared/SafeImage';
import { useState } from 'react';
import { createCategory, deleteCategory, replaceCategories, updateCategory } from '@/lib/api';
import { qk, useCategories, useInvalidate, useProducts } from '@/hooks/useAdminData';
import { INITIAL_CATEGORIES } from '@/lib/domain/constants';
import { useToast } from '@/providers/ToastProvider';
import type { CategoryItem } from '@/types';
import { CategoryFormModal, type CategoryDraft } from './CategoryFormModal';
import { DeleteCategoryDialog } from '@/components/modals/DeleteCategoryDialog';

export function CategoriesTab() {
  const showToast = useToast();
  const invalidate = useInvalidate();
  const { data: categories = [] } = useCategories();
  const { data: products = [] } = useProducts();
  const [categorySearch, setCategorySearch] = useState('');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryItem | null>(null);

  const refresh = () => invalidate(qk.categories, qk.products);
  const fail = (err: unknown) => alert(err instanceof Error ? err.message : 'কিছু ভুল হয়েছে। আবার চেষ্টা করুন।');

  const openAddCategoryModal = () => {
    setEditingCategory(null);
    setIsCategoryModalOpen(true);
  };
  const openEditCategoryModal = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategoryForm = async (draft: CategoryDraft) => {
    if (editingCategory) {
      await updateCategory({ ...editingCategory, ...draft });
      showToast(`ক্যাটাগরি "${draft.name}" সফলভাবে আপডেট করা হয়েছে!`);
    } else {
      await createCategory({ id: `cat-${Date.now()}`, ...draft });
      showToast(`নতুন ক্যাটাগরি "${draft.name}" সফলভাবে যোগ করা হয়েছে!`);
    }
    setIsCategoryModalOpen(false);
    await refresh();
  };

  const handleToggleCategory = async (id: string) => {
    const target = categories.find((c) => c.id === id);
    if (!target) return;
    await replaceCategories(categories.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c)));
    await refresh();
    showToast(`"${target.name}" ক্যাটাগরি ${!target.enabled ? 'চালু (ON)' : 'বন্ধ (OFF)'} করা হয়েছে`);
  };

  const handleToggleAllCategories = async (status: boolean) => {
    await replaceCategories(categories.map((c) => ({ ...c, enabled: status })));
    await refresh();
    showToast(status ? 'সবগুলো ক্যাটাগরি চালু (ON) করা হয়েছে' : 'সবগুলো ক্যাটাগরি বন্ধ (OFF) করা হয়েছে');
  };

  const handleReorderCategory = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === categories.length - 1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const reordered = [...categories];
    const moved = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = moved;
    await replaceCategories(reordered);
    await refresh();
    showToast(`"${moved.name}" এর পজিশন পরিবর্তন করা হয়েছে`);
  };

  const handleConfirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    try {
      await deleteCategory(categoryToDelete.id);
      showToast(`"${categoryToDelete.name}" ক্যাটাগরি মুছে ফেলা হয়েছে`);
      setCategoryToDelete(null);
      await refresh();
    } catch (err) {
      setCategoryToDelete(null);
      fail(err); // e.g. blocked because products still use the category
    }
  };

  const handleResetCategoriesToDefault = async () => {
    if (window.confirm('আপনি কি সব ক্যাটাগরি ডিফল্ট ৯টি আইটেমে রিসেট করতে চান?')) {
      await replaceCategories(INITIAL_CATEGORIES);
      await refresh();
      showToast('সব ক্যাটাগরি ডিফল্ট ৯টিতে রিসেট করা হয়েছে');
    }
  };

  return (
<>
          <div className="p-6 sm:p-8 space-y-6 max-w-7xl w-full">
            {/* Top Category Management Banner / Toolbar */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#0a5c36] text-white flex items-center justify-center font-black">
                    <Sparkles className="w-4 h-4 text-emerald-300" />
                  </div>
                  <h3 className="text-base font-bold text-stone-900 font-serif">
                    Category Management & Customization (ক্যাটাগরি ব্যবস্থাপনা)
                  </h3>
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  ক্যাটাগরি তৈরি, এডিট, রিমুভ, রিঅর্ডার (আগে/পিছে সাজানো) ও হোমপেজে দৃশ্যমানতা নিয়ন্ত্রণ করুন।
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleToggleAllCategories(true)}
                  className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Turn All ON</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleAllCategories(false)}
                  className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold border border-stone-200 cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <EyeOff className="w-3.5 h-3.5 text-stone-500" />
                  <span>Turn All OFF</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetCategoriesToDefault}
                  className="px-3 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-100 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="Reset to 9 default categories"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
                  <span>Reset Defaults</span>
                </button>

                <button
                  type="button"
                  onClick={openAddCategoryModal}
                  className="px-4 py-2 rounded-xl bg-[#0a5c36] hover:bg-[#08482a] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add New Category</span>
                </button>
              </div>
            </div>

            {/* Metric Counters & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-stone-50 p-4 rounded-2xl border border-stone-200">
              <div className="flex flex-wrap items-center gap-3">
                <span className="px-3 py-1 rounded-xl bg-white border border-stone-200 text-xs font-bold text-stone-800 shadow-2xs">
                  মোট ক্যাটাগরি: <strong className="text-stone-950 font-black">{categories.length}</strong>
                </span>
                <span className="px-3 py-1 rounded-xl bg-emerald-100/80 border border-emerald-200 text-xs font-bold text-emerald-900 shadow-2xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                  সক্রিয় (ON): <strong className="font-black">{categories.filter((c) => c.enabled).length}</strong>
                </span>
                <span className="px-3 py-1 rounded-xl bg-stone-200/80 border border-stone-300 text-xs font-bold text-stone-700 shadow-2xs">
                  লুকানো (OFF): <strong className="font-black">{categories.filter((c) => !c.enabled).length}</strong>
                </span>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  placeholder="ক্যাটাগরি খুঁজুন (Search)..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600 shadow-2xs"
                />
                {categorySearch && (
                  <button
                    onClick={() => setCategorySearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Categories Grid (Styled like screenshot with full customization actions) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {categories
                .filter(
                  (cat) =>
                    cat.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
                    cat.slug.toLowerCase().includes(categorySearch.toLowerCase())
                )
                .map((cat) => {
                  const index = categories.findIndex((c) => c.id === cat.id);
                  const productCount = products.filter(
                    (p) => p.category?.toLowerCase() === cat.name?.toLowerCase()
                  ).length;

                  return (
                    <div
                      key={cat.id}
                      className={`p-4 rounded-2xl border transition-all duration-200 relative group flex flex-col justify-between ${
                        cat.enabled
                          ? 'bg-white border-stone-200 shadow-xs hover:shadow-md hover:border-emerald-300'
                          : 'bg-stone-100/70 border-stone-200/80 opacity-75'
                      }`}
                    >
                      <div>
                        {/* Top row: Image + Info + ON/OFF switch */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-14 h-14 rounded-xl overflow-hidden bg-stone-100 border border-stone-200/80 shrink-0 relative">
                              <SafeImage
                                src={cat.image}
                                alt={cat.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                referrerPolicy="no-referrer"
                              />
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <div className="font-bold text-stone-900 text-xs sm:text-sm truncate">
                                  {cat.name}
                                </div>
                                {cat.badge && (
                                  <span className="px-1.5 py-0.5 rounded-md bg-[#FF6A00] text-white text-[9px] font-bold uppercase tracking-wider">
                                    {cat.badge}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-stone-400 font-mono mt-0.5">
                                /{cat.slug}
                              </div>
                              <div className="text-[10px] text-emerald-800 font-semibold mt-1">
                                {productCount} টি প্রোডাক্ট
                              </div>
                            </div>
                          </div>

                          {/* Toggle ON/OFF Switch (Exact style from screenshot) */}
                          <button
                            onClick={() => handleToggleCategory(cat.id)}
                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase transition-all cursor-pointer shadow-2xs shrink-0 ${
                              cat.enabled
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-stone-300 hover:bg-stone-400 text-stone-700'
                            }`}
                          >
                            {cat.enabled ? 'ON' : 'OFF'}
                          </button>
                        </div>
                      </div>

                      {/* Bottom Action Strip: Reorder & Edit / Delete */}
                      <div className="pt-3 mt-3 border-t border-stone-100 flex items-center justify-between">
                        {/* Reorder Buttons */}
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-stone-400 font-bold mr-1">#{index + 1}</span>
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => handleReorderCategory(index, 'up')}
                            className={`p-1 rounded-lg border border-stone-200 text-stone-600 transition-colors ${
                              index === 0
                                ? 'opacity-30 cursor-not-allowed bg-stone-50'
                                : 'hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 cursor-pointer bg-white'
                            }`}
                            title="Move Up (আগে নিন)"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={index === categories.length - 1}
                            onClick={() => handleReorderCategory(index, 'down')}
                            className={`p-1 rounded-lg border border-stone-200 text-stone-600 transition-colors ${
                              index === categories.length - 1
                                ? 'opacity-30 cursor-not-allowed bg-stone-50'
                                : 'hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 cursor-pointer bg-white'
                            }`}
                            title="Move Down (পিছে নিন)"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Edit & Delete Action Buttons */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditCategoryModal(cat)}
                            className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-emerald-50 hover:text-emerald-800 border border-stone-200 text-stone-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setCategoryToDelete(cat)}
                            className="p-1 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                            title="Delete Category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
      {isCategoryModalOpen && <CategoryFormModal category={editingCategory} onClose={() => setIsCategoryModalOpen(false)} onSave={handleSaveCategoryForm} />}
      {categoryToDelete && <DeleteCategoryDialog category={categoryToDelete} onCancel={() => setCategoryToDelete(null)} onConfirm={handleConfirmDeleteCategory} />}
    </>
  );
}
