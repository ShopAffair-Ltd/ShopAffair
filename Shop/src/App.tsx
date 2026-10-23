/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams, useLocation, Navigate } from 'react-router-dom';
import { MarketProduct } from './types';

import { useAuth } from './context/AuthContext';
import { useMarket } from './context/MarketContext';
import { useTrades } from './context/TradeContext';
import { useChat } from './context/ChatContext';
import { useStore } from './context/StoreContext';
import { useWallet } from './context/WalletContext';
import { useAdmin } from './context/AdminContext';
import { useAuthModal } from './context/AuthModalContext';

import Preloader from './components/Preloader/Preloader';
import BottomNav from './components/layout/BottomNav';
import AppHeader from './components/layout/AppHeader';
import VerificationGate from './components/layout/VerificationGate';
import AuthModal from './components/AuthModal';
import ForgotPasswordModal from './components/ForgotPasswordModal';
import MarketView from './components/MarketView';
import FavoritesView from './components/FavoritesView';
import HomeView from './components/HomeView';
import TransferHistoryView from './components/TransferHistoryView';
import TradeHistoryView from './components/TradeHistoryView';
import TradeView from './components/TradeView';
import ChatView from './components/ChatView';
import AdminPortal from './components/AdminPortal';
import LandingPage from './landing/LandingPage';
import ProfileView from './components/account/ProfileView';
import CheckoutView from './components/CheckoutView';
import MyStoreView from './components/MyStoreView';
import StoreProfile from './components/StoreProfile';
import StoreUpgradeModal from './components/modals/StoreUpgradeModal';
import DepositModal from './components/modals/DepositModal';
import TransferModal from './components/modals/TransferModal';
import RedeemPromoModal from './components/modals/RedeemPromoModal';
import WalletCallback from './components/wallet/WalletCallback';

import { UserProfile } from './types';
import { api } from './services/api';

const GUEST_PROFILE: UserProfile = {
  id: 'guest',
  tempId: 'GUEST',
  name: 'Guest',
  username: 'guest',
  email: '',
  role: 'buyer',
  verificationStatus: 'GUEST',
  walletBalance: 0,
  isPro: false,
  avatarColor: 'bg-slate-400'
} as UserProfile;

function GlobalOverlays() {
  const { addAuditLog } = useAdmin();
  const { storeUpgradeOpen, selectedStorePlan, activating, activateError, closeStoreUpgrade, selectPlan, activatePlan } = useStore();
  const { depositOpen, transferOpen, redeemOpen, closeDeposit, closeTransfer, closeRedeem, deposit, transfer, redeemPromo } = useWallet();
  const { user } = useAuth();
  const activeProfile = user ?? GUEST_PROFILE;
  const navigate = useNavigate();

  return (
    <>
      <StoreUpgradeModal
        isOpen={storeUpgradeOpen}
        selectedStorePlan={selectedStorePlan}
        activating={activating}
        activateError={activateError}
        onClose={closeStoreUpgrade}
        onSelectPlan={selectPlan}
        onActivatePlan={activatePlan}
        onAddAuditLog={addAuditLog}
        onNavigateToMyStore={() => navigate('/my-store')}
        activeUsername={activeProfile.username}
      />
      <DepositModal
        isOpen={depositOpen}
        onClose={closeDeposit}
        onDeposit={deposit}
        onAddAuditLog={addAuditLog}
        activeUsername={activeProfile.username}
      />
      <TransferModal
        isOpen={transferOpen}
        onClose={closeTransfer}
        onTransfer={transfer}
        onAddAuditLog={addAuditLog}
        activeUsername={activeProfile.username}
        accountHolderName={activeProfile.name}
        verifiedAccountNumber={activeProfile.accountNumber}
        verifiedBankName={activeProfile.bankName}
      />
      <RedeemPromoModal isOpen={redeemOpen} onClose={closeRedeem} onRedeem={redeemPromo} />
    </>
  );
}

function Shell({
  children,
  showChrome,
  showBackButton = false,
  onBack,
  chatPartnerName
}: {
  children: React.ReactNode;
  showChrome: boolean;
  showBackButton?: boolean;
  onBack?: () => void;
  chatPartnerName?: string;
}) {
  const { user, logout } = useAuth();
  const { totalUnread } = useChat();
  const navigate = useNavigate();
  const location = useLocation();
  const activeProfile = user ?? GUEST_PROFILE;
  const isGuest = activeProfile.verificationStatus === 'GUEST';

  // Derived from router state (not window.location read once at mount), so
  // the bottom nav / header always reflect the real current route - this is
  // what makes the Home tab actually highlight after client-side navigation.
  const currentTab = location.pathname.split('/')[1] || 'home';

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center text-slate-800 antialiased selection:bg-purple-100 font-sans">
      <div className="w-full max-w-md min-h-screen bg-white flex flex-col relative overflow-hidden shadow-2xl shadow-purple-950/5 border-x border-slate-100">
        {showChrome && !isGuest && (
          <AppHeader
            activeTab={currentTab as never}
            activeProfile={activeProfile}
            onNavigateTab={(tab) => navigate(`/${tab === 'home' ? '' : tab}`)}
            onLogout={() => {
              logout();
              navigate('/');
            }}
            showBackButton={showBackButton}
            onBack={onBack}
            chatPartnerName={chatPartnerName}
          />
        )}

        {children}

        {showChrome && (
          <BottomNav
            activeTab={currentTab as never}
            onTabChange={(tab: string) => navigate(`/${tab === 'home' ? '' : tab}`)}
            unreadChatsCount={totalUnread}
            activeProfile={activeProfile}
          />
        )}

        <GlobalOverlays />
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { openLogin, openRegister, openVerifyWizard } = useAuthModal();
  const activeProfile = user ?? GUEST_PROFILE;
  const [chatPartnerName, setChatPartnerName] = useState('');

  // Any path with a segment past the tab root is a sub-screen (trade detail,
  // trade edit, a specific chat thread, etc.) and should show a back button
  // that walks real browser history - this covers private chat, a trade card
  // opened from a store, and every other deep-link path in one place instead
  // of only special-casing chat.
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const isSubScreen = pathSegments.length > 1;
  const isChatThread = pathSegments[0] === 'chat' && pathSegments.length > 1;

  const handleBack = () => {
    navigate(-1);
  };

  // Guests (no signed-in user) never see the real page - Home, Trade, Chat,
  // Profile, Checkout, and My Store all depend on real account data and
  // authenticated API calls, so rendering them for a guest previously just
  // produced a blank screen. VerificationGate's GUEST branch shows a proper
  // sign-in/sign-up prompt instead.
  if (!user) {
    return (
      <Shell showChrome>
        <VerificationGate
          activeProfile={activeProfile}
          onNavigateToMarket={() => navigate('/market')}
          onOpenAuth={(mode) => {
            if (mode === 'login') openLogin();
            else if (mode === 'register') openRegister();
            else openVerifyWizard();
          }}
          onUpdateUser={updateUser}
        />
      </Shell>
    );
  }

  return (
    <Shell
      showChrome
      showBackButton={isSubScreen}
      onBack={handleBack}
      chatPartnerName={isChatThread ? chatPartnerName : undefined}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === ChatView) {
          return React.cloneElement(child, {
            onChatPartnerName: (name: string) => {
              setChatPartnerName(name);
            }
          } as any);
        }
        return child;
      })}
    </Shell>
  );
}

function TransferHistoryRoute() {
  const navigate = useNavigate();
  return <TransferHistoryView onBack={() => navigate(-1)} />;
}

function TradeHistoryRoute() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { trades, cancelTrade } = useTrades();
  if (!user) return null;
  return (
    <TradeHistoryView
      trades={trades}
      activeUsername={user.username}
      onSelectTrade={(id) => navigate(`/trade/${id}`)}
      onCancelTrade={async (id) => {
        await cancelTrade(id);
      }}
      onBack={() => navigate(-1)}
    />
  );
}

function MarketRoute() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openRegister } = useAuthModal();
  const { createTrade } = useTrades();
  const { startChatWithSeller } = useChat();
  const activeProfile = user ?? GUEST_PROFILE;

  const handleStartChatWithSeller = (sellerUsername: string, sellerName: string) => {
    startChatWithSeller(sellerUsername, sellerName);
    navigate('/chat');
  };

  const handleInitiateBuy = async (product: MarketProduct) => {
    const created = await createTrade({
      title: product.title,
      amount: product.price,
      type: 'Supply' as never,
      category: 'Physical' as never,
      condition: product.condition,
      deliveryFee: 1500,
      deliveryTime: '2-3 days',
      image: product.image
    });
    navigate('/trade');
  };

  const handleProceedToCheckout = () => {
    if (activeProfile.verificationStatus === 'GUEST') {
      openRegister();
    } else {
      navigate('/checkout');
    }
  };

  return (
    <Shell showChrome={true}>
      <MarketView />
    </Shell>
  );
}

function StoreProfileRoute() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { products } = useMarket();
  const { startChatWithSeller } = useChat();
  const [sellerData, setSellerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSeller = async () => {
      try {
        const response = await api.get(`/users/username/${username}`);
        setSellerData(response.data.user);
      } catch (error) {
        console.error('Failed to fetch seller:', error);
      } finally {
        setLoading(false);
      }
    };
    if (username) {
      fetchSeller();
    }
  }, [username]);

  if (loading) {
    return (
      <Shell showChrome={true}>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </Shell>
    );
  }

  if (!sellerData) {
    return (
      <Shell showChrome={true}>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-slate-400">Seller not found</p>
        </div>
      </Shell>
    );
  }
  return (
    <Shell showChrome={true}>
      <StoreProfile
        seller={{
          id: sellerData.id,
          name: sellerData.name,
          username: sellerData.username,
          storeName: sellerData.storeName || `${sellerData.name}'s Store`,
          location: sellerData.location || 'Nigeria',
          category: sellerData.storeCategory || 'General',
          plan: sellerData.isPro ? 'Pro Plan' : 'Free Plan',
          bio: sellerData.bio || 'No bio available',
          rating: sellerData.rating || 0,
          reviewsCount: sellerData.reviewsCount || 0,
          totalSales: sellerData.totalSales || 0,
          avatar: sellerData.name?.charAt(0) || 'S',
          avatarColor: sellerData.avatarColor || 'bg-purple-600',
          coverImage: sellerData.coverImage || null,
          isVerified: sellerData.verificationStatus === 'VERIFIED',
          followers: sellerData.followers || 0,
          followingByMe: sellerData.followingByMe || false,
          joinedDate: sellerData.createdAt || undefined
        }}
        products={products.filter((p) => p.sellerUsername === username)}
        onBack={() => navigate(-1)}
        onChat={(sellerUsername: string, sellerName: string) => {
          startChatWithSeller(sellerUsername, sellerName);
          navigate('/chat');
        }}
        onFollow={() => alert(`You are now following ${username}`)}
        onProductClick={() => navigate('/market')}
      />
    </Shell>
  );
}

export default function App() {
  const [isPreloaderActive, setIsPreloaderActive] = useState(true);
  const [showLanding, setShowLanding] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { user, isLoading: authLoading } = useAuth();
  const { openLogin, openRegister, close: closeAuthModal } = useAuthModal();
  const navigate = useNavigate();

  // Decide purely on token presence, not on whether `user` has loaded
  // yet - `user` can be briefly null even for a valid session (still
  // loading, or a transient fetch failure that intentionally preserves
  // the token - see authService.getCurrentUser). Showing landing here
  // based on `user` alone would incorrectly boot a real session back to
  // the landing page whenever that fetch hasn't resolved yet.
  //
  // G1 FIX: If a token exists, we should NEVER show the landing page on
  // refresh - we stay on the current route. Landing is only for brand new
  // visitors with no token.
  useEffect(() => {
    const token = localStorage.getItem('shopfair_token');
    setShowLanding(!token);
  }, []);

  // A successful login or signup issues a token and populates `user`, but
  // `showLanding` was only ever set on mount - without this, closing the
  // auth modal just re-revealed the landing page underneath instead of
  // entering the app. Mirrors what the landing page's own CTA does.
  const handleAuthenticated = () => {
    setShowLanding(false);
    navigate('/');
  };

  if (authLoading) {
    return <Preloader onComplete={() => { }} />;
  }

  return (
    <>
      <AuthModal
        onForgotPassword={() => {
          closeAuthModal();
          setShowForgotPassword(true);
        }}
        onAuthenticated={handleAuthenticated}
      />
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        onBackToLogin={() => {
          setShowForgotPassword(false);
          openLogin();
        }}
      />

      {showLanding ? (
        <LandingPage
          onEnterPlatform={() => {
            setShowLanding(false);
            navigate('/market');
          }}
          onLogin={openLogin}
          onRegister={openRegister}
        />
      ) : user?.role === 'admin' ? (
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">
          {isPreloaderActive && <Preloader onComplete={() => setIsPreloaderActive(false)} />}
          <AdminPortal />
        </div>
      ) : (
        <>
          {isPreloaderActive && <Preloader onComplete={() => setIsPreloaderActive(false)} />}
          <Routes>
            <Route path="/market" element={<MarketRoute />} />
            <Route
              path="/favorites"
              element={
                <ProtectedRoute>
                  <FavoritesView />
                </ProtectedRoute>
              }
            />
            <Route path="/store/:username" element={<StoreProfileRoute />} />
            <Route
              path="/wallet/callback"
              element={
                <ProtectedRoute>
                  <WalletCallback />
                </ProtectedRoute>
              }
            />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <HomeView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/transfer-history"
              element={
                <ProtectedRoute>
                  <TransferHistoryRoute />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trade"
              element={
                <ProtectedRoute>
                  <TradeView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trade/:tradeId"
              element={
                <ProtectedRoute>
                  <TradeView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trade/:tradeId/:mode"
              element={
                <ProtectedRoute>
                  <TradeView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trade-history"
              element={
                <ProtectedRoute>
                  <TradeHistoryRoute />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <ChatView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat/:roomUsername"
              element={
                <ProtectedRoute>
                  <ChatView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfileView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/:username"
              element={
                <ProtectedRoute>
                  <ProfileView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <CheckoutView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-store"
              element={
                <Shell showChrome={true}>
                  <MyStoreView />
                </Shell>
              }
            />
            <Route path="*" element={<Navigate to="/market" replace />} />
          </Routes>
        </>
      )}
    </>
  );
}