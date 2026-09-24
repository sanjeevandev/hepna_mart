import React, { ReactNode } from 'react';
import BorderGlow from '@/components/ui/BorderGlow';
import ScrollReveal from '@/components/ui/ScrollReveal';

export interface ProductSectionProps {
  eyebrow?: string;
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
  eyebrow,
  title,
  subtitle,
  action,
  children,
  className = '',
  backgroundColor,
  dark = false,
  withGlow = true,
}) => {
  const bg = backgroundColor || (dark ? '#071D31' : '#FFFFFF');
  // Subdued, elegant construction orange & deep navy tones only (no neon)
  const glowColor = dark ? '24 80 50' : '24 70 45';

  return (
    <section className={`w-full ${className}`}>
      {(eyebrow || title || subtitle || action) && (
        <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            {eyebrow && (
              <span className="text-xs sm:text-sm font-bold tracking-widest uppercase text-accent mb-2 block">
                {eyebrow}
              </span>
            )}
            {title && (
              <ScrollReveal
                baseOpacity={0.1}
                baseRotation={0}
                blurStrength={6}
                as="h2"
                containerClassName="mb-1"
                textClassName={`text-2xl sm:text-3xl lg:text-4xl font-extrabold font-heading tracking-tight ${
                  dark ? 'text-white' : 'text-primary-dark'
                }`}
              >
                {title}
              </ScrollReveal>
            )}
            {subtitle && (
              <p className={`text-sm sm:text-base mt-2 max-w-2xl leading-relaxed ${
                dark ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}

      {withGlow ? (
        <BorderGlow
          edgeSensitivity={20}
          glowColor={glowColor}
          backgroundColor={bg}
          borderRadius={24}
          glowRadius={28}
          glowIntensity={0.5}
          coneSpread={24}
          animated={false}
          colors={['#E87A2D', '#1B3A5C', '#2A5A8C']}
          className="p-4 sm:p-6 lg:p-8 shadow-sm transition-all rounded-3xl"
        >
          {children}
        </BorderGlow>
      ) : (
        <div className={`p-4 sm:p-6 lg:p-8 rounded-3xl ${dark ? 'bg-[#071D31] text-white' : 'bg-white'} shadow-sm border border-gray-100`}>
          {children}
        </div>
      )}
    </section>
  );
};

export default ProductSection;
