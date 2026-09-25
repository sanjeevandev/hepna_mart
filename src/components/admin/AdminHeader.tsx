import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  User,
  LogOut,
  ExternalLink,
  ChevronDown,
  Bell,
  HardHat,
  Sparkles,
} from 'lucide-react';
import { useAuthStore, PRESET_DEV_USERS } from '@/store/authStore';
import { getRoleLabel, getRoleBadgeColor } from '@/utils/rbac';

export const AdminHeader: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, switchDevUser, logout } = useAuthStore();
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  const role = currentUser?.role || 'customer';
  const roleBadge = getRoleBadgeColor(role);

  return (
    <header className="sticky top-0 z-40 bg-[#071A2B] text-white border-b border-white/10 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Branding */}
        <div className="flex items-center gap-3">
          <Link to="/admin" className="flex items-center gap-2">
            <span className="font-heading font-black text-lg tracking-tight text-white">
              HEPNA<span className="text-accent">MART</span>
            </span>
            <span className="px-2 py-0.5 rounded-md bg-accent text-white text-[10px] font-extrabold uppercase tracking-widest">
              ADMIN
            </span>
          </Link>
        </div>

        {/* Right: Quick actions & user menu */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Quick Storefront Link */}
          <Link
            to="/"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors border border-white/10"
          >
            <ExternalLink className="w-3.5 h-3.5 text-accent" />
            <span>View Public Store</span>
          </Link>

          {/* Development Role Switcher */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-bold transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{getRoleLabel(role)}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isRoleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 z-50 animate-in fade-in duration-150 text-slate-900">
                <div className="p-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Switch Test Persona (Dev)
                  </span>
                  <span className="text-[10px] text-accent font-bold">RBAC Live</span>
                </div>

                <div className="py-1 space-y-1 max-h-64 overflow-y-auto">
                  {PRESET_DEV_USERS.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => {
                        switchDevUser(user.id);
                        setIsRoleDropdownOpen(false);
                      }}
                      className={`w-full p-2 rounded-xl text-left text-xs flex items-center justify-between transition-colors ${
                        currentUser?.id === user.id
                          ? 'bg-purple-50 text-purple-900 font-bold'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-bold">{user.name}</div>
                        <div className="text-[10px] text-slate-500">
                          {getRoleLabel(user.role)}
                        </div>
                      </div>
                      {currentUser?.id === user.id && (
                        <span className="w-2 h-2 rounded-full bg-purple-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Badge */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-white/10">
            <div className="w-8 h-8 rounded-xl bg-accent text-white flex items-center justify-center font-black text-xs">
              {currentUser?.name?.slice(0, 2).toUpperCase() || 'AD'}
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-bold text-white leading-none">
                {currentUser?.name}
              </div>
              <div className="text-[10px] text-slate-400 leading-none mt-1">
                {currentUser?.email}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
