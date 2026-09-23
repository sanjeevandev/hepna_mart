import React from 'react';
import { Link } from 'react-router-dom';
import { offers } from '@/data/offers';
import OfferCard from '@/components/offer/OfferCard';

const DealsSection: React.FC = () => {
  if (!offers || offers.length === 0) return null;

  return (
    <section className="py-16 bg-surface-dark overflow-hidden">
      <div className="container-custom">
        <div className="flex items-center gap-3 mb-10">
          <h2 className="section-title text-primary-dark m-0">HEPNA MART Deals</h2>
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
