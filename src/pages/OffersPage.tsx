import React, { useEffect } from 'react';
import { offers } from '@/data/offers';
import { products } from '@/data/products';
import OfferCard from '@/components/offer/OfferCard';
import ProductGrid from '@/components/product/ProductGrid';
import { Tag } from 'lucide-react';

const OffersPage: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const newArrivals = products.slice(0, 4); // Mock new arrivals

  return (
    <div className="container-custom py-12">
      <div className="flex items-center gap-3 mb-8">
        <Tag size={32} className="text-accent" />
        <h1 className="text-3xl md:text-4xl font-heading font-bold text-primary">Special Offers & Deals</h1>
      </div>
      
      <p className="text-gray-600 mb-12 max-w-2xl text-lg">
        Maximize your project budget with our exclusive deals on top-quality construction materials. Limited time offers.
      </p>

      {/* Active Offers */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-2">Active Promotions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map(offer => (
            <OfferCard key={offer.id} offer={offer} />
          ))}
        </div>
      </section>

      {/* New Arrivals */}
      <section>
        <div className="flex justify-between items-center mb-6 border-b pb-2">
          <h2 className="text-2xl font-bold text-gray-900">New Arrivals (Introductory Pricing)</h2>
        </div>
        <ProductGrid products={newArrivals} />
      </section>
    </div>
  );
};

export default OffersPage;
