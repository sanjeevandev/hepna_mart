import React from 'react';

export type BadgeVariant = 'discount' | 'new' | 'featured' | 'outOfStock' | 'bulk' | 'limited';

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ variant, children, className = '' }) => {
  const baseClasses = 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider';
  
  const variantClasses = {
    discount: 'bg-success bg-opacity-10 text-success border border-success border-opacity-20',
    new: 'bg-accent bg-opacity-10 text-accent border border-accent border-opacity-20',
    featured: 'bg-primary bg-opacity-10 text-primary border border-primary border-opacity-20',
    outOfStock: 'bg-danger bg-opacity-10 text-danger border border-danger border-opacity-20',
    bulk: 'bg-purple-100 text-purple-800 border border-purple-200',
    limited: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  };

  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
