import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '@/store/cartStore';
import CheckoutSteps from '@/components/checkout/CheckoutSteps';
import AddressForm from '@/components/checkout/AddressForm';
import DeliveryMethod from '@/components/checkout/DeliveryMethod';
import PaymentMethod from '@/components/checkout/PaymentMethod';
import OrderConfirmation from '@/components/checkout/OrderConfirmation';
import OrderSummary from '@/components/cart/OrderSummary';
import { DeliveryAddress } from '@/types';

const CheckoutPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [address, setAddress] = useState<DeliveryAddress | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState<string>('standard');
  const [paymentMethod, setPaymentMethod] = useState<string>('card');
  const [orderId, setOrderId] = useState<string>('');
  
  const { items, clearCart } = useCartStore();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    if (items.length === 0 && currentStep !== 4) {
      navigate('/cart');
    }
  }, [items.length, currentStep, navigate]);

  const handleAddressSubmit = (addr: DeliveryAddress) => {
    setAddress(addr);
    setCurrentStep(2);
    window.scrollTo(0, 0);
  };

  const handleDeliverySubmit = (method: string) => {
    setDeliveryMethod(method);
    setCurrentStep(3);
    window.scrollTo(0, 0);
  };

  const handlePaymentSubmit = (method: string) => {
    setPaymentMethod(method);
    // Simulate order placement
    const newOrderId = `ORD-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
    setOrderId(newOrderId);
    clearCart();
    setCurrentStep(4);
    window.scrollTo(0, 0);
  };

  if (currentStep === 4) {
    return (
      <div className="container-custom py-12 max-w-4xl">
        <OrderConfirmation orderId={orderId} />
      </div>
    );
  }

  return (
    <div className="container-custom py-12">
      <div className="max-w-4xl mx-auto mb-12">
        <CheckoutSteps currentStep={currentStep} />
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-2/3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
            {currentStep === 1 && (
              <AddressForm 
                onSubmit={handleAddressSubmit} 
                defaultAddress={address} 
              />
            )}
            
            {currentStep === 2 && (
              <DeliveryMethod 
                onNext={handleDeliverySubmit} 
                onBack={() => setCurrentStep(1)} 
                defaultMethod={deliveryMethod}
              />
            )}
            
            {currentStep === 3 && (
              <PaymentMethod 
                onNext={handlePaymentSubmit} 
                onBack={() => setCurrentStep(2)} 
                defaultMethod={paymentMethod}
              />
            )}
          </div>
        </div>

        <aside className="w-full lg:w-1/3">
          <div className="sticky top-24">
            <OrderSummary hideCheckoutButton />
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CheckoutPage;
