import React, { useEffect, useState } from 'react';
import { catalogService } from '@/services/catalogService';
import { Product } from '@/types';
import ProductGrid from '@/components/product/ProductGrid';
import ScrollReveal from '@/components/ui/ScrollReveal';
import SectionReveal from '@/components/ui/SectionReveal';
import { Wrench, Hammer, HardHat, Zap, Ruler } from 'lucide-react';

const ConstructionToolsPage: React.FC = () => {
  const [tools, setTools] = useState<Product[]>([]);

  useEffect(() => {
    window.scrollTo(0, 0);
    let isMounted = true;
    catalogService.getProducts({ limit: 100 })
      .then((res) => {
        if (isMounted) {
          const prods = Array.isArray(res?.products)
            ? res.products
            : (Array.isArray(res?.items) ? res.items : []);
          const filtered = prods.filter(
            p => p.category === 'construction-tools' || p.category === 'safety-equipment'
          );
          setTools(filtered);
        }
      })
      .catch((err) => {
        console.error('Failed to load tools:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const categories = [
    { name: 'Hand Tools', icon: Wrench },
    { name: 'Power Tools', icon: Zap },
    { name: 'Measuring', icon: Ruler },
    { name: 'Masonry', icon: Hammer },
    { name: 'Safety', icon: HardHat },
  ];

  return (
    <div className="bg-surface-dark pb-16 min-h-screen">
      {/* Dark Theme Hero */}
      <div className="bg-primary-dark text-white py-16">
        <div className="container-custom">
          <SectionReveal variant="hero">
            <div className="max-w-2xl">
              <ScrollReveal
                baseOpacity={0.2}
                baseRotation={2}
                blurStrength={6}
                as="h1"
                containerClassName="mb-4"
                textClassName="text-4xl md:text-5xl font-heading font-bold text-accent-light"
              >
                Professional Tools Marketplace
              </ScrollReveal>
              <p className="text-lg text-gray-300 mb-8 leading-relaxed">
                High-performance tools and safety equipment for serious contractors. Built tough for Indian construction sites.
              </p>
              <div className="flex flex-wrap gap-4">
                {categories.map((cat, idx) => {
                  const Icon = cat.icon;
                  return (
                    <button key={idx} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white px-4 py-2 rounded-full transition-colors border border-white/15 select-none">
                      <Icon size={16} className="text-accent" />
                      <span className="text-sm font-medium text-white">{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </SectionReveal>
        </div>
      </div>

      <div className="container-custom py-12">
        <SectionReveal variant="product">
          <div className="flex justify-between items-center mb-8">
            <ScrollReveal
              baseOpacity={0.2}
              baseRotation={2}
              blurStrength={6}
              as="h2"
              containerClassName="m-0"
              textClassName="text-2xl font-bold text-gray-900"
            >
              Featured Tools & Equipment
            </ScrollReveal>
            <span className="text-gray-600 font-medium">{tools.length} Products</span>
          </div>
          
          {tools.length > 0 ? (
            <ProductGrid products={tools} />
          ) : (
            <div className="text-center py-20 bg-white rounded-xl shadow-sm">
              <h2 className="text-xl font-bold text-gray-700">No tools found</h2>
              <p className="text-gray-500 mt-2">We are currently restocking our tools inventory.</p>
            </div>
          )}
        </SectionReveal>
      </div>
    </div>
  );
};

export default ConstructionToolsPage;
