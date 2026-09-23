import React from 'react';
import { offers } from '@/data/offers';
import OfferCard from '@/components/offer/OfferCard';
import ScrollReveal from '@/components/ui/ScrollReveal';

const DealsSection: React.FC = () => {
  if (!offers || offers.length === 0) return null;

  return (
    <section className="py-12 md:py-16 bg-surface-dark overflow-hidden">
      <div className="container-custom">
        <div className="flex items-center gap-3 mb-8 md:mb-10">
          <ScrollReveal
            baseOpacity={0.2}
            baseRotation={2}
            blurStrength={6}
            as="h2"
            containerClassName="m-0"
            textClassName="section-title text-primary-dark m-0"
          >
            HEPNA MART Deals
          </ScrollReveal>
          <span className="text-3xl" role="img" aria-label="fire">🔥</span>
        </div>
        
        <div className="flex overflow-x-auto gap-6 pb-6 snap-x custom-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          {offers.map((offer) => (
            <div key={offer.id} className="min-w-[300px] md:min-w-[400px] snap-start flex-shrink-0">
              <OfferCard offer={offer} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DealsSection;
