import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  MapPin,
  Package,
  Heart,
  Building,
  Settings,
  LogOut,
  HardHat,
  FileText,
  Calculator,
  Users,
  ShieldCheck,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  ExternalLink,
  Briefcase,
  Layers,
  Sparkles,
  Info,
  Clock,
  Truck,
  ArrowRight,
} from 'lucide-react';
import { useAuthStore, PRESET_DEV_USERS } from '@/store/authStore';
import { useProjectStore } from '@/store/projectStore';
import { useOrderStore } from '@/store/orderStore';
import { useEstimateStore } from '@/store/estimateStore';
import { useSiteStore } from '@/store/siteStore';
import { useBusinessStore } from '@/store/businessStore';
import { formatPrice } from '@/utils/formatPrice';
import { getRoleLabel, getRoleBadgeColor, getAccountTypeLabel } from '@/utils/rbac';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

const AccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, updateProfile, switchDevUser, logout } = useAuthStore();
  const { projects } = useProjectStore();
  const { orders } = useOrderStore();
  const { estimates } = useEstimateStore();
  const { sites, deleteSite, setDefaultSite } = useSiteStore();
  const { businessProfile, contractorProfile, teamMembers } = useBusinessStore();

  const [activeTab, setActiveTab] = useState<string>('profile');
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editEmail, setEditEmail] = useState(currentUser?.email || '');
  const [editPhone, setEditPhone] = useState(currentUser?.phone || '');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (currentUser) {
      setEditName(currentUser.name);
      setEditEmail(currentUser.email);
      setEditPhone(currentUser.phone);
    }
  }, [currentUser]);

  const handleSaveProfile = () => {
    if (!editName.trim() || !editEmail.trim()) {
      toast.error('Name and email are required');
      return;
    }
    updateProfile({
      name: editName.trim(),
      email: editEmail.trim(),
      phone: editPhone.trim(),
    });
    setIsEditingProfile(false);
  };

  const role = currentUser?.role || 'customer';
  const roleBadge = getRoleBadgeColor(role);
  const accountType = currentUser?.accountType || 'individual';

  const tabs = [
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'projects', label: 'Projects & BOQs', icon: HardHat, badge: projects.length },
    { id: 'orders', label: 'My Orders', icon: Package, badge: orders.length },
    { id: 'estimates', label: 'Saved Estimates', icon: Calculator, badge: estimates.length },
    { id: 'sites', label: 'Construction Sites', icon: MapPin, badge: sites.length },
    ...(accountType !== 'individual'
      ? [
          { id: 'business', label: 'Business & Trade', icon: Briefcase },
          { id: 'team', label: 'Team Members', icon: Users, badge: teamMembers.length },
        ]
      : []),
    { id: 'settings', label: 'Settings & Dev RBAC', icon: Settings },
  ];

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-8 sm:py-12">
      <div className="container-custom">
        {/* Top Header Card */}
        <div className="bg-[#071A2B] text-white rounded-3xl p-6 sm:p-8 border border-white/10 shadow-xl mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-2xl sm:text-3xl font-black text-accent overflow-hidden shrink-0 shadow-inner">
                {currentUser?.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  currentUser?.name?.slice(0, 2).toUpperCase() || 'JD'
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="text-xl sm:text-3xl font-heading font-black text-white">
                    {currentUser?.name || 'Customer Account'}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/15 text-accent-light border border-white/10">
                    {getAccountTypeLabel(accountType)}
                  </span>
                  {role !== 'customer' && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-400/30">
                      Staff: {getRoleLabel(role)}
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-slate-300">
                  {currentUser?.email} • {currentUser?.phone}
                </p>
                {currentUser?.companyName && (
                  <p className="text-xs text-slate-400 mt-0.5 font-medium">
                    {currentUser.companyName}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap self-start md:self-center">
              <Link to="/account/setup">
                <button
                  type="button"
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-accent" />
                  <span>Reconfigure Account</span>
                </button>
              </Link>

              {role !== 'customer' && (
                <Link to="/admin">
                  <button
                    type="button"
                    className="px-4 py-2 bg-accent hover:bg-accent-dark text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md shadow-accent/20"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Launch Admin Portal</span>
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Metric KPI Summary Tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-8">
          {/* Projects */}
          <div
            onClick={() => setActiveTab('projects')}
            className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs cursor-pointer hover:border-slate-300 transition-all flex flex-col justify-between"
          >
            <span className="text-[11px] font-bold uppercase text-slate-500">Active Projects</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-slate-900">{projects.length}</span>
              <HardHat className="w-5 h-5 text-accent" />
            </div>
          </div>

          {/* BOQs */}
          <div
            onClick={() => setActiveTab('projects')}
            className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs cursor-pointer hover:border-slate-300 transition-all flex flex-col justify-between"
          >
            <span className="text-[11px] font-bold uppercase text-slate-500">Scheduled BOQs</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-slate-900">
                {projects.filter((p) => p.materials.length > 0).length}
              </span>
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
          </div>

          {/* Orders */}
          <div
            onClick={() => setActiveTab('orders')}
            className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs cursor-pointer hover:border-slate-300 transition-all flex flex-col justify-between"
          >
            <span className="text-[11px] font-bold uppercase text-slate-500">Site Orders</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-slate-900">{orders.length}</span>
              <Package className="w-5 h-5 text-emerald-600" />
            </div>
          </div>

          {/* Estimates */}
          <div
            onClick={() => setActiveTab('estimates')}
            className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs cursor-pointer hover:border-slate-300 transition-all flex flex-col justify-between"
          >
            <span className="text-[11px] font-bold uppercase text-slate-500">Saved Estimates</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-slate-900">{estimates.length}</span>
              <Calculator className="w-5 h-5 text-purple-600" />
            </div>
          </div>

          {/* Sites */}
          <div
            onClick={() => setActiveTab('sites')}
            className="col-span-2 lg:col-span-1 bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs cursor-pointer hover:border-slate-300 transition-all flex flex-col justify-between"
          >
            <span className="text-[11px] font-bold uppercase text-slate-500">Delivery Sites</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-slate-900">{sites.length}</span>
              <MapPin className="w-5 h-5 text-red-500" />
            </div>
          </div>
        </div>

        {/* Dashboard Main Layout */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Nav */}
          <aside className="w-full lg:w-72 shrink-0">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-2 space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                      isActive
                        ? 'bg-[#071A2B] text-white shadow-xs'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-accent' : 'text-slate-500'}`} />
                      <span>{tab.label}</span>
                    </div>
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] ${
                          isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}

              <div className="h-px bg-slate-100 my-2" />

              <button
                type="button"
                onClick={logout}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </aside>

          {/* Content Panel */}
          <main className="flex-1 min-w-0">
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 min-h-[500px]">
              {/* TAB 1: Profile */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <h2 className="text-xl font-heading font-bold text-slate-900">
                        Personal Information
                      </h2>
                      <p className="text-xs text-slate-500">
                        Your account credentials and contact parameters
                      </p>
                    </div>

                    {!isEditingProfile ? (
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(true)}
                        className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit Profile</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSaveProfile}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Save Changes</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        Full Name
                      </label>
                      <input
                        type="text"
                        disabled={!isEditingProfile}
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 disabled:bg-slate-100/70 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-accent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        disabled={!isEditingProfile}
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 disabled:bg-slate-100/70 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-accent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        disabled={!isEditingProfile}
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 disabled:bg-slate-100/70 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-accent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        Account Category
                      </label>
                      <div className="px-3.5 py-2.5 bg-slate-100 rounded-xl text-xs font-bold text-slate-800 flex items-center justify-between">
                        <span>{getAccountTypeLabel(accountType)}</span>
                        <Link to="/account/setup" className="text-accent hover:underline text-[11px]">
                          Change
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Projects & BOQs */}
              {activeTab === 'projects' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <h2 className="text-xl font-heading font-bold text-slate-900">
                        Construction Projects & BOQs
                      </h2>
                      <p className="text-xs text-slate-500">
                        Manage civil work schedules, material procurement, and bill of quantities
                      </p>
                    </div>

                    <Link to="/projects/new">
                      <button
                        type="button"
                        className="px-4 py-2 rounded-xl bg-accent hover:bg-accent-dark text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create Project</span>
                      </button>
                    </Link>
                  </div>

                  {projects.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 space-y-3">
                      <HardHat className="w-10 h-10 mx-auto text-slate-400" />
                      <h4 className="font-bold text-slate-800">No Projects Created Yet</h4>
                      <p className="text-xs max-w-sm mx-auto">
                        Start your first construction project to track stage completion and generate verified BOQs.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {projects.map((proj) => (
                        <div
                          key={proj.id}
                          className="p-5 rounded-2xl border border-slate-200/80 bg-white hover:border-accent hover:shadow-sm transition-all space-y-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold uppercase">
                                {proj.type} • {proj.stage}
                              </span>
                              <h3 className="font-heading font-bold text-base text-slate-900 mt-1">
                                {proj.name}
                              </h3>
                              <p className="text-xs text-slate-500">
                                {proj.builtUpArea} {proj.areaUnit} • {proj.floors} Floors • {proj.city}
                              </p>
                            </div>
                            <span className="text-xs font-bold text-accent bg-orange-50 px-2 py-1 rounded-lg">
                              {proj.materials.length} Materials
                            </span>
                          </div>

                          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                            <Link to={`/projects/${proj.id}`} className="flex-1">
                              <button
                                type="button"
                                className="w-full py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 transition-colors"
                              >
                                View Details
                              </button>
                            </Link>

                            <Link to={`/projects/${proj.id}/boq`} className="flex-1">
                              <button
                                type="button"
                                className="w-full py-2 bg-[#071A2B] hover:bg-[#0B2742] rounded-xl text-xs font-bold text-white transition-colors flex items-center justify-center gap-1"
                              >
                                <FileText className="w-3.5 h-3.5 text-accent" />
                                <span>Open BOQ</span>
                              </button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: Orders */}
              {activeTab === 'orders' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <h2 className="text-xl font-heading font-bold text-slate-900">
                        Site Orders & Delivery Tracking
                      </h2>
                      <p className="text-xs text-slate-500">
                        View active dispatches, truckload statuses, and digital invoices
                      </p>
                    </div>

                    <Link to="/shop">
                      <button
                        type="button"
                        className="px-4 py-2 rounded-xl bg-accent hover:bg-accent-dark text-white text-xs font-bold transition-colors"
                      >
                        Browse Materials
                      </button>
                    </Link>
                  </div>

                  {orders.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 space-y-3">
                      <Package className="w-10 h-10 mx-auto text-slate-400" />
                      <h4 className="font-bold text-slate-800">No Orders Placed Yet</h4>
                      <p className="text-xs max-w-sm mx-auto">
                        Orders placed through checkout or BOQ direct procurement will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {orders.map((order) => (
                        <div
                          key={order.id}
                          className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 bg-white hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-900">
                                Order #{order.id}
                              </span>
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {order.status}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500">
                              Placed on {new Date(order.date).toLocaleDateString('en-IN')} • {order.items.length} items
                            </div>
                            <div className="text-xs text-slate-600 font-medium">
                              Site: {order.deliveryAddress?.siteName || order.deliveryAddress?.city}
                            </div>
                          </div>

                          <div className="flex items-center gap-4 self-end sm:self-center">
                            <div className="text-right">
                              <div className="text-base font-black text-slate-900">
                                {formatPrice(order.total)}
                              </div>
                              <span className="text-[10px] text-slate-400">Total Amount</span>
                            </div>

                            <Link to={`/orders/${order.id}`}>
                              <button
                                type="button"
                                className="px-4 py-2 rounded-xl bg-[#071A2B] hover:bg-[#0B2742] text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                              >
                                <span>Track Order</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: Estimates */}
              {activeTab === 'estimates' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <h2 className="text-xl font-heading font-bold text-slate-900">
                        Saved Cost Estimates
                      </h2>
                      <p className="text-xs text-slate-500">
                        Smart Construction Calculator projections and material breakdowns
                      </p>
                    </div>

                    <Link to="/calculator">
                      <button
                        type="button"
                        className="px-4 py-2 rounded-xl bg-accent hover:bg-accent-dark text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <Calculator className="w-3.5 h-3.5" />
                        <span>New Calculator Estimate</span>
                      </button>
                    </Link>
                  </div>

                  {estimates.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 space-y-3">
                      <Calculator className="w-10 h-10 mx-auto text-slate-400" />
                      <h4 className="font-bold text-slate-800">No Saved Estimates</h4>
                      <p className="text-xs max-w-sm mx-auto">
                        Run our Smart Construction Cost Calculator to save accurate estimates.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {estimates.map((est) => (
                        <div
                          key={est.id}
                          className="p-5 rounded-2xl border border-slate-200/80 bg-white hover:border-accent transition-all space-y-3"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-bold uppercase">
                                {est.inputs.projectType} • {est.inputs.quality}
                              </span>
                              <h3 className="font-heading font-bold text-base text-slate-900 mt-1">
                                Estimate #{est.id}
                              </h3>
                              <p className="text-xs text-slate-500">
                                {est.inputs.builtUpArea} {est.inputs.areaUnit} • {est.inputs.floors} Floors • {est.inputs.city}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-black text-accent block">
                                {formatPrice(est.currentTotal)}
                              </span>
                              <span className="text-[10px] text-slate-400">w/GST</span>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-100 flex justify-end">
                            <Link to={`/estimates/${est.id}`}>
                              <button
                                type="button"
                                className="px-4 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold transition-colors"
                              >
                                View Detailed Breakdown
                              </button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: Construction Sites */}
              {activeTab === 'sites' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <h2 className="text-xl font-heading font-bold text-slate-900">
                        Saved Construction Sites
                      </h2>
                      <p className="text-xs text-slate-500">
                        Site drop locations, unloading instructions, and heavy vehicle access specifications
                      </p>
                    </div>

                    <Link to="/account/setup">
                      <button
                        type="button"
                        className="px-4 py-2 rounded-xl bg-accent hover:bg-accent-dark text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Site</span>
                      </button>
                    </Link>
                  </div>

                  {sites.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 space-y-3">
                      <MapPin className="w-10 h-10 mx-auto text-slate-400" />
                      <h4 className="font-bold text-slate-800">No Construction Sites Saved</h4>
                      <p className="text-xs max-w-sm mx-auto">
                        Add your active building plots for instant site delivery address auto-fill during checkout.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {sites.map((site) => (
                        <div
                          key={site.id}
                          className={`p-5 rounded-2xl border transition-all space-y-3 ${
                            site.isDefault
                              ? 'border-accent bg-orange-50/30'
                              : 'border-slate-200/80 bg-white'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              {site.isDefault && (
                                <span className="px-2 py-0.5 rounded-full bg-accent text-white text-[10px] font-bold uppercase tracking-wider mb-1 inline-block">
                                  Default Delivery Site
                                </span>
                              )}
                              <h3 className="font-heading font-bold text-base text-slate-900">
                                {site.siteName}
                              </h3>
                              <p className="text-xs text-slate-600 mt-0.5">
                                {site.address}, {site.landmark && `${site.landmark}, `}{site.city} - {site.pincode}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => deleteSite(site.id)}
                              className="p-1.5 text-slate-300 hover:text-red-600 rounded-lg"
                              title="Delete site"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="p-3 bg-white rounded-xl border border-slate-100 text-xs space-y-1 text-slate-600">
                            <div>
                              <strong className="text-slate-800">Contact:</strong> {site.contactPerson} ({site.contactPhone})
                            </div>
                            {site.vehicleAccess && (
                              <div>
                                <strong className="text-slate-800">Vehicle Access:</strong> {site.vehicleAccess}
                              </div>
                            )}
                            {site.unloadingInstructions && (
                              <div>
                                <strong className="text-slate-800">Unloading:</strong> {site.unloadingInstructions}
                              </div>
                            )}
                          </div>

                          {!site.isDefault && (
                            <button
                              type="button"
                              onClick={() => setDefaultSite(site.id)}
                              className="text-xs font-bold text-accent hover:underline"
                            >
                              Set as Default Site
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 6: Business Profile */}
              {activeTab === 'business' && (
                <div className="space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                    <h2 className="text-xl font-heading font-bold text-slate-900">
                      Business & Trade Profile
                    </h2>
                    <p className="text-xs text-slate-500">
                      Company registration parameters, specializations, and tax documentation
                    </p>
                  </div>

                  {accountType === 'contractor' && contractorProfile && (
                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3 text-xs">
                      <span className="text-accent font-bold uppercase tracking-wider text-[10px]">
                        Contractor Profile
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div>
                          <span className="text-slate-500 block">Firm Name</span>
                          <strong className="text-slate-900 text-sm">{contractorProfile.businessName}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Experience</span>
                          <strong className="text-slate-900 text-sm">{contractorProfile.yearsOfExperience} Years</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Service Area</span>
                          <strong className="text-slate-900 text-sm">{contractorProfile.serviceArea}</strong>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200">
                        <span className="text-slate-500 block mb-1.5 font-semibold">Specializations:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {contractorProfile.specialization.map((spec) => (
                            <span
                              key={spec}
                              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs font-bold"
                            >
                              {spec}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {accountType === 'business' && businessProfile && (
                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3 text-xs">
                      <span className="text-accent font-bold uppercase tracking-wider text-[10px]">
                        Corporate Entity
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div>
                          <span className="text-slate-500 block">Company Name</span>
                          <strong className="text-slate-900 text-sm">{businessProfile.businessName}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Entity Type</span>
                          <strong className="text-slate-900 text-sm">{businessProfile.businessType}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block">GSTIN</span>
                          <strong className="text-slate-900 text-sm">{businessProfile.gstin || 'Not Provided'}</strong>
                        </div>
                      </div>

                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-[11px] flex items-center gap-2">
                        <Info className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>GSTIN and PAN verification available after backend integration.</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 7: Team Members */}
              {activeTab === 'team' && (
                <div className="space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                    <h2 className="text-xl font-heading font-bold text-slate-900">
                      Organization Team Members
                    </h2>
                    <p className="text-xs text-slate-500">
                      Manage collaborative access for project engineers, procurement managers, and accountants
                    </p>
                  </div>

                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Collaboration Notice:</span>
                      <span className="text-amber-800">
                        Team invitations via verified email links will be fully active after Phase 2 backend integration.
                      </span>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl overflow-hidden">
                    {teamMembers.map((tm) => (
                      <div
                        key={tm.id}
                        className="p-4 bg-white flex items-center justify-between gap-4 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                            {tm.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <strong className="text-slate-900 text-sm block">{tm.name}</strong>
                            <span className="text-slate-500">{tm.email}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px]">
                            {tm.role}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] uppercase">
                            {tm.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 8: Settings & Dev RBAC Tester */}
              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                    <h2 className="text-xl font-heading font-bold text-slate-900">
                      Settings & Development RBAC Switcher
                    </h2>
                    <p className="text-xs text-slate-500">
                      Switch between customer profiles and internal staff roles to test Role-Based Access Control
                    </p>
                  </div>

                  {/* Dev Switcher Box */}
                  <div className="p-5 bg-purple-50/70 border border-purple-200/80 rounded-2xl space-y-4">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-purple-700" />
                      <h3 className="font-heading font-bold text-sm text-purple-950">
                        Local Development Role Switcher
                      </h3>
                    </div>
                    <p className="text-xs text-purple-900">
                      Test UI navigation and access guards by instantly adopting any customer or internal staff persona:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {PRESET_DEV_USERS.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => switchDevUser(user.id)}
                          className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                            currentUser?.id === user.id
                              ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                              : 'bg-white hover:bg-purple-100/50 border-purple-200 text-purple-950'
                          }`}
                        >
                          <div>
                            <div className="font-bold text-xs">{user.name}</div>
                            <div
                              className={`text-[10px] ${
                                currentUser?.id === user.id ? 'text-purple-100' : 'text-purple-700'
                              }`}
                            >
                              {getRoleLabel(user.role)} • {getAccountTypeLabel(user.accountType)}
                            </div>
                          </div>
                          {currentUser?.id === user.id && (
                            <span className="text-[10px] font-black uppercase bg-white/20 px-2 py-0.5 rounded">
                              Active
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
