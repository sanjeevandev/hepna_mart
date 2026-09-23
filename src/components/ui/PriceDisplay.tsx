import React from 'react';
import { formatPrice } from '@/utils/formatPrice';

interface PriceDisplayProps {
  price: number;
  mrp: number;
  discount: number;
  unit: string;
  size?: 'sm' | 'md' | 'lg';
  showUnit?: boolean;
  className?: string;
}

const PriceDisplay: React.FC<PriceDisplayProps> = ({
  price,
  mrp,
  discount,
  unit,
  size = 'md',
  showUnit = true,
  className = '',
}) => {
  const sizeClasses = {
    sm: {
      price: 'text-lg',
      mrp: 'text-xs',
      discount: 'text-xs',
      unit: 'text-xs',
    },
    md: {
      price: 'text-xl',
      mrp: 'text-sm',
      discount: 'text-sm',
      unit: 'text-sm',
    },
    lg: {
      price: 'text-2xl md:text-3xl',
      mrp: 'text-base',
      discount: 'text-base',
      unit: 'text-base',
    },
  };

  const classes = sizeClasses[size];

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-baseline flex-wrap gap-2">
        <span className={`font-heading font-bold text-accent ${classes.price}`}>
          {formatPrice(price)}
        </span>
        
        {showUnit && (
          <span className={`text-gray-500 font-medium ${classes.unit}`}>
            / {unit}
          </span>
        )}
      </div>

      {discount > 0 && (
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-gray-400 line-through ${classes.mrp}`}>
            {formatPrice(mrp)}
          </span>
          <span className={`text-success font-semibold ${classes.discount}`}>
            {discount}% OFF
          </span>
        </div>
      )}
    </div>
  );
};

export default PriceDisplay;
