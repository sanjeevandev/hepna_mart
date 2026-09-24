import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, MapPin, User, Heart, ShoppingCart, Menu, X } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useSearchStore } from '@/store/searchStore';
import SearchBar from '../ui/SearchBar';
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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const isScrolledRef = useRef(false);
  
  const { query, setQuery } = useSearchStore();

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 20;
      if (scrolled !== isScrolledRef.current) {
        isScrolledRef.current = scrolled;
        setIsScrolled(scrolled);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      setIsSearchOpen(false);
    }
  };

  const handleNavClick = (item: GooeyNavItem) => {
    navigate(item.href);
  };

  return (
    <>
      <header
        className={`sticky top-0 z-50 w-full transition-[background-color,border-color,box-shadow,padding] duration-300 ease-out ${
          isScrolled
            ? 'bg-[#071A2B]/95 backdrop-blur-[16px] shadow-md shadow-black/10 border-b border-white/[0.12] py-0.5'
            : 'bg-[#071A2B]/85 backdrop-blur-[14px] border-b border-white/[0.08] py-1'
        } text-white`}
      >
        <div className="container-custom">
          {/* Main Top Bar */}
          <div className="flex items-center justify-between h-16 gap-3 sm:gap-4 lg:gap-6">
            
            {/* Mobile Menu & Logo */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <button 
                className="md:hidden p-1.5 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Open mobile menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              
              <Link to="/" className="flex items-center gap-1.5 group">
                <span className="font-heading font-black text-xl sm:text-2xl tracking-tight text-white whitespace-nowrap">
                  HEPNA <span className="text-accent group-hover:text-accent-light transition-colors">MART</span>
                </span>
              </Link>
            </div>

            {/* Desktop Gooey Navigation (Clean SVG filter, no black box) */}
            <div className="hidden md:flex items-center justify-center flex-shrink-0">
              <GooeyNav
                items={navItems}
                initialActiveIndex={getActiveNavIndex()}
                onItemClick={handleNavClick}
                animationTime={450}
                particleCount={12}
                particleDistances={[70, 10]}
                particleR={80}
                colors={[1, 2, 3, 1, 2, 4]}
              />
            </div>

            {/* Quick Actions & Icons */}
            <div className="flex items-center space-x-1 sm:space-x-2.5 lg:space-x-3.5 flex-shrink-0">
              {/* Search Toggle */}
              <button 
                className={`p-2 rounded-full transition-all ${
                  isSearchOpen ? 'bg-white/20 text-accent' : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                aria-label="Toggle search"
              >
                {isSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
              </button>

              {/* Deliver To / Location */}
              <button className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-xs font-semibold">
                <MapPin className="h-4 w-4 text-accent" />
                <span>Deliver to Site</span>
              </button>

              {/* Account Link */}
              <Link
                to="/account"
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-xs font-semibold"
              >
                <User className="h-4 w-4" />
                <span className="hidden 2xl:block">Account</span>
              </Link>

              {/* Wishlist Link */}
              <Link
                to="/wishlist"
                className="relative p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                aria-label="View wishlist"
              >
                <Heart className="h-5 w-5" />
                {wishlistItems.length > 0 && (
                  <span className="absolute top-0 right-0 bg-accent text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full transform translate-x-1 -translate-y-1 shadow-sm">
                    {wishlistItems.length}
                  </span>
                )}
              </Link>

              {/* Cart Link with Micro-Interaction Badge */}
              <Link
                to="/cart"
                className="relative p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-full transition-colors flex items-center gap-2 group"
                aria-label="View cart"
              >
                <div className="relative">
                  <ShoppingCart className="h-5 w-5 group-hover:scale-105 transition-transform" />
                  {cartItemCount > 0 && (
                    <span className="absolute top-0 right-0 bg-accent text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full transform translate-x-2 -translate-y-2 border border-[#071A2B] shadow-md animate-pulse">
                      {cartItemCount}
                    </span>
                  )}
                </div>
                <span className="hidden lg:block text-xs font-bold uppercase tracking-wider text-accent-light">
                  Cart
                </span>
              </Link>
            </div>
          </div>
          
          {/* Expandable Search Drawer */}
          {isSearchOpen && (
            <div className="py-3 px-2 border-t border-white/10 animate-page-in">
              <div className="max-w-2xl mx-auto flex items-center gap-2">
                <SearchBar 
                  value={query}
                  onChange={setQuery}
                  onSearch={handleSearch}
                  placeholder="Search 60+ construction products, cement, tools, steel..."
                  className="w-full text-gray-900 shadow-xl"
                  autoFocus
                />
              </div>
            </div>
          )}
        </div>
      </header>
      
      {/* Mobile Navigation Drawer */}
      <MobileNav 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />
    </>
  );
};

export default Header;
