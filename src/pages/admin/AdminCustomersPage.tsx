import React, { useState } from 'react';
import { Users, Search, Building2, HardHat, User, CheckCircle2 } from 'lucide-react';
import { PRESET_DEV_USERS } from '@/store/authStore';
import { getAccountTypeLabel } from '@/utils/rbac';

const AdminCustomersPage: React.FC = () => {
  const [search, setSearch] = useState('');

  const filtered = PRESET_DEV_USERS.filter((u) => u.role === 'customer').filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.companyName && u.companyName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-black text-slate-900">
          Customers & Trade Accounts Directory
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          View registered Contractors, Real Estate Developers, and Retail Homebuilder accounts
        </p>
      </div>

      {/* Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers by name, email, company..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* Customers List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Account Type</th>
                <th className="py-3.5 px-4">Organization</th>
                <th className="py-3.5 px-4">Phone</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                        {user.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <strong className="text-slate-900 font-bold block">{user.name}</strong>
                        <span className="text-slate-500 text-[11px]">{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                      {getAccountTypeLabel(user.accountType)}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-800">
                    {user.companyName || 'Individual Builder'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-semibold">{user.phone}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Active</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminCustomersPage;
