import React, { ReactNode } from 'react';
import BorderGlow from '@/components/ui/BorderGlow';
import ScrollReveal from '@/components/ui/ScrollReveal';

export interface ProductSectionProps {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  backgroundColor?: string;
  dark?: boolean;
  withGlow?: boolean;
}

const ProductSection: React.FC<ProductSectionProps> = ({
  title,
  subtitle,
  action,
  children,
  className = '',
  backgroundColor,
  dark = false,
  withGlow = true,
}) => {
  const bg = backgroundColor || (dark ? '#0F2440' : '#FFFFFF');
  const glowColor = dark ? '24 95 65' : '24 85 55';

  return (
    <section className={`w-full py-4 ${className}`}>
      {(title || subtitle || action) && (
        <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            {title && (
              <ScrollReveal
                baseOpacity={0.2}
                baseRotation={2}
                blurStrength={6}
                as="h2"
                containerClassName="mb-1"
                textClassName={`text-2xl sm:text-3xl font-bold font-heading ${dark ? 'text-white' : 'text-primary'}`}
              >
                {title}
              </ScrollReveal>
            )}
            {subtitle && (
              <p className={`text-sm sm:text-base mt-1 ${dark ? 'text-gray-300' : 'text-gray-500'}`}>
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}

      {withGlow ? (
        <BorderGlow
          edgeSensitivity={28}
          glowColor={glowColor}
          backgroundColor={bg}
          borderRadius={24}
          glowRadius={36}
          glowIntensity={0.85}
          coneSpread={30}
          animated={false}
          colors={['#E87A2D', '#1B3A5C', '#F5A623', '#2A5A8C']}
          className="p-5 sm:p-7 shadow-sm transition-all"
        >
          {children}
        </BorderGlow>
      ) : (
        <div className={`p-5 sm:p-7 rounded-3xl ${dark ? 'bg-primary-dark text-white' : 'bg-white'} shadow-sm border border-gray-100`}>
          {children}
        </div>
      )}
    </section>
  );
};

export default ProductSection;
