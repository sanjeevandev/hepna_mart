import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, User, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { isInternalStaff, hasPermission as checkPermission, getRoleLabel } from '@/utils/rbac';
import { Permission } from '@/types';
import Button from '@/components/ui/Button';

interface AdminRouteProps {
  children: React.ReactNode;
  requiredPermission?: Permission;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({
  children,
  requiredPermission,
}) => {
  const { currentUser, isAuthenticated, switchDevUser } = useAuthStore();

  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/account" replace />;
  }

  const isStaff = isInternalStaff(currentUser.role);
  const isPermitted = requiredPermission
    ? checkPermission(currentUser.role, requiredPermission)
    : isStaff;

  if (!isStaff || !isPermitted) {
    return (
      <div className="bg-[#F8FAFC] min-h-[80vh] flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 mx-auto flex items-center justify-center border border-red-200">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-wider">
              Access Restricted
            </span>
            <h2 className="text-xl font-heading font-black text-slate-900 mt-2">
              Staff Authorization Required
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              The HEPNA MART Administration Portal is restricted to authorized internal team members.
              Your current active persona is signed in as a <strong className="text-slate-800">{getRoleLabel(currentUser.role)}</strong>.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-left text-xs space-y-2">
            <div className="font-bold text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span>Development Testing Helper:</span>
            </div>
            <p className="text-[11px] text-slate-500">
              In local development mode, you can quickly switch to an Admin persona:
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => switchDevUser('usr-admin-super')}
                className="flex-1 py-1.5 px-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[11px] font-bold transition-colors"
              >
                Switch to Super Admin
              </button>
              <button
                type="button"
                onClick={() => switchDevUser('usr-admin-procurement')}
                className="flex-1 py-1.5 px-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold transition-colors"
              >
                Switch to Procurement
              </button>
            </div>
          </div>

          <div className="pt-2 flex justify-center">
            <Link to="/account">
              <Button variant="primary" size="md" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Customer Account</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminRoute;
