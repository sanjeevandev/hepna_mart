import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import { Smartphone, CreditCard, Building, Wallet, ArrowLeft } from 'lucide-react';

interface PaymentMethodProps {
  onSelect?: (method: string) => void;
  onNext?: (method: string) => void;
  onBack?: () => void;
  selected?: string;
  defaultMethod?: string;
}

const PaymentMethod: React.FC<PaymentMethodProps> = ({ 
  onSelect, 
  onNext, 
  onBack, 
  selected, 
  defaultMethod = 'card' 
}) => {
  const [currentSelected, setCurrentSelected] = useState<string>(selected || defaultMethod);

  const methods = [
    { id: 'upi', title: 'UPI', desc: 'Google Pay, PhonePe, Paytm (Instant Verification)', icon: Smartphone },
    { id: 'card', title: 'Credit/Debit Card', desc: 'Visa, Mastercard, RuPay', icon: CreditCard },
    { id: 'netbanking', title: 'Net Banking', desc: 'All major Indian banks supported (RTGS/NEFT)', icon: Building },
    { id: 'cod', title: 'Cash on Delivery', desc: 'Pay when you receive the order (Available for orders under ₹50,000)', icon: Wallet },
  ];

  const handleSelect = (id: string) => {
    setCurrentSelected(id);
    onSelect?.(id);
  };

  const handleContinue = () => {
    if (onNext) {
      onNext(currentSelected);
    } else if (onSelect) {
      onSelect(currentSelected);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="font-heading font-semibold text-lg text-primary-dark mb-6">Payment Method</h3>
      
      <div className="space-y-4 mb-8">
        {methods.map((method) => {
          const isSelected = currentSelected === method.id;
          return (
            <label 
              key={method.id} 
              className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                isSelected ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/30'
              }`}
              onClick={() => handleSelect(method.id)}
            >
              <div className="pt-1">
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  value={method.id} 
                  checked={isSelected} 
                  onChange={() => handleSelect(method.id)} 
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

      <div className="flex items-center justify-between pt-2">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-gray-600 hover:text-primary-dark hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Delivery
          </button>
        ) : <div />}
        <Button 
          variant="primary" 
          size="lg" 
          disabled={!currentSelected}
          onClick={handleContinue}
          className="px-8"
        >
          Place Order
        </Button>
      </div>
    </div>
  );
};

export default PaymentMethod;

