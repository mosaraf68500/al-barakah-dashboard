import type { AdminAuditLog, HealthStatus } from '@/types/admin';
import { apiFetch } from './http';

export const getAuditLogs = (limit = 25) => apiFetch<AdminAuditLog[]>(`/v1/admin/audit?limit=${limit}`);
export const getHealth = () => apiFetch<HealthStatus>('/v1/admin/health');
