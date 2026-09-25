import React from 'react';
import {
  CheckCircle2,
  Clock,
  Package,
  Truck,
  MapPin,
  Check,
  AlertCircle,
  Boxes,
  ClipboardCheck,
} from 'lucide-react';
import { Order, OrderStatus } from '@/types';

interface OrderStatusTimelineProps {
  order: Order;
}

const TIMELINE_STEPS = [
  {
    key: 'confirmed',
    label: 'Order Confirmed',
    description: 'Order placed & scheduled with inventory',
    icon: ClipboardCheck,
    progress: 15,
  },
  {
    key: 'processing',
    label: 'Materials Being Prepared',
    description: 'Batch quality testing & material staging',
    icon: Boxes,
    progress: 30,
  },
  {
    key: 'packed',
    label: 'Packed & Palletized',
    description: 'Waterproof pallet wrap applied for heavy transit',
    icon: Package,
    progress: 50,
  },
  {
    key: 'shipped',
    label: 'Dispatched from Warehouse',
    description: 'Loaded on commercial carrier with e-waybill',
    icon: Truck,
    progress: 70,
  },
  {
    key: 'out-for-delivery',
    label: 'Out for Delivery to Site',
    description: 'Vehicle en route with site offloading crew',
    icon: MapPin,
    progress: 85,
  },
  {
    key: 'delivered',
    label: 'Delivered & Offloaded',
    description: 'Delivery signed & challan acknowledged at site',
    icon: CheckCircle2,
    progress: 100,
  },
];

export const getStatusProgress = (status: OrderStatus): number => {
  switch (status) {
    case 'confirmed':
      return 15;
    case 'processing':
      return 30;
    case 'packed':
      return 50;
    case 'shipped':
      return 70;
    case 'out-for-delivery':
      return 85;
    case 'delivered':
      return 100;
    case 'cancelled':
      return 0;
    default:
      return 15;
  }
};

export const getStatusStepIndex = (status: OrderStatus): number => {
  switch (status) {
    case 'confirmed':
      return 0;
    case 'processing':
      return 1;
    case 'packed':
      return 2;
    case 'shipped':
      return 3;
    case 'out-for-delivery':
      return 4;
    case 'delivered':
      return 5;
    case 'cancelled':
      return -1;
    default:
      return 0;
  }
};

export const getStatusBadgeInfo = (status: OrderStatus) => {
  switch (status) {
    case 'confirmed':
      return {
        label: 'Order Confirmed',
        bg: 'bg-blue-50 text-blue-800 border-blue-200',
        dot: 'bg-blue-500',
      };
    case 'processing':
      return {
        label: 'Preparing Materials',
        bg: 'bg-amber-50 text-amber-800 border-amber-200',
        dot: 'bg-amber-500 animate-pulse',
      };
    case 'packed':
      return {
        label: 'Packed & Ready',
        bg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
        dot: 'bg-indigo-500',
      };
    case 'shipped':
      return {
        label: 'Dispatched',
        bg: 'bg-purple-50 text-purple-800 border-purple-200',
        dot: 'bg-purple-500',
      };
    case 'out-for-delivery':
      return {
        label: 'Out for Delivery',
        bg: 'bg-orange-50 text-orange-800 border-orange-200',
        dot: 'bg-accent animate-ping',
      };
    case 'delivered':
      return {
        label: 'Delivered',
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        dot: 'bg-emerald-600',
      };
    case 'cancelled':
      return {
        label: 'Cancelled',
        bg: 'bg-red-50 text-red-800 border-red-200',
        dot: 'bg-red-500',
      };
    default:
      return {
        label: status,
        bg: 'bg-gray-50 text-gray-800 border-gray-200',
        dot: 'bg-gray-500',
      };
  }
};

const OrderStatusTimeline: React.FC<OrderStatusTimelineProps> = ({ order }) => {
  const currentStepIndex = getStatusStepIndex(order.status);
  const progressPercent = getStatusProgress(order.status);
  const isCancelled = order.status === 'cancelled';

  if (isCancelled) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-base text-red-900">
                Order Cancelled
              </h3>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700">
                Cancelled
              </span>
            </div>
            <p className="text-xs sm:text-sm text-red-700">
              {order.cancellationReason || 'This order was cancelled and material allocation has been released.'}
            </p>
            {order.cancelledAt && (
              <p className="text-[11px] text-gray-500 pt-1">
                Cancelled on: {new Date(order.cancelledAt).toLocaleString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
      {/* Top Header & Progress Bar */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="font-heading font-bold text-sm sm:text-base text-[#071A2B]">
              Site Delivery Progress
            </span>
            <span className="text-xs font-extrabold text-accent bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200/60">
              {progressPercent}% Completed
            </span>
          </div>

          <div className="text-xs text-slate-500">
            {order.status === 'delivered' ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> All materials safely offloaded
              </span>
            ) : (
              <span>
                Estimated drop: <strong className="text-slate-900">{order.estimatedDelivery}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-700 ease-out rounded-full ${
              order.status === 'delivered'
                ? 'bg-emerald-500'
                : 'bg-gradient-to-r from-primary via-accent to-accent-light'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Vertical / Step Timeline */}
      <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-[15px] sm:before:left-[19px] before:top-2 before:bottom-3 before:w-[2px] before:bg-slate-200">
        {TIMELINE_STEPS.map((step, idx) => {
          const isCompleted = currentStepIndex > idx;
          const isActive = currentStepIndex === idx;
          const isUpcoming = currentStepIndex < idx;

          const historyItem = order.statusHistory?.find(
            (h) => h.status === step.key
          );

          const StepIcon = step.icon;

          return (
            <div key={step.key} className="relative flex items-start gap-3 sm:gap-4 group">
              {/* Step Marker Node */}
              <div
                className={`absolute -left-6 sm:-left-8 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 z-10 ${
                  isCompleted
                    ? 'bg-[#071A2B] text-white ring-4 ring-slate-100'
                    : isActive
                    ? 'bg-accent text-white ring-4 ring-orange-100 animate-pulse shadow-md shadow-accent/30'
                    : 'bg-slate-100 text-slate-400 border border-slate-200'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : (
                  <StepIcon className="w-4 h-4" />
                )}
              </div>

              {/* Step Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <h4
                    className={`font-heading text-xs sm:text-sm font-bold ${
                      isActive
                        ? 'text-accent'
                        : isCompleted
                        ? 'text-[#071A2B]'
                        : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </h4>

                  {historyItem?.timestamp && (
                    <span className="text-[11px] text-slate-400 font-medium">
                      {historyItem.timestamp}
                    </span>
                  )}
                </div>

                <p
                  className={`text-xs mt-0.5 leading-relaxed ${
                    isActive
                      ? 'text-slate-700 font-medium'
                      : isCompleted
                      ? 'text-slate-500'
                      : 'text-slate-400'
                  }`}
                >
                  {historyItem?.description || step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderStatusTimeline;
