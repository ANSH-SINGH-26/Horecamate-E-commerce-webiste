import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../lib/supabase';
import { formatCurrency } from '../lib/utils';
import { motion } from 'motion/react';

export const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const imageUrl = product.images && Array.isArray(product.images) && product.images.length > 0 && product.images[0] ? product.images[0] : 'https://images.unsplash.com/photo-1584286595398-a59f21d313f5?w=800&q=80';

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }} className="h-full flex flex-col">
      <Link to={`/products/${product.id}`} className="group flex flex-col h-full bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(220,38,38,1)] hover:border-red-600 transition-all">
        <div className="relative aspect-[4/3] overflow-hidden bg-zinc-50 border-b-2 border-black">
          <motion.img
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            src={imageUrl}
            alt={product.name}
            className="h-full w-full object-cover object-center grayscale group-hover:grayscale-0 transition-all duration-300"
          />
          {product.stock <= 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <span className="bg-red-600 px-4 py-2 text-xs font-black uppercase tracking-widest text-white border-2 border-black">
                Out of stock
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-col flex-1 p-5">
          {product.categories?.name && (
            <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-2">{product.categories.name}</p>
          )}
          <h3 className="text-lg font-black text-black line-clamp-2 leading-tight flex-1 uppercase">{product.name}</h3>
          <p className="text-xl font-black text-black mt-4">{formatCurrency(product.price)}</p>
        </div>
      </Link>
    </motion.div>
  );
}
