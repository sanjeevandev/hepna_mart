import React from 'react';
import { FileText, Send, CheckCircle2, Clock, Building } from 'lucide-react';
import { formatPrice } from '@/utils/formatPrice';

const SAMPLE_QUOTES = [
  {
    id: 'QUO-9821',
    client: 'BuildRight Constructions',
    contact: 'John Doe (+91 98765 43210)',
    siteCity: 'Pune (Baner)',
    itemsCount: 6,
    estimatedValue: 485000,
    status: 'In Review',
    date: '24 Sep 2026',
  },
  {
    id: 'QUO-9815',
    client: 'Apex Infrastructure Pvt Ltd',
    contact: 'Priya Sharma (+91 98112 34567)',
    siteCity: 'Mumbai (MIDC)',
    itemsCount: 14,
    estimatedValue: 1250000,
    status: 'Approved',
    date: '22 Sep 2026',
  },
  {
    id: 'QUO-9790',
    client: 'Skyline Developers',
    contact: 'Sunil Rao (+91 98220 99887)',
    siteCity: 'Pune (Hinjawadi)',
    itemsCount: 8,
    estimatedValue: 740000,
    status: 'Dispatched',
    date: '19 Sep 2026',
  },
];

const AdminQuotesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-black text-slate-900">
          Institutional Bulk Quotations
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Wholesale volume RFQs, mill container pricing, and contractor discount requests
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="py-3.5 px-4">Quote Ref & Date</th>
                <th className="py-3.5 px-4">Client & Contact</th>
                <th className="py-3.5 px-4">Delivery Site</th>
                <th className="py-3.5 px-4 text-center">Items</th>
                <th className="py-3.5 px-4 text-right">Estimated Value</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {SAMPLE_QUOTES.map((q) => (
                <tr key={q.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {q.id}
                    <span className="text-[11px] text-slate-400 block font-normal">{q.date}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <strong className="text-slate-800 block">{q.client}</strong>
                    <span className="text-[11px] text-slate-500">{q.contact}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 font-semibold">{q.siteCity}</td>
                  <td className="py-3.5 px-4 text-center font-bold">{q.itemsCount}</td>
                  <td className="py-3.5 px-4 text-right font-black text-slate-900">
                    {formatPrice(q.estimatedValue)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-50 text-amber-800 border border-amber-200">
                      {q.status}
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

export default AdminQuotesPage;
