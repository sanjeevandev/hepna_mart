import { Product, Category } from '@/types';
import apiClient, {
  BackendProduct,
  BackendCategory,
  BackendCategoryListItem,
  ProductQueryParams,
  BackendInventoryListItem,
} from '@/lib/api';

/**
 * =========================================================================
 * CATALOG SERVICE (Phase 2C)
 * =========================================================================
 * Authoritative interface bridging FastAPI catalog endpoints with
 * the HEPNA MART React storefront and admin dashboards.
 * PostgreSQL + FastAPI is the single source of truth.
 */

export function transformBackendProductToFrontend(bp: BackendProduct): Product {
  // Normalize specifications into a clean Record<string, string>
  let normalizedSpecs: Record<string, string> = {};
  if (Array.isArray(bp.specifications)) {
    bp.specifications.forEach((s: any) => {
      if (s && typeof s === 'object') {
        const k = s.key || s.name || s.label;
        const v = s.value !== undefined ? s.value : (s.val !== undefined ? s.val : '');
        if (k) normalizedSpecs[k] = String(v);
      }
    });
  } else if (bp.specifications && typeof bp.specifications === 'object') {
    Object.entries(bp.specifications).forEach(([k, v]) => {
      normalizedSpecs[k] = String(v);
    });
  }

  const rawImages = Array.isArray(bp.images) && bp.images.length > 0 
    ? bp.images 
    : ['https://images.unsplash.com/photo-1590937195954-5a0410d68622?w=400'];

  return {
    id: bp.id,
    name: bp.name,
    slug: bp.slug,
    brand: bp.brand,
    category: bp.category_slug || (bp.category ? bp.category.slug : bp.category_id),
    subcategory: bp.subcategory || '',
    description: bp.description || '',
    images: rawImages,
    price: Number(bp.price),
    mrp: Number(bp.mrp),
    discount: bp.discount_percent || 0,
    unit: bp.unit || 'Piece',
    stock: bp.stock !== undefined ? bp.stock : (bp.available_stock !== undefined ? bp.available_stock : 0),
    rating: bp.rating || 4.5,
    reviews: bp.review_count || 0,
    bulkPrice: bp.bulk_price ? Number(bp.bulk_price) : undefined,
    minimumBulkQuantity: bp.minimum_bulk_quantity || undefined,
    deliveryAvailable: bp.delivery_available !== undefined ? bp.delivery_available : true,
    featured: bp.is_featured || false,
    newArrival: bp.is_new || false,
    specifications: normalizedSpecs,
    features: Array.isArray(bp.features) ? bp.features : [],
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
    subcategories: Array.isArray(bc.subcategories) ? bc.subcategories : [],
  };
}

export const catalogService = {
  /**
   * Fetches all categories with live product counts directly from FastAPI.
   */
  async getCategories(activeOnly: boolean = true): Promise<Category[]> {
    try {
      const res = await apiClient.categories.list(activeOnly);
      if (res.data && Array.isArray(res.data)) {
        return res.data.map(transformBackendCategoryToFrontend);
      }
      throw new Error('Unable to load categories.');
    } catch {
      throw new Error('Unable to load categories. Please try again.');
    }
  },

  /**
   * Fetches a single category by slug directly from FastAPI.
   */
  async getCategoryBySlug(slug: string): Promise<Category | null> {
    try {
      const res = await apiClient.categories.getBySlug(slug);
      if (res.data) {
        return transformBackendCategoryToFrontend(res.data);
      }
      return null;
    } catch (err: any) {
      if (err.status === 404) return null;
      throw new Error('Unable to load category details. Please try again.');
    }
  },

  /**
   * Queries products with pagination, search, and filters directly from FastAPI.
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
      if (res.data && Array.isArray(res.data.items)) {
        return {
          products: res.data.items.map(transformBackendProductToFrontend),
          total: res.data.total,
          totalPages: res.data.total_pages,
          page: res.data.page,
          pageSize: res.data.page_size,
        };
      }
      throw new Error('Unable to load products.');
    } catch {
      throw new Error('Unable to load products. Please try again.');
    }
  },

  /**
   * Fetches full product details by slug directly from FastAPI.
   */
  async getProductBySlug(slug: string): Promise<Product | null> {
    try {
      const res = await apiClient.products.getBySlug(slug);
      if (res.data) {
        return transformBackendProductToFrontend(res.data);
      }
      return null;
    } catch (err: any) {
      if (err.status === 404) return null;
      throw new Error('Unable to load product details. Please try again.');
    }
  },

  /**
   * Fetches full product details by unique product ID directly from FastAPI.
   */
  async getProductById(id: string): Promise<Product | null> {
    try {
      const res = await apiClient.products.getById(id);
      if (res.data) {
        return transformBackendProductToFrontend(res.data);
      }
      return null;
    } catch (err: any) {
      if (err.status === 404) return null;
      throw new Error('Unable to load product. Please try again.');
    }
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
    try {
      const res = await this.getProducts({ category: categorySlug, page_size: limit + 1 });
      return res.products.filter((p) => p.id !== currentProductId).slice(0, limit);
    } catch {
      return [];
    }
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
