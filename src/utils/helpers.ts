import { Product, SearchFilters } from '@/types';

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export function filterProducts(
  products: Product[] = [],
  filtersOrQuery?: SearchFilters | string,
  queryOrFilters?: string | SearchFilters
): Product[] {
  let productsList = Array.isArray(products) ? [...products] : [];

  let query: string = '';
  let filters: SearchFilters = {};

  if (typeof filtersOrQuery === 'string') {
    query = filtersOrQuery;
  } else if (filtersOrQuery && typeof filtersOrQuery === 'object') {
    filters = filtersOrQuery;
  }

  if (typeof queryOrFilters === 'string') {
    query = queryOrFilters;
  } else if (queryOrFilters && typeof queryOrFilters === 'object') {
    filters = queryOrFilters;
  }

  // Filter by text search query
  if (query && typeof query === 'string' && query.trim()) {
    const lowerQuery = query.toLowerCase().trim();
    productsList = productsList.filter(
      (p) =>
        p.name?.toLowerCase().includes(lowerQuery) ||
        p.brand?.toLowerCase().includes(lowerQuery) ||
        p.category?.toLowerCase().includes(lowerQuery) ||
        p.subcategory?.toLowerCase().includes(lowerQuery) ||
        p.description?.toLowerCase().includes(lowerQuery) ||
        (p.specifications &&
          Object.values(p.specifications).some((val) =>
            val.toLowerCase().includes(lowerQuery)
          ))
    );
  }

  // Filter by category
  if (filters.category) {
    productsList = productsList.filter((p) => p.category === filters.category);
  }

  // Filter by brand
  if (filters.brand) {
    productsList = productsList.filter((p) => p.brand === filters.brand);
  }

  // Filter by price range
  if (filters.priceRange && Array.isArray(filters.priceRange) && filters.priceRange.length === 2) {
    productsList = productsList.filter(
      (p) => p.price >= filters.priceRange![0] && p.price <= filters.priceRange![1]
    );
  }

  // Filter by rating
  if (filters.rating) {
    productsList = productsList.filter((p) => (p.rating || 0) >= filters.rating!);
  }

  // Filter by stock
  if (filters.inStock) {
    productsList = productsList.filter((p) => (p.stock || 0) > 0);
  }

  // Filter by wholesale / bulk availability
  if (filters.wholesale) {
    productsList = productsList.filter((p) => p.bulkPrice !== undefined);
  }

  // Sorting
  if (filters.sortBy) {
    switch (filters.sortBy) {
      case 'price-low':
        productsList.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        productsList.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        productsList.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'newest':
        productsList.sort((a, b) => (a.newArrival === b.newArrival ? 0 : a.newArrival ? -1 : 1));
        break;
      case 'discount':
        productsList.sort((a, b) => (b.discount || 0) - (a.discount || 0));
        break;
      case 'relevance':
      default:
        productsList.sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
        break;
    }
  }

  return productsList;
}

export function getProductsByCategory(products: Product[] = [], categorySlug: string): Product[] {
  return (products || []).filter((p) => p.category === categorySlug);
}

export function getRelatedProducts(products: Product[] = [], product: Product, limit: number = 4): Product[] {
  if (!product) return [];
  return (products || [])
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, limit);
}

export function calculateDiscount(mrp: number, price: number): number {
  if (!mrp || mrp <= price) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}

export function getBrands(products: Product[] = []): string[] {
  const brands = new Set((products || []).map((p) => p.brand).filter(Boolean));
  return Array.from(brands).sort();
}

export function getCategories(products: Product[] = []): string[] {
  const cats = new Set((products || []).map((p) => p.category).filter(Boolean));
  return Array.from(cats).sort();
}
