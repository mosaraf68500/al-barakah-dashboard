import type { AdminRole, StaffMember } from '@/types/admin';
import { apiFetch, del, post } from './http';

export const getStaff = () => apiFetch<StaffMember[]>('/v1/admin/staff');
export const grantStaff = (input: { name: string; email: string; role: AdminRole }) => post<StaffMember>('/v1/admin-auth/grant-access', input);
export const revokeStaff = (id: string) => del<{ ok: true }>(`/v1/admin/staff/${encodeURIComponent(id)}`);
