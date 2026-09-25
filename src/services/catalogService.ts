import { Product, Category } from '@/types';
import apiClient, {
  BackendProduct,
  BackendCategory,
  BackendCategoryListItem,
  ProductQueryParams,
  BackendInventoryListItem,
} from '@/lib/api';
import { products as fallbackProducts } from '@/data/products';
import { categories as fallbackCategories } from '@/data/categories';

/**
 * =========================================================================
 * CATALOG SERVICE (Phase 2C)
 * =========================================================================
 * Authoritative interface bridging backend FastAPI catalog endpoints with
 * the HEPNA MART React storefront and admin dashboards.
 * Provides seamless transformation and graceful fallback for offline dev.
 */

export function transformBackendProductToFrontend(bp: BackendProduct): Product {
  return {
    id: bp.id,
    name: bp.name,
    slug: bp.slug,
    brand: bp.brand,
    category: bp.category_slug || (bp.category ? bp.category.slug : bp.category_id),
    subcategory: bp.subcategory || '',
    description: bp.description || '',
    images: bp.images && bp.images.length > 0 ? bp.images : ['https://images.unsplash.com/photo-1590937195954-5a0410d68622?w=400'],
    price: Number(bp.price),
    mrp: Number(bp.mrp),
    discount: bp.discount_percent || 0,
    unit: bp.unit || 'Piece',
    stock: bp.stock !== undefined ? bp.stock : (bp.available_stock || 0),
    rating: bp.rating || 4.5,
    reviews: bp.review_count || 0,
    bulkPrice: bp.bulk_price ? Number(bp.bulk_price) : undefined,
    minimumBulkQuantity: bp.minimum_bulk_quantity || undefined,
    deliveryAvailable: bp.delivery_available !== undefined ? bp.delivery_available : true,
    featured: bp.is_featured || false,
    newArrival: bp.is_new || false,
    specifications: bp.specifications || [],
    features: bp.features || [],
  };
}

export function transformBackendCategoryToFrontend(bc: BackendCategory | BackendCategoryListItem): Category {
  return {
    id: bc.id,
    name: bc.name,
    slug: bc.slug,
    description: bc.description || '',
    tagline: bc.tagline || '',
    icon: bc.icon || 'Building2',
    image: bc.image || 'https://images.unsplash.com/photo-1590937195954-5a0410d68622?w=400',
    productCount: bc.product_count || 0,
    subcategories: bc.subcategories || [],
  };
}

export const catalogService = {
  /**
   * Fetches all categories with live product counts.
   */
  async getCategories(activeOnly: boolean = true): Promise<Category[]> {
    try {
      const res = await apiClient.categories.list(activeOnly);
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        return res.data.map(transformBackendCategoryToFrontend);
      }
    } catch {
      // Fallback to local data
    }
    return fallbackCategories;
  },

  /**
   * Fetches a single category by slug.
   */
  async getCategoryBySlug(slug: string): Promise<Category | null> {
    try {
      const res = await apiClient.categories.getBySlug(slug);
      if (res.data) {
        return transformBackendCategoryToFrontend(res.data);
      }
    } catch {
      // Fallback
    }
    const found = fallbackCategories.find((c) => c.slug.toLowerCase() === slug.toLowerCase());
    return found || null;
  },

  /**
   * Queries products with pagination and filters.
   */
  async getProducts(params: ProductQueryParams = {}): Promise<{
    products: Product[];
    total: number;
    totalPages: number;
    page: number;
    pageSize: number;
  }> {
    try {
      const res = await apiClient.products.list(params);
      if (res.data && res.data.items) {
        return {
          products: res.data.items.map(transformBackendProductToFrontend),
          total: res.data.total,
          totalPages: res.data.total_pages,
          page: res.data.page,
          pageSize: res.data.page_size,
        };
      }
    } catch {
      // Fallback filtering over local products
    }

    let filtered = [...fallbackProducts];
    if (params.category) {
      filtered = filtered.filter((p) => p.category.toLowerCase() === params.category!.toLowerCase());
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
    }
    if (params.brand) {
      filtered = filtered.filter((p) => p.brand.toLowerCase() === params.brand!.toLowerCase());
    }
    if (params.min_price !== undefined) {
      filtered = filtered.filter((p) => p.price >= params.min_price!);
    }
    if (params.max_price !== undefined) {
      filtered = filtered.filter((p) => p.price <= params.max_price!);
    }
    if (params.featured !== undefined) {
      filtered = filtered.filter((p) => Boolean(p.featured) === params.featured);
    }
    if (params.new !== undefined) {
      filtered = filtered.filter((p) => Boolean(p.newArrival) === params.new);
    }

    const pageSize = params.page_size || 24;
    const page = params.page || 1;
    const total = filtered.length;
    const totalPages = Math.ceil(total / pageSize) || 1;
    const start = (page - 1) * pageSize;
    const paginated = filtered.slice(start, start + pageSize);

    return {
      products: paginated,
      total,
      totalPages,
      page,
      pageSize,
    };
  },

  /**
   * Fetches full product details by slug.
   */
  async getProductBySlug(slug: string): Promise<Product | null> {
    try {
      const res = await apiClient.products.getBySlug(slug);
      if (res.data) {
        return transformBackendProductToFrontend(res.data);
      }
    } catch {
      // Fallback
    }
    const found = fallbackProducts.find((p) => p.slug.toLowerCase() === slug.toLowerCase());
    return found || null;
  },

  /**
   * Fetches full product details by unique product ID.
   */
  async getProductById(id: string): Promise<Product | null> {
    try {
      const res = await apiClient.products.getById(id);
      if (res.data) {
        return transformBackendProductToFrontend(res.data);
      }
    } catch {
      // Fallback
    }
    const found = fallbackProducts.find((p) => p.id === id);
    return found || null;
  },

  /**
   * Fetches featured products for homepage.
   */
  async getFeaturedProducts(limit: number = 8): Promise<Product[]> {
    const res = await this.getProducts({ featured: true, page_size: limit });
    return res.products;
  },

  /**
   * Fetches new arrival products.
   */
  async getNewArrivals(limit: number = 8): Promise<Product[]> {
    const res = await this.getProducts({ new: true, page_size: limit });
    return res.products;
  },

  /**
   * Fetches related products in the same category.
   */
  async getRelatedProducts(categorySlug: string, currentProductId: string, limit: number = 4): Promise<Product[]> {
    const res = await this.getProducts({ category: categorySlug, page_size: limit + 1 });
    return res.products.filter((p) => p.id !== currentProductId).slice(0, limit);
  },

  /**
   * Fetches warehouse inventory list (Staff only).
   */
  async getInventory(lowStockOnly: boolean = false): Promise<BackendInventoryListItem[]> {
    const res = await apiClient.inventory.list(lowStockOnly);
    return res.data || [];
  },
};

export default catalogService;
