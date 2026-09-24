'use client';

import { AlertTriangle, Check, FolderPlus, Image as ImageIcon, Upload, X } from 'lucide-react';
import { SafeImage } from '@/components/shared/SafeImage';
import { useState } from 'react';
import { ApiError, uploadImageDataUrl } from '@/lib/api';
import { compressImageFile } from '@/lib/imageCompressor';
import { CATEGORY_PRESET_IMAGES } from '@/lib/domain/constants';
import { generateSlug } from '@/lib/domain/slug';
import { useToast } from '@/providers/ToastProvider';
import type { CategoryItem } from '@/types';

export const DEFAULT_CATEGORY_IMAGE = 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=600&auto=format&fit=crop&q=80';
export type CategoryDraft = Pick<CategoryItem, 'name' | 'slug' | 'image' | 'badge' | 'enabled'>;

const SLUG_RE = /^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u;
const SAMPLE_IMAGE_URLS = new Set([DEFAULT_CATEGORY_IMAGE, ...CATEGORY_PRESET_IMAGES.map((p) => p.url)]);

type ErrorField = 'name' | 'slug' | 'badge' | 'image';

function categorySaveError(err: unknown): { field: ErrorField | null; message: string } {
  if (!(err instanceof ApiError)) {
    return { field: null, message: err instanceof Error && err.message ? err.message : 'ক্যাটাগরি সেভ হয়নি। আবার চেষ্টা করুন।' };
  }
  const code = err.code || err.message;
  if (code === 'CATEGORY_NAME_TAKEN') return { field: 'name', message: 'This category name is already used. এই নামে আরেকটি ক্যাটাগরি আছে।' };
  if (code === 'CATEGORY_SLUG_TAKEN') return { field: 'slug', message: 'This category link is already used. অন্য একটি লিংক দিন।' };
  if (code === 'MEDIA_NOT_CONFIGURED') return { field: 'image', message: 'Image upload is not ready. ছবি আপলোডের সেটআপ এখনো হয়নি।' };
  if (code === 'IMAGE_NOT_REGISTERED') return { field: 'image', message: 'Please select the image. ডিভাইস থেকে ছবি আপলোড করুন। স্যাম্পল লিংক সেভ হয় না।' };
  if (code === 'VALIDATION_ERROR') {
    const details = Array.isArray(err.details) ? (err.details as { path?: string }[]) : [];
    const path = details.find((d) => d.path)?.path || '';
    if (path.startsWith('name')) return { field: 'name', message: 'Please enter the category name. ক্যাটাগরির নাম এখনো লেখা হয়নি।' };
    if (path.startsWith('slug')) return { field: 'slug', message: 'Please fix the category link. লিংকে শুধু অক্ষর, সংখ্যা ও হাইফেন ব্যবহার করুন।' };
    if (path.startsWith('image')) return { field: 'image', message: 'Please select the image. ক্যাটাগরির ছবি এখনো সিলেক্ট করা হয়নি।' };
    if (path.startsWith('badge')) return { field: 'badge', message: 'Please shorten the badge. ব্যাজ ৪০ অক্ষরের মধ্যে রাখুন।' };
    return { field: null, message: 'Please check the form. কিছু তথ্য সঠিকভাবে দেওয়া হয়নি।' };
  }
  if (err.message && err.message !== code) return { field: null, message: err.message };
  return { field: null, message: 'ক্যাটাগরি সেভ হয়নি। আবার চেষ্টা করুন।' };
}

export function CategoryFormModal({ category, onClose, onSave }: { category: CategoryItem | null; onClose: () => void; onSave: (draft: CategoryDraft) => void | Promise<void> }) {
  const [catFormName, setCatFormName] = useState(category?.name ?? '');
  const [catFormSlug, setCatFormSlug] = useState(category ? category.slug || generateSlug(category.name) : '');
  const [catFormImage, setCatFormImage] = useState(category ? category.image || '' : DEFAULT_CATEGORY_IMAGE);
  const [catFormBadge, setCatFormBadge] = useState(category?.badge || '');
  const [catFormEnabled, setCatFormEnabled] = useState(category?.enabled ?? true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<ErrorField | null>(null);
  const showToast = useToast();

  const reject = (field: ErrorField | null, message: string) => {
    setErrorField(field);
    setFormError(message);
    showToast(message, 'error');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = catFormName.trim();
    const slug = catFormSlug.trim();
    const badge = catFormBadge.trim();
    const image = catFormImage.trim();

    if (!name) {
      reject('name', 'Please enter the category name. ক্যাটাগরির নাম এখনো লেখা হয়নি।');
      return;
    }
    if (slug && !SLUG_RE.test(slug)) {
      reject('slug', 'Please fix the category link. লিংকে শুধু অক্ষর, সংখ্যা ও হাইফেন ব্যবহার করুন।');
      return;
    }
    if (badge.length > 40) {
      reject('badge', 'Please shorten the badge. ব্যাজ ৪০ অক্ষরের মধ্যে রাখুন।');
      return;
    }
    const imageUnchanged = Boolean(category && image === (category.image || '').trim());
    if (!imageUnchanged && (!image || SAMPLE_IMAGE_URLS.has(image))) {
      reject('image', 'Please select the image. ক্যাটাগরির ছবি এখনো সিলেক্ট করা হয়নি। ডিভাইস থেকে আপলোড করুন।');
      return;
    }

    setSaving(true);
    setFormError(null);
    setErrorField(null);
    try {
      const uploaded = image.startsWith('data:') ? await uploadImageDataUrl(image, 'categories') : image;
      await onSave({
        name,
        slug: slug || generateSlug(name),
        image: uploaded,
        badge: badge || undefined,
        enabled: catFormEnabled,
      });
    } catch (err) {
      const mapped = categorySaveError(err);
      reject(mapped.field, mapped.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCategoryImageUpload = async (file: File) => {
    if (errorField === 'image') setErrorField(null);
    try {
      setCatFormImage(await compressImageFile(file, 500, 500, 0.72));
    } catch {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) setCatFormImage(e.target.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
        <div className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] shadow-2xl border border-stone-200 my-auto flex flex-col overflow-hidden">
            {/* Fixed Top Header */}
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#0a5c36] text-white flex items-center justify-center font-black shrink-0">
                  <FolderPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-stone-900 font-serif leading-tight">
                    {category ? 'Edit Category (ক্যাটাগরি এডিট)' : 'Add New Category (নতুন ক্যাটাগরি)'}
                  </h3>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    {category ? 'ক্যাটাগরির নাম, ছবি ও ব্যাজ আপডেট করুন' : 'শপে নতুন ক্যাটাগরি আইটেম যুক্ত করুন'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form id="category-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {/* Category Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-800">
                  Category Name (ক্যাটাগরির নাম) *
                </label>
                <input
                  type="text"
                  value={catFormName}
                  onChange={(e) => {
                    setCatFormName(e.target.value);
                    if (errorField === 'name') setErrorField(null);
                    if (!category) {
                      setCatFormSlug(generateSlug(e.target.value));
                    }
                  }}
                  placeholder="যেমন: খাটি মধু ও ঘি / Watches / আতর"
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border text-xs font-medium text-stone-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all ${errorField === 'name' ? 'border-rose-400' : 'border-stone-200'}`}
                />
                {errorField === 'name' && formError ? <p className="text-[11px] font-semibold text-rose-600">{formError}</p> : null}
              </div>

              {/* Slug & Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-800">
                    URL Slug (লিংক স্লাগ)
                  </label>
                  <input
                    type="text"
                    value={catFormSlug}
                    onChange={(e) => {
                      setCatFormSlug(e.target.value);
                      if (errorField === 'slug') setErrorField(null);
                    }}
                    placeholder="organic-honey"
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border text-xs font-mono text-stone-700 focus:outline-none focus:border-emerald-600 focus:bg-white ${errorField === 'slug' ? 'border-rose-400' : 'border-stone-200'}`}
                  />
                  {errorField === 'slug' && formError ? <p className="text-[11px] font-semibold text-rose-600">{formError}</p> : null}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-800">
                    Badge Tag (ঐচ্ছিক ব্যাজ)
                  </label>
                  <input
                    type="text"
                    value={catFormBadge}
                    onChange={(e) => {
                      setCatFormBadge(e.target.value);
                      if (errorField === 'badge') setErrorField(null);
                    }}
                    placeholder="যেমন: HOT, NEW, 100% PURE"
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border text-xs font-medium text-stone-900 focus:outline-none focus:border-emerald-600 focus:bg-white ${errorField === 'badge' ? 'border-rose-400' : 'border-stone-200'}`}
                  />
                  {errorField === 'badge' && formError ? <p className="text-[11px] font-semibold text-rose-600">{formError}</p> : null}
                </div>
              </div>

              {/* Quick Badge Suggestions */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[10px] text-stone-400 font-bold">কুইক ব্যাজ:</span>
                {['HOT', 'NEW', '100% PURE', 'POPULAR', 'SALE', 'LUXURY', 'COMBO', 'BESTSELLER'].map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setCatFormBadge(b)}
                    className="px-2 py-0.5 rounded-md bg-stone-100 hover:bg-orange-100 hover:text-[#f38018] text-stone-600 text-[10px] font-bold transition-colors cursor-pointer border border-stone-200"
                  >
                    +{b}
                  </button>
                ))}
              </div>

              {/* Category Image Section */}
              <div className="space-y-2 pt-2 border-t border-stone-100">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-stone-800">
                    Category Thumbnail Image (ক্যাটাগরির ছবি) *
                  </label>
                  <span className="text-[10px] text-stone-400">আপলোড বা URL দিন</span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Thumbnail Preview */}
                  <div className="w-16 h-16 rounded-2xl bg-stone-100 border border-stone-200 overflow-hidden shrink-0 flex items-center justify-center">
                    {catFormImage ? (
                      <SafeImage
                        src={catFormImage}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-stone-300" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold cursor-pointer transition-colors shrink-0">
                        <Upload className="w-3.5 h-3.5" />
                        <span>ডিভাইস থেকে আপলোড</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleCategoryImageUpload(e.target.files[0]);
                            }
                          }}
                        />
                      </label>
                      <input
                        type="text"
                        value={catFormImage}
                        onChange={(e) => {
                          setCatFormImage(e.target.value);
                          if (errorField === 'image') setErrorField(null);
                        }}
                        placeholder="বা Image URL পেস্ট করুন..."
                        className={`w-full px-3 py-2 rounded-xl bg-stone-50 border text-xs text-stone-800 focus:outline-none focus:border-emerald-600 focus:bg-white ${errorField === 'image' ? 'border-rose-400' : 'border-stone-200'}`}
                      />
                    </div>
                  </div>
                </div>
                {errorField === 'image' && formError ? <p className="text-[11px] font-semibold text-rose-600">{formError}</p> : null}

                {/* Preset image selector */}
                <div className="space-y-1 pt-1">
                  <div className="text-[10px] text-stone-500 font-semibold">
                    অথবা স্যাম্পল ছবি নির্বাচন করুন:
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-32 overflow-y-auto p-1 bg-stone-50 rounded-xl border border-stone-200">
                    {CATEGORY_PRESET_IMAGES.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCatFormImage(preset.url)}
                        className={`p-1.5 rounded-lg text-left text-[10px] font-medium border flex items-center gap-2 transition-all cursor-pointer ${
                          catFormImage === preset.url
                            ? 'bg-emerald-100 border-emerald-500 text-emerald-900 font-bold'
                            : 'bg-white border-stone-200 hover:border-stone-300 text-stone-700'
                        }`}
                      >
                        <SafeImage src={preset.url} alt="" className="w-5 h-5 rounded object-cover shrink-0" />
                        <span className="truncate">{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Visibility Switch */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-stone-900">হোমপেজে দৃশ্যমানতা (Visibility)</div>
                  <div className="text-[10px] text-stone-500">অন থাকলে হোমপেজ স্লাইডার ও মেনুতে দেখাবে</div>
                </div>
                <button
                  type="button"
                  onClick={() => setCatFormEnabled(!catFormEnabled)}
                  className={`px-4 py-1.5 rounded-full text-xs font-black uppercase transition-colors cursor-pointer shadow-2xs ${
                    catFormEnabled
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-stone-300 hover:bg-stone-400 text-stone-700'
                  }`}
                >
                  {catFormEnabled ? 'ON (সক্রিয়)' : 'OFF (লুকানো)'}
                </button>
              </div>
            </form>

            {/* Fixed Bottom Action Buttons */}
            <div className="px-6 py-3.5 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-stone-50/90 shrink-0">
              <div className="w-full sm:w-auto">
                {formError && !errorField ? (
                  <div className="flex items-center gap-1.5 text-rose-600 font-bold text-xs bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                ) : null}
              </div>
              <div className="flex items-center justify-end gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 text-xs font-bold cursor-pointer transition-colors disabled:opacity-60"
              >
                Cancel (বাতিল)
              </button>
              <button
                type="submit"
                form="category-form"
                disabled={saving}
                className="px-6 py-2 rounded-xl bg-[#0a5c36] hover:bg-[#08482a] text-white text-xs font-bold shadow-md cursor-pointer transition-all flex items-center gap-1.5 disabled:opacity-60"
              >
                <Check className="w-4 h-4" />
                <span>{saving ? 'সেভ হচ্ছে...' : category ? 'Save Changes (সেভ করুন)' : 'Create Category (তৈরি করুন)'}</span>
              </button>
              </div>
            </div>
          </div>
        </div>
  );
}
