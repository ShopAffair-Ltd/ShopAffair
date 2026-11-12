import React, { useEffect, useMemo, useState } from 'react';
import { Package, Share2 } from 'lucide-react';
import { fetchProducts } from '../../services/productService';
import { fetchTrades, mapTradeToMarketProduct } from '../../services/TradeService';
import { MarketProduct, TradeType } from '../../types';
import QrShareModal from '../../components/modals/QrShareModal';

interface NewlyListedProps {
  onSelectProduct: (productId: string) => void;
}

export function NewlyListed({ onSelectProduct }: NewlyListedProps) {
  const [products, setProducts] = useState<MarketProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [qrProduct, setQrProduct] = useState<MarketProduct | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchProducts({ limit: 24 }),
      fetchTrades({ type: TradeType.SUPPLY, limit: 24 }).catch(() => ({ items: [] }))
    ])
      .then(([productRes, tradeRes]) => {
        if (!cancelled) {
          const tradesAsProducts = (tradeRes.items || [])
            .map(mapTradeToMarketProduct)
            .filter((item): item is MarketProduct => item !== null);
          setProducts([...(productRes.items || []), ...tradesAsProducts]);
        }
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(
        products
          .map((p) => (p.category || '').trim())
          .filter(Boolean)
      )
    );
    return ['All', ...unique];
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (activeCategory === 'All') return products.slice(0, 12);
    return products
      .filter((p) => (p.category || '').toLowerCase() === activeCategory.toLowerCase())
      .slice(0, 12);
  }, [products, activeCategory]);

  return (
    <section id="newly-listed" className="scroll-mt-24 px-6 py-16 bg-white relative z-10 border-t border-slate-100">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Newly listed on ShopAffair
          </h2>
          {!loading && products.length > 0 && (
            <span className="text-xs text-slate-500 font-medium">
              {products.length} {products.length === 1 ? 'listing' : 'listings'} available
            </span>
          )}
        </div>

        {/* Category Filter Pills */}
        {categories.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {categories.map((cat) => {
              const selected = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer border ${
                    selected
                      ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-purple-300 hover:text-purple-700'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="space-y-2.5 animate-pulse">
                <div className="aspect-square w-full rounded-xl bg-slate-100" />
                <div className="h-3.5 bg-slate-100 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
                <div className="h-4 bg-slate-100 rounded w-1/3" />
              </div>
            ))}
          </div>
        )}

        {/* Real DB products grid */}
        {!loading && filteredProducts.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => onSelectProduct(product.id)}
                className="group text-left space-y-2.5 cursor-pointer focus:outline-none"
              >
                <div className="aspect-square w-full rounded-xl overflow-hidden bg-slate-50 border border-slate-100 group-hover:border-purple-200 transition-colors relative">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Package className="w-8 h-8" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setQrProduct(product);
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-purple-600 shadow-sm transition-all cursor-pointer"
                    title="Share via QR & WhatsApp"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-0.5 px-0.5">
                  <h3 className="text-sm font-semibold text-slate-900 truncate group-hover:text-purple-600 transition-colors">
                    {product.title}
                  </h3>
                  <p className="text-xs text-slate-500 truncate">
                    {product.category}
                  </p>
                  <p className="text-sm font-bold text-slate-900">
                    ₦{Number(product.price).toLocaleString()}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Empty state when DB has no listings yet */}
        {!loading && filteredProducts.length === 0 && (
          <div className="py-14 text-center rounded-2xl border border-slate-100 bg-slate-50/50 space-y-2">
            <Package className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No products listed yet</p>
            <p className="text-xs text-slate-400">Listings added by verified sellers will appear here automatically.</p>
          </div>
        )}
      </div>

      {qrProduct && (
        <QrShareModal
          isOpen={!!qrProduct}
          onClose={() => setQrProduct(null)}
          kind="product"
          title={qrProduct.title}
          subtitle={`₦${Number(qrProduct.price).toLocaleString()} • ${qrProduct.sellerName}`}
          url={`${window.location.origin}/market?product=${encodeURIComponent(qrProduct.id)}`}
          imageUrl={qrProduct.image}
        />
      )}
    </section>
  );
}
