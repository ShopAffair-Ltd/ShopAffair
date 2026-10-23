import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Star, MessageSquare, ShoppingBag, Users,
  MessageCircle, Store, ShieldCheck, CheckCircle, Package,
  MapPin, Calendar, Clock, Share2, AlertCircle
} from 'lucide-react';
import { userService, User, UserStatsResponse } from '../../services/userService';
import { reviewService, Review, ReviewsResponse } from '../../services/reviewService';
import { useTrades } from '../../context/TradeContext';

interface PublicProfileViewProps {
  username: string;
}

export default function PublicProfileView({ username }: PublicProfileViewProps) {
  const navigate = useNavigate();
  const { trades } = useTrades();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStatsResponse | null>(null);
  const [reviewsData, setReviewsData] = useState<ReviewsResponse | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'reviews' | 'trades' | 'about'>('reviews');
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    Promise.allSettled([
      userService.getUserByUsername(username),
      userService.getUserStats(username),
      reviewService.getSellerReviews(username)
    ]).then(([userRes, statsRes, reviewsRes]) => {
      if (!isMounted) return;

      if (userRes.status === 'fulfilled' && userRes.value.data?.user) {
        setProfileUser(userRes.value.data.user);
      } else {
        setError('User not found or unable to load profile.');
      }

      if (statsRes.status === 'fulfilled' && statsRes.value.data) {
        setStats(statsRes.value.data);
        setIsFollowing(statsRes.value.data.isFollowing);
        setFollowersCount(statsRes.value.data.followers);
      }

      if (reviewsRes.status === 'fulfilled' && reviewsRes.value.data) {
        setReviewsData(reviewsRes.value.data);
      }

      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [username]);

  const handleToggleFollow = async () => {
    if (followLoading) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        const res = await userService.unfollowUser(username);
        setIsFollowing(false);
        setFollowersCount(res.data.followersCount ?? Math.max(0, followersCount - 1));
      } else {
        const res = await userService.followUser(username);
        setIsFollowing(true);
        setFollowersCount(res.data.followersCount ?? (followersCount + 1));
      }
    } catch (err) {
      console.error('Follow error:', err);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: `${profileUser?.name || username}'s Profile`,
        url
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {
        alert('Profile link copied to clipboard!');
      });
    }
  };

  const userTrades = trades.filter(
    (t) => t.creatorUsername === username && t.status !== 'DRAFT'
  );

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 h-full p-6">
        <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-3" />
        <p className="text-xs font-sans text-slate-500 font-semibold">Loading profile...</p>
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 h-full p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-3">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-base font-bold text-slate-900 mb-1">User Not Found</h2>
        <p className="text-xs text-slate-500 max-w-xs mb-5">
          {error || `We couldn't find a profile for @${username}.`}
        </p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-xl shadow-sm hover:bg-purple-700 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  const statItems = [
    {
      label: 'Rating',
      value: stats?.rating ? stats.rating.toFixed(1) : (profileUser.rating ? profileUser.rating.toFixed(1) : '5.0'),
      icon: <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
    },
    {
      label: 'Reviews',
      value: reviewsData?.stats.totalReviews ?? stats?.reviewsCount ?? profileUser.reviewsCount ?? 0,
      icon: <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
    },
    {
      label: 'Sales',
      value: stats?.totalSales ?? profileUser.totalSales ?? 0,
      icon: <ShoppingBag className="w-3.5 h-3.5 text-green-500" />
    },
    {
      label: 'Followers',
      value: followersCount,
      icon: <Users className="w-3.5 h-3.5 text-purple-500" />
    }
  ];

  const joinedYear = profileUser.createdAt
    ? new Date(profileUser.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : '2024';

  return (
    <div className="flex-1 flex flex-col bg-[#F8F9FC] h-full overflow-hidden pb-24">
      {/* HEADER BAR */}
      <div className="sticky top-0 bg-white z-20 px-4 py-3 border-b border-slate-100 flex items-center justify-between shadow-xs">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-full hover:bg-slate-100 transition-colors text-slate-600 flex items-center gap-1"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-xs font-bold font-sans">Back</span>
        </button>
        <span className="text-sm font-sans font-bold text-slate-900 truncate max-w-[50%]">
          @{profileUser.username}
        </span>
        <button
          onClick={handleShare}
          className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-600"
          title="Share Profile"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* COVER & AVATAR BANNER */}
        <div className="relative">
          <div className="h-24 sm:h-28 w-full bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-900 relative overflow-hidden">
            {profileUser.coverImage ? (
              <img src={profileUser.coverImage} alt="Cover" className="w-full h-full object-cover opacity-60" />
            ) : (
              <div className="absolute inset-0 bg-radial from-white/10 to-transparent opacity-30" />
            )}
          </div>

          <div className="px-4">
            <div className="flex items-end justify-between -mt-8">
              <div className="w-16 h-16 rounded-full bg-white border-4 border-white shadow-md overflow-hidden flex items-center justify-center font-display font-black text-xl relative">
                {profileUser.profilePicture ? (
                  <img src={profileUser.profilePicture} alt={profileUser.name} className="w-full h-full object-cover" />
                ) : (
                  <span className={`w-full h-full flex items-center justify-center ${profileUser.avatarColor || 'bg-purple-600'} text-white`}>
                    {profileUser.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                )}
                {profileUser.verificationStatus === 'VERIFIED' && (
                  <span className="absolute -bottom-0.5 -right-0.5 bg-green-500 text-white rounded-full p-0.5 border-2 border-white">
                    <CheckCircle className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
              <span className="mb-1 text-[10px] font-sans font-bold px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
                • Active Trader
              </span>
            </div>

            {/* USER INFO */}
            <div className="mt-2.5 pb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-display font-black text-slate-900 leading-tight">
                  {profileUser.name}
                </h1>
                {profileUser.verificationStatus === 'VERIFIED' && (
                  <span className="bg-green-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full shrink-0 flex items-center gap-0.5">
                    <ShieldCheck className="w-2.5 h-2.5" /> Verified
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-sans mt-0.5">@{profileUser.username}</p>

              <div className="flex items-center gap-3 mt-2 text-[11px] font-sans text-slate-500 flex-wrap">
                {profileUser.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {profileUser.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  Joined {joinedYear}
                </span>
                {profileUser.storeName && (
                  <span className="flex items-center gap-1 font-bold text-purple-700">
                    <Store className="w-3 h-3" />
                    {profileUser.storeName}
                  </span>
                )}
              </div>

              {profileUser.bio && (
                <p className="text-xs font-sans text-slate-600 mt-2.5 leading-relaxed bg-white/70 p-2.5 rounded-xl border border-slate-100">
                  {profileUser.bio}
                </p>
              )}

              {/* ACTION BUTTONS */}
              <div className="flex gap-2 mt-3.5">
                <button
                  onClick={() => navigate(`/chat/${profileUser.username}`)}
                  className="flex-1 py-2.5 px-3 bg-white border border-slate-200 text-slate-800 font-sans font-bold text-xs rounded-xl shadow-xs hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 text-purple-600" />
                  Chat
                </button>
                {profileUser.storeName && (
                  <button
                    onClick={() => navigate(`/store/${profileUser.username}`)}
                    className="flex-1 py-2.5 px-3 bg-white border border-slate-200 text-slate-800 font-sans font-bold text-xs rounded-xl shadow-xs hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Store className="w-4 h-4 text-indigo-600" />
                    Visit Store
                  </button>
                )}
                <button
                  onClick={handleToggleFollow}
                  disabled={followLoading}
                  className={`flex-1 py-2.5 px-3 font-sans font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    isFollowing
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  {isFollowing ? 'Following' : '+ Follow'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* BV3 FIX: All 4 stats in a single straight line (4-col grid) */}
        <div className="grid grid-cols-4 gap-2 px-4 py-3 bg-white border-y border-slate-100">
          {statItems.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="flex items-center justify-center gap-1 text-sm font-bold text-slate-900">
                {stat.icon}
                <span>{stat.value}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-sans">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div className="bg-white border-b border-slate-100 px-4 flex gap-6">
          <button
            onClick={() => setActiveTab('reviews')}
            className={`py-3 text-xs font-sans font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'reviews'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            Reviews ({reviewsData?.reviews.length ?? 0})
          </button>
          <button
            onClick={() => setActiveTab('trades')}
            className={`py-3 text-xs font-sans font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'trades'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            Listings ({userTrades.length})
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`py-3 text-xs font-sans font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'about'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Trust & About
          </button>
        </div>

        {/* TAB CONTENTS */}
        <div className="p-4 space-y-4">
          {/* TAB 1: REVIEWS (C7 FIX) */}
          {activeTab === 'reviews' && (
            <div className="space-y-3">
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-2xl font-black text-slate-900 leading-none">
                    {stats?.rating ? stats.rating.toFixed(1) : '5.0'}
                  </span>
                  <span className="text-xs text-slate-400 font-sans ml-1">/ 5.0</span>
                  <div className="flex items-center gap-0.5 mt-1 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-400 stroke-amber-400" />
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-700 block">
                    {reviewsData?.reviews.length ?? 0} Customer Reviews
                  </span>
                  <span className="text-[10px] text-green-600 font-semibold">
                    100% Verified Escrow Trades
                  </span>
                </div>
              </div>

              {reviewsData?.reviews && reviewsData.reviews.length > 0 ? (
                <div className="space-y-2.5">
                  {reviewsData.reviews.map((rev) => (
                    <div key={rev.id} className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <strong className="text-xs font-bold text-slate-800">{rev.reviewerName}</strong>
                          <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-medium">
                            @{rev.reviewerUsername}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">{rev.date}</span>
                      </div>
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-2.5 h-2.5 ${
                              i < rev.rating ? 'fill-amber-400 stroke-amber-400' : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs font-sans text-slate-600 leading-relaxed">
                        "{rev.content}"
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center space-y-2">
                  <Star className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">No reviews yet</p>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    Reviews from buyers will appear here automatically once trades are successfully completed.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ACTIVE TRADES */}
          {activeTab === 'trades' && (
            <div className="space-y-3">
              {userTrades.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {userTrades.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => navigate(`/trade/${t.id}`)}
                      className="bg-white p-3 rounded-xl border border-slate-100 shadow-xs hover:shadow-md transition-shadow cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        {t.image ? (
                          <img src={t.image} alt={t.title} className="w-full aspect-square object-cover rounded-lg mb-2" />
                        ) : (
                          <div className="w-full aspect-square bg-slate-100 rounded-lg flex items-center justify-center mb-2">
                            <Package className="w-6 h-6 text-slate-400" />
                          </div>
                        )}
                        <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-tight">
                          {t.title}
                        </h4>
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-50 flex items-center justify-between">
                        <span className="text-xs font-black text-purple-600">₦{t.amount.toLocaleString()}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">{t.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center space-y-2">
                  <Package className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">No active listings</p>
                  <p className="text-[11px] text-slate-400">
                    This user doesn't have any open trade listings currently.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TRUST & ABOUT */}
          {activeTab === 'about' && (
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b border-slate-50 pb-2">
                Trust & Verification Details
              </h3>
              <div className="space-y-3 font-sans text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Identity Verification:</span>
                  <span className="font-bold text-green-600 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {profileUser.verificationStatus}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Account Role:</span>
                  <span className="font-bold text-slate-800 capitalize">{profileUser.role?.toLowerCase() || 'Member'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Completed Trades:</span>
                  <span className="font-bold text-slate-800">{profileUser.completedTrades ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Completion Rate:</span>
                  <span className="font-bold text-slate-800">{profileUser.completionRate ?? 100}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Member Since:</span>
                  <span className="font-bold text-slate-800">{joinedYear}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
