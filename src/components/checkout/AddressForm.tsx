import React, { useState } from 'react';
import Button from '@/components/ui/Button';

export interface DeliveryAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  isConstructionSite: boolean;
  siteContactPerson?: string;
  sitePhone?: string;
  deliveryInstructions?: string;
}

interface AddressFormProps {
  onSubmit: (address: DeliveryAddress) => void;
  initialAddress?: DeliveryAddress;
}

const AddressForm: React.FC<AddressFormProps> = ({ onSubmit, initialAddress }) => {
  const [formData, setFormData] = useState<DeliveryAddress>(initialAddress || {
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    isConstructionSite: false,
    siteContactPerson: '',
    sitePhone: '',
    deliveryInstructions: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="font-heading font-semibold text-lg text-primary-dark mb-6">Delivery Address</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
          <input required type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="input-field w-full" placeholder="John Doe" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
          <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} className="input-field w-full" placeholder="+91 98765 43210" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1 *</label>
          <input required type="text" name="addressLine1" value={formData.addressLine1} onChange={handleChange} className="input-field w-full" placeholder="Flat, House no., Building, Company, Apartment" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
          <input type="text" name="addressLine2" value={formData.addressLine2} onChange={handleChange} className="input-field w-full" placeholder="Area, Street, Sector, Village" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
          <input required type="text" name="city" value={formData.city} onChange={handleChange} className="input-field w-full" placeholder="Mumbai" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
          <input required type="text" name="state" value={formData.state} onChange={handleChange} className="input-field w-full" placeholder="Maharashtra" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
          <input required type="text" name="pincode" value={formData.pincode} onChange={handleChange} className="input-field w-full" placeholder="400001" />
        </div>
      </div>

      <div className="mb-6 p-4 bg-surface rounded-lg border border-gray-100">
        <label className="flex items-center gap-3 cursor-pointer mb-4">
          <input 
            type="checkbox" 
            name="isConstructionSite" 
            checked={formData.isConstructionSite} 
            onChange={handleChange} 
            className="w-5 h-5 text-accent focus:ring-accent rounded border-gray-300"
          />
          <span className="font-semibold text-primary-dark">Deliver to Construction Site</span>
        </label>
        
        {formData.isConstructionSite && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-200 pt-4 mt-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Site Contact Person</label>
              <input type="text" name="siteContactPerson" value={formData.siteContactPerson} onChange={handleChange} className="input-field w-full" placeholder="Site Manager Name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Site Phone</label>
              <input type="tel" name="sitePhone" value={formData.sitePhone} onChange={handleChange} className="input-field w-full" placeholder="Manager Phone" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Instructions</label>
              <textarea 
                name="deliveryInstructions" 
                value={formData.deliveryInstructions} 
                onChange={handleChange} 
                className="input-field w-full h-24 resize-none" 
                placeholder="E.g., Call before reaching, vehicle size restrictions, unloading preferences"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button type="submit" variant="primary" size="lg">
          Continue to Delivery
        </Button>
      </div>
    </form>
  );
};

export default AddressForm;
