import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface QuantitySelectorProps {
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md';
}

const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  quantity,
  onQuantityChange,
  min = 1,
  max = 99,
  size = 'md',
}) => {
  const handleDecrease = () => {
    if (quantity > min) {
      onQuantityChange(quantity - 1);
    }
  };

  const handleIncrease = () => {
    if (quantity < max) {
      onQuantityChange(quantity + 1);
    }
  };

  const sizeClasses = {
    sm: 'h-8 text-sm',
    md: 'h-10 text-base',
  };

  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  const widthClass = size === 'sm' ? 'w-8' : 'w-10';

  return (
    <div className={`inline-flex items-center border border-gray-300 rounded-md bg-white ${sizeClasses[size]}`}>
      <button
        type="button"
        onClick={handleDecrease}
        disabled={quantity <= min}
        className={`${widthClass} h-full flex items-center justify-center text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-l-md`}
        aria-label="Decrease quantity"
      >
        <Minus className={iconSize} />
      </button>
      
      <div className={`${widthClass} h-full flex items-center justify-center font-medium text-gray-900 border-x border-gray-300`}>
        {quantity}
      </div>
      
      <button
        type="button"
        onClick={handleIncrease}
        disabled={quantity >= max}
        className={`${widthClass} h-full flex items-center justify-center text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-r-md`}
        aria-label="Increase quantity"
      >
        <Plus className={iconSize} />
      </button>
    </div>
  );
};

export default QuantitySelector;
