import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  ArrowLeft,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  UserCheck,
  Building,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { isInternalStaff, hasPermission as checkPermission, getRoleLabel } from '@/utils/rbac';
import { Permission } from '@/types';

interface AdminRouteProps {
  children: React.ReactNode;
  requiredPermission?: Permission;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({
  children,
  requiredPermission,
}) => {
  const { currentUser, isAuthenticated, switchDevUser } = useAuthStore();

  const isStaff = isAuthenticated && !!currentUser && isInternalStaff(currentUser.role);
  const isPermitted =
    isStaff &&
    (!requiredPermission || (currentUser && checkPermission(currentUser.role, requiredPermission)));

  // If user is not staff or lacks specific permission, show dedicated access screen without redirecting
  if (!isStaff || !isPermitted) {
    const activeRoleLabel = currentUser?.role ? getRoleLabel(currentUser.role) : 'Unauthenticated Guest';

    return (
      <div className="min-h-screen bg-[#071A2B] flex flex-col items-center justify-center p-4 sm:p-6 text-slate-100">
        <div className="max-w-xl w-full bg-[#0B2742] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 mx-auto flex items-center justify-center shadow-inner">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-red-500/20 text-red-300 text-[10px] font-extrabold uppercase tracking-widest border border-red-500/30">
                Access Restricted
              </span>
              <h1 className="text-2xl sm:text-3xl font-heading font-black text-white mt-2">
                HEPNA MART Administration
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                Your current account does not have permission to access the HEPNA MART Administration Panel.
              </p>
            </div>
          </div>

          {/* Current Status Box */}
          <div className="bg-[#071A2B] rounded-2xl p-4 border border-white/10 text-xs space-y-2">
            <div className="text-slate-400 text-[11px] uppercase tracking-wider font-bold">
              Current Session Status
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="text-white font-bold">{currentUser?.name || 'Guest User'}</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300 font-mono text-[11px]">
                {activeRoleLabel}
              </span>
            </div>
            {requiredPermission && (
              <p className="text-[11px] text-amber-300/80 pt-1 border-t border-white/5">
                Required Permission: <code className="text-amber-200">{requiredPermission}</code>
              </p>
            )}
          </div>

          {/* Dev Persona Switcher */}
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10 text-xs space-y-3">
            <div className="flex items-center justify-between text-slate-300 font-bold">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" />
                <span>Development Mode — Instant Admin Access</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-accent text-white uppercase font-black">
                Dev Helper
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Select an authorized internal staff persona below to access the administration dashboard:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => switchDevUser('usr-admin-super')}
                className="p-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-left font-bold text-xs transition-all shadow-md flex items-center justify-between group"
              >
                <div>
                  <div className="text-white">Sanjeevan</div>
                  <div className="text-[10px] text-purple-200 font-normal">Super Admin (All Access)</div>
                </div>
                <ShieldCheck className="w-4 h-4 text-purple-200 group-hover:scale-110 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => switchDevUser('usr-admin-ops')}
                className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-left font-bold text-xs transition-all shadow-md flex items-center justify-between group"
              >
                <div>
                  <div className="text-white">Kavita Verma</div>
                  <div className="text-[10px] text-blue-200 font-normal">Operations Admin</div>
                </div>
                <UserCheck className="w-4 h-4 text-blue-200 group-hover:scale-110 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => switchDevUser('usr-admin-procurement')}
                className="p-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-left font-bold text-xs transition-all shadow-md flex items-center justify-between group"
              >
                <div>
                  <div className="text-white">Rajesh Kumar</div>
                  <div className="text-[10px] text-amber-200 font-normal">Procurement Manager</div>
                </div>
                <Building className="w-4 h-4 text-amber-200 group-hover:scale-110 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => switchDevUser('usr-admin-inventory')}
                className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-left font-bold text-xs transition-all shadow-md flex items-center justify-between group"
              >
                <div>
                  <div className="text-white">Sneha Joshi</div>
                  <div className="text-[10px] text-emerald-200 font-normal">Inventory Manager</div>
                </div>
                <Sparkles className="w-4 h-4 text-emerald-200 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <Link
              to="/account"
              className="w-full sm:w-auto text-center px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-bold transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Go to Customer Account</span>
            </Link>

            <Link
              to="/"
              className="w-full sm:w-auto text-center px-4 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-md"
            >
              <span>View Public Store</span>
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminRoute;
