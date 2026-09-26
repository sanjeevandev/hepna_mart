import React, { useEffect, useState } from 'react';
import { offers } from '@/data/offers';
import { catalogService } from '@/services/catalogService';
import { Product } from '@/types';
import OfferCard from '@/components/offer/OfferCard';
import ProductGrid from '@/components/product/ProductGrid';
import ScrollReveal from '@/components/ui/ScrollReveal';
import { Tag } from 'lucide-react';

const OffersPage: React.FC = () => {
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    let isMounted = true;
    catalogService.getProducts({ limit: 4, sort: 'newest' })
      .then((res) => {
        if (isMounted) {
          const prods = Array.isArray(res?.products) 
            ? res.products 
            : (Array.isArray(res?.items) ? res.items : []);
          setNewArrivals(prods);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load new arrivals:', err);
        if (isMounted) {
          setNewArrivals([]);
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="container-custom py-12">
      <div className="flex items-center gap-3 mb-4">
        <Tag size={32} className="text-accent" />
        <ScrollReveal
          baseOpacity={0.2}
          baseRotation={2}
          blurStrength={6}
          as="h1"
          containerClassName="m-0"
          textClassName="text-3xl md:text-4xl font-heading font-bold text-primary"
        >
          Special Offers & Deals
        </ScrollReveal>
      </div>
      
      <p className="text-gray-600 mb-12 max-w-2xl text-lg">
        Maximize your project budget with our exclusive deals on top-quality construction materials. Limited time offers.
      </p>

      {/* Active Offers */}
      <section className="mb-16">
        <ScrollReveal
          baseOpacity={0.2}
          baseRotation={2}
          blurStrength={6}
          as="h2"
          containerClassName="mb-6 border-b pb-2"
          textClassName="text-2xl font-bold text-gray-900"
        >
          Active Promotions
        </ScrollReveal>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map(offer => (
            <OfferCard key={offer.id} offer={offer} />
          ))}
        </div>
      </section>

      {/* New Arrivals */}
      <section>
        <div className="flex justify-between items-center mb-6 border-b pb-2">
          <ScrollReveal
            baseOpacity={0.2}
            baseRotation={2}
            blurStrength={6}
            as="h2"
            containerClassName="m-0"
            textClassName="text-2xl font-bold text-gray-900"
          >
            New Arrivals (Introductory Pricing)
          </ScrollReveal>
        </div>
        <ProductGrid products={newArrivals} />
      </section>
    </div>
  );
};

export default OffersPage;
