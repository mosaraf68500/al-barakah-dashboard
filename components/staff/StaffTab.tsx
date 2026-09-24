'use client';

import { ShieldCheck, Trash2, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { grantStaff, revokeStaff } from '@/lib/api';
import { qk, useInvalidate, useStaff } from '@/hooks/useAdminData';
import { useToast } from '@/providers/ToastProvider';
import type { AdminRole } from '@/types/admin';

export function StaffTab() {
  const showToast = useToast();
  const invalidate = useInvalidate();
  const { data: staffList = [] } = useStaff();
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<AdminRole>('admin');

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffEmail.trim()) return;
    try {
      const member = await grantStaff({ name: newStaffName.trim(), email: newStaffEmail.trim(), role: newStaffRole });
      await invalidate(qk.staff);
      setNewStaffName('');
      setNewStaffEmail('');
      alert(`Access granted for ${member.email} with role: ${member.role === 'super_admin' ? 'Super Admin' : 'Admin'}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not grant access.');
    }
  };

  const handleDeleteStaff = async (id: string, email: string) => {
    if (!window.confirm(`Revoke admin access for ${email}?`)) return;
    try {
      await revokeStaff(id);
      await invalidate(qk.staff);
      showToast('Admin access revoked');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not revoke access.');
    }
  };

  return (
          <div className="p-6 sm:p-8 space-y-6 max-w-7xl w-full">
            
            {/* Phase 2 stub notice (replaces the legacy "RBAC" banner, whose claims were never enforced) */}
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-[#0a5c36] shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-[#0a5c36]">Admin Access</h4>
                <p className="text-[11px] text-emerald-800">
                  Grant sends an invitation email. Revoke ends that person's access immediately.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Add Staff Form */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs h-fit">
                <div className="flex items-center gap-2 mb-4">
                  <UserPlus className="w-4 h-4 text-[#0a5c36]" />
                  <h3 className="text-sm font-bold text-stone-900 font-serif">Grant Admin Access</h3>
                </div>

                <form onSubmit={handleAddStaff} className="space-y-3.5">
                  <div>
                    <label className="text-xs font-bold text-stone-700">Staff Member Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Mahir Rahman"
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium focus:outline-none focus:border-emerald-600"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-700">Authorized Gmail / Email Address</label>
                    <input
                      type="email"
                      placeholder="e.g. manager@gmail.com"
                      value={newStaffEmail}
                      onChange={(e) => setNewStaffEmail(e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium focus:outline-none focus:border-emerald-600 font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-700">Assigned Role</label>
                    <select
                      value={newStaffRole}
                      onChange={(e) => setNewStaffRole(e.target.value as AdminRole)}
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-bold focus:outline-none focus:border-emerald-600 cursor-pointer"
                    >
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-[#0a5c36] hover:bg-[#08482a] text-white text-xs font-bold cursor-pointer transition-colors shadow-xs"
                  >
                    Authorize Staff Email
                  </button>
                </form>
              </div>

              {/* Staff List Table */}
              <div className="md:col-span-2 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                <h3 className="text-sm font-bold text-stone-900 font-serif mb-4">Authorized Admin & Staff List</h3>
                <div className="space-y-3">
                  {staffList.map((s) => {
                    const isOwner = Boolean(s.isPrimary);
                    return (
                      <div key={s.id} className="flex items-center justify-between p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-950 text-[#D4AF37] font-bold text-xs flex items-center justify-center">
                            {s.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-stone-900 text-xs">{s.name}</span>
                              {isOwner && (
                                <span className="px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#8B6508] border border-[#D4AF37]/40 text-[9px] font-black uppercase">
                                  Primary Owner
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-stone-500 font-mono mt-0.5">{s.email}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                            s.role === 'super_admin' 
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
                              : 'bg-blue-50 text-blue-800'
                          }`}>
                            {s.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                          </span>

                          {!isOwner && (
                            <button
                              onClick={() => handleDeleteStaff(s.id, s.email)}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                              title="Revoke Access"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
  );
}
