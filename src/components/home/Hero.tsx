import React from 'react';
import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button';
import { Box, Truck, Tag } from 'lucide-react';

const Hero: React.FC = () => {
  return (
    <div className="relative min-h-[500px] md:h-[600px] flex items-center bg-cover bg-center overflow-hidden" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1541888086225-ee5315b8823f?q=80&w=2070&auto=format&fit=crop")' }}>
      <div className="absolute inset-0 bg-gradient-to-r from-primary-dark/90 via-primary-dark/70 to-primary/40"></div>
      
      <div className="container-custom relative z-10 text-white py-16 md:py-24">
        <div className="max-w-3xl">
          <div className="inline-block px-4 py-1.5 mb-6 rounded-full bg-accent/20 border border-accent text-accent-light text-sm font-semibold tracking-wide backdrop-blur-sm shadow-sm">
            India's #1 Construction Marketplace
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading mb-6 leading-tight">
            Build Better. <span className="text-accent">Buy Smarter.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-200 mb-10 max-w-2xl leading-relaxed">
            Construction materials, tools and building essentials delivered directly to your site. Professional grade products at wholesale prices.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <Link to="/shop">
              <Button variant="primary" size="lg" className="w-full sm:w-auto text-lg px-8 shadow-lg shadow-accent/30">
                Shop Now
              </Button>
            </Link>
            <Link to="/categories">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 border-white text-white hover:bg-white hover:text-primary-dark backdrop-blur-sm">
                Explore Categories
              </Button>
            </Link>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 pt-8 border-t border-white/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
                <Box className="w-5 h-5 text-accent" />
              </div>
              <span className="font-medium text-sm md:text-base">10,000+ Products</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
                <Truck className="w-5 h-5 text-accent" />
              </div>
              <span className="font-medium text-sm md:text-base">Free Delivery Above ₹5,000</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
                <Tag className="w-5 h-5 text-accent" />
              </div>
              <span className="font-medium text-sm md:text-base">Bulk Discounts Available</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
