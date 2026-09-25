import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '@/store/cartStore';
import { useOrderStore } from '@/store/orderStore';
import { useProjectStore } from '@/store/projectStore';
import CheckoutSteps from '@/components/checkout/CheckoutSteps';
import AddressForm from '@/components/checkout/AddressForm';
import DeliveryMethod from '@/components/checkout/DeliveryMethod';
import PaymentMethod from '@/components/checkout/PaymentMethod';
import OrderConfirmation from '@/components/checkout/OrderConfirmation';
import OrderSummary from '@/components/cart/OrderSummary';
import { DeliveryAddress, Order } from '@/types';

const CheckoutPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [address, setAddress] = useState<DeliveryAddress | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState<string>('standard');
  const [paymentMethod, setPaymentMethod] = useState<string>('card');
  const [orderId, setOrderId] = useState<string>('');

  const { items, clearCart, getSubtotal, getTax, getDeliveryCharge, getTotal } = useCartStore();
  const { addOrder } = useOrderStore();
  const { projects, activeProjectId } = useProjectStore();
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

    const subtotal = getSubtotal();
    const tax = getTax();
    const deliveryCharge = getDeliveryCharge();
    const total = getTotal();

    const newOrderId = `HM-${Math.floor(10000 + Math.random() * 90000)}`;

    const currentProject = activeProjectId
      ? projects.find((p) => p.id === activeProjectId)
      : projects[0];

    const estDeliveryDate =
      address?.requiredDeliveryDate ||
      new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];

    const methodLabels: Record<string, string> = {
      card: 'Credit / Debit Card (Verified)',
      upi: 'UPI Instant Transfer (Verified)',
      netbanking: 'Net Banking (RTGS/NEFT)',
      cod: 'Cash on Site Offloading (COD)',
    };

    const newOrder: Order = {
      id: newOrderId,
      items: [...items],
      subtotal,
      discount: 0,
      deliveryCharge,
      tax,
      total,
      status: 'confirmed',
      date: new Date().toISOString(),
      estimatedDelivery: estDeliveryDate,
      deliveryWindow: '10:00 AM – 02:00 PM',
      projectId: currentProject?.id,
      projectName: address?.siteName || currentProject?.name,
      paymentMethod: methodLabels[method] || 'Online Payment',
      deliveryAddress: address || {
        id: 'addr-' + Date.now(),
        fullName: 'Patil Infrastructure',
        phone: '+91 98765 43210',
        addressLine1: 'Plot 104, Industrial Area Phase 1',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411045',
        isConstructionSite: true,
        siteType: 'Residential Project',
        deliveryPreference: 'Standard Commercial Vehicle',
      },
      statusHistory: [
        {
          status: 'confirmed',
          title: 'Order Confirmed',
          description: 'Payment authorized and material allocation confirmed with fulfillment depot.',
          timestamp: new Date().toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          completed: true,
          active: true,
        },
      ],
    };

    addOrder(newOrder);
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
              <AddressForm onSubmit={handleAddressSubmit} defaultAddress={address} />
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
