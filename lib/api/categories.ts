import type { CategoryItem } from '@/types';
import { apiFetch, del, patch, post, put } from './http';

export const getCategories = () => apiFetch<CategoryItem[]>('/v1/admin/categories');
export const createCategory = (c: CategoryItem) => post<CategoryItem[]>('/v1/admin/categories', c);
export const updateCategory = (c: CategoryItem) => patch<CategoryItem[]>(`/v1/admin/categories/${encodeURIComponent(c.id)}`, c);
export const deleteCategory = (id: string) => del<CategoryItem[]>(`/v1/admin/categories/${encodeURIComponent(id)}`);
/** Replace the whole ordered list: reorder, turn all on/off, reset defaults. */
export const replaceCategories = (categories: CategoryItem[]) => put<CategoryItem[]>('/v1/admin/categories', { categories });
