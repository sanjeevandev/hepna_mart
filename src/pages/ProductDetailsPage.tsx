import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { products } from '@/data/products';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { getRelatedProducts } from '@/utils/helpers';
import ProductGallery from '@/components/product/ProductGallery';
import ProductGrid from '@/components/product/ProductGrid';
import Rating from '@/components/ui/Rating';
import PriceDisplay from '@/components/ui/PriceDisplay';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import QuantitySelector from '@/components/ui/QuantitySelector';
import { ChevronRight, Heart, ShoppingCart, Truck, Shield, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const ProductDetailsPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'features' | 'reviews'>('desc');
  
  const addToCart = useCartStore(state => state.addToCart);
  const { toggleWishlist, isWishlisted } = useWishlistStore();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  const product = products.find(p => p.slug === slug);
  
  if (!product) {
    return (
      <div className="container-custom py-20 text-center">
        <h1 className="text-3xl font-bold mb-4">Product Not Found</h1>
        <Link to="/shop" className="text-accent hover:underline">
          Continue Shopping
        </Link>
      </div>
    );
  }

  const relatedProducts = getRelatedProducts(products, product.id, product.category);
  const wishlisted = isWishlisted(product.id);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    toast.success('Added to cart successfully!');
  };

  const handleBuyNow = () => {
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
      <nav className="flex items-center text-sm text-gray-500 mb-8">
        <Link to="/" className="hover:text-primary transition-colors">Home</Link>
        <ChevronRight size={16} className="mx-2" />
        <Link to="/categories" className="hover:text-primary transition-colors">Categories</Link>
        <ChevronRight size={16} className="mx-2" />
        <span className="text-gray-900 font-medium truncate max-w-[200px]">{product.name}</span>
      </nav>

      {/* Main Product Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        <ProductGallery images={[product.image]} />
        
        <div className="flex flex-col">
          <div className="mb-4">
            <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">{product.brand}</span>
            <h1 className="text-3xl font-heading font-bold text-gray-900 mt-2">{product.name}</h1>
          </div>
          
          <div className="flex items-center gap-4 mb-6">
            <Rating rating={product.rating || 4.5} count={product.reviews || 120} />
            <div className="h-4 w-px bg-gray-300"></div>
            <span className="text-sm text-gray-600">SKU: {product.sku || 'N/A'}</span>
          </div>

          <div className="mb-6">
            <PriceDisplay price={product.price} discountPrice={product.discountPrice} size="lg" />
            <div className="text-sm text-gray-500 mt-1">per {product.unit}</div>
          </div>

          <div className="mb-8">
            <Badge 
              text={product.inStock ? 'In Stock' : 'Out of Stock'} 
              variant={product.inStock ? 'success' : 'danger'} 
            />
            {!product.inStock && (
              <p className="text-sm text-danger mt-2">This product is currently unavailable.</p>
            )}
          </div>

          {product.inStock && (
            <div className="flex items-end gap-4 mb-8">
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-gray-700">Quantity</span>
                <QuantitySelector quantity={quantity} onIncrease={() => setQuantity(q => q + 1)} onDecrease={() => setQuantity(q => Math.max(1, q - 1))} />
              </div>
              <div className="flex-1 flex gap-4">
                <Button className="flex-1 flex items-center justify-center gap-2" variant="outline" onClick={handleAddToCart}>
                  <ShoppingCart size={20} />
                  Add to Cart
                </Button>
                <Button className="flex-1" variant="primary" onClick={handleBuyNow}>
                  Buy Now
                </Button>
              </div>
              <button 
                onClick={handleToggleWishlist}
                className={`p-3 rounded-md border flex items-center justify-center transition-colors ${wishlisted ? 'border-accent text-accent bg-accent/5' : 'border-gray-300 text-gray-500 hover:border-gray-400'}`}
              >
                <Heart size={24} className={wishlisted ? 'fill-current' : ''} />
              </button>
            </div>
          )}

          {/* Delivery & Assurance info */}
          <div className="border-t border-gray-200 pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Truck size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">Fast Delivery</h4>
                <p className="text-xs text-gray-500">Usually ships in 2-3 days</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Shield size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">Genuine Product</h4>
                <p className="text-xs text-gray-500">100% authentic materials</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-16">
        <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
          {['desc', 'specs', 'features', 'reviews'].map((tab) => (
            <button
              key={tab}
              className={`py-4 px-6 font-medium whitespace-nowrap transition-colors border-b-2 ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              onClick={() => setActiveTab(tab as any)}
            >
              {tab === 'desc' && 'Description'}
              {tab === 'specs' && 'Specifications'}
              {tab === 'features' && 'Features'}
              {tab === 'reviews' && 'Reviews'}
            </button>
          ))}
        </div>

        <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 min-h-[300px]">
          {activeTab === 'desc' && (
            <div className="prose max-w-none text-gray-700">
              <p className="text-lg leading-relaxed">{product.description}</p>
              <p className="mt-4">Our {product.name} is manufactured to the highest industry standards, ensuring durability and performance for all your construction needs. Perfect for both residential and commercial projects.</p>
            </div>
          )}
          {activeTab === 'specs' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <tbody>
                  <tr className="border-b border-gray-100">
                    <th className="py-4 px-4 bg-gray-50 font-medium text-gray-900 w-1/3">Brand</th>
                    <td className="py-4 px-4 text-gray-700">{product.brand}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <th className="py-4 px-4 bg-gray-50 font-medium text-gray-900 w-1/3">Unit</th>
                    <td className="py-4 px-4 text-gray-700">{product.unit}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <th className="py-4 px-4 bg-gray-50 font-medium text-gray-900 w-1/3">Category</th>
                    <td className="py-4 px-4 text-gray-700 capitalize">{product.category.replace('-', ' ')}</td>
                  </tr>
                  {product.sku && (
                    <tr className="border-b border-gray-100">
                      <th className="py-4 px-4 bg-gray-50 font-medium text-gray-900 w-1/3">SKU</th>
                      <td className="py-4 px-4 text-gray-700">{product.sku}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          {activeTab === 'features' && (
            <ul className="list-disc pl-6 space-y-3 text-gray-700">
              <li>High-quality materials sourced from trusted manufacturers.</li>
              <li>Tested for strength, durability, and reliability.</li>
              <li>Complies with all relevant Indian construction standards (IS codes).</li>
              <li>Easy to handle and apply on-site.</li>
              <li>Excellent cost-to-performance ratio for large projects.</li>
            </ul>
          )}
          {activeTab === 'reviews' && (
            <div>
              <div className="flex items-center gap-4 mb-8">
                <div className="text-4xl font-bold text-gray-900">{product.rating || 4.5}</div>
                <div>
                  <Rating rating={product.rating || 4.5} />
                  <p className="text-sm text-gray-500 mt-1">Based on {product.reviews || 120} reviews</p>
                </div>
              </div>
              <div className="space-y-6">
                {[1, 2].map((i) => (
                  <div key={i} className="border-b border-gray-100 pb-6 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-bold text-gray-900">User {i}</div>
                      <span className="text-sm text-gray-500">2 months ago</span>
                    </div>
                    <Rating rating={5} />
                    <p className="text-gray-700 mt-2">Excellent quality product. Delivery was on time and the materials were exactly as described. Highly recommend for large projects.</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Products</h2>
          <ProductGrid products={relatedProducts.slice(0, 4)} />
        </div>
      )}
    </div>
  );
};

export default ProductDetailsPage;
