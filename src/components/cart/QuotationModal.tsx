import React, { useState } from 'react';
import { X, Printer, Download, Share2, Building2, CheckCircle2, ShieldCheck, PhoneCall, Mail } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/utils/formatPrice';
import toast from 'react-hot-toast';

interface QuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const QuotationModal: React.FC<QuotationModalProps> = ({ isOpen, onClose }) => {
  const { items, getSubtotal, getTax, getDeliveryCharge, getTotal } = useCartStore();

  const [customerName, setCustomerName] = useState('BuildCon Infrastructure / Client');
  const [projectName, setProjectName] = useState('Construction Project Site');
  const [siteLocation, setSiteLocation] = useState('Pune / Mumbai, Maharashtra');

  const today = new Date();
  const validUntil = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

  const quoteRef = `HM-QT-${today.getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
  const dateStr = today.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const validStr = validUntil.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  if (!isOpen || items.length === 0) return null;

  const subtotal = getSubtotal();
  const tax = getTax();
  const delivery = getDeliveryCharge();
  const total = getTotal();

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const text = `HEPNA MART Digital Quotation [${quoteRef}] for ${customerName} (${projectName}). Total: ${formatPrice(total)} (Incl. 18% GST). View at https://hepnamart.com`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-gray-200 flex flex-col max-h-[95vh] overflow-hidden">
        {/* Modal Top Control Bar (Hidden during Print) */}
        <div className="p-4 sm:p-5 border-b border-gray-200 flex items-center justify-between bg-[#071A2B] text-white print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white font-bold text-xs">
              QT
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-heading font-bold text-white">
                Official Commercial Quotation
              </h2>
              <p className="text-[11px] text-white/70">Ref: {quoteRef}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShareWhatsApp}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-accent hover:bg-accent-dark text-white text-xs font-bold transition-colors shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close quote modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Quotation Content */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-white text-gray-900 print:p-0 print:m-0" id="quotation-sheet">
          {/* Letterhead */}
          <div className="flex flex-col sm:flex-row justify-between items-start pb-6 border-b-2 border-primary/20 gap-4">
            <div>
              <div className="font-heading font-black text-2xl tracking-tight text-[#071A2B]">
                HEPNA <span className="text-accent">MART</span>
              </div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Industrial & Commercial Construction Supplies
              </p>
              <div className="text-xs text-gray-600 mt-2 space-y-0.5">
                <div>HEPNA Infrastructure & Supplies Pvt. Ltd.</div>
                <div>GSTIN: 27AABCH9821K1Z4 | CIN: U45200MH2023PTC891234</div>
                <div>Regd Office: HEPNA Logistics Park, Ring Road, Pune - 411045</div>
                <div>Email: sales@hepnamart.com | Tel: +91 98765 43210</div>
              </div>
            </div>

            <div className="text-left sm:text-right bg-gray-50 sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none w-full sm:w-auto border sm:border-0 border-gray-200">
              <div className="text-xs font-bold uppercase tracking-wider text-accent">Formal Price Quotation</div>
              <div className="text-base font-extrabold text-[#071A2B] mt-0.5">{quoteRef}</div>
              <div className="text-xs text-gray-600 mt-1">Date: <span className="font-semibold text-gray-900">{dateStr}</span></div>
              <div className="text-xs text-gray-600">Validity: <span className="font-semibold text-emerald-700">{validStr} (7 Days)</span></div>
            </div>
          </div>

          {/* Quotation Recipient & Project (Editable inline before printing) */}
          <div className="my-6 p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
              Quotation Issued To (Project / Contractor Details):
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-gray-500 text-[10px] uppercase font-semibold">Client / Company Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full font-bold text-gray-900 bg-white border border-gray-200 px-2.5 py-1.5 rounded-lg text-xs print:border-none print:p-0"
                />
              </div>
              <div>
                <label className="block text-gray-500 text-[10px] uppercase font-semibold">Project / Site Name</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full font-bold text-gray-900 bg-white border border-gray-200 px-2.5 py-1.5 rounded-lg text-xs print:border-none print:p-0"
                />
              </div>
              <div>
                <label className="block text-gray-500 text-[10px] uppercase font-semibold">Delivery Site Location</label>
                <input
                  type="text"
                  value={siteLocation}
                  onChange={(e) => setSiteLocation(e.target.value)}
                  className="w-full font-bold text-gray-900 bg-white border border-gray-200 px-2.5 py-1.5 rounded-lg text-xs print:border-none print:p-0"
                />
              </div>
            </div>
          </div>

          {/* Itemized Material Table */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-[#071A2B] text-white">
                  <th className="p-2.5 rounded-l-lg">#</th>
                  <th className="p-2.5">Item & Specification</th>
                  <th className="p-2.5">Brand</th>
                  <th className="p-2.5 text-center">Qty</th>
                  <th className="p-2.5 text-right">Unit Price</th>
                  <th className="p-2.5 text-right">GST (18%)</th>
                  <th className="p-2.5 text-right rounded-r-lg">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map((item, idx) => {
                  const itemSub = item.product.price * item.quantity;
                  const itemGst = itemSub * 0.18;
                  const itemTot = itemSub + itemGst;

                  return (
                    <tr key={item.product.id} className="hover:bg-gray-50/70">
                      <td className="p-2.5 font-semibold text-gray-500">{idx + 1}</td>
                      <td className="p-2.5">
                        <div className="font-bold text-gray-900">{item.product.name}</div>
                        <div className="text-[11px] text-gray-500">Unit: {item.product.unit}</div>
                      </td>
                      <td className="p-2.5 font-medium text-gray-700">{item.product.brand}</td>
                      <td className="p-2.5 text-center font-bold text-gray-900">
                        {item.quantity} {item.product.unit}
                      </td>
                      <td className="p-2.5 text-right font-medium text-gray-900">
                        {formatPrice(item.product.price)}
                      </td>
                      <td className="p-2.5 text-right text-gray-600">
                        {formatPrice(itemGst)}
                      </td>
                      <td className="p-2.5 text-right font-bold text-gray-900">
                        {formatPrice(itemTot)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Financial Calculation Breakdown */}
          <div className="flex flex-col sm:flex-row justify-between items-start pt-4 border-t border-gray-200 gap-6">
            <div className="w-full sm:w-1/2 space-y-2 text-xs text-gray-600">
              <div className="font-bold text-gray-900 uppercase tracking-wider text-[11px]">
                Commercial Terms & Conditions:
              </div>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-gray-600">
                <li>Prices are valid for 7 calendar days from quotation date.</li>
                <li>Supply subject to physical site road clearance for vehicle unloading.</li>
                <li>100% Tax invoice issued upon dispatch eligible for full GST ITC claim.</li>
                <li>Standard delivery within 24-48 hours upon order confirmation.</li>
              </ul>
            </div>

            <div className="w-full sm:w-2/5 bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs space-y-2.5">
              <div className="flex justify-between text-gray-600">
                <span>Material Subtotal:</span>
                <span className="font-semibold text-gray-900">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>CGST (9.0%):</span>
                <span className="font-semibold text-gray-900">{formatPrice(tax / 2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>SGST (9.0%):</span>
                <span className="font-semibold text-gray-900">{formatPrice(tax / 2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Estimated Site Logistics:</span>
                <span className="font-semibold text-gray-900">
                  {delivery === 0 ? <span className="text-emerald-700 font-bold">FREE</span> : formatPrice(delivery)}
                </span>
              </div>

              <div className="pt-2 border-t border-gray-300 flex justify-between items-center text-sm font-bold text-[#071A2B]">
                <span>Total Quotation Value:</span>
                <span className="text-base text-accent font-extrabold">{formatPrice(total)}</span>
              </div>
            </div>
          </div>

          {/* Authorised Signatory Stamp */}
          <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between items-end text-xs text-gray-500">
            <div>
              <div>Computer Generated Digital Quotation</div>
              <div className="text-[10px] text-gray-400">HEPNA MART Automated Procurement Engine</div>
            </div>

            <div className="text-right">
              <div className="font-heading font-bold text-gray-800">For HEPNA MART SUPPLIES</div>
              <div className="text-[11px] text-gray-500 mt-6">Authorised Commercial Officer</div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer (Hidden during Print) */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Guaranteed price lock for 7 days upon quotation generation.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-none px-5 py-2 bg-accent hover:bg-accent-dark text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Print Quotation</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 rounded-xl text-xs sm:text-sm font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotationModal;
