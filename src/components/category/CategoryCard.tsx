import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Layers, Home, Droplets, Zap, Grid3x3, DoorOpen, Paintbrush, Wrench, Hammer, Bath, HardHat, Package } from 'lucide-react';
import { Category } from '@/types';

interface CategoryCardProps {
  category: Category;
}

const iconMap: Record<string, React.FC<any>> = {
  Building2, Layers, Home, Droplets, Zap, Grid3x3, DoorOpen, Paintbrush, Wrench, Hammer, Bath, HardHat
};

const CategoryCard: React.FC<CategoryCardProps> = ({ category }) => {
  const Icon = iconMap[category.icon] || Package;

  return (
    <Link 
      to={`/category/${category.slug}`} 
      className="flex flex-col items-center p-5 text-center group bg-white rounded-2xl border border-gray-100/90 shadow-sm hover:border-accent/40 hover:-translate-y-1 hover:shadow-card-hover transition-all duration-300"
    >
      <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center mb-3.5 group-hover:bg-accent group-hover:text-white transition-all duration-300 group-hover:scale-105">
        <Icon className="w-7 h-7 text-primary group-hover:text-white transition-colors duration-300" />
      </div>
      <h3 className="font-heading font-semibold text-sm sm:text-base text-primary-dark mb-1 group-hover:text-accent transition-colors">
        {category.name}
      </h3>
      <p className="text-xs text-gray-500 mb-2 line-clamp-1">
        {category.tagline}
      </p>
      <span className="text-[11px] font-semibold text-accent bg-accent/10 px-2.5 py-0.5 rounded-full mt-auto">
        {category.productCount} Products
      </span>
    </Link>
  );
};

export default CategoryCard;
