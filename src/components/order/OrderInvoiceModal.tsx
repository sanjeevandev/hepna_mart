import React from 'react';
import { X, Printer, Share2, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';
import { Order } from '@/types';
import { formatPrice } from '@/utils/formatPrice';
import Button from '@/components/ui/Button';

interface OrderInvoiceModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
}

const OrderInvoiceModal: React.FC<OrderInvoiceModalProps> = ({ order, isOpen, onClose }) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const text = `HEPNA MART Commercial Tax Invoice [${order.id}] for ${order.deliveryAddress.fullName}. Total: ${formatPrice(
      order.total
    )} (Incl. 18% GST). View at https://hepnamart.com/orders/${order.id}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const orderDateStr = new Date(order.date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[95vh] overflow-hidden">
        {/* Top Control Bar (Hidden on print) */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-[#071A2B] text-white print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white font-bold text-xs">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-heading font-bold text-white">
                Tax Invoice & Delivery Challan
              </h2>
              <p className="text-[11px] text-white/70">Invoice #{order.id}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-accent hover:bg-accent-dark text-white text-xs font-bold transition-colors shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close invoice"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-white text-slate-900 print:p-0 print:m-0" id="invoice-sheet">
          {/* Company Letterhead */}
          <div className="flex flex-col sm:flex-row justify-between items-start pb-6 border-b-2 border-primary/20 gap-4">
            <div>
              <div className="font-heading font-black text-2xl tracking-tight text-[#071A2B]">
                HEPNA <span className="text-accent">MART</span>
              </div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Industrial & Commercial Construction Supplies Pvt. Ltd.
              </p>
              <div className="text-xs text-slate-600 mt-2 space-y-0.5">
                <div>GSTIN: 27AABCH9821K1Z4 | CIN: U45200MH2023PTC891234</div>
                <div>Regd Office: HEPNA Logistics Park, Ring Road, Pune - 411045</div>
                <div>Email: billing@hepnamart.com | Tel: +91 98765 43210</div>
              </div>
            </div>

            <div className="text-left sm:text-right bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none w-full sm:w-auto border sm:border-0 border-slate-200">
              <div className="text-xs font-bold uppercase tracking-wider text-accent">Tax Invoice / E-Way Challan</div>
              <div className="text-base font-extrabold text-[#071A2B] mt-0.5">{order.id}</div>
              <div className="text-xs text-slate-600 mt-1">
                Order Date: <span className="font-semibold text-slate-900">{orderDateStr}</span>
              </div>
              <div className="text-xs text-slate-600">
                Payment: <span className="font-semibold text-emerald-700">{order.paymentMethod}</span>
              </div>
              <div className="text-xs text-slate-600">
                Status: <span className="font-bold text-accent uppercase">{order.status}</span>
              </div>
            </div>
          </div>

          {/* Billing & Site Consignee Details */}
          <div className="my-6 grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Billed To (Customer):
              </div>
              <div className="font-bold text-slate-900 text-sm">{order.deliveryAddress.fullName}</div>
              <div className="text-slate-600 mt-1">Phone: {order.deliveryAddress.phone}</div>
              <div className="text-slate-600">
                {order.deliveryAddress.addressLine1}, {order.deliveryAddress.city}, {order.deliveryAddress.state} — {order.deliveryAddress.pincode}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Consignee / Site Unloading Destination:
              </div>
              <div className="font-bold text-slate-900 text-sm">
                {order.projectName || order.deliveryAddress.siteName || 'Construction Project Site'}
              </div>
              <div className="text-slate-600 mt-1">
                Site Supervisor: {order.deliveryAddress.siteContactPerson || order.deliveryAddress.fullName} (
                {order.deliveryAddress.sitePhone || order.deliveryAddress.phone})
              </div>
              <div className="text-slate-600">
                Carrier: {order.deliveryAddress.deliveryPreference || 'Standard Commercial Truck'}
              </div>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-[#071A2B] text-white">
                  <th className="p-2.5 rounded-l-lg">#</th>
                  <th className="p-2.5">Material & Specification</th>
                  <th className="p-2.5">Brand</th>
                  <th className="p-2.5 text-center">Qty</th>
                  <th className="p-2.5 text-right">Rate</th>
                  <th className="p-2.5 text-right">GST (18%)</th>
                  <th className="p-2.5 text-right rounded-r-lg">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {order.items.map((item, idx) => {
                  const itemSub = item.product.price * item.quantity;
                  const itemGst = itemSub * 0.18;
                  const itemTot = itemSub + itemGst;

                  return (
                    <tr key={item.product.id} className="hover:bg-slate-50/70">
                      <td className="p-2.5 font-semibold text-slate-500">{idx + 1}</td>
                      <td className="p-2.5">
                        <div className="font-bold text-slate-900">{item.product.name}</div>
                        <div className="text-[10px] text-slate-500">
                          Unit: {item.product.unit} | SKU: {item.product.id}
                        </div>
                      </td>
                      <td className="p-2.5 font-medium text-slate-700">{item.product.brand}</td>
                      <td className="p-2.5 text-center font-bold text-slate-900">
                        {item.quantity} {item.product.unit}s
                      </td>
                      <td className="p-2.5 text-right font-medium text-slate-900">
                        {formatPrice(item.product.price)}
                      </td>
                      <td className="p-2.5 text-right text-slate-600">{formatPrice(itemGst)}</td>
                      <td className="p-2.5 text-right font-bold text-slate-900">{formatPrice(itemTot)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pricing Calculation Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start pt-4 border-t border-slate-200 gap-6">
            <div className="w-full sm:w-1/2 space-y-2 text-xs text-slate-600">
              <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Terms & GST Declarations:
              </div>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600">
                <li>Material supplies are tested to meet Bureau of Indian Standards (BIS).</li>
                <li>100% Tax invoice issued for Input Tax Credit (ITC) eligibility.</li>
                <li>Goods once delivered and offloaded subject to signed challan receipt.</li>
              </ul>
            </div>

            <div className="w-full sm:w-2/5 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2.5">
              <div className="flex justify-between text-slate-600">
                <span>Materials Subtotal:</span>
                <span className="font-semibold text-slate-900">{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>CGST (9.0%):</span>
                <span className="font-semibold text-slate-900">{formatPrice(order.tax / 2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>SGST (9.0%):</span>
                <span className="font-semibold text-slate-900">{formatPrice(order.tax / 2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Site Delivery & Transit:</span>
                <span className="font-semibold text-slate-900">
                  {order.deliveryCharge === 0 ? (
                    <span className="text-emerald-700 font-bold">FREE</span>
                  ) : (
                    formatPrice(order.deliveryCharge)
                  )}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-300 flex justify-between items-center text-sm font-bold text-[#071A2B]">
                <span>Total Invoice Value:</span>
                <span className="text-base text-accent font-extrabold">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Stamp & Verification */}
          <div className="mt-8 pt-6 border-t border-slate-200 flex justify-between items-end text-xs text-slate-500">
            <div>
              <div className="font-semibold text-slate-700">HEPNA MART Fulfillment Center</div>
              <div className="text-[10px] text-slate-400">Electronic E-Way Verified Document</div>
            </div>

            <div className="text-right">
              <div className="font-heading font-bold text-slate-800">For HEPNA MART SUPPLIES</div>
              <div className="text-[11px] text-slate-500 mt-6">Authorized Logistics Signatory</div>
            </div>
          </div>
        </div>

        {/* Modal Footer (Hidden on print) */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Official GST Compliant Electronic Invoice</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button variant="primary" size="sm" onClick={handlePrint}>
              <Printer className="w-4 h-4" />
              <span>Print Invoice</span>
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderInvoiceModal;
