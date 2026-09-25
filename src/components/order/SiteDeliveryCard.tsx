import React from 'react';
import {
  HardHat,
  MapPin,
  User,
  Phone,
  Truck,
  Building2,
  Clock,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { DeliveryAddress } from '@/types';

interface SiteDeliveryCardProps {
  address: DeliveryAddress;
  projectName?: string;
  deliveryWindow?: string;
  estimatedDelivery?: string;
}

const SiteDeliveryCard: React.FC<SiteDeliveryCardProps> = ({
  address,
  projectName,
  deliveryWindow,
  estimatedDelivery,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-orange-50 text-accent flex items-center justify-center shrink-0 border border-orange-200/60">
            <HardHat className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-sm sm:text-base text-[#071A2B]">
              Construction Site Delivery
            </h3>
            <p className="text-[11px] text-slate-500">
              Direct-to-site offloading specification
            </p>
          </div>
        </div>

        {address.isConstructionSite && (
          <span className="text-[10px] font-extrabold uppercase tracking-wider bg-accent/10 text-accent px-2.5 py-1 rounded-full border border-accent/20">
            Active Job Site
          </span>
        )}
      </div>

      {/* Grid of Key Site Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        {/* Project Name */}
        {(projectName || address.siteName) && (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              <Building2 className="w-3.5 h-3.5 text-accent" />
              <span>Project / Site Name</span>
            </div>
            <div className="font-bold text-slate-900 text-xs sm:text-sm">
              {projectName || address.siteName}
            </div>
          </div>
        )}

        {/* Site Type */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            <Building2 className="w-3.5 h-3.5 text-accent" />
            <span>Site Classification</span>
          </div>
          <div className="font-bold text-slate-900 text-xs sm:text-sm">
            {address.siteType || 'Residential Construction'}
          </div>
        </div>

        {/* Site Supervisor Contact */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            <User className="w-3.5 h-3.5 text-accent" />
            <span>Site Supervisor / In-Charge</span>
          </div>
          <div className="font-bold text-slate-900">
            {address.siteContactPerson || address.fullName}
          </div>
          <div className="flex items-center gap-1 text-slate-600 mt-0.5">
            <Phone className="w-3 h-3 text-slate-400" />
            <span>{address.sitePhone || address.phone}</span>
          </div>
        </div>

        {/* Carrier Vehicle & Access */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            <Truck className="w-3.5 h-3.5 text-accent" />
            <span>Carrier Vehicle & Access</span>
          </div>
          <div className="font-bold text-slate-900">
            {address.deliveryPreference || 'Standard Commercial Heavy Vehicle'}
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
            Ground Level Direct Unloading
          </div>
        </div>
      </div>

      {/* Delivery Window & ETA */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-orange-50/60 border border-orange-200/60 text-xs">
        <Clock className="w-4 h-4 text-accent shrink-0" />
        <div className="flex-1">
          <span className="font-bold text-slate-900">Scheduled Delivery Slot: </span>
          <span className="text-slate-700">
            {deliveryWindow || '10:00 AM – 02:00 PM'} (Expected {estimatedDelivery || 'in 1-2 days'})
          </span>
        </div>
      </div>

      {/* Full Physical Site Address */}
      <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-accent shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-slate-900">
              {address.addressLine1}
            </div>
            {address.addressLine2 && <div>{address.addressLine2}</div>}
            <div>
              {address.city}, {address.state} — {address.pincode}
            </div>
          </div>
        </div>
      </div>

      {/* Gate & Access Instructions */}
      {address.deliveryInstructions && (
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <FileText className="w-3.5 h-3.5 text-accent" />
            <span>Gate & Offloading Instructions</span>
          </div>
          <p className="text-slate-700 italic">
            &ldquo;{address.deliveryInstructions}&rdquo;
          </p>
        </div>
      )}

      {/* Genuine Assurance */}
      <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span>Vehicle equipped with electronic weighbridge slip & certified test reports.</span>
      </div>
    </div>
  );
};

export default SiteDeliveryCard;
