import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Product } from '@/types';
import catalogService from '@/services/catalogService';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useCompareStore } from '@/store/compareStore';
import ProductGallery from '@/components/product/ProductGallery';
import ProductGrid from '@/components/product/ProductGrid';
import SectionReveal from '@/components/ui/SectionReveal';
import Rating from '@/components/ui/Rating';
import PriceDisplay from '@/components/ui/PriceDisplay';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import QuantitySelector from '@/components/ui/QuantitySelector';
import { ChevronRight, Heart, ShoppingCart, Truck, Shield, Layers, Check, Zap, FolderPlus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import AddToProjectModal from '@/components/project/AddToProjectModal';

const ProductDetailsPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'features' | 'reviews'>('desc');
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const addToCart = useCartStore((state) => state.addToCart);
  const { toggleWishlist, isWishlisted } = useWishlistStore();
  const { toggleCompare, isInCompare } = useCompareStore();

  const loadProduct = () => {
    if (!slug) return;
    setLoading(true);
    setError(null);

    catalogService.getProductBySlug(slug)
      .then((p) => {
        setProduct(p);
        setLoading(false);

        if (p) {
          catalogService.getRelatedProducts(p.category, p.id, 4).then((rel) => {
            setRelatedProducts(rel);
          }).catch(() => {});
        }
      })
      .catch((err: any) => {
        setError(err.message || 'Unable to load product specification. Please try again.');
        setLoading(false);
      });
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    loadProduct();
  }, [slug]);

  if (loading) {
    return (
      <div className="container-custom py-24 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-accent animate-spin mb-4" />
        <p className="text-sm font-bold text-gray-600">Loading product specification...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-custom py-20 text-center max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-red-600 mb-2">Failed to load product</h2>
        <p className="text-xs text-gray-500 mb-6">{error}</p>
        <div className="flex justify-center gap-3">
          <button
            onClick={loadProduct}
            className="px-5 py-2 bg-accent hover:bg-accent-dark text-white rounded-xl text-xs font-bold transition-colors"
          >
            Retry Connection
          </button>
          <Link to="/shop" className="px-5 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold transition-colors">
            Back to Catalog
          </Link>
        </div>
      </div>
    );
  }
  
  if (!product) {
    return (
      <div className="container-custom py-20 text-center">
        <h1 className="text-3xl font-bold mb-4">Product Not Found</h1>
        <Link to="/shop" className="text-accent hover:underline font-bold">
          Continue Shopping
        </Link>
      </div>
    );
  }
  const wishlisted = isWishlisted(product.id);
  const compared = isInCompare(product.id);
  const inStock = product.stock && product.stock > 0;

  const handleAddToCart = () => {
    if (!inStock) return;
    addToCart(product, quantity);
    toast.success(`Added ${quantity} × ${product.name} to cart!`);
  };

  const handleBuyNow = () => {
    if (!inStock) return;
    addToCart(product, quantity);
    navigate('/checkout');
  };

  const handleToggleWishlist = () => {
    toggleWishlist(product.id);
    if (wishlisted) {
      toast.success('Removed from wishlist');
    } else {
      toast.success('Added to wishlist');
    }
  };

  return (
    <div className="container-custom py-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center text-xs sm:text-sm text-gray-500 mb-8 overflow-x-auto whitespace-nowrap">
        <Link to="/" className="hover:text-primary transition-colors">Home</Link>
        <ChevronRight size={14} className="mx-2 shrink-0" />
        <Link to="/categories" className="hover:text-primary transition-colors">Categories</Link>
        <ChevronRight size={14} className="mx-2 shrink-0" />
        <Link to={`/category/${product.category}`} className="hover:text-primary capitalize transition-colors">
          {product.category.replace('-', ' ')}
        </Link>
        <ChevronRight size={14} className="mx-2 shrink-0" />
        <span className="text-gray-900 font-medium truncate max-w-[200px]">{product.name}</span>
      </nav>

      {/* Main Product Area */}
      <SectionReveal variant="hero">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 mb-16">
          <ProductGallery images={product.images || ['https://placehold.co/600?text=HEPNA']} />
          
          <div className="flex flex-col">
            <div className="mb-3">
              <span className="text-xs font-bold text-accent uppercase tracking-widest">{product.brand}</span>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-black text-gray-900 mt-1 leading-tight">
                {product.name}
              </h1>
            </div>
            
            <div className="flex items-center gap-4 mb-5">
              <Rating rating={product.rating || 4.5} reviews={product.reviews || 120} showCount size="sm" />
              <div className="h-4 w-px bg-gray-200"></div>
              <span className="text-xs text-gray-500 font-medium">SKU: HM-{product.id.toUpperCase()}</span>
            </div>

            <div className="mb-5 p-4 rounded-xl bg-gray-50/70 border border-gray-100">
              <PriceDisplay price={product.price} mrp={product.mrp} discount={product.discount} unit={product.unit} size="lg" showUnit />
              {product.bulkPrice && (
                <div className="text-xs font-bold text-emerald-700 mt-1.5 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Bulk Project Rate: ₹{product.bulkPrice} / {product.unit} (Min. {product.minimumBulkQuantity} {product.unit}s)</span>
                </div>
              )}
            </div>

            <div className="mb-6 flex flex-wrap items-center gap-2">
              <Badge 
                text={inStock ? `In Stock (${product.stock} units)` : 'Out of Stock'} 
                variant={inStock ? 'success' : 'danger'} 
              />
              {product.deliveryAvailable && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                  <Truck className="w-3.5 h-3.5 text-accent" />
                  <span>Direct Site Delivery Available</span>
                </span>
              )}
            </div>

            {inStock ? (
              <div className="space-y-4 mb-8">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-gray-700">Quantity</span>
                    <QuantitySelector 
                      quantity={quantity} 
                      onQuantityChange={setQuantity}
                      min={1} 
                      max={product.stock || 50} 
                    />
                  </div>

                  <div className="flex-1 flex gap-2 pt-5">
                    <Button 
                      className="flex-1 flex items-center justify-center gap-2 py-3" 
                      variant="primary" 
                      onClick={handleAddToCart}
                    >
                      <ShoppingCart size={18} />
                      <span>Add to Cart</span>
                    </Button>
                    <button 
                      type="button"
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border border-accent/40 bg-orange-50 hover:bg-orange-100 text-accent font-bold text-sm sm:text-base transition-colors active:scale-[0.98] select-none" 
                      onClick={handleBuyNow}
                    >
                      <Zap size={18} className="fill-accent" />
                      <span>Buy Now</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button 
                    onClick={handleToggleWishlist}
                    className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                      wishlisted ? 'border-accent text-accent bg-accent/5' : 'border-gray-200 text-gray-700 hover:border-gray-400 bg-white'
                    }`}
                  >
                    <Heart size={15} className={wishlisted ? 'fill-accent text-accent' : ''} />
                    <span>{wishlisted ? 'Wishlisted' : 'Wishlist'}</span>
                  </button>

                  <button 
                    onClick={() => toggleCompare(product)}
                    className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                      compared ? 'border-accent text-accent bg-accent/5' : 'border-gray-200 text-gray-700 hover:border-gray-400 bg-white'
                    }`}
                  >
                    <Layers size={15} />
                    <span>{compared ? 'Comparing' : 'Compare'}</span>
                  </button>

                  <button 
                    onClick={() => setIsProjectModalOpen(true)}
                    className="flex-1 min-w-[120px] py-2.5 px-3 rounded-xl border border-accent/40 bg-orange-50/60 hover:bg-orange-100 text-accent text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <FolderPlus size={15} />
                    <span>+ Add to Project</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-6 text-sm text-red-700">
                This item is currently out of stock. Contact our bulk desk for incoming batch allocation.
              </div>
            )}

            {/* Add To Project Modal */}
            <AddToProjectModal
              product={product}
              isOpen={isProjectModalOpen}
              onClose={() => setIsProjectModalOpen(false)}
            />

            {/* Delivery & Assurance info */}
            <div className="border-t border-gray-100 pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent shrink-0">
                  <Truck size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Direct Site Unloading</h4>
                  <p className="text-[11px] text-gray-500">Scheduled vehicle drop directly at pouring site</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent shrink-0">
                  <Shield size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">100% Certified Genuine</h4>
                  <p className="text-[11px] text-gray-500">Comes with manufacturer test certificates</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SectionReveal>

      {/* Tabs */}
      <SectionReveal>
        <div className="mb-16">
          <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
            {['desc', 'specs', 'features', 'reviews'].map((tab) => (
              <button
                key={tab}
                className={`py-3.5 px-6 font-bold text-sm whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === tab ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab(tab as any)}
              >
                {tab === 'desc' && 'Product Overview'}
                {tab === 'specs' && 'Technical Specifications'}
                {tab === 'features' && 'Key Features'}
                {tab === 'reviews' && `Reviews (${product.reviews || 0})`}
              </button>
            ))}
          </div>

          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 min-h-[250px]">
            {activeTab === 'desc' && (
              <div className="prose max-w-none text-gray-700 text-sm leading-relaxed space-y-4">
                <p className="text-base">{product.description}</p>
                <p>
                  Sourced directly from verified manufacturers and processed according to strict quality control standards. Ideal for residential foundations, commercial highrises, and structural infrastructure.
                </p>
              </div>
            )}

            {activeTab === 'specs' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <th className="py-3 px-4 bg-gray-50 font-bold text-gray-900 w-1/3">Brand</th>
                      <td className="py-3 px-4 text-gray-700">{product.brand}</td>
                    </tr>
                    <tr>
                      <th className="py-3 px-4 bg-gray-50 font-bold text-gray-900 w-1/3">Unit Measure</th>
                      <td className="py-3 px-4 text-gray-700">{product.unit}</td>
                    </tr>
                    <tr>
                      <th className="py-3 px-4 bg-gray-50 font-bold text-gray-900 w-1/3">Category</th>
                      <td className="py-3 px-4 text-gray-700 capitalize">{product.category.replace('-', ' ')}</td>
                    </tr>
                    <tr>
                      <th className="py-3 px-4 bg-gray-50 font-bold text-gray-900 w-1/3">Subcategory</th>
                      <td className="py-3 px-4 text-gray-700">{product.subcategory}</td>
                    </tr>
                    {product.specifications && (
                      Array.isArray(product.specifications) ? (
                        (product.specifications as any[]).map((spec: any, idx: number) => (
                          <tr key={idx}>
                            <th className="py-3 px-4 bg-gray-50 font-bold text-gray-900 w-1/3 capitalize">
                              {(spec.key || spec.name || '').replace(/([A-Z])/g, ' $1').trim()}
                            </th>
                            <td className="py-3 px-4 text-gray-700">{spec.value || ''}</td>
                          </tr>
                        ))
                      ) : (
                        Object.entries(product.specifications).map(([key, val]) => (
                          <tr key={key}>
                            <th className="py-3 px-4 bg-gray-50 font-bold text-gray-900 w-1/3 capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </th>
                            <td className="py-3 px-4 text-gray-700">{val}</td>
                          </tr>
                        ))
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'features' && (
              <ul className="list-disc pl-6 space-y-2.5 text-sm text-gray-700">
                {product.features && product.features.length > 0 ? (
                  product.features.map((feat, idx) => <li key={idx}>{feat}</li>)
                ) : (
                  <>
                    <li>Manufactured strictly complying with standard Bureau of Indian Standards (BIS) specifications.</li>
                    <li>Superior load-bearing and compressive strength tested in certified NABL laboratories.</li>
                    <li>Weather-resistant packaging ensures zero moisture seepage during transit and on-site storage.</li>
                    <li>Optimized for fast curing and high structural bonding performance.</li>
                  </>
                )}
              </ul>
            )}

            {activeTab === 'reviews' && (
              <div>
                <div className="flex items-center gap-6 mb-8 p-4 bg-gray-50 rounded-xl">
                  <div className="text-4xl font-extrabold text-[#071A2B]">{product.rating || 4.5}</div>
                  <div>
                    <Rating rating={product.rating || 4.5} reviews={product.reviews || 120} showCount size="md" />
                    <p className="text-xs text-gray-500 mt-1">Verified purchases from contractors & builders</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="border-b border-gray-100 pb-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-sm text-gray-900">Ramesh K. (Site Contractor)</span>
                      <span className="text-xs text-gray-400">1 week ago</span>
                    </div>
                    <Rating rating={5} size="sm" />
                    <p className="text-xs text-gray-600 mt-2">
                      Prompt delivery directly to our pouring site. Exact batch numbers and pristine packaging. Highly satisfied.
                    </p>
                  </div>
                  <div className="border-b border-gray-100 pb-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-sm text-gray-900">Vikram S. (Civil Engineer)</span>
                      <span className="text-xs text-gray-400">3 weeks ago</span>
                    </div>
                    <Rating rating={4.5} size="sm" />
                    <p className="text-xs text-gray-600 mt-2">
                      Materials met all structural test criteria. Pricing is noticeably lower than local retail dealer network.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </SectionReveal>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <SectionReveal variant="product">
          <ProductGrid products={relatedProducts} title="Related Construction Supplies" />
        </SectionReveal>
      )}
    </div>
  );
};

export default ProductDetailsPage;
