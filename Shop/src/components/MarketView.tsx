import React, { useState, useEffect } from 'react';
import { MarketProduct } from '../types';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useMarket } from '../context/MarketContext';
import { useChat } from '../context/ChatContext';
import { useAuthModal } from '../context/AuthModalContext';
import { useNavigate } from 'react-router-dom';
import MarketHeader from './MarketHeader';
import MarketProductList from './MarketProductList';

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
    bgGradient: 'from-red-600 via-rose-700 to-pink-700',
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
    bgGradient: 'from-emerald-600 via-teal-700 to-cyan-700',
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
    bgGradient: 'from-amber-600 via-orange-700 to-yellow-700',
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
  const { startChatWithSeller } = useChat();
  const navigate = useNavigate();

  const activeProfile = user;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Trending');
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

  const mockDemands = [
    {
      id: 'dem_1',
      title: 'Looking for iPhone 15 Pro Max',
      price: 1050000,
      buyerName: 'Tech Explorer',
      buyerUsername: 'techexplore',
      category: 'Phones',
      condition: 'New or Like New',
      description: 'Need a titanium blue or natural titanium 256GB iPhone 15 Pro Max. Must have 95%+ battery health.',
      image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&q=80&w=150',
      offersCount: 4,
      status: 'Active'
    },
    {
      id: 'dem_2',
      title: 'Toyota Camry 2018+ wanted',
      price: 15500000,
      buyerName: 'Auto Dealer NG',
      buyerUsername: 'autodealer_ng',
      category: 'Vehicles',
      condition: 'Foreign Used',
      description: 'Urgently buying a clean Toyota Camry 2018 or newer. Full option, low mileage preferred.',
      image: 'https://images.unsplash.com/photo-1621007947382-cc34aa8668c2?auto=format&fit=crop&q=80&w=150',
      offersCount: 7,
      status: 'Active'
    },
    {
      id: 'dem_3',
      title: 'Urgently need 3-Bedroom Lekki Duplex',
      price: 85000000,
      buyerName: 'John Estates',
      buyerUsername: 'john_estates',
      category: 'Houses',
      condition: 'New',
      description: 'Looking to purchase a detached 3-bedroom duplex around Lekki Phase 1 / Orchid Road.',
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=150',
      offersCount: 2,
      status: 'Active'
    },
    {
      id: 'dem_4',
      title: 'Looking for Bulk Screen Repair Kits',
      price: 45000,
      buyerName: 'FixIt Hub',
      buyerUsername: 'fixit_hub',
      category: 'Repair',
      condition: 'New',
      description: 'Need 10 sets of high-grade screen separation and repair toolkits for mobile phone workshop.',
      image: 'https://images.unsplash.com/photo-1597740985671-2a8a3b80f02e?auto=format&fit=crop&q=80&w=150',
      offersCount: 3,
      status: 'Active'
    }
  ];

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase());

    if (selectedCategory === 'Trending') {
      return matchesSearch;
    }

    const matchesCategory = product.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const filteredDemands = mockDemands.filter((demand) => {
    const matchesSearch =
      demand.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      demand.category.toLowerCase().includes(searchQuery.toLowerCase());

    if (selectedCategory === 'Trending') {
      return matchesSearch;
    }

    const matchesCategory = demand.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const goToSlide = (index: number) => setCurrentSlide(index);
  const goToHotDealSlide = (index: number) => setHotDealSlide(index);

  const handleVisitStore = (sellerUsername: string) => {
    navigate(`/store/${sellerUsername}`);
  };

  const handleStartChatWithSeller = (sellerUsername: string, sellerName: string) => {
    startChatWithSeller(sellerUsername, sellerName);
    navigate('/chat');
  };

  const handleProceedToCheckout = () => {
    if (!activeProfile || activeProfile.verificationStatus === 'GUEST') {
      openRegister();
    } else {
      navigate('/checkout');
    }
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
        onAddToCart={addToCart}
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