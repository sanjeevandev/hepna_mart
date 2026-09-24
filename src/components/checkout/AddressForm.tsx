import React, { useState } from 'react';
import { HardHat, Truck, Calendar, UserCheck, PhoneCall, AlertCircle, Building, CheckCircle2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { DeliveryAddress } from '@/types';

interface AddressFormProps {
  onSubmit: (address: DeliveryAddress) => void;
  initialAddress?: Partial<DeliveryAddress>;
}

const AddressForm: React.FC<AddressFormProps> = ({ onSubmit, initialAddress }) => {
  const [formData, setFormData] = useState<DeliveryAddress>({
    id: initialAddress?.id || 'addr-' + Date.now(),
    fullName: initialAddress?.fullName || '',
    phone: initialAddress?.phone || '',
    addressLine1: initialAddress?.addressLine1 || '',
    addressLine2: initialAddress?.addressLine2 || '',
    city: initialAddress?.city || '',
    state: initialAddress?.state || 'Maharashtra',
    pincode: initialAddress?.pincode || '',
    isConstructionSite: initialAddress?.isConstructionSite ?? true,
    siteName: initialAddress?.siteName || '',
    siteType: initialAddress?.siteType || 'Residential (House / Villa)',
    deliveryPreference: initialAddress?.deliveryPreference || 'Standard Commercial Truck',
    requiredDeliveryDate: initialAddress?.requiredDeliveryDate || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    siteContactPerson: initialAddress?.siteContactPerson || '',
    sitePhone: initialAddress?.sitePhone || '',
    deliveryInstructions: initialAddress?.deliveryInstructions || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div>
          <h3 className="font-heading font-bold text-xl text-[#071A2B]">Delivery & Site Details</h3>
          <p className="text-xs text-gray-500">Provide direct-to-site unloading location & contact</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200/60 rounded-full text-amber-800 text-xs font-semibold">
          <Truck className="w-3.5 h-3.5 text-accent" />
          <span>Direct Site Dispatch</span>
        </div>
      </div>

      {/* Primary Contact Information */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Primary Billing / Order Contact</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Billing Full Name *</label>
            <input
              required
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
              placeholder="e.g. Ramesh Patil / Patil Constructions"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Billing Phone Number *</label>
            <input
              required
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
              placeholder="+91 98765 43210"
            />
          </div>
        </div>
      </div>

      {/* Construction Site Delivery Special Section */}
      <div className="p-5 rounded-2xl border-2 border-accent/25 bg-orange-50/30 transition-all">
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            name="isConstructionSite"
            checked={formData.isConstructionSite}
            onChange={handleChange}
            className="w-5 h-5 mt-0.5 text-accent focus:ring-accent rounded border-gray-300 cursor-pointer accent-[#E87A2D]"
          />
          <div>
            <div className="flex items-center gap-2">
              <HardHat className="w-4 h-4 text-accent" />
              <span className="font-heading font-bold text-sm sm:text-base text-[#071A2B]">
                Deliver Directly to Active Construction Site
              </span>
              <span className="bg-accent/15 text-accent text-[10px] font-bold px-2 py-0.5 rounded">
                Recommended
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-0.5">
              Enable dedicated logistics for site vehicle clearance, gate pass coordination, and supervisor handoff.
            </p>
          </div>
        </label>

        {formData.isConstructionSite && (
          <div className="mt-5 pt-5 border-t border-accent/20 space-y-4 animate-in fade-in duration-200">
            {/* Site Name & Site Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Project / Site Name *
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    required={formData.isConstructionSite}
                    type="text"
                    name="siteName"
                    value={formData.siteName}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                    placeholder="e.g. Skyline Heights Phase 2, Plot #42"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Construction Site Type
                </label>
                <select
                  name="siteType"
                  value={formData.siteType}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                >
                  <option value="Residential (House / Villa)">Residential (House / Villa)</option>
                  <option value="Multi-Story Apartment / Highrise">Multi-Story Apartment / Highrise</option>
                  <option value="Commercial Complex / Mall">Commercial Complex / Mall</option>
                  <option value="Industrial / Warehouse / Factory">Industrial / Warehouse / Factory</option>
                  <option value="Infrastructure / Road / Bridge">Infrastructure / Road / Bridge</option>
                  <option value="Renovation / Interior Site">Renovation / Interior Site</option>
                </select>
              </div>
            </div>

            {/* Delivery Preferences & Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Site Vehicle / Unloading Preference
                </label>
                <div className="relative">
                  <Truck className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <select
                    name="deliveryPreference"
                    value={formData.deliveryPreference}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                  >
                    <option value="Standard Commercial Truck">Standard Commercial Truck (Eicher / 10-Wheel)</option>
                    <option value="Small Commercial Vehicle (Tata Ace / Mahindra Bolero)">Small Commercial Vehicle (Tata Ace / Bolero)</option>
                    <option value="Heavy Tipper / Dump Truck (Bulk Aggregates / Sand)">Heavy Tipper / Dump Truck</option>
                    <option value="Crane / Hydraulic Unloading Required">Hydraulic Unloading Assistance Required</option>
                    <option value="Express Same-Day Urgent Dispatch">Express Priority Dispatch</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Required Site Delivery Date *
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    required={formData.isConstructionSite}
                    type="date"
                    name="requiredDeliveryDate"
                    value={formData.requiredDeliveryDate}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                  />
                </div>
              </div>
            </div>

            {/* Site Supervisor / On-site Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  On-Site Supervisor / Engineer Name
                </label>
                <div className="relative">
                  <UserCheck className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    name="siteContactPerson"
                    value={formData.siteContactPerson}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                    placeholder="e.g. Anand Sharma (Site Incharge)"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  On-Site Contact Mobile Number
                </label>
                <div className="relative">
                  <PhoneCall className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    name="sitePhone"
                    value={formData.sitePhone}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                    placeholder="+91 91234 56789"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Address Fields */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
          {formData.isConstructionSite ? 'Site Physical Location & Landmark' : 'Delivery Address'}
        </h4>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Address / Plot / Survey No. *
            </label>
            <input
              required
              type="text"
              name="addressLine1"
              value={formData.addressLine1}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
              placeholder="Plot No. 42, Sector 18, Near Ring Road Junction"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Landmark / Access Road Details
            </label>
            <input
              type="text"
              name="addressLine2"
              value={formData.addressLine2}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
              placeholder="Opposite Indian Oil Pump, 100m inside Service Lane"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">City / District *</label>
              <input
                required
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
                placeholder="Pune / Mumbai"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">State *</label>
              <input
                required
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
                placeholder="Maharashtra"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Pincode *</label>
              <input
                required
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
                placeholder="411001"
              />
            </div>
          </div>

          {/* Delivery & Unloading Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Special Unloading / Gate Access Instructions
            </label>
            <textarea
              name="deliveryInstructions"
              value={formData.deliveryInstructions}
              onChange={handleChange}
              rows={3}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all resize-none"
              placeholder="E.g. Call supervisor 1 hour before arrival, wide entrance available on North gate, unloading space cleared near block A."
            />
          </div>
        </div>
      </div>

      {/* Trust reassurance */}
      <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex items-start gap-2.5 text-xs text-blue-900">
        <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <span>
          HEPNA logistics will verify site accessibility with the site supervisor prior to vehicle dispatch.
        </span>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-2">
        <Button type="submit" variant="primary" size="lg" className="w-full sm:w-auto px-8 shadow-md">
          Continue to Delivery Options
        </Button>
      </div>
    </form>
  );
};

export default AddressForm;
