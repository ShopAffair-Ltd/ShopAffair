import React, { useState, useEffect } from 'react';
import { MarketProduct, TradeType, TradeVisibility, EscrowStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useMarket } from '../context/MarketContext';
import { useTrades } from '../context/TradeContext';
import { useChat } from '../context/ChatContext';
import { useAuthModal } from '../context/AuthModalContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { isTradeBasedProductId, stripTradeIdPrefix } from '../services/TradeService';
import MarketHeader from './MarketHeader';
import MarketProductList from './MarketProductList';
import MarketFilterPanel from './MarketFilterPanel';

const carouselMessages = [
  { text: 'ShopAffairShop', subtext: 'Your trusted marketplace', icon: 'Store' },
  { text: 'Flash Sale Live!', subtext: 'Up to 40% off', icon: 'Zap' },
  { text: 'New Arrivals', subtext: 'Check out latest products', icon: 'Sparkles' },
  { text: 'Premium Deals', subtext: 'Exclusive offers', icon: 'Gem' },
  { text: 'Fast Delivery', subtext: 'Get it in 24hrs', icon: 'Truck' },
  { text: 'Secure Escrow', subtext: '100% protected', icon: 'Shield' }
];

const hotDeals = [
  {
    id: 'hot_1',
    title: 'GET UP TO 25% OFF',
    subtitle: 'Limited time offer. T&Cs apply',
    bgGradient: 'from-purple-600 via-purple-700 to-indigo-700',
    tag: 'HOT DEAL',
    tag2: 'LIMITED TIME',
    timeLeft: '3h 45m',
    icon: 'Flame',
    images: [
      'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&q=80&w=100',
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=100',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=100'
    ]
  },
  {
    id: 'hot_2',
    title: 'FLASH SALE 40% OFF',
    subtitle: 'Electronics & Gadgets',
    bgGradient: 'from-purple-700 via-violet-600 to-purple-500',
    tag: 'FLASH SALE',
    tag2: 'TODAY ONLY',
    timeLeft: '1h 30m',
    icon: 'Zap',
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=100',
      'https://images.unsplash.com/photo-1588423771073-b8903fbb85b5?auto=format&fit=crop&q=80&w=100',
      'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&q=80&w=100'
    ]
  },
  {
    id: 'hot_3',
    title: 'BUY 1 GET 1 FREE',
    subtitle: 'Selected items only',
    bgGradient: 'from-indigo-600 via-purple-600 to-violet-700',
    tag: 'BOGO OFFER',
    tag2: 'LIMITED STOCK',
    timeLeft: '5h 20m',
    icon: 'Gift',
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=100',
      'https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&q=80&w=100',
      'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&q=80&w=100'
    ]
  },
  {
    id: 'hot_4',
    title: 'PREMIUM DEALS',
    subtitle: 'Luxury items at best prices',
    bgGradient: 'from-violet-700 via-purple-600 to-indigo-700',
    tag: 'PREMIUM',
    tag2: 'EXCLUSIVE',
    timeLeft: '2h 15m',
    icon: 'Gem',
    images: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=100',
      'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&q=80&w=100',
      'https://images.unsplash.com/photo-1610945265064-0e34e4d213b5?auto=format&fit=crop&q=80&w=100'
    ]
  }
];

export default function MarketView() {
  const { user } = useAuth();
  const { openRegister } = useAuthModal();
  const { cart, addToCart, updateQuantity, removeFromCart } = useCart();
  const { products, isLoading: productsLoading, error: productsError } = useMarket();
  const { trades } = useTrades();
  const { startChatWithSeller } = useChat();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const handleAddToCart = (product: MarketProduct) => {
    if (isTradeBasedProductId(product.id)) {
      navigate(`/trade?open=${stripTradeIdPrefix(product.id)}`);
      return;
    }
    addToCart(product);
  };

  const activeProfile = user;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Trending');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterMinPrice, setFilterMinPrice] = useState('');
  const [filterMaxPrice, setFilterMaxPrice] = useState('');
  const [filterCondition, setFilterCondition] = useState<MarketProduct['condition'] | ''>('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<MarketProduct | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [marketTab, setMarketTab] = useState<'supply' | 'demands'>('supply');
  const [selectedDemand, setSelectedDemand] = useState<any | null>(null);
  const [quickTransferOpen, setQuickTransferOpen] = useState(false);
  const [accountNumber, setAccountNumber] = useState('2034785521');
  const [editingAccount, setEditingAccount] = useState(false);
  const [accountDraft, setAccountDraft] = useState(accountNumber);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [hotDealSlide, setHotDealSlide] = useState(0);

  useEffect(() => {
    const openId = searchParams.get('product') || searchParams.get('open');
    if (openId && products.some((p) => p.id === openId)) {
      setSelectedProduct(products.find((p) => p.id === openId) ?? null);
      if (searchParams.get('open')) {
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.delete('open');
          next.set('product', openId);
          return next;
        }, { replace: true });
      }
    } else if (!openId) {
      window.scrollTo({ top: 0 });
    }
  }, [searchParams, products, setSearchParams]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselMessages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setHotDealSlide((prev) => (prev + 1) % hotDeals.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const isLoggedIn = !!(activeProfile && activeProfile.verificationStatus !== 'GUEST');
  const isOwnListing = (product: MarketProduct) =>
    !!activeProfile && activeProfile.username === product.sellerUsername;

  const activeFilterCount = [filterLocation, filterMinPrice, filterMaxPrice, filterCondition].filter(Boolean).length;

  const matchesFilters = (item: { location?: string; price: number; condition?: string }) => {
    if (filterLocation && !(item.location ?? '').toLowerCase().includes(filterLocation.toLowerCase())) {
      return false;
    }
    if (filterMinPrice && item.price < Number(filterMinPrice)) {
      return false;
    }
    if (filterMaxPrice && item.price > Number(filterMaxPrice)) {
      return false;
    }
    if (filterCondition && item.condition && item.condition !== filterCondition) {
      return false;
    }
    return true;
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'Trending' || product.category.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory && matchesFilters(product);
  });

  const filteredDemands = trades
    .filter(
      (t) =>
        t.type === TradeType.REQUEST &&
        t.visibility === TradeVisibility.MARKET &&
        t.status === EscrowStatus.PENDING
    )
    .map((t) => ({
      id: t.id,
      title: t.title,
      price: t.amount,
      buyerName: t.creatorName || t.creatorUsername,
      buyerUsername: t.creatorUsername,
      category: String(t.category),
      condition: t.condition || 'Any',
      description: t.description || '',
      image: t.image || 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=150',
      offersCount: 0,
      status: 'Active'
    }))
    .filter((demand) => {
      const matchesSearch =
        demand.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        demand.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === 'Trending' || demand.category.toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const goToSlide = (index: number) => setCurrentSlide(index);
  const goToHotDealSlide = (index: number) => setHotDealSlide(index);

  const handleVisitStore = (sellerUsername: string, returnProductId?: string) => {
    const productId = returnProductId || selectedProduct?.id;
    navigate(
      `/store/${sellerUsername}${productId ? `?fromProduct=${encodeURIComponent(productId)}` : ''}`,
      { state: { returnToProduct: productId } }
    );
  };

  const handleStartChatWithSeller = (
    sellerUsername: string,
    sellerName: string,
    product?: MarketProduct
  ) => {
    if (!activeProfile || activeProfile.verificationStatus === 'GUEST') {
      openRegister();
      return;
    }
    const item = product || selectedProduct;
    startChatWithSeller(sellerUsername, sellerName);
    navigate(`/chat/${sellerUsername}`, {
      state: item
        ? {
            enquiryTrade: {
              id: item.id,
              title: item.title,
              amount: item.price,
              image: item.image,
              category: item.category,
              condition: item.condition,
              sellerUsername: item.sellerUsername,
              sellerName: item.sellerName
            }
          }
        : undefined
    });
  };

  const handleProceedToCheckout = (productId?: string) => {
    if (!activeProfile || activeProfile.verificationStatus === 'GUEST') {
      openRegister();
      return;
    }
    if (productId) {
      if (isTradeBasedProductId(productId)) {
        navigate(`/trade?open=${stripTradeIdPrefix(productId)}`);
        return;
      }
      const prod = products.find((p) => p.id === productId);
      if (prod) {
        addToCart(prod);
      }
      navigate('/checkout', { state: { onlyProductId: productId } });
      return;
    }
    navigate('/checkout');
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F8F9FC] h-full overflow-hidden pb-24 relative font-sans">
      <MarketHeader
        isLoggedIn={isLoggedIn}
        activeProfile={activeProfile}
        showBalance={showBalance}
        setShowBalance={setShowBalance}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        cartCount={cartCount}
        setCartOpen={setCartOpen}
        currentSlide={currentSlide}
        goToSlide={goToSlide}
        carouselMessages={carouselMessages}
        editingAccount={editingAccount}
        setEditingAccount={setEditingAccount}
        accountNumber={accountNumber}
        setAccountNumber={setAccountNumber}
        accountDraft={accountDraft}
        setAccountDraft={setAccountDraft}
        saveAccountNumber={() => {
          setAccountNumber(accountDraft);
          setEditingAccount(false);
        }}
        cancelAccountEdit={() => {
          setAccountDraft(accountNumber);
          setEditingAccount(false);
        }}
        activeFilterCount={activeFilterCount}
        onOpenFilters={() => setShowFilterPanel(true)}
      />

      <MarketFilterPanel
        isOpen={showFilterPanel}
        onClose={() => setShowFilterPanel(false)}
        location={filterLocation}
        setLocation={setFilterLocation}
        minPrice={filterMinPrice}
        setMinPrice={setFilterMinPrice}
        maxPrice={filterMaxPrice}
        setMaxPrice={setFilterMaxPrice}
        condition={filterCondition}
        setCondition={setFilterCondition}
        onClear={() => {
          setFilterLocation('');
          setFilterMinPrice('');
          setFilterMaxPrice('');
          setFilterCondition('');
        }}
      />

      <MarketProductList
        isLoggedIn={isLoggedIn}
        activeProfile={activeProfile}
        hotDeals={hotDeals}
        hotDealSlide={hotDealSlide}
        goToHotDealSlide={goToHotDealSlide}
        marketTab={marketTab}
        setMarketTab={setMarketTab}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        activeGroup={activeGroup}
        setActiveGroup={setActiveGroup}
        filteredProducts={filteredProducts}
        productsLoading={productsLoading}
        productsError={productsError}
        filteredDemands={filteredDemands}
        selectedProduct={selectedProduct}
        setSelectedProduct={setSelectedProduct}
        selectedDemand={selectedDemand}
        setSelectedDemand={setSelectedDemand}
        cartOpen={cartOpen}
        setCartOpen={setCartOpen}
        cart={cart}
        cartTotal={cartTotal}
        cartCount={cartCount}
        onAddToCart={handleAddToCart}
        onUpdateCartQty={updateQuantity}
        onRemoveFromCart={removeFromCart}
        onProceedToCheckout={handleProceedToCheckout}
        onStartChatWithSeller={handleStartChatWithSeller}
        isOwnListing={isOwnListing}
        quickTransferOpen={quickTransferOpen}
        setQuickTransferOpen={setQuickTransferOpen}
        onVisitStore={handleVisitStore}
      />
    </div>
  );
}