import React from 'react';
import { Settings, ShieldCheck, Lock, Users, Key, AlertTriangle, Check } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { ROLE_PERMISSIONS, ALL_PERMISSIONS, getRoleLabel } from '@/utils/rbac';
import { UserRole } from '@/types';

const ROLES_LIST: UserRole[] = [
  'super_admin',
  'admin',
  'procurement_manager',
  'inventory_manager',
  'order_manager',
  'support_staff',
];

const AdminSettingsPage: React.FC = () => {
  const { currentUser } = useAuthStore();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-heading font-black text-slate-900">
          System Administration & RBAC Matrix
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Role-Based Access Control matrix, permission allocations, and platform security boundaries
        </p>
      </div>

      {/* Security Architecture Box */}
      <div className="p-5 bg-purple-50/70 border border-purple-200/80 rounded-2xl text-xs text-purple-900 space-y-2">
        <div className="flex items-center gap-2 font-bold text-sm text-purple-950">
          <ShieldCheck className="w-5 h-5 text-purple-700" />
          <span>RBAC Security Boundary (Phase 1 Status)</span>
        </div>
        <p className="leading-relaxed text-[11px]">
          Client-side permission checks govern menu visibility and navigation guards in this phase.
          Full cryptographic JWT session token validation and database role verification will be enforced on every endpoint in Phase 2.
        </p>
      </div>

      {/* Role Permission Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-heading font-bold text-base text-slate-900">
            Permission Matrix by Staff Role
          </h3>
          <p className="text-xs text-slate-500">
            Active permissions mapped across all 6 internal administrative roles
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Permission Name</th>
                {ROLES_LIST.map((r) => (
                  <th key={r} className="py-3 px-3 text-center">
                    {getRoleLabel(r)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ALL_PERMISSIONS.map((perm) => (
                <tr key={perm} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-4 font-bold text-slate-800 font-mono text-[11px]">
                    {perm}
                  </td>
                  {ROLES_LIST.map((r) => {
                    const isGranted = ROLE_PERMISSIONS[r]?.includes(perm);
                    return (
                      <td key={r} className="py-2.5 px-3 text-center">
                        {isGranted ? (
                          <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 inline-flex items-center justify-center text-[10px] font-bold">
                            ✓
                          </span>
                        ) : (
                          <span className="text-slate-300 font-mono">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
