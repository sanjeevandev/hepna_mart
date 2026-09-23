import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { 
  Building2, Layers, Home, Droplets, Zap, 
  Grid3x3, DoorOpen, Paintbrush, Wrench, 
  Hammer, Bath, HardHat, Package 
} from 'lucide-react';
import { categories } from '@/data/categories';

// Icon mapping based on strings from category data
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

  return icons[iconName] || <Package className="w-5 h-5" />;
};

const CategoryNav = () => {
  const { slug } = useParams<{ slug: string }>();

  return (
    <div className="w-full bg-white">
      <div className="container-custom">
        <ul className="flex flex-row overflow-x-auto hide-scrollbar py-2 md:py-0 md:flex-wrap md:justify-center gap-1 md:gap-4 lg:gap-8">
          {categories.map((category) => {
            const isActive = slug === category.slug;
            
            return (
              <li key={category.id} className="flex-shrink-0">
                <Link
                  to={`/category/${category.slug}`}
                  className={`flex flex-col md:flex-row items-center gap-2 py-2 px-3 md:py-4 transition-colors group
                    ${isActive 
                      ? 'text-accent border-b-2 border-accent' 
                      : 'text-gray-600 hover:text-primary md:border-b-2 md:border-transparent md:hover:border-primary-light'
                    }`}
                >
                  <span className={`${isActive ? 'text-accent' : 'text-primary group-hover:text-primary-light'}`}>
                    {getCategoryIcon(category.icon)}
                  </span>
                  <span className="text-xs md:text-sm font-medium whitespace-nowrap">
                    {category.name}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default CategoryNav;
