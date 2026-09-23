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
    <Link to={`/category/${category.slug}`} className="card card-hover flex flex-col items-center p-6 text-center group transition-all duration-300">
      <div className="w-16 h-16 rounded-full bg-surface-dark flex items-center justify-center mb-4 group-hover:bg-primary-light transition-colors duration-300">
        <Icon className="w-8 h-8 text-primary group-hover:text-white transition-colors duration-300" />
      </div>
      <h3 className="font-heading font-semibold text-lg text-primary-dark mb-1">{category.name}</h3>
      <p className="text-sm text-gray-500 mb-3 line-clamp-2">{category.tagline}</p>
      <span className="text-xs font-medium text-accent bg-accent/10 px-2 py-1 rounded-full">{category.productCount} Products</span>
    </Link>
  );
};

export default CategoryCard;
