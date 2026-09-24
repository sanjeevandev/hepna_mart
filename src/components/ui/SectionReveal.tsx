import React from 'react';
import SectionMotion, { SectionMotionProps, SectionMotionVariant } from './SectionMotion';

export interface SectionRevealProps extends Omit<SectionMotionProps, 'variant'> {
  variant?: 'standard' | 'product' | 'hero' | 'showcase' | SectionMotionVariant;
}

const SectionReveal: React.FC<SectionRevealProps> = ({ variant = 'standard', ...props }) => {
  let mappedVariant: SectionMotionVariant = 'up';
  if (variant === 'standard') mappedVariant = 'up';
  else if (variant === 'showcase') mappedVariant = 'scale';
  else mappedVariant = variant as SectionMotionVariant;

  return <SectionMotion variant={mappedVariant} {...props} />;
};

export default SectionReveal;
