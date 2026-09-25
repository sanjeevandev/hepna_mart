import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { 
  Building2, Layers, Home, Droplets, Zap, 
  Grid3x3, DoorOpen, Paintbrush, Wrench, 
  Hammer, Bath, HardHat, Package 
} from 'lucide-react';
import { catalogService } from '@/services/catalogService';
import { Category } from '@/types';

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

const CategoryNav: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);

  useEffect(() => {
    let mounted = true;
    catalogService.getCategories()
      .then((cats) => {
        if (mounted && cats && cats.length > 0) {
          setCategoriesList(cats);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="w-full bg-white">
      <div className="container-custom">
        <ul className="flex flex-row overflow-x-auto hide-scrollbar py-2 md:py-0 md:flex-wrap md:justify-center gap-1 md:gap-4 lg:gap-8">
          {categoriesList.map((category) => {
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
