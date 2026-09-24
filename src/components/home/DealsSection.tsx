import React from 'react';
import { offers } from '@/data/offers';
import OfferCard from '@/components/offer/OfferCard';
import ScrollReveal from '@/components/ui/ScrollReveal';
import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button';
import { ArrowRight, Flame } from 'lucide-react';

const DealsSection: React.FC = () => {
  if (!offers || offers.length === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-[#F5F5F3] overflow-hidden border-y border-gray-200/60">
      <div className="container-custom">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 md:mb-12 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-4 h-4 text-accent fill-accent" />
              <span className="text-xs sm:text-sm font-bold tracking-widest uppercase text-accent">
                LIMITED-TIME SAVINGS
              </span>
            </div>
            <ScrollReveal
              baseOpacity={0.15}
              baseRotation={0}
              blurStrength={6}
              as="h2"
              containerClassName="mb-1"
              textClassName="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-heading text-primary-dark tracking-tight"
            >
              Exclusive Site Deals
            </ScrollReveal>
            <p className="text-sm sm:text-base text-gray-600 mt-2 max-w-2xl leading-relaxed">
              Curated contractor packages, volume purchase discounts, and manufacturer rebates on high-volume materials.
            </p>
          </div>

          <Link to="/offers" className="hidden md:inline-flex group">
            <Button variant="outline" size="sm" className="items-center gap-1.5 border-primary/20 text-primary hover:bg-primary hover:text-white transition-all hover-lift">
              <span>View All Offers</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.slice(0, 3).map((offer) => (
            <div key={offer.id} className="h-full">
              <OfferCard offer={offer} />
            </div>
          ))}
        </div>

        <div className="mt-8 text-center md:hidden">
          <Link to="/offers" className="block">
            <Button variant="outline" fullWidth className="flex items-center justify-center gap-2">
              <span>View All Offers</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default DealsSection;
