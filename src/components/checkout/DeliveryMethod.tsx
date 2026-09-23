import React from 'react';
import Button from '@/components/ui/Button';
import { Truck, Zap, HardHat } from 'lucide-react';

interface DeliveryMethodProps {
  onSelect: (method: string) => void;
  selected?: string;
}

const DeliveryMethod: React.FC<DeliveryMethodProps> = ({ onSelect, selected }) => {
  const methods = [
    { id: 'standard', title: 'Standard Delivery', desc: '5-7 business days', price: 'Free above ₹5,000', icon: Truck },
    { id: 'express', title: 'Express Delivery', desc: '2-3 business days', price: '₹499', icon: Zap },
    { id: 'site', title: 'Construction Site Delivery', desc: '3-5 business days. Includes proper unloading coordination.', price: '₹299', icon: HardHat },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="font-heading font-semibold text-lg text-primary-dark mb-6">Choose Delivery Method</h3>
      
      <div className="space-y-4 mb-8">
        {methods.map((method) => {
          const isSelected = selected === method.id;
          return (
            <label 
              key={method.id} 
              className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                isSelected ? 'border-accent bg-accent/5' : 'border-gray-200 hover:border-accent/30'
              }`}
              onClick={() => onSelect(method.id)}
            >
              <div className="pt-1">
                <input 
                  type="radio" 
                  name="deliveryMethod" 
                  value={method.id} 
                  checked={isSelected} 
                  onChange={() => {}} 
                  className="w-5 h-5 text-accent focus:ring-accent"
                />
              </div>
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white flex items-center justify-center border border-gray-100">
                <method.icon className={`w-5 h-5 ${isSelected ? 'text-accent' : 'text-gray-400'}`} />
              </div>
              <div className="flex-grow">
                <div className="flex justify-between items-center mb-1">
                  <h4 className={`font-semibold ${isSelected ? 'text-primary-dark' : 'text-gray-700'}`}>{method.title}</h4>
                  <span className="font-semibold text-accent">{method.price}</span>
                </div>
                <p className="text-sm text-gray-500">{method.desc}</p>
              </div>
            </label>
          );
        })}
      </div>

      <div className="flex justify-end">
        <Button 
          variant="primary" 
          size="lg" 
          disabled={!selected}
          onClick={() => onSelect(selected || methods[0].id)}
        >
          Continue to Payment
        </Button>
      </div>
    </div>
  );
};

export default DeliveryMethod;
