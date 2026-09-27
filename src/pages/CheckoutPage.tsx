import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCartStore } from '@/store/cartStore';
import { useOrderStore, mapBackendOrderToOrder } from '@/store/orderStore';
import { useProjectStore } from '@/store/projectStore';
import { apiClient, getAuthToken } from '@/lib/api';
import CheckoutSteps, { DEFAULT_CHECKOUT_STEPS } from '@/components/checkout/CheckoutSteps';
import AddressForm from '@/components/checkout/AddressForm';
import DeliveryMethod from '@/components/checkout/DeliveryMethod';
import PaymentMethod from '@/components/checkout/PaymentMethod';
import OrderConfirmation from '@/components/checkout/OrderConfirmation';
import OrderSummary from '@/components/cart/OrderSummary';
import { DeliveryAddress, Order } from '@/types';
import { ShoppingBag, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const CheckoutPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [address, setAddress] = useState<DeliveryAddress | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState<string>('standard');
  const [paymentMethod, setPaymentMethod] = useState<string>('card');
  const [orderId, setOrderId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const { items, clearCart, getSubtotal, getTax, getDeliveryCharge, getTotal } = useCartStore();
  const { addOrder } = useOrderStore();
  const { projects, activeProjectId } = useProjectStore();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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

  const handlePaymentSubmit = async (method: string) => {
    setPaymentMethod(method);
    setIsSubmitting(true);

    const currentProject = activeProjectId
      ? projects.find((p) => p.id === activeProjectId)
      : projects[0];

    const estDeliveryDate =
      address?.requiredDeliveryDate ||
      new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];

    const token = getAuthToken();

    // 1. Try real PostgreSQL FastAPI Backend Checkout
    if (token) {
      try {
        const payload = {
          delivery_address: {
            full_name: address?.fullName || 'Customer',
            phone: address?.phone || '+91 98765 43210',
            address_line1: address?.addressLine1 || '',
            address_line2: address?.addressLine2 || '',
            city: address?.city || 'Pune',
            district: address?.city || 'Pune',
            state: address?.state || 'Maharashtra',
            pincode: address?.pincode || '411001',
            is_construction_site: address?.isConstructionSite ?? true,
            site_name: address?.siteName || '',
            site_type: address?.siteType || '',
            delivery_preference: address?.deliveryPreference || deliveryMethod,
            required_delivery_date: estDeliveryDate,
            site_contact_person: address?.siteContactPerson || '',
            site_phone: address?.sitePhone || '',
            delivery_instructions: address?.deliveryInstructions || '',
          },
          payment_method: method.toLowerCase(),
          project_id: currentProject?.id,
          project_name: address?.siteName || currentProject?.name,
          notes: address?.deliveryInstructions || '',
        };

        const res = await apiClient.orders.checkout(payload);
        if (res.data) {
          const mappedOrder = mapBackendOrderToOrder(res.data);
          addOrder(mappedOrder);
          setOrderId(mappedOrder.id);
          await useCartStore.getState().fetchCart();

          // Create payment record
          try {
            await apiClient.payments.create({
              order_id: mappedOrder.id,
              payment_method: method.toLowerCase(),
            });
          } catch {
            // Non-fatal
          }

          if (method.toLowerCase() === 'upi') {
            toast.success('Order placed! Please complete your UPI payment.');
            navigate(`/payment/${mappedOrder.id}`);
            return;
          }

          setCurrentStep(4);
          window.scrollTo(0, 0);
          return;
        }
      } catch (err: any) {
        console.error('[Checkout] Backend checkout error:', err);
        toast.error(err.message || 'Failed to place order on server. Please check inventory stock.');
        setIsSubmitting(false);
        return;
      } finally {
        setIsSubmitting(false);
      }
    }

    // 2. Offline / Guest local checkout simulation
    try {
      const subtotal = getSubtotal();
      const tax = getTax();
      const deliveryCharge = getDeliveryCharge();
      const total = getTotal();

      const newOrderId = `HEP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100000 + Math.random() * 900000)}`;

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
      await clearCart();
      setCurrentStep(4);
      window.scrollTo(0, 0);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0 && currentStep !== 4) {
    return (
      <div className="container-custom py-20 text-center max-w-md mx-auto">
        <div className="w-16 h-16 bg-orange-50 text-accent rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-100">
          <ShoppingBag className="w-8 h-8 text-accent" />
        </div>
        <h2 className="text-2xl font-heading font-bold text-primary-dark mb-2">Your Cart is Empty</h2>
        <p className="text-sm text-gray-500 mb-6">
          You do not have any materials in your cart to proceed with checkout.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/shop"
            className="w-full sm:w-auto px-6 py-2.5 bg-accent hover:bg-accent-dark text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
          >
            Browse Materials
          </Link>
          <Link
            to="/cart"
            className="w-full sm:w-auto px-6 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            View Cart
          </Link>
        </div>
      </div>
    );
  }

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
        <CheckoutSteps currentStep={currentStep} steps={DEFAULT_CHECKOUT_STEPS} />
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
              <div className="space-y-6">
                <PaymentMethod
                  onNext={handlePaymentSubmit}
                  onBack={() => setCurrentStep(2)}
                  defaultMethod={paymentMethod}
                />
                {isSubmitting && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center text-xs font-semibold text-amber-900 animate-pulse">
                    Processing your order securely with the fulfillment depot...
                  </div>
                )}
              </div>
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
