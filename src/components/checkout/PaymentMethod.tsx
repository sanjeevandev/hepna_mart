import React from 'react';
import Button from '@/components/ui/Button';
import { Smartphone, CreditCard, Building, Wallet } from 'lucide-react';

interface PaymentMethodProps {
  onSelect: (method: string) => void;
  selected?: string;
}

const PaymentMethod: React.FC<PaymentMethodProps> = ({ onSelect, selected }) => {
  const methods = [
    { id: 'upi', title: 'UPI', desc: 'Google Pay, PhonePe, Paytm', icon: Smartphone },
    { id: 'card', title: 'Credit/Debit Card', desc: 'Visa, Mastercard, RuPay', icon: CreditCard },
    { id: 'netbanking', title: 'Net Banking', desc: 'All major Indian banks supported', icon: Building },
    { id: 'cod', title: 'Cash on Delivery', desc: 'Pay when you receive the order (Available for orders under ₹50,000)', icon: Wallet },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="font-heading font-semibold text-lg text-primary-dark mb-6">Payment Method</h3>
      
      <div className="space-y-4 mb-8">
        {methods.map((method) => {
          const isSelected = selected === method.id;
          return (
            <label 
              key={method.id} 
              className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                isSelected ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/30'
              }`}
              onClick={() => onSelect(method.id)}
            >
              <div className="pt-1">
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  value={method.id} 
                  checked={isSelected} 
                  onChange={() => {}} 
                  className="w-5 h-5 text-primary focus:ring-primary"
                />
              </div>
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white flex items-center justify-center border border-gray-100">
                <method.icon className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-gray-400'}`} />
              </div>
              <div>
                <h4 className={`font-semibold ${isSelected ? 'text-primary-dark' : 'text-gray-700'}`}>{method.title}</h4>
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
          className="px-8"
        >
          Place Order
        </Button>
      </div>
    </div>
  );
};

export default PaymentMethod;
