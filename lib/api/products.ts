import type { Product } from '@/types';
import { apiFetch, del, post, put } from './http';

/** Archived (soft-deleted) products are hidden unless `includeArchived` (maps to `?deleted=include`). */
export const getProducts = (includeArchived = false) => apiFetch<Product[]>(`/v1/admin/products${includeArchived ? '?deleted=include' : ''}`);
export const getProduct = (id: string) => apiFetch<Product>(`/v1/admin/products/${encodeURIComponent(id)}`);
export const createProduct = (p: Product) => post<Product>('/v1/admin/products', p);
export const updateProduct = (p: Product) => put<Product>(`/v1/admin/products/${encodeURIComponent(p.id)}`, p);
export const deleteProduct = (id: string) => del<{ ok: true }>(`/v1/admin/products/${encodeURIComponent(id)}`);
