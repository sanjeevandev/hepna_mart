import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, MapPin, User, Heart, ShoppingCart, Menu } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useSearchStore } from '@/store/searchStore';
import SearchBar from '../ui/SearchBar';
import CategoryNav from './CategoryNav';
import MobileNav from './MobileNav';
import GooeyNav, { GooeyNavItem } from '../ui/GooeyNav';

const navItems: GooeyNavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Shop', href: '/shop' },
  { label: 'Categories', href: '/categories' },
  { label: 'Tools', href: '/tools' },
  { label: 'Offers', href: '/offers' },
  { label: 'Wholesale', href: '/wholesale' },
];

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const cartItemCount = useCartStore((state) => state.getItemCount());
  const wishlistItems = useWishlistStore((state) => state.items);
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  
  const { query, setQuery } = useSearchStore();

  const getActiveNavIndex = () => {
    const path = location.pathname;
    if (path === '/') return 0;
    if (path.startsWith('/shop')) return 1;
    if (path.startsWith('/categories') || path.startsWith('/category/')) return 2;
    if (path.startsWith('/tools')) return 3;
    if (path.startsWith('/offers')) return 4;
    if (path.startsWith('/wholesale')) return 5;
    return 0;
  };

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery)}`);
      setIsMobileSearchOpen(false);
    }
  };

  const handleNavClick = (item: GooeyNavItem) => {
    navigate(item.href);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full shadow-md bg-primary text-white">
        <div className="container-custom">
          {/* Main Top Bar */}
          <div className="flex items-center justify-between h-16 gap-3 lg:gap-5">
            
            {/* Mobile Menu & Logo */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <button 
                className="md:hidden p-1 mr-1 text-white hover:bg-primary-light rounded-md"
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Open mobile menu"
              >
                <Menu className="h-6 w-6" />
              </button>
              
              <Link to="/" className="flex items-center gap-2">
                <span className="font-heading font-bold text-xl md:text-2xl tracking-tight text-white whitespace-nowrap">
                  HEPNA <span className="text-accent">MART</span>
                </span>
              </Link>
            </div>

            {/* Desktop Gooey Navigation */}
            <div className="hidden lg:flex items-center justify-center flex-shrink-0">
              <GooeyNav
                items={navItems}
                initialActiveIndex={getActiveNavIndex()}
                onItemClick={handleNavClick}
                animationTime={500}
                particleCount={14}
                particleDistances={[75, 10]}
                particleR={90}
                colors={[1, 2, 3, 1, 2, 4]}
              />
            </div>

            {/* Desktop Search */}
            <div className="hidden md:flex flex-1 max-w-xs xl:max-w-sm 2xl:max-w-md px-1">
              <SearchBar 
                value={query}
                onChange={setQuery}
                onSearch={handleSearch}
                className="w-full text-gray-900"
              />
            </div>

            {/* Icons */}
            <div className="flex items-center space-x-2 md:space-x-3 xl:space-x-4 flex-shrink-0">
              <button 
                className="md:hidden p-2 text-white hover:bg-primary-light rounded-full"
                onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
                aria-label="Toggle search"
              >
                <Search className="h-5 w-5" />
              </button>

              <button className="hidden 2xl:flex items-center gap-1.5 p-2 text-white hover:text-accent transition-colors text-sm font-medium">
                <MapPin className="h-5 w-5" />
                <span>Deliver to</span>
              </button>

              <Link to="/account" className="hidden sm:flex items-center gap-1.5 p-2 text-white hover:text-accent transition-colors text-sm font-medium">
                <User className="h-5 w-5" />
                <span className="hidden xl:block">Account</span>
              </Link>

              <Link to="/wishlist" className="relative p-2 text-white hover:text-accent transition-colors" aria-label="View wishlist">
                <Heart className="h-5 w-5 md:h-6 md:w-6" />
                {wishlistItems.length > 0 && (
                  <span className="absolute top-0 right-0 bg-accent text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full transform translate-x-1 -translate-y-1">
                    {wishlistItems.length}
                  </span>
                )}
              </Link>

              <Link to="/cart" className="relative p-2 text-white hover:text-accent transition-colors flex items-center gap-2" aria-label="View cart">
                <div className="relative">
                  <ShoppingCart className="h-5 w-5 md:h-6 md:w-6" />
                  {cartItemCount > 0 && (
                    <span className="absolute top-0 right-0 bg-accent text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full transform translate-x-2 -translate-y-2 border-2 border-primary">
                      {cartItemCount}
                    </span>
                  )}
                </div>
                <span className="hidden xl:block font-medium">Cart</span>
              </Link>
            </div>
          </div>
          
          {/* Mobile Search Bar (Expandable) */}
          {isMobileSearchOpen && (
            <div className="md:hidden pb-4 px-2">
              <SearchBar 
                value={query}
                onChange={setQuery}
                onSearch={handleSearch}
                className="w-full text-gray-900"
              />
            </div>
          )}
        </div>
        
        {/* Desktop Category Navigation */}
        <div className="hidden md:block bg-white border-b border-gray-200">
          <CategoryNav />
        </div>
      </header>
      
      {/* Mobile Navigation Overlay */}
      <MobileNav 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />
    </>
  );
};

export default Header;
