import React from 'react';
import { Project } from '@/types';
import { BOQItemComputed } from './BOQMaterialRow';
import { formatPrice } from '@/utils/formatPrice';
import { ShieldCheck, HardHat, FileText, CheckCircle2 } from 'lucide-react';

interface BOQPrintViewProps {
  project: Project;
  items: BOQItemComputed[];
  totalRequiredValue: number;
  purchasedValue: number;
  remainingValue: number;
}

export const BOQPrintView: React.FC<BOQPrintViewProps> = ({
  project,
  items,
  totalRequiredValue,
  purchasedValue,
  remainingValue,
}) => {
  const estimatedTax = totalRequiredValue * 0.18;
  const grandTotal = totalRequiredValue + estimatedTax;
  const printDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="hidden print:block bg-white text-black p-4 font-sans text-xs leading-normal">
      {/* Printable Letterhead */}
      <div className="border-b-2 border-slate-900 pb-4 mb-4 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tight text-[#071A2B]">
              HEPNA<span className="text-[#E87A2D]">MART</span>
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest bg-slate-900 text-white px-2 py-0.5 rounded">
              Procurement Division
            </span>
          </div>
          <p className="text-[10px] text-slate-600 mt-1">
            Institutional Construction Materials & Supply Chain Network • www.hepnamart.com
          </p>
        </div>

        <div className="text-right text-[11px]">
          <div className="font-extrabold text-sm text-slate-900">
            OFFICIAL BILL OF QUANTITIES (BOQ)
          </div>
          <div className="text-slate-600">Doc Ref: BOQ-{project.id.toUpperCase()}</div>
          <div className="text-slate-600">Generated: {printDate}</div>
        </div>
      </div>

      {/* Project Metadata Block */}
      <div className="border border-slate-300 rounded-lg p-3.5 mb-4 bg-slate-50/50">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Project Title</span>
            <strong className="text-slate-900 text-sm">{project.name}</strong>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Structure Type & Area</span>
            <strong className="text-slate-900">
              {project.type} • {project.builtUpArea} {project.areaUnit} ({project.floors} Floors)
            </strong>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Site Location</span>
            <strong className="text-slate-900">
              {project.city} (PIN: {project.pincode || 'N/A'})
            </strong>
          </div>
        </div>
      </div>

      {/* Financial Valuation Summary Bar */}
      <div className="grid grid-cols-4 gap-2 mb-4 text-center">
        <div className="border border-slate-300 rounded p-2">
          <div className="text-[9px] font-bold uppercase text-slate-500">Total Materials Budget</div>
          <div className="font-black text-xs text-slate-900">{formatPrice(totalRequiredValue)}</div>
        </div>
        <div className="border border-slate-300 rounded p-2">
          <div className="text-[9px] font-bold uppercase text-slate-500">Procured Value</div>
          <div className="font-black text-xs text-emerald-800">{formatPrice(purchasedValue)}</div>
        </div>
        <div className="border border-slate-300 rounded p-2">
          <div className="text-[9px] font-bold uppercase text-slate-500">Remaining Procurement</div>
          <div className="font-black text-xs text-orange-800">{formatPrice(remainingValue)}</div>
        </div>
        <div className="border border-slate-300 rounded p-2">
          <div className="text-[9px] font-bold uppercase text-slate-500">Grand Total (Incl. 18% GST)</div>
          <div className="font-black text-xs text-slate-900">{formatPrice(grandTotal)}</div>
        </div>
      </div>

      {/* Full Itemized BOQ Table */}
      <table className="w-full border-collapse border border-slate-300 text-[10px] mb-4">
        <thead>
          <tr className="bg-slate-200 text-slate-900 font-bold border-b border-slate-300">
            <th className="border border-slate-300 p-1.5 w-6 text-center">#</th>
            <th className="border border-slate-300 p-1.5 text-left">Material Description</th>
            <th className="border border-slate-300 p-1.5 text-left">Brand</th>
            <th className="border border-slate-300 p-1.5 text-left">Stage</th>
            <th className="border border-slate-300 p-1.5 text-center">Base Qty</th>
            <th className="border border-slate-300 p-1.5 text-center">Waste %</th>
            <th className="border border-slate-300 p-1.5 text-center">Total Req</th>
            <th className="border border-slate-300 p-1.5 text-center">Procured</th>
            <th className="border border-slate-300 p-1.5 text-center">Remaining</th>
            <th className="border border-slate-300 p-1.5 text-right">Rate</th>
            <th className="border border-slate-300 p-1.5 text-right">Total Amount</th>
            <th className="border border-slate-300 p-1.5 text-center">Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, idx) => (
            <tr key={it.productId} className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
              <td className="border border-slate-300 p-1 text-center font-bold">{idx + 1}</td>
              <td className="border border-slate-300 p-1 font-semibold text-slate-900">
                {it.product.name}
                {it.notes && <span className="block text-[8px] text-slate-500 italic font-normal">Note: {it.notes}</span>}
              </td>
              <td className="border border-slate-300 p-1">{it.product.brand}</td>
              <td className="border border-slate-300 p-1">{it.stage || 'General'}</td>
              <td className="border border-slate-300 p-1 text-center">{it.quantity} {it.unit}</td>
              <td className="border border-slate-300 p-1 text-center">+{it.wastagePercent || 0}%</td>
              <td className="border border-slate-300 p-1 text-center font-bold">{it.effectiveRequiredQty} {it.unit}</td>
              <td className="border border-slate-300 p-1 text-center text-emerald-800 font-bold">{it.purchasedQuantity || 0}</td>
              <td className="border border-slate-300 p-1 text-center font-bold text-orange-900">{it.remainingQty}</td>
              <td className="border border-slate-300 p-1 text-right">{formatPrice(it.currentPrice)}/{it.unit}</td>
              <td className="border border-slate-300 p-1 text-right font-extrabold">{formatPrice(it.lineTotalRequired)}</td>
              <td className="border border-slate-300 p-1 text-center font-bold">
                {it.status === 'COMPLETED'
                  ? 'PROCURED'
                  : it.status === 'PARTIAL'
                  ? 'PARTIAL'
                  : 'PENDING'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Engineering Disclaimer */}
      <div className="border border-slate-300 p-2.5 rounded mb-6 text-[9px] text-slate-600 bg-slate-50">
        <strong className="block text-slate-900 uppercase font-bold mb-0.5">
          Engineering & Compliance Notice:
        </strong>
        This Bill of Quantities (BOQ) is prepared using standard civil engineering coefficients and HEPNA MART active market pricing. Site-specific structural designs, soil conditions, and architectural modifications may require quantity adjustments. Verification by a licensed Structural Engineer or Chartered Civil Engineer is strongly advised before ordering.
      </div>

      {/* Official Signatures Block */}
      <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-300 text-center text-[10px]">
        <div>
          <div className="border-b border-slate-400 pb-8 font-semibold">HEPNA MART Systems</div>
          <div className="pt-1 text-slate-500">Authorized Procurement Agent</div>
        </div>
        <div>
          <div className="border-b border-slate-400 pb-8 font-semibold">Site Engineer / Contractor</div>
          <div className="pt-1 text-slate-500">Sign & Verification Date</div>
        </div>
        <div>
          <div className="border-b border-slate-400 pb-8 font-semibold">Client / Project Manager</div>
          <div className="pt-1 text-slate-500">Approved for Purchase</div>
        </div>
      </div>
    </div>
  );
};

export default BOQPrintView;
