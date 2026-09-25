import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, User, Heart, Package, Info, Phone, Store, Percent, PenTool, Users } from 'lucide-react';
import { categories } from '@/data/categories';
import { 
  Building2, Layers, Home, Droplets, Zap, 
  Grid3x3, DoorOpen, Paintbrush, Wrench, 
  Hammer, Bath, HardHat, Calculator, Package as PackageIcon 
} from 'lucide-react';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

const getCategoryIcon = (iconName: string) => {
  const icons: Record<string, React.ReactNode> = {
    'Building2': <Building2 className="w-5 h-5" />,
    'Layers': <Layers className="w-5 h-5" />,
    'Home': <Home className="w-5 h-5" />,
    'Droplets': <Droplets className="w-5 h-5" />,
    'Zap': <Zap className="w-5 h-5" />,
    'Grid3x3': <Grid3x3 className="w-5 h-5" />,
    'DoorOpen': <DoorOpen className="w-5 h-5" />,
    'Paintbrush': <Paintbrush className="w-5 h-5" />,
    'Wrench': <Wrench className="w-5 h-5" />,
    'Hammer': <Hammer className="w-5 h-5" />,
    'Bath': <Bath className="w-5 h-5" />,
    'HardHat': <HardHat className="w-5 h-5" />,
  };
  return icons[iconName] || <PackageIcon className="w-5 h-5" />;
};

const MobileNav: React.FC<MobileNavProps> = ({ isOpen, onClose }) => {
  // Prevent scrolling on body when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const quickLinks = [
    { name: 'Home', path: '/', icon: <Home className="w-5 h-5" /> },
    { name: 'Shop All', path: '/shop', icon: <Store className="w-5 h-5" /> },
    { name: 'Categories', path: '/categories', icon: <Layers className="w-5 h-5" /> },
    { name: 'Offers', path: '/offers', icon: <Percent className="w-5 h-5" /> },
    { name: 'Construction Tools', path: '/tools', icon: <PenTool className="w-5 h-5" /> },
    { name: 'Wholesale', path: '/wholesale', icon: <Users className="w-5 h-5" /> },
    { name: 'About Us', path: '/about', icon: <Info className="w-5 h-5" /> },
    { name: 'Contact', path: '/contact', icon: <Phone className="w-5 h-5" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Menu Panel */}
      <div className="relative flex w-full max-w-xs flex-col overflow-y-auto bg-white pb-12 shadow-xl transform transition-transform">
        <div className="flex px-4 pt-5 pb-2 justify-between items-center bg-primary text-white">
          <Link to="/" className="flex items-center gap-2" onClick={onClose}>
            <span className="font-heading font-bold text-xl tracking-tight text-white">
              HEPNA <span className="text-accent">MART</span>
            </span>
          </Link>
          <button
            type="button"
            className="-m-2 inline-flex items-center justify-center rounded-md p-2 text-gray-200 hover:text-white"
            onClick={onClose}
          >
            <span className="sr-only">Close menu</span>
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        {/* User Account Links */}
        <div className="border-b border-gray-200 py-4 px-4 bg-gray-50">
          <ul className="space-y-3">
            <li>
              <Link to="/account" onClick={onClose} className="flex items-center gap-3 text-gray-700 font-medium">
                <User className="h-5 w-5 text-primary" /> My Account
              </Link>
            </li>
            <li>
              <Link to="/orders" onClick={onClose} className="flex items-center gap-3 text-gray-700 font-medium">
                <Package className="h-5 w-5 text-primary" /> My Orders
              </Link>
            </li>
            <li>
              <Link to="/calculator" onClick={onClose} className="flex items-center gap-3 text-gray-700 font-medium">
                <Calculator className="h-5 w-5 text-accent" /> Cost Calculator
              </Link>
            </li>
            <li>
              <Link to="/projects" onClick={onClose} className="flex items-center gap-3 text-gray-700 font-medium">
                <HardHat className="h-5 w-5 text-accent" /> Project Builder & BOQ
              </Link>
            </li>
            <li>
              <Link to="/wishlist" onClick={onClose} className="flex items-center gap-3 text-gray-700 font-medium">
                <Heart className="h-5 w-5 text-primary" /> Wishlist
              </Link>
            </li>
          </ul>
        </div>

        {/* Quick Links */}
        <div className="py-4 px-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Menu</h3>
          <ul className="space-y-4">
            {quickLinks.map((link, idx) => (
              <li key={idx}>
                <Link to={link.path} onClick={onClose} className="flex items-center gap-3 text-gray-700 hover:text-primary">
                  <span className="text-gray-400">{link.icon}</span>
                  <span className="font-medium">{link.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Category Links */}
        <div className="py-4 px-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Categories</h3>
          <ul className="space-y-4">
            {categories.map((category) => (
              <li key={category.id}>
                <Link 
                  to={`/category/${category.slug}`} 
                  onClick={onClose}
                  className="flex items-center gap-3 text-gray-700 hover:text-primary"
                >
                  <span className="text-primary-light">
                    {getCategoryIcon(category.icon)}
                  </span>
                  <span className="font-medium">{category.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MobileNav;
