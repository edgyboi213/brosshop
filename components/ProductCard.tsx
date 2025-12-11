import React from 'react';
import { Product } from '../types';
import { PLACEHOLDER_IMAGE } from '../constants';
import { useNavigate } from 'react-router-dom';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const navigate = useNavigate();

  return (
    <div 
      className="bg-zinc-800 rounded-lg overflow-hidden cursor-pointer hover:shadow-xl hover:shadow-orange-500/20 transition-all duration-300 group"
      onClick={() => navigate(`/product/${product.idProduct}`)}
    >
      <div className="relative aspect-square overflow-hidden">
        <img 
          src={product.imageUrl || PLACEHOLDER_IMAGE} 
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 text-[10px] md:text-xs font-bold uppercase rounded text-white">
          {product.category}
        </div>
      </div>
      <div className="p-3 md:p-4">
        <h3 className="text-sm md:text-lg font-bold text-white mb-1 truncate">{product.name}</h3>
        <p className="text-orange-500 font-bold text-base md:text-xl">{product.price.toLocaleString()} ₽</p>
      </div>
    </div>
  );
};