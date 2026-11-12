import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, MapPin, BarChart3, CreditCard, History, Star, 
  AlertCircle, RefreshCw, Settings, ChevronRight, Copy, 
  Check, Camera, ArrowLeft, LogOut, ShieldCheck, 
  Bell, Lock, Sparkles, TrendingUp, Loader2
} from 'lucide-react';
import { EscrowStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useTrades } from '../../context/TradeContext';
import { useStore } from '../../context/StoreContext';
import { userService } from '../../services/userService';
import { uploadImage } from '../../services/UploadService';
import {
  fetchWalletTransactions,
  WalletTransaction,
  fetchSubscriptionStatus,
  SubscriptionStatus,
  TRIAL_PLAN_PRICE_DISPLAY,
  STARTER_PLAN_PRICE_DISPLAY
} from '../../services/paymentService';
import { reviewService, ReviewsResponse } from '../../services/reviewService';
import PublicProfileView from './PublicProfileView';

type SubScreen = 'main' | 'profile-info' | 'delivery-address' | 'analytics' | 'subscription' | 'transactions' | 'settings' | 'reviews' | 'disputes' | 'trades';

const VALID_SCREENS: SubScreen[] = [
  'main',
  'profile-info',
  'delivery-address',
  'analytics',
  'subscription',
  'transactions',
  'settings',
  'reviews',
  'disputes',
  'trades'
];

interface UserPreferences {
  pushNotifications: boolean;
  emailNotifications: boolean;
  twoFactorAuth: boolean;
  tradingPin: string;
}

const DEFAULT_PREFS: UserPreferences = {
  pushNotifications: true,
  emailNotifications: true,
  twoFactorAuth: false,
  tradingPin: ''
};

function getPrefsStorageKey(userId: string): string {
  return `shopfair_user_prefs_${userId}`;
}

function loadUserPreferences(userId?: string): UserPreferences {
  if (!userId) return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem(getPrefsStorageKey(userId));
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<UserPreferences>;
    return {
      pushNotifications: typeof parsed.pushNotifications === 'boolean' ? parsed.pushNotifications : true,
      emailNotifications: typeof parsed.emailNotifications === 'boolean' ? parsed.emailNotifications : true,
      twoFactorAuth: typeof parsed.twoFactorAuth === 'boolean' ? parsed.twoFactorAuth : false,
      tradingPin: typeof parsed.tradingPin === 'string' ? parsed.tradingPin : ''
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export default function ProfileView() {
  const navigate = useNavigate();
  const { username } = useParams<{ username?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user: activeProfile, updateUser: onUpdateProfile, logout } = useAuth();
  const { trades } = useTrades();
  const { openStoreUpgrade } = useStore();

  // If viewing someone else's profile via /profile/:username
  if (username && activeProfile && username.toLowerCase() !== activeProfile.username.toLowerCase()) {
    return <PublicProfileView username={username} />;
  }

  const onLogout = () => {
    logout();
    navigate('/market');
  };

  const screenParam = searchParams.get('screen') as SubScreen | null;
  const initialScreen: SubScreen = screenParam && VALID_SCREENS.includes(screenParam) ? screenParam : 'main';

  const [currentScreen, setCurrentScreen] = useState<SubScreen>(initialScreen);
  const [copiedId, setCopiedId] = useState(false);

  // Form states synced from activeProfile
  const [editName, setEditName] = useState(activeProfile?.name ?? '');
  const [editUsername, setEditUsername] = useState(activeProfile?.username ?? '');
  const [editPhone, setEditPhone] = useState(activeProfile?.phoneNumber ?? '');
  const [editAddress, setEditAddress] = useState(activeProfile?.deliveryAddress ?? '');

  // Action feedback states
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  // Persisted per-user settings preferences
  const [prefs, setPrefs] = useState<UserPreferences>(() => loadUserPreferences(activeProfile?.id));
  const [prefsSavedNotice, setPrefsSavedNotice] = useState(false);
  const [isEditingPin, setIsEditingPin] = useState(false);
  const [pinDraft, setPinDraft] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  // Real data states for transactions, subscription, and reviews
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [transactionsError, setTransactionsError] = useState<string | null>(null);

  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [reviewsData, setReviewsData] = useState<ReviewsResponse | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync URL query param -> subscreen
  useEffect(() => {
    const param = searchParams.get('screen') as SubScreen | null;
    if (param && VALID_SCREENS.includes(param)) {
      setCurrentScreen(param);
    } else if (!param) {
      setCurrentScreen('main');
    }
  }, [searchParams]);

  // Sync form fields & preferences when activeProfile updates
  useEffect(() => {
    if (!activeProfile) return;
    setEditName(activeProfile.name ?? '');
    setEditUsername(activeProfile.username ?? '');
    setEditPhone(activeProfile.phoneNumber ?? '');
    setEditAddress(activeProfile.deliveryAddress ?? '');
    setPrefs(loadUserPreferences(activeProfile.id));
  }, [
    activeProfile?.id,
    activeProfile?.name,
    activeProfile?.username,
    activeProfile?.phoneNumber,
    activeProfile?.deliveryAddress
  ]);

  // Load subscription status & review summary for active user
  useEffect(() => {
    if (!activeProfile?.username) return;
    let cancelled = false;

    fetchSubscriptionStatus()
      .then((data) => {
        if (!cancelled) setSubscriptionStatus(data);
      })
      .catch(() => {
        // Subscription status falls back to activeProfile.isPro
      });

    setLoadingReviews(true);
    reviewService
      .getSellerReviews(activeProfile.username)
      .then((res) => {
        if (!cancelled) setReviewsData(res.data);
      })
      .catch(() => {
        // Leave null so empty state shows cleanly
      })
      .finally(() => {
        if (!cancelled) setLoadingReviews(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeProfile?.username]);

  // Load wallet transactions when opening Transactions subscreen
  useEffect(() => {
    if (currentScreen !== 'transactions' || !activeProfile) return;
    let cancelled = false;
    setLoadingTransactions(true);
    setTransactionsError(null);

    fetchWalletTransactions({ page: 1, limit: 30 })
      .then((res) => {
        if (!cancelled) setTransactions(res.items);
      })
      .catch(() => {
        if (!cancelled) setTransactionsError('Could not load transaction history right now.');
      })
      .finally(() => {
        if (!cancelled) setLoadingTransactions(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentScreen, activeProfile?.id]);

  const navigateScreen = (screen: SubScreen) => {
    setFeedbackError(null);
    setFeedbackSuccess(null);
    setCurrentScreen(screen);
    if (screen === 'main') {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ screen }, { replace: true });
    }
  };

  const updatePreference = (patch: Partial<UserPreferences>) => {
    if (!activeProfile) return;
    const next = { ...prefs, ...patch };
    setPrefs(next);
    try {
      localStorage.setItem(getPrefsStorageKey(activeProfile.id), JSON.stringify(next));
      setPrefsSavedNotice(true);
      setTimeout(() => setPrefsSavedNotice(false), 2000);
    } catch {
      // Ignore storage quota errors
    }
  };

  // Real user trades & derived metrics
  const userTrades = useMemo(() => {
    if (!activeProfile?.username) return [];
    const handle = activeProfile.username.toLowerCase();
    return trades.filter(
      (t) =>
        t.creatorUsername?.toLowerCase() === handle ||
        t.buyerUsername?.toLowerCase() === handle
    );
  }, [trades, activeProfile?.username]);

  const disputedTrades = useMemo(
    () => userTrades.filter((t) => t.status === EscrowStatus.DISPUTED),
    [userTrades]
  );

  const tradeMetrics = useMemo(() => {
    const completed = userTrades.filter((t) => t.status === EscrowStatus.COMPLETED);
    const totalCount = activeProfile?.totalTrades ?? userTrades.length;
    const completedCount = activeProfile?.completedTrades ?? completed.length;
    const rate =
      activeProfile?.completionRate ||
      (totalCount > 0 ? `${Math.round((completedCount / totalCount) * 100)}%` : '0%');

    const totalCompletedVolume = completed.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const activeEscrowVolume = userTrades
      .filter((t) => t.status === EscrowStatus.FUNDED || t.status === EscrowStatus.DELIVERED)
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const monthlyCount = userTrades.filter(
      (t) => new Date(t.createdAt).getTime() >= thirtyDaysAgo
    ).length;

    const dailyBuckets = Array.from({ length: 7 }, (_, idx) => {
      const dayOffset = 6 - idx;
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - dayOffset);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      const label = start.toLocaleDateString('en-US', { weekday: 'short' });
      const volume = userTrades
        .filter((t) => {
          const ts = new Date(t.createdAt).getTime();
          return ts >= start.getTime() && ts < end.getTime();
        })
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      return { label, volume };
    });

    const maxDailyVolume = Math.max(...dailyBuckets.map((b) => b.volume), 1);

    return {
      totalCount,
      completedCount,
      rate,
      totalCompletedVolume,
      activeEscrowVolume,
      monthlyCount,
      dailyBuckets,
      maxDailyVolume
    };
  }, [userTrades, activeProfile?.totalTrades, activeProfile?.completedTrades, activeProfile?.completionRate]);

  // Copy Profile ID
  const handleCopyId = () => {
    if (!activeProfile) return;
    const profileId = activeProfile.tempId || activeProfile.id;
    navigator.clipboard.writeText(profileId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Image Upload handler -> uploads to backend and saves URL on user profile
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeProfile) return;

    setIsUploadingAvatar(true);
    setFeedbackError(null);
    try {
      const imageUrl = await uploadImage(file);
      const updated = await userService.updateMyProfile({ profilePicture: imageUrl });
      onUpdateProfile({
        ...activeProfile,
        ...updated,
        profilePicture: updated.profilePicture ?? imageUrl
      });
    } catch {
      setFeedbackError('Could not upload profile photo. Please try again.');
    } finally {
      setIsUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const handleSaveProfileInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProfile) return;
    setIsSavingProfile(true);
    setFeedbackError(null);
    setFeedbackSuccess(null);
    try {
      const updated = await userService.updateMyProfile({
        name: editName.trim(),
        username: editUsername.trim(),
        phoneNumber: editPhone.trim()
      });
      onUpdateProfile({
        ...activeProfile,
        ...updated
      });
      setFeedbackSuccess('Profile details updated.');
      navigateScreen('main');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Failed to save profile details.';
      setFeedbackError(message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProfile) return;
    setIsSavingAddress(true);
    setFeedbackError(null);
    setFeedbackSuccess(null);
    try {
      const updated = await userService.updateMyProfile({
        deliveryAddress: editAddress.trim()
      });
      onUpdateProfile({
        ...activeProfile,
        ...updated
      });
      setFeedbackSuccess('Delivery address updated.');
      navigateScreen('main');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Failed to save delivery address.';
      setFeedbackError(message);
    } finally {
      setIsSavingAddress(false);
    }
  };

  if (!activeProfile) return null;

  const reviewCount = reviewsData?.stats.totalReviews ?? activeProfile.reviewsCount ?? 0;
  const averageRating = reviewsData?.stats.averageRating ?? activeProfile.rating ?? 0;

  return (
    <div className="flex-1 flex flex-col bg-slate-50 h-full overflow-hidden">
      
      {/* HEADER BAR */}
      <div className="sticky top-0 bg-white z-10 px-4 py-4 border-b border-slate-100 flex items-center justify-between shadow-xs">
        {currentScreen !== 'main' ? (
          <button 
            onClick={() => navigateScreen('main')}
            className="p-1.5 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer text-slate-600 flex items-center gap-1.5"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-xs font-sans font-bold">Back</span>
          </button>
        ) : (
          <h1 className="text-xl font-display font-black text-slate-900 tracking-tight">Profile</h1>
        )}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold bg-purple-50 text-purple-600 px-2.5 py-1 rounded-full uppercase">
            {activeProfile.verificationStatus}
          </span>
        </div>
      </div>

      {/* VIEWPORT CONTROLLER */}
      <div
        className="flex-1 overflow-y-auto no-scrollbar"
        style={{ paddingBottom: 'max(140px, calc(140px + env(safe-area-inset-bottom, 0px)))' }}
      >
        {feedbackError && (
          <div className="mx-4 mt-3 px-3.5 py-2.5 bg-red-50 border border-red-200 rounded-xl text-xs font-sans text-red-700">
            {feedbackError}
          </div>
        )}
        {feedbackSuccess && (
          <div className="mx-4 mt-3 px-3.5 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-sans text-emerald-700">
            {feedbackSuccess}
          </div>
        )}
        <AnimatePresence mode="wait">
          
          {/* 1. MAIN PROFILE DASHBOARD */}
          {currentScreen === 'main' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 space-y-6"
            >
              {/* Profile Card Info */}
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
                <div className="relative group mb-3">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-3 border-purple-100 bg-slate-100 flex items-center justify-center shadow-md">
                    {activeProfile.profilePicture ? (
                      <img 
                        src={activeProfile.profilePicture} 
                        alt={activeProfile.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-slate-400">
                        {activeProfile.name?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="absolute -bottom-1 -right-1 p-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white rounded-full border-2 border-white shadow-sm transition-colors cursor-pointer"
                  >
                    {isUploadingAvatar ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                    accept="image/*" 
                    className="hidden" 
                  />
                </div>

                <div>
                  <h2 className="text-lg font-sans font-black text-slate-900 flex items-center justify-center gap-1.5">
                    {activeProfile.name}
                    {activeProfile.verificationStatus === 'VERIFIED' && (
                      <ShieldCheck className="w-4.5 h-4.5 text-orange-500 fill-orange-500/10" />
                    )}
                  </h2>
                  <p className="text-xs text-slate-400 font-sans">@{activeProfile.username}</p>
                </div>

                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200/50 rounded-xl">
                  <span className="text-[10px] font-mono text-slate-500">ID: #{activeProfile.tempId || activeProfile.id}</span>
                  <button 
                    onClick={handleCopyId}
                    className="p-1 hover:bg-slate-200/50 rounded-md transition-colors cursor-pointer text-slate-400 hover:text-slate-600"
                  >
                    {copiedId ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Store Plan Banner */}
              <button 
                onClick={() => navigateScreen('subscription')}
                className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white p-4 rounded-2xl flex items-center justify-between shadow-md shadow-orange-500/10 transition-all text-left cursor-pointer border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-xl">
                    <Sparkles className="w-5 h-5 text-amber-200" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold tracking-wide text-orange-100 uppercase">
                      {subscriptionStatus?.isPro || activeProfile.isPro
                        ? `${subscriptionStatus?.storePlan === 'TRIAL' ? 'Trial' : 'Starter'} Plan Active`
                        : 'Upgrade Your Store'}
                    </span>
                    <span className="text-[11px] text-white/90">
                      {subscriptionStatus?.isPro || activeProfile.isPro
                        ? 'View your active store plan & listing limits'
                        : 'Unlock store capacity and marketplace listings'}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/80" />
              </button>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white p-3.5 rounded-2xl border border-slate-100 text-center shadow-xs">
                  <span className="block text-lg font-sans font-black text-slate-900">{tradeMetrics.totalCount}</span>
                  <span className="text-[10px] text-slate-400 font-sans font-medium">Total Trades</span>
                </div>
                <div className="bg-white p-3.5 rounded-2xl border border-slate-100 text-center shadow-xs">
                  <span className="block text-lg font-sans font-black text-emerald-600">{tradeMetrics.rate}</span>
                  <span className="text-[10px] text-slate-400 font-sans font-medium">Completion</span>
                </div>
                <div className="bg-white p-3.5 rounded-2xl border border-slate-100 text-center shadow-xs">
                  <span className="block text-lg font-sans font-black text-slate-900">{tradeMetrics.completedCount}</span>
                  <span className="text-[10px] text-slate-400 font-sans font-medium">Completed</span>
                </div>
              </div>

              {/* ACCOUNT SECTION LIST */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest pl-1 block">Account</span>
                
                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs divide-y divide-slate-50">
                  <button 
                    onClick={() => navigateScreen('profile-info')}
                    className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 text-slate-700">
                      <User className="w-4.5 h-4.5 text-purple-600" />
                      <div>
                        <span className="block text-xs font-bold text-slate-800">Profile Information</span>
                        <span className="text-[10px] text-slate-400">Identity, verification, and public profile</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button 
                    onClick={() => navigateScreen('delivery-address')}
                    className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 text-slate-700">
                      <MapPin className="w-4.5 h-4.5 text-purple-600" />
                      <div>
                        <span className="block text-xs font-bold text-slate-800">Delivery Address</span>
                        <span className="text-[10px] text-slate-400">
                          {activeProfile.deliveryAddress ? activeProfile.deliveryAddress : 'Set your default delivery location'}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button 
                    onClick={() => navigateScreen('analytics')}
                    className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 text-slate-700">
                      <BarChart3 className="w-4.5 h-4.5 text-purple-600" />
                      <div>
                        <span className="block text-xs font-bold text-slate-800">Store Analytics</span>
                        <span className="text-[10px] text-slate-400">Monitor your sales and progress</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button 
                    onClick={() => navigateScreen('subscription')}
                    className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 text-slate-700">
                      <CreditCard className="w-4.5 h-4.5 text-purple-600" />
                      <div>
                        <span className="block text-xs font-bold text-slate-800">Subscription Tiers</span>
                        <span className="text-[10px] text-slate-400">Check your subscription level.</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button 
                    onClick={() => navigateScreen('transactions')}
                    className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 text-slate-700">
                      <History className="w-4.5 h-4.5 text-purple-600" />
                      <div>
                        <span className="block text-xs font-bold text-slate-800">Transaction History</span>
                        <span className="text-[10px] text-slate-400">Record of wallet and trade activity</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>

              {/* SYSTEM SECTION LIST */}
              <div className="space-y-2 pb-6">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest pl-1 block">System</span>
                
                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs divide-y divide-slate-50">
                  <button 
                    onClick={() => navigateScreen('reviews')}
                    className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 text-slate-700">
                      <Star className="w-4.5 h-4.5 text-amber-500 fill-amber-500/15" />
                      <div>
                        <span className="block text-xs font-bold text-slate-800">Review History</span>
                        <span className="text-[10px] text-slate-400">
                          {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'} from buyers
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button 
                    onClick={() => navigateScreen('disputes')}
                    className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 text-slate-700">
                      <AlertCircle className="w-4.5 h-4.5 text-red-500" />
                      <div>
                        <span className="block text-xs font-bold text-slate-800">Disputes Portal</span>
                        <span className="text-[10px] text-slate-400">
                          {disputedTrades.length > 0
                            ? `${disputedTrades.length} active dispute ${disputedTrades.length === 1 ? 'case' : 'cases'}`
                            : 'Report or check escrow dispute cases'}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button 
                    onClick={() => navigateScreen('trades')}
                    className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 text-slate-700">
                      <RefreshCw className="w-4.5 h-4.5 text-blue-500" />
                      <div>
                        <span className="block text-xs font-bold text-slate-800">Trade History</span>
                        <span className="text-[10px] text-slate-400">Past buyer and seller escrow sheets</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button 
                    onClick={() => navigateScreen('settings')}
                    className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 text-slate-700">
                      <Settings className="w-4.5 h-4.5 text-slate-500" />
                      <div>
                        <span className="block text-xs font-bold text-slate-800">Settings</span>
                        <span className="text-[10px] text-slate-400">Security, pins & notification parameters</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Logout Button */}
              <button 
                onClick={onLogout}
                className="w-full py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-2xl text-xs font-sans font-bold flex items-center justify-center gap-2 border border-rose-150 cursor-pointer shadow-xs transition-colors"
              >
                <LogOut className="w-4.5 h-4.5" /> Logout from Account
              </button>
            </motion.div>
          )}

          {/* 2. PROFILE INFORMATION */}
          {currentScreen === 'profile-info' && (
            <motion.form
              onSubmit={handleSaveProfileInfo}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4 space-y-4"
            >
              <div className="bg-white p-5 rounded-2xl border border-slate-100 space-y-4">
                <h3 className="text-sm font-sans font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <User className="w-4.5 h-4.5 text-purple-600" /> Public Identity Details
                </h3>

                <div className="space-y-3 font-sans text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Full Legal Name</label>
                    <input 
                      type="text" 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-purple-600 transition-colors text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Username Handle</label>
                    <input 
                      type="text" 
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      required
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-purple-600 transition-colors text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Primary Email Address</label>
                    <input 
                      type="email" 
                      value={activeProfile.email}
                      disabled
                      readOnly
                      className="w-full px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed text-sm"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">Email is tied to your verified account login.</span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Contact Phone Number</label>
                    <input 
                      type="tel" 
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="+234..."
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-purple-600 transition-colors text-sm"
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                disabled={isSavingProfile}
                className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-sans font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer text-center flex items-center justify-center gap-2"
              >
                {isSavingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSavingProfile ? 'Saving Identity Updates...' : 'Save Identity Updates'}
              </button>
            </motion.form>
          )}

          {/* 3. DELIVERY ADDRESS */}
          {currentScreen === 'delivery-address' && (
            <motion.form
              onSubmit={handleSaveAddress}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4 space-y-4"
            >
              <div className="bg-white p-5 rounded-2xl border border-slate-100 space-y-4">
                <h3 className="text-sm font-sans font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <MapPin className="w-4.5 h-4.5 text-purple-600" /> Default Shipping Address
                </h3>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Specify where physical trade dispatch packages should be delivered. Ensure courier partners can easily reach this destination.
                </p>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Full Shipping & Delivery Address</label>
                  <textarea 
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    placeholder="Enter street address, city, state, and delivery landmark"
                    required
                    rows={4}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-purple-600 transition-colors text-xs font-sans leading-relaxed"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isSavingAddress}
                className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-sans font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer text-center flex items-center justify-center gap-2"
              >
                {isSavingAddress && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSavingAddress ? 'Saving Address...' : 'Save Delivery Address'}
              </button>
            </motion.form>
          )}

          {/* 4. STORE ANALYTICS */}
          {currentScreen === 'analytics' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4 space-y-4"
            >
              {/* Main revenue card */}
              <div className="bg-gradient-to-br from-purple-900 via-purple-950 to-indigo-950 text-white p-5 rounded-3xl relative overflow-hidden shadow-lg border border-purple-800">
                <div className="relative z-10 space-y-2">
                  <span className="text-[10px] font-sans font-extrabold text-purple-200 uppercase tracking-widest block">Completed Trade Volume</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-sans font-black tracking-tight">
                      ₦{tradeMetrics.totalCompletedVolume.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-0.5">
                      <TrendingUp className="w-3.5 h-3.5" /> {tradeMetrics.rate} completion
                    </span>
                  </div>
                  <p className="text-[10px] text-purple-200/80 leading-normal">
                    Total completed escrow trade volume across your account.
                  </p>
                </div>
                <div className="absolute -right-4 -bottom-6 w-32 h-32 bg-purple-600/10 rounded-full blur-2xl" />
              </div>

              {/* Stats overview */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide">30-Day Trades</span>
                  <strong className="text-slate-800 text-base font-sans mt-1 block">
                    {tradeMetrics.monthlyCount} {tradeMetrics.monthlyCount === 1 ? 'order' : 'orders'}
                  </strong>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide">Active In Escrow</span>
                  <strong className="text-slate-800 text-base font-sans mt-1 block">
                    ₦{tradeMetrics.activeEscrowVolume.toLocaleString()}
                  </strong>
                </div>
              </div>

              {/* 7-Day Trade Volume Chart */}
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Last 7 Days Trade Volume</span>
                
                <div className="h-32 flex items-end justify-between gap-2.5 pt-4 px-2">
                  {tradeMetrics.dailyBuckets.map((bucket, i) => {
                    const heightPct = bucket.volume > 0 ? Math.max(8, Math.round((bucket.volume / tradeMetrics.maxDailyVolume) * 100)) : 4;
                    return (
                      <div key={bucket.label} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end" title={`${bucket.label}: ₦${bucket.volume.toLocaleString()}`}>
                        <div className="w-full bg-slate-50 rounded-md relative h-full flex items-end">
                          <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height: `${heightPct}%` }}
                            transition={{ duration: 0.6, delay: i * 0.04 }}
                            className={`w-full rounded-md transition-colors ${
                              bucket.volume > 0 ? 'bg-purple-600 hover:bg-purple-700' : 'bg-slate-200'
                            }`}
                          />
                        </div>
                        <span className="text-[8px] font-mono text-slate-400">{bucket.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* 5. SUBSCRIPTION TIERS */}
          {currentScreen === 'subscription' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4 space-y-4"
            >
              <div className="bg-white p-5 rounded-2xl border border-slate-100 space-y-4">
                <h3 className="text-sm font-sans font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <CreditCard className="w-4.5 h-4.5 text-purple-600" /> Store Subscription Plans
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Upgrade your store plan to expand catalogue listing slots and showcase items on the ShopFair marketplace.
                </p>

                <div className="space-y-3">
                  {/* Free Plan */}
                  <div className={`p-4 rounded-xl border flex justify-between items-center ${
                    !(subscriptionStatus?.isPro || activeProfile.isPro)
                      ? 'bg-slate-50 border-purple-200'
                      : 'bg-slate-50 border-slate-200/50'
                  }`}>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Free Plan</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Store wall & direct escrow links</p>
                      <p className="text-[10px] text-purple-600 mt-1.5 font-bold">
                        Free {!(subscriptionStatus?.isPro || activeProfile.isPro) ? '• Active' : ''}
                      </p>
                    </div>
                    {!(subscriptionStatus?.isPro || activeProfile.isPro) && (
                      <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  {/* Trial Plan */}
                  <div className="p-4 bg-white border border-purple-200 rounded-xl flex justify-between items-center shadow-xs">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Trial Store Plan</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Up to 10 products • Public store showcase</p>
                      <p className="text-[10px] text-purple-600 mt-1.5 font-bold">
                        {TRIAL_PLAN_PRICE_DISPLAY} / 7 days
                        {subscriptionStatus?.storePlan === 'TRIAL' ? ' • Active' : ''}
                      </p>
                    </div>
                    {subscriptionStatus?.storePlan === 'TRIAL' ? (
                      <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                        <Check className="w-4 h-4" />
                      </div>
                    ) : (
                      <button
                        onClick={openStoreUpgrade}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold rounded-lg cursor-pointer"
                      >
                        Choose Plan
                      </button>
                    )}
                  </div>

                  {/* Starter Pro Plan */}
                  <div className="p-4 bg-white border border-slate-200 rounded-xl flex justify-between items-center shadow-xs">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Starter Store Plan</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Expanded store capacity & marketplace listings</p>
                      <p className="text-[10px] text-purple-600 mt-1.5 font-bold">
                        {STARTER_PLAN_PRICE_DISPLAY} / month
                        {subscriptionStatus?.storePlan === 'STARTER' ? ' • Active' : ''}
                      </p>
                    </div>
                    {subscriptionStatus?.storePlan === 'STARTER' ? (
                      <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                        <Check className="w-4 h-4" />
                      </div>
                    ) : (
                      <button
                        onClick={openStoreUpgrade}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold rounded-lg cursor-pointer"
                      >
                        Upgrade
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 6. TRANSACTION HISTORY */}
          {currentScreen === 'transactions' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4 space-y-3"
            >
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Wallet Statement Logs</span>

                {loadingTransactions ? (
                  <div className="py-8 flex items-center justify-center text-slate-400 gap-2 text-xs">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading wallet transactions...
                  </div>
                ) : transactionsError ? (
                  <p className="py-6 text-center text-xs text-red-500">{transactionsError}</p>
                ) : transactions.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-400">No wallet transactions yet.</p>
                ) : (
                  <div className="divide-y divide-slate-50 font-sans text-xs">
                    {transactions.map((tx) => {
                      const isCredit = tx.type === 'FUNDING' || tx.type === 'ESCROW_RELEASE' || tx.type === 'REFUND';
                      const numericAmount = Number(tx.amount) || 0;
                      const dateLabel = new Date(tx.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      });
                      return (
                        <div key={tx.id} className="py-2.5 flex justify-between items-center gap-3">
                          <div className="min-w-0">
                            <strong className="block text-slate-800 truncate">{tx.type.replace('_', ' ')}</strong>
                            <span className="text-[9px] text-slate-400 block truncate">
                              {tx.reference || tx.tradeId || tx.provider} • {tx.status}
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className={`block font-bold ${isCredit ? 'text-green-600' : 'text-rose-600'}`}>
                              {isCredit ? '+' : '-'}₦{numericAmount.toLocaleString()}
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono">{dateLabel}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* 7. SETTINGS */}
          {currentScreen === 'settings' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4 space-y-4"
            >
              <div className="bg-white p-5 rounded-2xl border border-slate-100 space-y-4 font-sans text-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-sm font-sans font-bold text-slate-900 flex items-center gap-2">
                    <Settings className="w-4.5 h-4.5 text-purple-600" /> Configuration Parameters
                  </h3>
                  {prefsSavedNotice && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Saved
                    </span>
                  )}
                </div>

                {/* Notifications */}
                <div className="space-y-3 border-b border-slate-50 pb-3">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                    <Bell className="w-3.5 h-3.5" /> Notifications Preferences
                  </span>
                  <div className="flex items-center justify-between">
                    <span>Email alerts on escrow status changes</span>
                    <input 
                      type="checkbox" 
                      checked={prefs.emailNotifications}
                      onChange={(e) => updatePreference({ emailNotifications: e.target.checked })}
                      className="w-4 h-4 text-purple-600 cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Push notification sound & popups</span>
                    <input 
                      type="checkbox" 
                      checked={prefs.pushNotifications}
                      onChange={(e) => updatePreference({ pushNotifications: e.target.checked })}
                      className="w-4 h-4 text-purple-600 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Security */}
                <div className="space-y-3 pt-1">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" /> Security & Payout PINs
                  </span>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="block font-semibold">2-Factor Multi-Sig Auth</span>
                      <span className="text-[10px] text-slate-400">Require secondary verification to disburse</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={prefs.twoFactorAuth}
                      onChange={(e) => updatePreference({ twoFactorAuth: e.target.checked })}
                      className="w-4 h-4 text-purple-600 cursor-pointer"
                    />
                  </div>
                  
                  <div className="pt-2 border-t border-slate-50 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="block font-semibold">4-Digit Escrow PIN</span>
                        <span className="text-[10px] text-slate-400">
                          {prefs.tradingPin ? 'PIN configured (••••)' : 'No security PIN set yet'}
                        </span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => {
                          setIsEditingPin((prev) => !prev);
                          setPinDraft('');
                          setPinError(null);
                        }}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer text-[10px]"
                      >
                        {isEditingPin ? 'Cancel' : prefs.tradingPin ? 'Change PIN' : 'Set PIN'}
                      </button>
                    </div>

                    {isEditingPin && (
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="password"
                          inputMode="numeric"
                          maxLength={4}
                          value={pinDraft}
                          onChange={(e) => {
                            setPinDraft(e.target.value.replace(/\D/g, '').slice(0, 4));
                            setPinError(null);
                          }}
                          placeholder="Enter 4 digits"
                          className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-purple-600"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (pinDraft.length !== 4) {
                              setPinError('PIN must be exactly 4 digits.');
                              return;
                            }
                            updatePreference({ tradingPin: pinDraft });
                            setIsEditingPin(false);
                            setPinDraft('');
                            setPinError(null);
                          }}
                          className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl cursor-pointer text-[11px]"
                        >
                          Save PIN
                        </button>
                      </div>
                    )}
                    {pinError && <p className="text-[10px] text-red-500">{pinError}</p>}
                  </div>
                </div>
              </div>

              {/* Quick shortcuts to account & store settings */}
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs divide-y divide-slate-50">
                <button
                  onClick={() => navigateScreen('profile-info')}
                  className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left cursor-pointer"
                >
                  <span className="text-xs font-bold text-slate-800">Edit Identity & Phone Number</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
                <button
                  onClick={() => navigateScreen('delivery-address')}
                  className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left cursor-pointer"
                >
                  <span className="text-xs font-bold text-slate-800">Update Default Delivery Address</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
                <button
                  onClick={() => navigate('/my-store?tab=settings')}
                  className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left cursor-pointer"
                >
                  <span className="text-xs font-bold text-slate-800">Manage Store Branding & Settings</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </motion.div>
          )}

          {/* 8. REVIEWS */}
          {currentScreen === 'reviews' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4 space-y-3"
            >
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-50 pb-2.5">
                  <span className="block text-sm font-sans font-bold text-slate-800">Customer Reviews</span>
                  <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                    <Star className="w-4 h-4 fill-amber-500" /> {averageRating.toFixed(1)} / 5.0
                  </div>
                </div>

                {loadingReviews ? (
                  <div className="py-8 flex items-center justify-center text-slate-400 gap-2 text-xs">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading reviews...
                  </div>
                ) : !reviewsData || reviewsData.reviews.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-400">
                    No buyer reviews yet. Completed trades can be reviewed by buyers.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-50 space-y-3 font-sans text-xs">
                    {reviewsData.reviews.map((rev) => (
                      <div key={rev.id} className="pt-2.5 first:pt-0">
                        <div className="flex items-center justify-between mb-1">
                          <strong className="text-slate-800">{rev.reviewerName || rev.reviewerUsername}</strong>
                          <span className="text-[9px] text-slate-400">{rev.date}</span>
                        </div>
                        <div className="flex items-center gap-0.5 text-amber-500 mb-1">
                          {[...Array(Math.max(0, Math.min(5, Math.round(rev.rating))))].map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-amber-500 stroke-amber-500" />
                          ))}
                        </div>
                        <p className="text-slate-600 leading-normal text-[11px]">{rev.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* 9. DISPUTES */}
          {currentScreen === 'disputes' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4 space-y-4"
            >
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4 font-sans text-xs">
                <h3 className="text-sm font-sans font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <AlertCircle className="w-4.5 h-4.5 text-red-500" /> Escrow Dispute Resolution
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Have an issue with item delivery, quality, or a seller? Open the trade sheet and initiate a dispute to pause escrow release while administrators review evidence.
                </p>

                {disputedTrades.length > 0 ? (
                  <div className="divide-y divide-slate-100 border border-red-100 rounded-xl overflow-hidden">
                    {disputedTrades.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => navigate(`/trades/${t.id}`)}
                        className="w-full p-3.5 bg-red-50/40 hover:bg-red-50 flex items-center justify-between text-left transition-colors cursor-pointer"
                      >
                        <div className="min-w-0 pr-3">
                          <strong className="block text-slate-900 truncate">{t.title}</strong>
                          <span className="text-[10px] text-red-600 font-mono">DISPUTED • ₦{t.amount.toLocaleString()}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl">
                    <strong className="block text-slate-700">No active dispute cases</strong>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">You currently have zero disputed escrow trades.</span>
                  </div>
                )}

                <button 
                  onClick={() => navigate('/trades')}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-sans font-bold text-xs rounded-xl transition-all cursor-pointer text-center"
                >
                  Open My Trades
                </button>
              </div>
            </motion.div>
          )}

          {/* 10. TRADE HISTORY */}
          {currentScreen === 'trades' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4 space-y-3"
            >
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Archived Escrow Trade Records</span>
                
                <div className="divide-y divide-slate-50 font-sans text-xs">
                  {userTrades.length > 0 ? (
                    userTrades.map((t) => (
                      <div key={t.id} className="py-2.5 flex justify-between items-center">
                        <div>
                          <strong className="block text-slate-800">{t.title}</strong>
                          <span className="text-[9px] text-slate-400">Escrow ID: {t.id} • {t.type}</span>
                        </div>
                        <div className="text-right">
                          <span className="block font-bold text-slate-950">₦{t.amount.toLocaleString()}</span>
                          <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${
                            t.status === 'COMPLETED' ? 'bg-green-50 text-green-700' :
                            t.status === 'REFUNDED' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {t.status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-6 text-slate-400">No past trades found.</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

    </div>
  );
}