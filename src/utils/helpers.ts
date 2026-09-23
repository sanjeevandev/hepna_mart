import { Product, SearchFilters, SortOption } from '@/types';

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export function filterProducts(products: Product[], filters: SearchFilters, query?: string): Product[] {
  let filtered = [...products];

  if (query) {
    const lowerQuery = query.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.brand.toLowerCase().includes(lowerQuery) ||
        p.category.toLowerCase().includes(lowerQuery) ||
        p.description.toLowerCase().includes(lowerQuery)
    );
  }

  if (filters.category) {
    filtered = filtered.filter((p) => p.category === filters.category);
  }

  if (filters.brand && filters.brand.length > 0) {
    filtered = filtered.filter((p) => filters.brand!.includes(p.brand));
  }

  if (filters.priceRange) {
    filtered = filtered.filter(
      (p) => p.price >= filters.priceRange![0] && p.price <= filters.priceRange![1]
    );
  }

  if (filters.rating) {
    filtered = filtered.filter((p) => p.rating >= filters.rating!);
  }

  if (filters.inStock) {
    filtered = filtered.filter((p) => p.stock > 0);
  }

  if (filters.wholesale) {
    filtered = filtered.filter((p) => p.bulkPrice !== undefined);
  }

  if (filters.sortBy) {
    switch (filters.sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating-desc':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        filtered.sort((a, b) => (a.newArrival === b.newArrival ? 0 : a.newArrival ? -1 : 1));
        break;
      case 'popularity':
        filtered.sort((a, b) => b.reviews - a.reviews);
        break;
      default:
        break;
    }
  }

  return filtered;
}

export function getProductsByCategory(products: Product[], categorySlug: string): Product[] {
  return products.filter((p) => p.category === categorySlug);
}

export function getRelatedProducts(products: Product[], product: Product, limit: number = 4): Product[] {
  return products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, limit);
}

export function calculateDiscount(mrp: number, price: number): number {
  if (mrp <= price) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}

export function getBrands(products: Product[]): string[] {
  const brands = new Set(products.map((p) => p.brand));
  return Array.from(brands).sort();
}

export function getCategories(products: Product[]): string[] {
  const categories = new Set(products.map((p) => p.category));
  return Array.from(categories).sort();
}
