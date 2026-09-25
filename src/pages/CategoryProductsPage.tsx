import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Category, Product } from '@/types';
import catalogService from '@/services/catalogService';
import ProductGrid from '@/components/product/ProductGrid';
import ProductFilters from '@/components/product/ProductFilters';
import SectionReveal from '@/components/ui/SectionReveal';
import ScrollReveal from '@/components/ui/ScrollReveal';
import { ChevronRight, Loader2 } from 'lucide-react';

const CategoryProductsPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const loadCategoryData = () => {
    if (!slug) return;
    setLoading(true);
    setError(null);

    Promise.all([
      catalogService.getCategoryBySlug(slug),
      catalogService.getProducts({ category: slug, page_size: 60 }),
    ])
      .then(([catData, prodData]) => {
        setCategory(catData);
        setProducts(prodData.products);
        setLoading(false);
      })
      .catch((err: any) => {
        setError(err.message || 'Unable to load category supplies. Please try again.');
        setLoading(false);
      });
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    loadCategoryData();
  }, [slug]);

  if (loading) {
    return (
      <div className="container-custom py-24 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin mb-3" />
        <p className="text-xs font-bold text-gray-500">Loading category supplies...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-custom py-20 text-center max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-red-600 mb-2">Failed to load category</h2>
        <p className="text-xs text-gray-500 mb-6">{error}</p>
        <button
          onClick={loadCategoryData}
          className="px-6 py-2.5 bg-accent hover:bg-accent-dark text-white rounded-xl text-xs font-bold transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="container-custom py-20 text-center">
        <h1 className="text-3xl font-bold mb-4">Category Not Found</h1>
        <Link to="/categories" className="text-accent hover:underline font-bold">
          Back to all categories
        </Link>
      </div>
    );
  }

  return (
    <div className="container-custom py-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center text-sm text-gray-500 mb-8">
        <Link to="/" className="hover:text-primary transition-colors">Home</Link>
        <ChevronRight size={16} className="mx-2" />
        <Link to="/categories" className="hover:text-primary transition-colors">Categories</Link>
        <ChevronRight size={16} className="mx-2" />
        <span className="text-gray-900 font-medium">{category.name}</span>
      </nav>

      {/* Category Header */}
      <SectionReveal variant="hero">
        <div className="bg-primary text-white rounded-2xl overflow-hidden mb-12 flex flex-col md:flex-row items-center shadow-lg">
          <div className="p-8 md:p-12 md:w-1/2">
            <ScrollReveal
              baseOpacity={0.2}
              baseRotation={2}
              blurStrength={4}
              as="h1"
              containerClassName="mb-4"
              textClassName="text-3xl sm:text-4xl font-heading font-bold text-white"
            >
              {category.name}
            </ScrollReveal>
            <p className="text-base sm:text-lg text-gray-200 leading-relaxed">{category.description}</p>
          </div>
          <div className="w-full md:w-1/2 h-64 md:h-80 relative">
            <img 
              src={category.image} 
              alt={category.name} 
              className="w-full h-full object-cover absolute inset-0"
            />
          </div>
        </div>
      </SectionReveal>

      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-1/4">
          <div className="sticky top-24">
            <ProductFilters products={products} />
          </div>
        </aside>
        
        <main className="w-full md:w-3/4">
          <div className="mb-6 text-gray-600 font-medium text-xs sm:text-sm">
            Showing {products.length} certified products in {category.name}
          </div>
          <SectionReveal variant="product">
            <ProductGrid products={products} />
          </SectionReveal>
        </main>
      </div>
    </div>
  );
};

export default CategoryProductsPage;
