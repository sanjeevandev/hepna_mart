import React, { useState } from 'react';

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

const ProductGallery: React.FC<ProductGalleryProps> = ({ images, productName }) => {
  const displayImages = images && images.length > 0 ? images : ['https://placehold.co/800?text=No+Image'];
  const [mainImage, setMainImage] = useState(displayImages[0]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-square overflow-hidden bg-white rounded-xl group border border-gray-200 shadow-sm flex items-center justify-center">
        <img 
          src={mainImage} 
          alt={productName} 
          className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-125 origin-center"
        />
      </div>
      
      {displayImages.length > 1 && (
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x">
          {displayImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setMainImage(img)}
              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors snap-start bg-white ${
                mainImage === img ? 'border-primary' : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <img src={img} alt={`${productName} thumbnail ${idx + 1}`} className="w-full h-full object-contain p-1" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductGallery;
