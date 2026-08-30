import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, ImageOff } from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';
import { useMarket } from '../context/MarketContext';

export default function FavoritesView() {
  const navigate = useNavigate();
  const { favoriteMarketIds, toggleFavorite, loading } = useFavorites();
  const { products } = useMarket();

  const favoritedProducts = products.filter((p) => favoriteMarketIds.has(p.id));

  return (
    <div className="flex-1 flex flex-col bg-white h-full overflow-hidden">
      <div className="sticky top-0 bg-white z-10 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <button
          onClick={() => navigate('/market')}
          className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-display font-bold text-slate-900">Favorites</h2>
        <div className="w-8 h-8" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading ? (
          <p className="text-center text-xs font-sans text-slate-400 py-16">Loading your favorites...</p>
        ) : favoritedProducts.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-sans text-slate-500 font-medium">No favorites yet</p>
            <p className="text-xs font-sans text-slate-400 mt-1">
              Tap the heart icon on any product to save it here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {favoritedProducts.map((prod) => (
              <div
                key={prod.id}
                onClick={() => navigate('/market')}
                className="bg-white border border-slate-100/90 rounded-lg overflow-hidden shadow-2xs cursor-pointer flex flex-col relative"
              >
                <div className="aspect-square w-full bg-slate-50 relative overflow-hidden">
                  {prod.image ? (
                    <img src={prod.image} alt={prod.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <ImageOff className="w-6 h-6" />
                    </div>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(prod.id);
                    }}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center shadow-sm hover:bg-white transition-colors cursor-pointer"
                    aria-label="Remove from favorites"
                  >
                    <Heart className="w-3 h-3 fill-red-500 stroke-red-500" />
                  </button>
                </div>
                <div className="p-2">
                  <h4 className="text-[10px] font-sans font-bold text-slate-900 leading-tight line-clamp-2">
                    {prod.title}
                  </h4>
                  <span className="text-[10px] font-sans font-black text-slate-950 mt-1 block">
                    ₦{prod.price.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
