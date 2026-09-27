import React from 'react';
import { Check } from 'lucide-react';

export const DEFAULT_CHECKOUT_STEPS = ['Delivery Address', 'Delivery Method', 'Payment'];

interface CheckoutStepsProps {
  currentStep: number;
  steps?: string[];
}

const CheckoutSteps: React.FC<CheckoutStepsProps> = ({ currentStep, steps = DEFAULT_CHECKOUT_STEPS }) => {
  const stepsList = steps && steps.length > 0 ? steps : DEFAULT_CHECKOUT_STEPS;
  const totalSteps = stepsList.length;
  const progressPercent = totalSteps > 1 
    ? Math.min(100, Math.max(0, ((currentStep - 1) / (totalSteps - 1)) * 100)) 
    : 100;

  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between relative">
        {/* Connecting Line background */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 z-0 hidden sm:block"></div>
        {/* Active Line */}
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-accent z-0 transition-all duration-500 hidden sm:block" 
          style={{ width: `${progressPercent}%` }}
        ></div>

        {stepsList.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isActive = stepNumber === currentStep;
          const isFuture = stepNumber > currentStep;

          return (
            <div key={step} className="relative z-10 flex flex-col items-center gap-2">
              <div 
                className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-semibold text-sm md:text-base border-2 transition-colors duration-300
                  ${isCompleted ? 'bg-success border-success text-white' : ''}
                  ${isActive ? 'bg-accent border-accent text-white shadow-md shadow-accent/30' : ''}
                  ${isFuture ? 'bg-white border-gray-300 text-gray-400' : ''}
                `}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : stepNumber}
              </div>
              <span 
                className={`text-xs md:text-sm font-medium transition-colors duration-300
                  ${isActive ? 'text-primary-dark font-bold' : 'text-gray-500'}
                `}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CheckoutSteps;

