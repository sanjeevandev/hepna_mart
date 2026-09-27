import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCartStore } from '@/store/cartStore';
import { useOrderStore, mapBackendOrderToOrder } from '@/store/orderStore';
import { useProjectStore } from '@/store/projectStore';
import { useAuthStore } from '@/store/authStore';
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
    if (isSubmitting) return;
    setPaymentMethod(method);
    setIsSubmitting(true);

    const currentProject = activeProjectId
      ? projects.find((p) => p.id === activeProjectId)
      : projects[0];

    const estDeliveryDate =
      address?.requiredDeliveryDate ||
      new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];

    try {
      // 1. Ensure backend authentication token
      let token = getAuthToken();
      if (!token) {
        await useAuthStore.getState().ensureBackendToken();
        token = getAuthToken();
      }

      if (!token) {
        const guestEmail = address?.phone
          ? `customer_${address.phone.replace(/[^0-9]/g, '')}@hepnamart.com`
          : `guest_${Date.now()}@hepnamart.com`;
        const guestPass = 'CustomerPassword123!';

        const loggedIn = await useAuthStore.getState().loginWithBackend({ email: guestEmail, password: guestPass });
        if (!loggedIn) {
          await useAuthStore.getState().registerWithBackend({
            email: guestEmail,
            password: guestPass,
            first_name: address?.fullName?.split(' ')[0] || 'Customer',
            last_name: address?.fullName?.split(' ').slice(1).join(' ') || 'User',
            phone: address?.phone || '+91 98765 43210',
            account_type: 'individual',
          });
        }
        token = getAuthToken();
      }

      if (!token) {
        throw new Error('Authentication session could not be established. Please try logging in.');
      }

      // 2. Synchronize current cart items to backend cart
      const cartItems = useCartStore.getState().items;
      if (cartItems.length > 0) {
        try {
          await apiClient.cart.merge(
            cartItems.map((ci) => ({ product_id: ci.product.id, quantity: ci.quantity }))
          );
        } catch (syncErr) {
          console.warn('Cart sync warning before checkout:', syncErr);
        }
      }

      // 3. Build authoritative checkout payload
      const payload = {
        delivery_address: {
          full_name: address?.fullName || 'Customer',
          phone: address?.phone || '+91 98765 43210',
          address_line1: address?.addressLine1 || 'Main Site Road',
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

      // 4. Call real PostgreSQL checkout
      const res = await apiClient.orders.checkout(payload);
      if (!res.data) {
        throw new Error('Failed to create order on server.');
      }

      const backendOrder = res.data;
      const mappedOrder = mapBackendOrderToOrder(backendOrder);
      addOrder(mappedOrder);
      setOrderId(backendOrder.id);
      await clearCart();
      await useCartStore.getState().fetchCart().catch(() => {});

      // 5. Create authoritative Payment record in PostgreSQL
      try {
        await apiClient.payments.create({
          order_id: backendOrder.id,
          payment_method: method.toLowerCase(),
        });
      } catch (payErr: any) {
        console.warn('Payment record creation note:', payErr);
      }

      // 6. Navigation handling based on payment method
      const normMethod = method.toLowerCase().trim();
      if (normMethod === 'upi' || normMethod === 'online' || normMethod === 'card' || normMethod === 'netbanking') {
        toast.success('Order created! Please complete your payment.');
        navigate(`/payment/${backendOrder.id}`);
        return;
      }

      if (normMethod === 'cod') {
        toast.success('Order placed with Cash on Delivery!');
        setCurrentStep(4);
        window.scrollTo(0, 0);
        return;
      }

      navigate(`/payment/${backendOrder.id}`);
      return;
    } catch (err: any) {
      console.error('[Checkout] Checkout error:', err);
      toast.error(err.message || 'Failed to place order. Please check inventory stock.');
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
