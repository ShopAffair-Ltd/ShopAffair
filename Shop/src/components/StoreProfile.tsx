import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft, MessageCircle, Share2, ThumbsUp, Heart,
  MapPin, Star, Grid3x3, MessageSquare, LayoutGrid, ShoppingBag,
  MoreVertical, Users, Package, Award, Clock, CheckCircle
} from 'lucide-react';
import { MarketProduct } from '../types';
import { reviewService, Review, RatingDistribution } from '../services/reviewService';
import { userService } from '../services/userService';

interface StoreProfileProps {
  seller: {
    id: string;
    name: string;
    username: string;
    storeName: string;
    location: string;
    category: string;
    plan: string;
    bio: string;
    rating: number;
    reviewsCount: number;
    totalSales: number;
    avatar: string;
    avatarColor?: string;
    coverImage?: string;
    isVerified?: boolean;
    followers?: number;
    followingByMe?: boolean;
    joinedDate?: string;
  };
  products: MarketProduct[];
  onBack: () => void;
  onChat: (sellerUsername: string, sellerName: string) => void;
  onFollow: (sellerId: string) => void;
  onProductClick: (product: MarketProduct) => void;
  communityPosts?: any[];
}

export default function StoreProfile({
  seller,
  products,
  onBack,
  onChat,
  onProductClick,
  communityPosts = []
}: StoreProfileProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'reviews'>('overview');
  const [isFollowing, setIsFollowing] = useState(seller.followingByMe ?? false);
  const [followersCount, setFollowersCount] = useState(seller.followers || 0);
  const [likedPosts, setLikedPosts] = useState<string[]>([]);
  const [ratingDistribution, setRatingDistribution] = useState<RatingDistribution[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [showFullBio, setShowFullBio] = useState(false);
  const [stats, setStats] = useState({
    rating: seller.rating || 0,
    reviewsCount: seller.reviewsCount || 0,
    totalSales: seller.totalSales || 0,
    followers: seller.followers || 0
  });

  useEffect(() => {
    fetchStats();
    fetchReviews();
  }, [seller.username]);

  const fetchStats = async () => {
    try {
      const response = await userService.getUserStats(seller.username);
      setStats({
        rating: response.data.rating || 0,
        reviewsCount: response.data.reviewsCount || 0,
        totalSales: response.data.totalSales || 0,
        followers: response.data.followers || 0
      });
      setFollowersCount(response.data.followers || 0);
      setIsFollowing(response.data.isFollowing || false);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchReviews = async () => {
    setLoadingReviews(true);
    try {
      const response = await reviewService.getSellerReviews(seller.username);
      setReviews(response.data.reviews || []);
      setRatingDistribution(response.data.distribution || []);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        const response = await userService.unfollowUser(seller.username);
        setFollowersCount(response.data.followersCount);
        setIsFollowing(false);
      } else {
        const response = await userService.followUser(seller.username);
        setFollowersCount(response.data.followersCount);
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Failed to follow/unfollow:', error);
    }
  };

  const handleLike = (postId: string) => {
    setLikedPosts(prev =>
      prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId]
    );
  };

  const handleMarkHelpful = async (reviewId: string) => {
    try {
      const response = await reviewService.markHelpful(reviewId);
      setReviews(prev =>
        prev.map(review =>
          review.id === reviewId
            ? { ...review, helpful: response.data.count, isHelpful: response.data.helpful }
            : review
        )
      );
    } catch (error) {
      console.error('Failed to mark helpful:', error);
    }
  };

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Star key={i} className={`w-3 h-3 ${i < rating ? 'fill-amber-400 stroke-amber-400' : 'text-slate-200'}`} />
    ));
  };

  const statItems = [
    { label: 'Rating', value: stats.rating, icon: <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" /> },
    { label: 'Reviews', value: stats.reviewsCount, icon: <MessageSquare className="w-3.5 h-3.5 text-blue-400" /> },
    { label: 'Sales', value: stats.totalSales, icon: <ShoppingBag className="w-3.5 h-3.5 text-green-400" /> },
    { label: 'Followers', value: followersCount, icon: <Users className="w-3.5 h-3.5 text-purple-400" /> }
  ];

  return (
    <div className="flex-1 flex flex-col bg-[#F8F9FC] h-full overflow-hidden">

      <div className="sticky top-0 bg-white z-20 px-4 py-3 border-b border-slate-100 flex items-center justify-between shadow-sm">
        <button
          onClick={onBack}
          className="p-2 rounded-full hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <span className="text-sm font-sans font-semibold text-slate-800 truncate max-w-[60%]">
          {seller.storeName || seller.name}
        </span>
        <button className="p-2 rounded-full hover:bg-slate-100 transition-colors">
          <MoreVertical className="w-5 h-5 text-slate-600" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">

        <div className="relative">
          <div className="h-40 sm:h-48 bg-gradient-to-r from-purple-600 to-indigo-600 relative overflow-hidden">
            {seller.coverImage ? (
              <img src={seller.coverImage} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/30 to-indigo-600/30" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          </div>

          <div className="px-4 -mt-10 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4">
              <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl ${seller.avatarColor || 'bg-purple-600'} text-white font-sans font-bold text-3xl flex items-center justify-center shrink-0 border-4 border-white shadow-lg relative`}>
                {seller.avatar || seller.name?.charAt(0) || 'S'}
                {seller.isVerified && (
                  <span className="absolute -bottom-0.5 -right-0.5 bg-green-500 text-white rounded-full p-0.5 border-2 border-white">
                    <CheckCircle className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-xl font-sans font-bold text-white drop-shadow-lg truncate">
                    {seller.storeName || seller.name}
                  </h1>
                  {seller.isVerified && (
                    <span className="bg-green-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full shrink-0">Verified</span>
                  )}
                </div>
                <p className="text-sm text-white/80 drop-shadow-md">@{seller.username}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => onChat(seller.username, seller.name)}
                  className="flex-1 sm:flex-none px-4 py-2 bg-white text-purple-600 font-sans font-bold text-xs rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  <MessageCircle className="w-4 h-4 inline sm:mr-1.5" />
                  <span className="hidden sm:inline">Chat</span>
                </button>
                <button
                  onClick={handleFollow}
                  className={`flex-1 sm:flex-none px-4 py-2 font-sans font-bold text-xs rounded-xl shadow-lg transition-all ${
                    isFollowing 
                      ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' 
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  {isFollowing ? 'Following' : '+ Follow'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 bg-white border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>{seller.location || 'Nigeria'}</span>
            </div>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <div className="flex items-center gap-1">
              <Package className="w-3.5 h-3.5" />
              <span>{seller.category || 'General'}</span>
            </div>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span className="text-purple-600 font-semibold">{seller.plan || 'Free Plan'}</span>
          </div>

          {seller.bio && (
            <p className="text-sm text-slate-600 leading-relaxed mt-2">
              {showFullBio ? seller.bio : `${seller.bio.slice(0, 120)}${seller.bio.length > 120 ? '...' : ''}`}
              {seller.bio.length > 120 && (
                <button
                  onClick={() => setShowFullBio(!showFullBio)}
                  className="text-purple-600 font-semibold text-xs ml-1"
                >
                  {showFullBio ? 'Show less' : 'Read more'}
                </button>
              )}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-4 py-3 bg-white border-b border-slate-100">
          {statItems.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="flex items-center justify-center gap-1 text-sm font-bold text-slate-900">
                {stat.icon}
                {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
              </div>
              <span className="text-[10px] text-slate-400">{stat.label}</span>
            </div>
          ))}
        </div>

        <div className="bg-white border-b border-slate-100 px-4 overflow-x-auto">
          <div className="flex items-center gap-6 min-w-max">
            {[
              { id: 'overview', label: 'Overview', icon: <LayoutGrid className="w-4 h-4" /> },
              { id: 'products', label: 'Products', icon: <Package className="w-4 h-4" /> },
              { id: 'reviews', label: 'Reviews', icon: <Star className="w-4 h-4" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 text-xs font-sans font-semibold capitalize transition-all relative flex items-center gap-1.5 shrink-0 ${
                  activeTab === tab.id ? 'text-purple-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab.icon}
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="storeTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 rounded-full"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 space-y-4">

          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">About this store</h3>
                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>Joined {seller.joinedDate ? new Date(seller.joinedDate).toLocaleDateString() : 'Recently'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-slate-400" />
                    <span>{products.length} products listed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-slate-400" />
                    <span>{seller.plan || 'Free'} seller</span>
                  </div>
                </div>
              </div>

              {communityPosts && communityPosts.length > 0 && (
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Latest Updates</h3>
                  <div className="space-y-3">
                    {communityPosts.slice(0, 3).map((post) => (
                      <div key={post.id} className="border-b border-slate-50 last:border-0 pb-3 last:pb-0">
                        <p className="text-xs text-slate-700 line-clamp-2">{post.content}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400">
                          <span>{post.time || 'Just now'}</span>
                          <button className="flex items-center gap-1 hover:text-purple-600">
                            <Heart className={`w-3 h-3 ${likedPosts.includes(post.id) ? 'fill-red-500 text-red-500' : ''}`} />
                            {post.likes || 0}
                          </button>
                          <button className="flex items-center gap-1 hover:text-purple-600">
                            <MessageCircle className="w-3 h-3" />
                            {post.comments || 0}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'products' && (
            <div className="grid grid-cols-2 gap-3">
              {products && products.length > 0 ? (
                products.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => onProductClick(product)}
                    className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100 cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <div className="aspect-square w-full bg-slate-50 relative overflow-hidden">
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {product.condition && (
                        <span className="absolute top-2 left-2 bg-emerald-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full">
                          {product.condition}
                        </span>
                      )}
                    </div>
                    <div className="p-2.5">
                      <h4 className="text-[10px] font-sans font-bold text-slate-800 line-clamp-1">{product.title}</h4>
                      <p className="text-[10px] font-sans font-extrabold text-purple-600 mt-0.5">₦{Number(product.price).toLocaleString()}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center py-12 bg-white rounded-xl border border-slate-100">
                  <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">No products listed yet</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-4">
              {loadingReviews ? (
                <div className="text-center py-8 bg-white rounded-xl border border-slate-100">
                  <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-slate-400 mt-2">Loading reviews...</p>
                </div>
              ) : reviews && reviews.length > 0 ? (
                <>
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <div className="text-center min-w-[80px]">
                        <span className="text-3xl font-black text-slate-900">{stats.rating || 0}</span>
                        <div className="flex items-center justify-center gap-0.5 mt-1">
                          {renderStars(Math.round(stats.rating || 0))}
                        </div>
                        <span className="text-[10px] text-slate-400">{stats.reviewsCount || 0} reviews</span>
                      </div>
                      <div className="flex-1 w-full space-y-1.5">
                        {[5, 4, 3, 2, 1].map((star) => {
                          const dist = ratingDistribution.find(d => d.rating === star);
                          const percentage = dist?.percentage || 0;
                          const count = dist?.count || 0;
                          return (
                            <div key={star} className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-500 w-4 font-medium">{star}</span>
                              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-amber-400 rounded-full transition-all duration-700"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-slate-400 w-8 text-right">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="bg-white rounded-xl p-4 shadow-sm border border-slate-100"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 text-purple-600 font-sans font-bold text-sm flex items-center justify-center">
                            {review.reviewerName?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <span className="block text-xs font-bold text-slate-800">{review.reviewerName || 'Anonymous'}</span>
                            <span className="text-[10px] text-slate-400">@{review.reviewerUsername || 'user'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {renderStars(review.rating || 0)}
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">{review.content}</p>
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-50">
                        <span className="text-[10px] text-slate-400">{review.date ? new Date(review.date).toLocaleDateString() : 'Just now'}</span>
                        <button
                          onClick={() => handleMarkHelpful(review.id)}
                          className={`text-[10px] flex items-center gap-1 transition-colors ${
                            review.isHelpful ? 'text-purple-600 font-semibold' : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          <ThumbsUp className={`w-3 h-3 ${review.isHelpful ? 'fill-purple-600' : ''}`} />
                          {review.helpful || 0} helpful
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
                  <Star className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">No reviews yet</p>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}