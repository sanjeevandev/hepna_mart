import React from 'react';
import { Link } from 'react-router-dom';
import { Offer } from '@/types';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

interface OfferCardProps {
  offer: Offer;
}

const OfferCard: React.FC<OfferCardProps> = ({ offer }) => {
  // Map offer types to gradient colors
  const gradientMap: Record<string, string> = {
    deal: 'from-orange-500 to-red-500',
    combo: 'from-blue-600 to-cyan-500',
    bulk: 'from-purple-600 to-indigo-600',
    limited: 'from-red-600 to-pink-600',
    new: 'from-emerald-500 to-teal-500',
  };

  const gradient = gradientMap[offer.type] || 'from-primary to-primary-light';

  return (
    <Link to={`/offers`} className="block w-full h-full group">
      <div className={`relative h-full min-h-[220px] rounded-2xl overflow-hidden shadow-md group-hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-1 bg-gradient-to-br ${gradient}`}>
        {/* Background Image overlay if available */}
        {offer.image && (
          <div 
            className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-40 group-hover:opacity-50 transition-opacity duration-300"
            style={{ backgroundImage: `url(${offer.image})` }}
          ></div>
        )}
        
        {/* Content */}
        <div className="relative z-10 p-6 flex flex-col h-full text-white">
          <div className="flex justify-between items-start mb-4">
            {offer.badge && (
              <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-white/30">
                {offer.badge}
              </span>
            )}
            {offer.discount > 0 && (
              <div className="bg-white text-gray-900 font-bold px-3 py-1 rounded-full text-sm shadow-sm">
                {offer.discountType === 'percentage' ? `${offer.discount}% OFF` : `₹${offer.discount} OFF`}
              </div>
            )}
          </div>
          
          <h3 className="text-xl md:text-2xl font-bold font-heading mb-2 leading-tight">
            {offer.title}
          </h3>
          
          <p className="text-white/80 text-sm mb-6 line-clamp-2 max-w-[85%]">
            {offer.description}
          </p>
          
          <div className="mt-auto">
            <span className="inline-flex items-center gap-2 text-sm font-semibold bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
              Shop Now
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default OfferCard;
