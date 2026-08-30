import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Flame, Store, Car, Home, Smartphone, Shirt, Wrench, Tag,
  PhoneIcon, Gift, Cpu, ChevronLeft, Clock, Star, Plus, Lock,
  ShoppingBag, ArrowRight, X, Trash2, Minus, ChevronRight,
  Search, ShoppingCart, Heart, Eye, EyeOff, SlidersHorizontal,
  Zap, Sparkles, Gem, Truck, Shield, Coffee, Headphones, Watch, Camera, Laptop, Package,
  User, MapPin
} from 'lucide-react';
import { MarketProduct, UserProfile, CartItem } from '../types';
import QuickTransferModal from './QuickTransferModal';
import { useFavorites } from '../context/FavoritesContext';

interface SubCategory {
  name: string;
  icon: typeof Smartphone;
}

interface CategoryGroup {
  name: string;
  icon: typeof Store;
  subcategories: SubCategory[];
}

const categoryGroups: CategoryGroup[] = [
  {
    name: 'Products',
    icon: Store,
    subcategories: [
      { name: 'Phones', icon: Smartphone },
      { name: 'Fashion', icon: Shirt },
      { name: 'Vehicles', icon: Car },
      { name: 'Houses', icon: Home }
    ]
  },
  {
    name: 'Services',
    icon: Wrench,
    subcategories: [
      { name: 'Repair', icon: Wrench },
      { name: 'Trade', icon: Store }
    ]
  },
  {
    name: 'Digital Assets',
    icon: Tag,
    subcategories: [
      { name: 'Airtime & Data', icon: PhoneIcon },
      { name: 'Gift Cards', icon: Gift },
      { name: 'Software & Apps', icon: Cpu }
    ]
  }
];

interface MarketProductListProps {
  isLoggedIn: boolean;
  activeProfile: UserProfile | null;
  hotDeals: any[];
  hotDealSlide: number;
  goToHotDealSlide: (index: number) => void;
  marketTab: 'supply' | 'demands';
  setMarketTab: (tab: 'supply' | 'demands') => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  activeGroup: string | null;
  setActiveGroup: (group: string | null) => void;
  filteredProducts: MarketProduct[];
  productsLoading?: boolean;
  productsError?: string | null;
  filteredDemands: any[];
  selectedProduct: MarketProduct | null;
  setSelectedProduct: (product: MarketProduct | null) => void;
  selectedDemand: any | null;
  setSelectedDemand: (demand: any | null) => void;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  cart: CartItem[];
  cartTotal: number;
  cartCount: number;
  onAddToCart: (product: MarketProduct) => void;
  onUpdateCartQty: (productId: string, delta: number) => void;
  onRemoveFromCart: (productId: string) => void;
  onProceedToCheckout: () => void;
  onStartChatWithSeller: (sellerUsername: string, sellerName: string) => void;
  isOwnListing: (product: MarketProduct) => boolean;
  quickTransferOpen: boolean;
  setQuickTransferOpen: (open: boolean) => void;
  onVisitStore: (sellerUsername: string) => void; // Changed to string
}

export default function MarketProductList({
  isLoggedIn,
  activeProfile,
  hotDeals,
  hotDealSlide,
  goToHotDealSlide,
  marketTab,
  setMarketTab,
  selectedCategory,
  setSelectedCategory,
  activeGroup,
  setActiveGroup,
  filteredProducts,
  productsLoading = false,
  productsError = null,
  filteredDemands,
  selectedProduct,
  setSelectedProduct,
  selectedDemand,
  setSelectedDemand,
  cartOpen,
  setCartOpen,
  cart,
  cartTotal,
  cartCount,
  onAddToCart,
  onUpdateCartQty,
  onRemoveFromCart,
  onProceedToCheckout,
  onStartChatWithSeller,
  isOwnListing,
  quickTransferOpen,
  setQuickTransferOpen,
  onVisitStore
}: MarketProductListProps) {

  const { isFavorited, toggleFavorite } = useFavorites();
  const activeGroupData = categoryGroups.find((g) => g.name === activeGroup);

  const openGroup = (groupName: string) => {
    setActiveGroup(groupName);
  };

  const goBackToGroups = () => {
    setActiveGroup(null);
    setSelectedCategory('Trending');
  };

  const selectSubcategory = (name: string) => {
    setSelectedCategory(name);
  };

  return (
    <>
      {/* Hot Deals Carousel */}
      <div className="mb-3">
        <div className="relative overflow-hidden rounded-xl shadow-lg border border-purple-400/20">
          <AnimatePresence mode="wait">
            <motion.div
              key={hotDealSlide}
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className={`relative bg-gradient-to-r ${hotDeals[hotDealSlide].bgGradient} p-0`}
            >
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557821552-17105176677c?auto=format&fit=crop&q=80&w=800')] opacity-10 bg-cover bg-center" />
              <div className="relative p-2.5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {(() => {
                        const IconMap: any = { Flame, Zap, Gift, Gem };
                        const Icon = IconMap[hotDeals[hotDealSlide].icon] || Flame;
                        return <Icon className="w-2 h-2 text-amber-400" />;
                      })()}
                      <span className="bg-amber-400 text-black text-[6px] font-black px-1.5 py-0.5 rounded-full tracking-wider">
                        {hotDeals[hotDealSlide].tag}
                      </span>
                      <span className="bg-white/20 text-white text-[6px] font-bold px-1.5 py-0.5 rounded-full backdrop-blur-sm">
                        {hotDeals[hotDealSlide].tag2}
                      </span>
                    </div>
                    <h2 className="text-base font-black text-white leading-tight tracking-tight">
                      {hotDeals[hotDealSlide].title}
                    </h2>
                    <p className="text-[8px] text-white/80 font-semibold mt-0.5">{hotDeals[hotDealSlide].subtitle}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm px-1.5 py-0.5 rounded-full border border-white/10">
                        <Clock className="w-2 h-2 text-amber-400" />
                        <span className="text-[7px] text-white font-bold">Ends in {hotDeals[hotDealSlide].timeLeft}</span>
                      </div>
                      <button className="bg-white text-purple-700 text-[7px] font-black px-2 py-0.5 rounded-full shadow-lg hover:bg-purple-50 transition-colors">
                        SHOP NOW →
                      </button>
                    </div>
                  </div>
                  <div className="flex -space-x-1.5">
                    {hotDeals[hotDealSlide].images.slice(0, 2).map((img: string, i: number) => (
                      <div key={i} className="w-8 h-8 rounded-lg border-2 border-white/30 overflow-hidden shadow-md -ml-1.5 first:ml-0">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Market Tabs */}
      {isLoggedIn && (
        <div className="bg-[#F4F4F6] p-0.5 rounded-lg flex w-full mb-3">
          <button
            onClick={() => setMarketTab('supply')}
            className={`flex-1 py-1.5 text-center text-[10px] font-sans font-bold transition-all rounded-md cursor-pointer ${
              marketTab === 'supply'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Market (Supply)
          </button>
          <button
            onClick={() => setMarketTab('demands')}
            className={`flex-1 py-1.5 text-center text-[10px] font-sans font-bold transition-all rounded-md cursor-pointer ${
              marketTab === 'demands'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Demands (Requests)
          </button>
        </div>
      )}

      {/* Categories */}
      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          {activeGroup && (
            <button
              onClick={goBackToGroups}
              className="w-5 h-5 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer shrink-0"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
          )}
          <h3 className="text-[10px] font-sans font-bold text-slate-900 tracking-wide">
            {activeGroup ? activeGroup : 'Categories'}
          </h3>
        </div>

        {!activeGroup ? (
          <div className="grid grid-cols-4 gap-1.5 mb-2">
            <button
              onClick={() => { setSelectedCategory('Trending'); setActiveGroup(null); }}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg border transition-all cursor-pointer ${
                selectedCategory === 'Trending' && !activeGroup
                  ? 'bg-[#F5F3FF] border-[#7C3AED] text-[#7C3AED] shadow-[0_2px_8px_rgba(124,58,237,0.06)]'
                  : 'bg-white border-slate-100 text-[#1A1A1A] hover:bg-slate-50'
              }`}
            >
              <Flame className={`w-3.5 h-3.5 mb-0.5 ${selectedCategory === 'Trending' ? 'text-[#7C3AED]' : 'text-slate-600'}`} />
              <span className={`text-[8px] font-sans font-bold tracking-tight ${selectedCategory === 'Trending' ? 'text-[#7C3AED]' : 'text-slate-700'}`}>
                Trending
              </span>
            </button>

            {categoryGroups.map((group) => {
              const GroupIcon = group.icon;
              return (
                <button
                  key={group.name}
                  onClick={() => openGroup(group.name)}
                  className="flex flex-col items-center justify-center py-1.5 px-1 rounded-lg border border-slate-100 bg-white text-[#1A1A1A] hover:bg-slate-50 transition-all cursor-pointer"
                >
                  <GroupIcon className="w-3.5 h-3.5 mb-0.5 text-slate-600" />
                  <span className="text-[8px] font-sans font-bold tracking-tight text-slate-700 text-center leading-tight">
                    {group.name}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-1.5 mb-2">
            {activeGroupData?.subcategories.map((sub) => {
              const SubIcon = sub.icon;
              const isActive = selectedCategory === sub.name;
              return (
                <button
                  key={sub.name}
                  onClick={() => selectSubcategory(sub.name)}
                  className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#F5F3FF] border-[#7C3AED] text-[#7C3AED] shadow-[0_2px_8px_rgba(124,58,237,0.06)]'
                      : 'bg-white border-slate-100 text-[#1A1A1A] hover:bg-slate-50'
                  }`}
                >
                  <SubIcon className={`w-3.5 h-3.5 mb-0.5 ${isActive ? 'text-[#7C3AED]' : 'text-slate-600'}`} />
                  <span className={`text-[8px] font-sans font-bold tracking-tight text-center leading-tight ${isActive ? 'text-[#7C3AED]' : 'text-slate-700'}`}>
                    {sub.name}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Products / Demands List */}
      <div className="flex-1 overflow-y-auto px-4 py-2 no-scrollbar">
        {marketTab === 'supply' ? (
          <>
            <h3 className="text-[10px] font-sans font-black text-slate-900 mb-2 tracking-wide uppercase">
              {selectedCategory === 'Trending' ? 'Trending Products (6)' : `${selectedCategory} Products`} ({filteredProducts.length})
            </h3>

            {productsLoading ? (
              <div className="text-center py-12 px-4 bg-slate-50/50 rounded-lg border border-dashed border-slate-150">
                <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-1 animate-pulse" />
                <p className="text-[10px] font-sans text-slate-500 font-bold">Loading products...</p>
              </div>
            ) : productsError ? (
              <div className="text-center py-12 px-4 bg-red-50/50 rounded-lg border border-dashed border-red-200">
                <ShoppingBag className="w-8 h-8 text-red-300 mx-auto mb-1" />
                <p className="text-[10px] font-sans text-red-500 font-bold">{productsError}</p>
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {filteredProducts.map((prod) => {
                  const ownListing = isOwnListing(prod);
                  return (
                    <div
                      key={prod.id}
                      onClick={() => setSelectedProduct(prod)}
                      className="bg-white border border-slate-100/90 rounded-lg overflow-hidden shadow-2xs cursor-pointer flex flex-col justify-between hover:border-slate-200 transition-all relative"
                    >
                      {ownListing && (
                        <span className="absolute top-1.5 left-1.5 z-10 bg-slate-900/80 text-white text-[7px] font-sans font-black px-1.5 py-0.5 rounded-full tracking-wider backdrop-blur-xs">
                          YOUR LISTING
                        </span>
                      )}
                      <div className="aspect-square w-full bg-slate-50 relative overflow-hidden">
                        <img
                          src={prod.image}
                          alt={prod.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        {isLoggedIn && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(prod.id);
                            }}
                            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center shadow-sm hover:bg-white transition-colors cursor-pointer"
                            aria-label={isFavorited(prod.id) ? 'Remove from favorites' : 'Add to favorites'}
                          >
                            <Heart
                              className={`w-3 h-3 transition-colors ${
                                isFavorited(prod.id) ? 'fill-red-500 stroke-red-500' : 'stroke-slate-500'
                              }`}
                            />
                          </button>
                        )}
                      </div>

                      <div className="p-2 flex flex-col justify-between flex-1">
                        <div>
                          <h4 className="text-[10px] font-sans font-bold text-slate-900 leading-tight line-clamp-2">
                            {prod.title}
                          </h4>

                          <div className="flex items-center gap-0.5 text-[8px] text-slate-400 font-medium mt-0.5">
                            <Star className="w-2.5 h-2.5 fill-amber-400 stroke-amber-400" />
                            <span className="font-bold text-slate-600">{prod.rating}</span>
                            <span className="text-slate-300">•</span>
                            <span>@{prod.sellerUsername}</span>
                          </div>

                          {/* Visit Store Button - BLINKING */}
                          {!ownListing && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onVisitStore(prod.sellerUsername);
                              }}
                              className="flex items-center gap-1 text-[7px] text-purple-600 font-bold mt-0.5 animate-pulse hover:animate-none transition-all bg-purple-50 hover:bg-purple-100 px-1.5 py-0.5 rounded-full"
                            >
                              <Store className="w-2.5 h-2.5" />
                              Visit Store
                            </button>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-1.5 pt-0.5">
                          <span className="text-[10px] font-sans font-black text-slate-950">
                            ₦{prod.price.toLocaleString()}
                          </span>
                          {ownListing ? (
                            <div
                              className="w-6 h-6 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center shadow-xs"
                              title="You can't buy your own listing"
                            >
                              <Lock className="w-2.5 h-2.5" />
                            </div>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onAddToCart(prod);
                              }}
                              className="w-6 h-6 bg-[#7C3AED] hover:bg-purple-700 text-white rounded-full flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                            >
                              <Plus className="w-3 h-3 stroke-[2.5]" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 px-4 bg-slate-50/50 rounded-lg border border-dashed border-slate-150">
                <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                <p className="text-[10px] font-sans text-slate-500 font-bold">No products found under this category.</p>
              </div>
            )}
          </>
        ) : (
          <>
            <h3 className="text-[10px] font-sans font-black text-slate-900 mb-2 tracking-wide uppercase">
              Buyer Demands ({filteredDemands.length})
            </h3>

            {filteredDemands.length > 0 ? (
              <div className="space-y-2">
                {filteredDemands.map((demand) => (
                  <div
                    key={demand.id}
                    onClick={() => setSelectedDemand(demand)}
                    className="bg-white border border-slate-100 rounded-lg p-2 shadow-2xs hover:border-slate-200 transition-all flex gap-2 cursor-pointer"
                  >
                    <img
                      src={demand.image}
                      alt={demand.title}
                      className="w-14 h-14 rounded-lg object-cover border border-slate-100 shrink-0"
                    />

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[8px] font-bold text-[#7C3AED] bg-[#F5F3FF] px-1.5 py-0.5 rounded">
                            {demand.category}
                          </span>
                          <span className="text-[8px] text-slate-400 font-medium">@{demand.buyerUsername}</span>
                        </div>
                        <h4 className="text-[10px] font-sans font-extrabold text-slate-900 truncate mt-0.5">
                          {demand.title}
                        </h4>
                        <p className="text-[8px] text-slate-400 line-clamp-1 mt-0.5 leading-snug">{demand.description}</p>
                      </div>

                      <div className="flex items-center justify-between mt-1 pt-0.5 border-t border-slate-50">
                        <span className="text-[10px] font-black text-slate-950">
                          ₦{demand.price.toLocaleString()}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onStartChatWithSeller(demand.buyerUsername, demand.buyerName);
                          }}
                          className="text-[8px] font-sans font-bold text-white bg-[#7C3AED] hover:bg-purple-700 px-2 py-0.5 rounded-md transition-colors shadow-2xs"
                        >
                          Send Offer
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 px-4 bg-slate-50/50 rounded-lg border border-dashed border-slate-150">
                <Tag className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                <p className="text-[10px] font-sans text-slate-500 font-bold">No demands found under this category.</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Cart Drawer */}
      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setCartOpen(false)}
              className="fixed inset-0 bg-slate-950 z-40"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-white z-50 shadow-2xl flex flex-col"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-[#7C3AED]" />
                  <h3 className="text-sm font-sans font-black text-slate-900 tracking-tight">Your Cart ({cartCount})</h3>
                </div>
                <button
                  onClick={() => setCartOpen(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 no-scrollbar">
                {cart.length > 0 ? (
                  cart.map((item) => (
                    <div key={item.product.id} className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100/50">
                      <img
                        src={item.product.image}
                        alt={item.product.title}
                        className="w-12 h-12 rounded-lg object-cover border border-slate-100 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="block text-xs font-bold text-slate-800 truncate">{item.product.title}</span>
                        <span className="block text-[10px] text-[#7C3AED] font-black mt-0.5">₦{item.product.price.toLocaleString()}</span>

                        <div className="flex items-center gap-2 mt-1.5">
                          <button
                            onClick={() => onUpdateCartQty(item.product.id, -1)}
                            className="w-5 h-5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-md flex items-center justify-center cursor-pointer"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="text-[11px] font-sans font-bold text-slate-700 w-4 text-center">{item.quantity}</span>
                          <button
                            onClick={() => onUpdateCartQty(item.product.id, 1)}
                            className="w-5 h-5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-md flex items-center justify-center cursor-pointer"
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() => onRemoveFromCart(item.product.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors shrink-0 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16 space-y-3">
                    <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
                    <p className="text-xs text-slate-400 font-bold">Your shopping cart is currently empty.</p>
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-4 border-t border-slate-100 bg-white space-y-3">
                  <div className="flex items-center justify-between text-xs font-sans">
                    <span className="font-bold text-slate-500">Cart Subtotal:</span>
                    <span className="font-black text-slate-950 text-base">₦{cartTotal.toLocaleString()}</span>
                  </div>

                  <button
                    onClick={() => {
                      setCartOpen(false);
                      onProceedToCheckout();
                    }}
                    className="w-full py-3 bg-[#7C3AED] hover:bg-purple-700 text-white font-sans font-black text-xs uppercase tracking-wider rounded-lg shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Proceed to Checkout <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Product Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-45 bg-slate-900/50 backdrop-blur-xs flex items-end justify-center">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="bg-white w-full max-w-md rounded-t-xl shadow-2xl border-t border-slate-150 max-h-[90vh] flex flex-col"
            >
              <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto my-3" />

              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-3 left-4 p-1.5 rounded-full text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-3 right-4 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="overflow-y-auto px-6 pb-28 space-y-4 no-scrollbar flex-1">
                <div className="aspect-video w-full rounded-lg overflow-hidden bg-slate-50 border border-slate-100">
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {isOwnListing(selectedProduct) && (
                  <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <p className="text-[10px] font-sans text-slate-500 font-semibold">
                      This is your own listing — you can't buy or chat about it as a customer.
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between p-3 bg-purple-50/15 rounded-lg border border-purple-100/40">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#7C3AED] text-white font-sans font-black text-xs flex items-center justify-center">
                      {selectedProduct.sellerName.charAt(0)}
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-800 leading-tight">{selectedProduct.sellerName}</span>
                      <span className="text-[10px] text-slate-400">@{selectedProduct.sellerUsername} • Merchant</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-amber-500 block">★ {selectedProduct.rating}</span>
                    <span className="text-[9px] text-slate-400">Verified Seller</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="inline-block text-[9px] font-bold text-[#7C3AED] bg-[#F5F3FF] px-2 py-0.5 rounded-md">
                    {selectedProduct.category}
                  </span>
                  <h2 className="text-base font-sans font-black text-slate-900 leading-snug">
                    {selectedProduct.title}
                  </h2>
                  <div className="flex items-center gap-3 pt-1">
                    <span className="text-lg font-sans font-black text-slate-900">
                      ₦{selectedProduct.price.toLocaleString()}
                    </span>
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                      {selectedProduct.condition}
                    </span>
                  </div>
                </div>

                <div className="space-y-1 border-t border-slate-100 pt-3">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Product Description</span>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {selectedProduct.description}
                  </p>
                </div>

                {/* Visit Store Button in Modal - BLINKING */}
                {!isOwnListing(selectedProduct) && (
                  <button
                    onClick={() => {
                      onVisitStore(selectedProduct.sellerUsername);
                      setSelectedProduct(null);
                    }}
                    className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-sans font-bold text-xs rounded-lg shadow-lg flex items-center justify-center gap-2 animate-pulse hover:animate-none transition-all duration-300 hover:scale-[1.02]"
                  >
                    <Store className="w-4 h-4" />
                    Visit Store
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                  </button>
                )}
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 flex gap-3">
                {isOwnListing(selectedProduct) ? (
                  <div className="flex-1 py-3 bg-slate-50 text-slate-400 font-sans font-bold text-xs rounded-lg border border-slate-200/50 text-center flex items-center justify-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" /> This is your own listing
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        onStartChatWithSeller(selectedProduct.sellerUsername, selectedProduct.sellerName);
                        setSelectedProduct(null);
                      }}
                      className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-sans font-bold text-xs rounded-lg border border-slate-200/50 cursor-pointer text-center transition-colors"
                    >
                      Chat with Seller
                    </button>
                    <button
                      onClick={() => {
                        onAddToCart(selectedProduct);
                        setSelectedProduct(null);
                        setCartOpen(true);
                      }}
                      className="flex-1 py-3 bg-[#7C3AED] hover:bg-purple-700 text-white font-sans font-bold text-xs rounded-lg shadow-md cursor-pointer text-center transition-all"
                    >
                      Add to Cart
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Demand Modal */}
      <AnimatePresence>
        {selectedDemand && (
          <div className="fixed inset-0 z-45 bg-slate-900/50 backdrop-blur-xs flex items-end justify-center">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="bg-white w-full max-w-md rounded-t-xl shadow-2xl border-t border-slate-150 max-h-[90vh] flex flex-col"
            >
              <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto my-3" />

              <button
                onClick={() => setSelectedDemand(null)}
                className="absolute top-3 right-4 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="overflow-y-auto px-6 pb-28 space-y-4 no-scrollbar flex-1">
                <div className="aspect-video w-full rounded-lg overflow-hidden bg-slate-50 border border-slate-100">
                  <img
                    src={selectedDemand.image}
                    alt={selectedDemand.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-50/15 rounded-lg border border-purple-100/40">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#7C3AED] text-white font-sans font-black text-xs flex items-center justify-center">
                      {selectedDemand.buyerName.charAt(0)}
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-800 leading-tight">{selectedDemand.buyerName}</span>
                      <span className="text-[10px] text-slate-400">@{selectedDemand.buyerUsername} • Requester</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-[#7C3AED] bg-[#F5F3FF] px-2 py-0.5 rounded border border-purple-250">
                      {selectedDemand.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="inline-block text-[9px] font-bold text-[#7C3AED] bg-[#F5F3FF] px-2 py-0.5 rounded-md">
                    {selectedDemand.category}
                  </span>
                  <h2 className="text-base font-sans font-black text-slate-900 leading-snug">
                    {selectedDemand.title}
                  </h2>
                  <div className="flex items-center gap-3 pt-1">
                    <span className="text-xs font-bold text-slate-400">Target Budget:</span>
                    <span className="text-lg font-sans font-black text-slate-900">
                      ₦{selectedDemand.price.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">Condition requested: <strong className="text-slate-700">{selectedDemand.condition}</strong></p>
                </div>

                <div className="space-y-1 border-t border-slate-100 pt-3">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Demand Description</span>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {selectedDemand.description}
                  </p>
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 flex gap-3">
                <button
                  onClick={() => setSelectedDemand(null)}
                  className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-sans font-bold text-xs rounded-lg border border-slate-200/50 cursor-pointer text-center transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    onStartChatWithSeller(selectedDemand.buyerUsername, selectedDemand.buyerName);
                    setSelectedDemand(null);
                  }}
                  className="flex-1 py-3 bg-[#7C3AED] hover:bg-purple-700 text-white font-sans font-bold text-xs rounded-lg shadow-md cursor-pointer text-center transition-all"
                >
                  Send Offer Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <QuickTransferModal open={quickTransferOpen} onClose={() => setQuickTransferOpen(false)} />
    </>
  );
}