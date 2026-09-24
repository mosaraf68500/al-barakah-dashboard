import type { ProductReview } from '@/types';
import { apiFetch, del } from './http';

export const getReviews = () => apiFetch<ProductReview[]>('/v1/admin/reviews');
export const deleteReview = (id: string) => del<{ ok: true }>(`/v1/admin/reviews/${encodeURIComponent(id)}`);
