import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  User,
  LogOut,
  ExternalLink,
  ChevronDown,
  Bell,
  Menu,
  Sparkles,
  Check,
} from 'lucide-react';
import { useAuthStore, PRESET_DEV_USERS } from '@/store/authStore';
import { getRoleLabel, getRoleBadgeColor } from '@/utils/rbac';
import toast from 'react-hot-toast';

interface AdminHeaderProps {
  onToggleMobileMenu?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onToggleMobileMenu }) => {
  const navigate = useNavigate();
  const { currentUser, switchDevUser, logout } = useAuthStore();
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const role = currentUser?.role || 'super_admin';
  const roleBadge = getRoleBadgeColor(role);

  const handleSignOut = () => {
    logout();
    toast.success('Signed out of Administration Console');
  };

  return (
    <header className="sticky top-0 z-40 bg-[#071A2B] text-white border-b border-white/10 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Brand */}
        <div className="flex items-center gap-3">
          {onToggleMobileMenu && (
            <button
              type="button"
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 transition-colors"
              aria-label="Toggle Navigation Drawer"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <Link to="/admin" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-accent text-white flex items-center justify-center font-black text-sm shadow-md">
              H
            </div>
            <div>
              <div className="font-heading font-black text-base sm:text-lg tracking-tight text-white leading-none">
                HEPNA<span className="text-accent">MART</span>
              </div>
              <div className="text-[10px] uppercase font-extrabold tracking-widest text-slate-400 leading-none mt-0.5">
                Administration
              </div>
            </div>
          </Link>
        </div>

        {/* Right: Actions, Notifications, Role, Profile & Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Public Storefront Link */}
          <Link
            to="/"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors border border-white/10"
          >
            <ExternalLink className="w-3.5 h-3.5 text-accent" />
            <span>Storefront</span>
          </Link>

          {/* Notifications */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white transition-colors relative"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-50 animate-in fade-in duration-150 text-slate-900">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                  <span className="font-bold text-xs text-slate-800">Admin Alerts & Notifications</span>
                  <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-bold">2 New</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="font-bold text-slate-800">Low Stock: UltraTech OPC 53</div>
                    <div className="text-[11px] text-slate-500">Inventory reached 120 bags (below safety threshold).</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="font-bold text-slate-800">New Bulk RFQ Submitted</div>
                    <div className="text-[11px] text-slate-500">BuildRight Constructions requested 500 Bags PPC quote.</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Development Role Switcher Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-bold transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="hidden sm:inline">{currentUser?.name?.split(' ')[0]}:</span>
              <span className="text-accent-light font-extrabold uppercase text-[11px]">
                {getRoleLabel(role)}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isRoleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 z-50 animate-in fade-in duration-150 text-slate-900">
                <div className="p-2 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-accent" />
                    <span className="text-[11px] font-bold text-slate-800">
                      Dev Persona Switcher
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                    RBAC Live
                  </span>
                </div>

                <div className="py-1 space-y-1 max-h-72 overflow-y-auto">
                  {PRESET_DEV_USERS.map((user) => {
                    const isSelected = currentUser?.id === user.id;
                    const badge = getRoleBadgeColor(user.role);

                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => {
                          switchDevUser(user.id);
                          setIsRoleDropdownOpen(false);
                        }}
                        className={`w-full p-2.5 rounded-xl text-left text-xs flex items-center justify-between transition-colors ${
                          isSelected
                            ? 'bg-purple-50 text-purple-900 font-bold border border-purple-200'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{user.name}</span>
                            {user.role === 'super_admin' && (
                              <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.2 rounded font-extrabold">
                                HQ
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Role: <strong className="text-slate-700">{getRoleLabel(user.role)}</strong>
                            {user.accountType && ` • (${user.accountType})`}
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-purple-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar */}
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-white/10">
            <div className="w-8 h-8 rounded-xl bg-accent text-white flex items-center justify-center font-black text-xs shadow-sm">
              {currentUser?.name?.slice(0, 2).toUpperCase() || 'AD'}
            </div>
            <div className="hidden xl:block text-left">
              <div className="text-xs font-bold text-white leading-none">
                {currentUser?.name}
              </div>
              <div className="text-[10px] text-slate-400 leading-none mt-1">
                {currentUser?.email}
              </div>
            </div>
          </div>

          {/* Sign Out Button */}
          <button
            type="button"
            onClick={handleSignOut}
            className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors flex items-center gap-1.5 text-xs font-bold"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline text-[11px]">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
