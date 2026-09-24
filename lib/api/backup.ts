import type { DatabaseBackupPayload } from '@/types/admin';
import { apiFetch, post } from './http';

export const createBackup = () => apiFetch<DatabaseBackupPayload>('/v1/admin/backup');
export const restoreBackup = (payload: DatabaseBackupPayload) =>
  post<{ ok: true; counts: { products: number; orders: number; categories: number } }>(`/v1/admin/backup/restore?confirm=RESTORE`, payload);
