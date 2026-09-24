import React, { useEffect, useRef, useState, ReactNode } from 'react';
import './SectionMotion.css';

export type SectionMotionVariant = 'up' | 'left' | 'right' | 'scale' | 'fade' | 'product' | 'hero';

export interface SectionMotionProps {
  children: ReactNode;
  className?: string;
  variant?: SectionMotionVariant;
  threshold?: number;
  rootMargin?: string;
  delay?: number;
  as?: keyof JSX.IntrinsicElements;
}

const SectionMotion: React.FC<SectionMotionProps> = ({
  children,
  className = '',
  variant = 'up',
  threshold = 0.15,
  rootMargin = '0px 0px -40px 0px',
  delay = 0,
  as: Component = 'div',
}) => {
  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Respect user's accessibility preferences
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (delay > 0) {
            setTimeout(() => setIsVisible(true), delay);
          } else {
            setIsVisible(true);
          }
          observer.unobserve(element);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, delay]);

  const variantClass = `section-motion--${variant}`;

  return (
    // @ts-expect-error dynamic component
    <Component
      ref={ref}
      className={`section-motion ${variantClass} ${isVisible ? 'is-visible' : ''} ${className}`.trim()}
    >
      {children}
    </Component>
  );
};

export default SectionMotion;
