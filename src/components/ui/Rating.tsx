import React from 'react';
import { Star } from 'lucide-react';

interface RatingProps {
  rating: number;
  reviews?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
}

const Rating: React.FC<RatingProps> = ({
  rating,
  reviews = 0,
  size = 'md',
  showCount = false,
}) => {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const starSize = sizeClasses[size];

  // Helper function to determine star fill
  const renderStar = (index: number) => {
    const value = index + 1;
    const isFull = rating >= value;
    const isHalf = rating >= value - 0.5 && rating < value;
    
    if (isFull) {
      return <Star key={index} className={`${starSize} text-accent-light fill-accent-light`} />;
    } else if (isHalf) {
      return (
        <div key={index} className="relative">
          <Star className={`${starSize} text-gray-300`} />
          <div className="absolute top-0 left-0 overflow-hidden w-1/2">
            <Star className={`${starSize} text-accent-light fill-accent-light`} />
          </div>
        </div>
      );
    } else {
      return <Star key={index} className={`${starSize} text-gray-300`} />;
    }
  };

  return (
    <div className="flex items-center">
      <div className="flex items-center space-x-0.5">
        {[...Array(5)].map((_, i) => renderStar(i))}
      </div>
      
      {showCount && (
        <span className={`ml-2 text-gray-500 ${size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'}`}>
          ({reviews} {reviews === 1 ? 'review' : 'reviews'})
        </span>
      )}
    </div>
  );
};

export default Rating;
