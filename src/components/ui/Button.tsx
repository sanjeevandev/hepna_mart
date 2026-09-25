import React, { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'dark' | 'outline' | 'outline-white' | 'ghost' | 'ghost-white' | 'danger' | 'outline-danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      fullWidth,
      className = '',
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 select-none hover:-translate-y-[1px] active:translate-y-0 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none disabled:hover:translate-y-0';

    const variantClasses = {
      primary: 'bg-accent hover:bg-accent-dark active:bg-[#BA6224] text-white focus-visible:ring-accent focus-visible:ring-offset-white',
      secondary: 'bg-primary hover:bg-primary-light active:bg-primary-dark text-white focus-visible:ring-primary focus-visible:ring-offset-white',
      dark: 'bg-[#071A2B] hover:bg-[#0B2742] active:bg-[#041321] text-white focus-visible:ring-[#071A2B] focus-visible:ring-offset-white',
      outline: 'border-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-white active:bg-primary-dark active:text-white focus-visible:ring-primary focus-visible:ring-offset-white',
      'outline-white': 'border border-white/40 bg-white/5 text-white hover:bg-white hover:text-[#071A2B] active:bg-white/90 active:text-[#071A2B] backdrop-blur-md focus-visible:ring-white focus-visible:ring-offset-[#071A2B]',
      ghost: 'bg-transparent hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200 text-gray-700 focus-visible:ring-gray-400 focus-visible:ring-offset-white',
      'ghost-white': 'bg-transparent hover:bg-white/15 hover:text-white active:bg-white/25 text-white/90 focus-visible:ring-white focus-visible:ring-offset-[#071A2B]',
      danger: 'bg-danger hover:bg-red-600 active:bg-red-700 text-white focus-visible:ring-danger focus-visible:ring-offset-white',
      'outline-danger': 'border-2 border-danger text-danger bg-transparent hover:bg-danger hover:text-white active:bg-red-700 active:text-white focus-visible:ring-danger focus-visible:ring-offset-white',
    };

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-xs sm:text-sm',
      md: 'px-4 py-2 text-sm sm:text-base',
      lg: 'px-6 py-3 text-base sm:text-lg',
    };

    const classes = `
      ${baseClasses}
      ${variantClasses[variant] || variantClasses.primary}
      ${sizeClasses[size] || sizeClasses.md}
      ${fullWidth ? 'w-full' : ''}
      ${className}
    `;

    return (
      <button
        ref={ref}
        className={classes.trim()}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {!loading && icon && <span className="mr-2 inline-flex items-center">{icon}</span>}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
