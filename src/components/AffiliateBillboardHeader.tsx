import React, { useState, useEffect } from 'react';
import { ExternalLink, Tag, ChevronRight, Star, ShoppingBag, Sparkles } from 'lucide-react';
import { AffiliateProduct } from '../types';

interface AffiliateBillboardHeaderProps {
  products: AffiliateProduct[];
  onOpenDealsModal: () => void;
  onSelectProduct?: (product: AffiliateProduct) => void;
  primaryColor?: string;
}

export const AffiliateBillboardHeader: React.FC<AffiliateBillboardHeaderProps> = ({
  products,
  onOpenDealsModal,
  onSelectProduct,
  primaryColor = '#f59e0b',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-rotate the billboard product every 5 seconds
  useEffect(() => {
    if (!products || products.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % products.length);
    }, 4800);
    return () => clearInterval(interval);
  }, [products]);

  const currentProduct = products && products.length > 0 ? products[currentIndex] : null;

  if (!currentProduct) {
    return (
      <div className="relative pt-8 pb-4 px-4 border-b border-zinc-800 bg-zinc-950">
        <h2 className="text-3xl text-white font-serif italic">Music Player</h2>
      </div>
    );
  }

  const handleProductClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelectProduct) {
      onSelectProduct(currentProduct);
    }
    onOpenDealsModal();
  };

  return (
    <div className="relative border-b border-zinc-800/80 bg-linear-to-b from-zinc-900/90 via-zinc-950 to-zinc-950 overflow-hidden select-none">
      {/* Background Ambience & subtle soundwave bars */}
      <div className="absolute inset-0 pointer-events-none opacity-10 flex items-end justify-between px-3 pb-1 gap-1">
        <div className="w-2 bg-amber-400 h-8 rounded-t animate-pulse" />
        <div className="w-2 bg-amber-400 h-14 rounded-t" />
        <div className="w-2 bg-amber-400 h-20 rounded-t animate-pulse" />
        <div className="w-2 bg-amber-400 h-12 rounded-t" />
        <div className="w-2 bg-amber-400 h-16 rounded-t" />
        <div className="w-2 bg-amber-400 h-9 rounded-t animate-pulse" />
        <div className="w-2 bg-amber-400 h-18 rounded-t" />
        <div className="w-2 bg-amber-400 h-11 rounded-t" />
        <div className="w-2 bg-amber-400 h-7 rounded-t animate-pulse" />
      </div>

      {/* Top Bar: Brand Title & Billboard Badge */}
      <div className="relative z-10 pt-5 px-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2
            className="text-2xl text-white font-normal italic tracking-wide drop-shadow-md"
            style={{
              fontFamily: "'Dancing Script', 'Playfair Display', cursive, serif",
            }}
          >
            Music Player
          </h2>
          <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30 flex items-center gap-1">
            <Sparkles size={9} /> STORE DEALS
          </span>
        </div>

        {/* View All Deals button */}
        <button
          onClick={onOpenDealsModal}
          className="text-[11px] font-medium text-amber-400 hover:text-amber-300 flex items-center gap-0.5 transition-colors cursor-pointer"
          title="Browse All Affiliate Music Gear"
        >
          View all
          <ChevronRight size={13} />
        </button>
      </div>

      {/* The Interactive Rotating Billboard Card */}
      <div className="relative z-10 px-3 pb-3">
        <div
          onClick={handleProductClick}
          className="group relative w-full bg-zinc-900/90 hover:bg-zinc-850 border border-amber-500/30 hover:border-amber-400/60 rounded-xl p-2.5 transition-all duration-300 cursor-pointer shadow-lg shadow-black/40 overflow-hidden"
          id="sidebar-affiliate-billboard-card"
        >
          {/* Subtle glowing accent gradient */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex gap-2.5 items-center">
            {/* Product Image with Badge */}
            <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-zinc-800 border border-zinc-700/60 flex items-center justify-center shadow-inner">
              {currentProduct.imageUrl ? (
                <img
                  src={currentProduct.imageUrl}
                  alt={currentProduct.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <ShoppingBag className="text-zinc-500" size={24} />
              )}
              {currentProduct.discountPercent && (
                <span className="absolute bottom-0 right-0 bg-red-600 text-white font-bold text-[9px] px-1 py-0.5 rounded-tl">
                  {currentProduct.discountPercent}
                </span>
              )}
            </div>

            {/* Product Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider truncate">
                  {currentProduct.badge || currentProduct.category}
                </span>
                <span className="text-[10px] text-zinc-400 flex items-center gap-0.5">
                  <Star size={10} className="fill-amber-400 text-amber-400" />
                  {currentProduct.rating}
                </span>
              </div>

              <h4 className="text-xs font-medium text-zinc-100 truncate group-hover:text-amber-300 transition-colors">
                {currentProduct.title}
              </h4>

              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-sm font-bold text-emerald-400">
                  {currentProduct.price}
                </span>
                {currentProduct.originalPrice && (
                  <span className="text-[10px] text-zinc-500 line-through">
                    {currentProduct.originalPrice}
                  </span>
                )}
                <span className="text-[10px] text-amber-300/80 ml-auto flex items-center gap-0.5 group-hover:underline">
                  Buy <ExternalLink size={10} />
                </span>
              </div>
            </div>
          </div>

          {/* Carousel dots indicator */}
          <div className="flex items-center justify-center gap-1 pt-2 mt-1 border-t border-zinc-800/60">
            {products.map((prod, idx) => (
              <button
                key={prod.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                className={`h-1 rounded-full transition-all duration-300 ${
                  idx === currentIndex
                    ? 'w-4 bg-amber-400'
                    : 'w-1.5 bg-zinc-700 hover:bg-zinc-500'
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
