import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  ShieldCheck,
  Star,
  Plus,
  Send,
  Pin,
  PackageSearch,
  SlidersHorizontal,
  Share,
  Pencil,
  Trash2
} from 'lucide-react';
import { UserProfile, MarketProduct } from '../types';
import { useAuth } from '../context/AuthContext';
import { useMarket } from '../context/MarketContext';
import {
  StoreTab,
  WallPost,
  CATEGORY_CHIPS
} from './storeConstants';
import { Avatar, WallPostComponent } from './storeComponents';
import AddProductSheet from './storeAddProductSheet';
import * as wallPostService from '../services/wallPostService';
import type { WallPost as ApiWallPost } from '../services/wallPostService';

function mapApiPost(apiPost: ApiWallPost, currentUserId: string): WallPost {
  return {
    id: apiPost.id,
    caption: apiPost.content,
    timestamp: apiPost.createdAt,
    isPinned: apiPost.isPinned,
    likes: apiPost.likesCount,
    likedByMe: apiPost.likedByMe,
    comments: apiPost.comments.map((c) => ({
      id: c.id,
      authorName: c.author.name,
      isSeller: c.author.id === currentUserId,
      content: c.content,
      timestamp: c.createdAt
    }))
  };
}

export default function MyStoreView() {
  const navigate = useNavigate();
  const { user: activeProfile } = useAuth();
  const { products, addProduct, editProduct, deleteProduct } = useMarket();
  const onBack = () => navigate('/');

  const [activeTab, setActiveTab] = useState<StoreTab>('wall');

  // ---- Wall state -----------------------------------------------------
  const [wallPosts, setWallPosts] = useState<WallPost[]>([]);
  const [wallLoading, setWallLoading] = useState(true);
  const [wallError, setWallError] = useState<string | null>(null);
  const [postDraft, setPostDraft] = useState('');
  const [openCommentsFor, setOpenCommentsFor] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  // ---- Catalogue state --------------------------------------------------
  const [activeCategoryChip, setActiveCategoryChip] = useState('All');

  // ---- Settings / seller management state --------------------------------
  const [productSheetOpen, setProductSheetOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<MarketProduct | null>(null);
  const [keepPrivate, setKeepPrivate] = useState(false);

  useEffect(() => {
    if (!activeProfile) return;
    let cancelled = false;
    setWallLoading(true);
    wallPostService
      .getWallPosts(activeProfile.username)
      .then((posts) => {
        if (cancelled) return;
        setWallPosts(posts.map((p) => mapApiPost(p, activeProfile.id)));
        setWallError(null);
      })
      .catch(() => {
        if (cancelled) return;
        setWallError('Could not load wall posts.');
      })
      .finally(() => {
        if (!cancelled) setWallLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeProfile?.username]);

  // Own inventory: real products from this seller
  const storeProducts = activeProfile ? products.filter((p) => p.sellerUsername === activeProfile.username) : [];
  const filteredProducts =
    activeCategoryChip === 'All' ? storeProducts : storeProducts.filter((p) => p.category === activeCategoryChip);

  const totalSales = storeProducts.reduce((sum, p) => sum + p.salesCount, 0);
  const totalReviews = storeProducts.reduce((sum, p) => sum + p.reviewsCount, 0);
  const avgRating =
    storeProducts.length > 0
      ? (storeProducts.reduce((sum, p) => sum + p.rating, 0) / storeProducts.length).toFixed(1)
      : '0.0';

  // ---- SHARE STORE FUNCTION ----------------------------------------------
  const handleShareStore = () => {
    if (!activeProfile) return;
    const url = window.location.href;
    const shareData = {
      title: `Check out ${activeProfile.name}'s store on ShopAffair!`,
      text: `Visit ${activeProfile.name}'s store on ShopAffair! Quality products and great deals.`,
      url: url,
    };

    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {
        alert('Store link copied to clipboard! Share it with your friends.');
      });
    }
  };

  // ---- Wall handlers ------------------------------------------------------

  const handleSendPost = async () => {
    if (!postDraft.trim() || !activeProfile) return;
    const content = postDraft.trim();
    setPostDraft('');
    try {
      const created = await wallPostService.createWallPost(content);
      setWallPosts((prev) => [mapApiPost(created, activeProfile.id), ...prev]);
    } catch {
      setWallError('Could not publish post. Please try again.');
      setPostDraft(content);
    }
  };

  const toggleLike = async (postId: string) => {
    if (!activeProfile) return;
    setWallPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, likedByMe: !p.likedByMe, likes: p.likes + (p.likedByMe ? -1 : 1) } : p
      )
    );
    try {
      const updated = await wallPostService.toggleLike(postId);
      setWallPosts((prev) => prev.map((p) => (p.id === postId ? mapApiPost(updated, activeProfile.id) : p)));
    } catch {
      setWallPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, likedByMe: !p.likedByMe, likes: p.likes + (p.likedByMe ? -1 : 1) } : p
        )
      );
    }
  };

  const togglePin = async (postId: string) => {
    if (!activeProfile) return;
    try {
      const updated = await wallPostService.togglePin(postId);
      setWallPosts((prev) => prev.map((p) => (p.id === postId ? mapApiPost(updated, activeProfile.id) : p)));
    } catch {
      setWallError('Could not update pin. Please try again.');
    }
  };

  const handleSendComment = async (postId: string) => {
    if (!activeProfile) return;
    const draft = (commentDrafts[postId] || '').trim();
    if (!draft) return;
    setCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
    try {
      const updated = await wallPostService.addComment(postId, draft);
      setWallPosts((prev) => prev.map((p) => (p.id === postId ? mapApiPost(updated, activeProfile.id) : p)));
    } catch {
      setWallError('Could not send comment. Please try again.');
      setCommentDrafts((prev) => ({ ...prev, [postId]: draft }));
    }
  };

  // Pinned posts float to the top, most recent otherwise.
  const sortedPosts = [...wallPosts].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  // ---- Catalogue / Settings product handlers -------------------------------

  const [productActionError, setProductActionError] = useState<string | null>(null);

  const handleAddOrEditProduct = async (
    productInput: Omit<MarketProduct, 'id' | 'sellerUsername' | 'sellerName' | 'rating' | 'salesCount' | 'reviewsCount'>
  ) => {
    setProductActionError(null);
    try {
      if (editingProduct) {
        await editProduct(editingProduct.id, productInput);
      } else {
        await addProduct(productInput);
      }
      setProductSheetOpen(false);
      setEditingProduct(null);
    } catch (err) {
      console.error(err);
      setProductActionError('Could not save product. Please try again.');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    setProductActionError(null);
    try {
      await deleteProduct(id);
    } catch (err) {
      console.error(err);
      setProductActionError('Could not delete product. Please try again.');
    }
  };

  const openAddProduct = () => {
    setEditingProduct(null);
    setProductSheetOpen(true);
  };

  const openEditProduct = (product: MarketProduct) => {
    setEditingProduct(product);
    setProductSheetOpen(true);
  };

  if (!activeProfile) return null;

  return (
    <div className="flex-1 flex flex-col bg-white h-full overflow-hidden">
      <div className="px-4 pt-4 pb-3 flex items-center gap-3 border-b border-slate-100 shrink-0">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer shrink-0 outline-none"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="min-w-0 flex-1">
          <span className="block text-[10px] font-sans text-slate-400">Merchant Dashboard</span>
          <span className="text-sm font-sans font-extrabold text-slate-900 truncate block">My Store</span>
        </div>
        <button
          onClick={handleShareStore}
          className="w-9 h-9 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-600 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          title="Share your store"
        >
          <Share className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
        <div className="relative">
          <div className="h-24 w-full bg-slate-800" />

          <div className="px-4">
            <div className="flex items-end justify-between -mt-8">
              <div className="w-16 h-16 rounded-full bg-white border-4 border-white shadow-md overflow-hidden flex items-center justify-center bg-purple-100 text-purple-600 font-display font-black text-xl">
                {activeProfile.profilePicture ? (
                  <img src={activeProfile.profilePicture} alt={activeProfile.name} className="w-full h-full object-cover" />
                ) : (
                  activeProfile.name.charAt(0).toUpperCase()
                )}
              </div>
              <span className="mb-1 text-[10px] font-sans font-bold px-2.5 py-1 rounded-full bg-green-50 text-green-600 border border-green-200">
                • Available
              </span>
            </div>

            <div className="mt-2">
              <h2 className="text-base font-display font-black text-slate-900 flex items-center gap-1.5">
                {activeProfile.name}
                {activeProfile.verificationStatus === 'VERIFIED' && (
                  <ShieldCheck className="w-4 h-4 text-teal-500 fill-teal-50" />
                )}
              </h2>
              <div className="flex items-center gap-2 mt-1 text-[11px] font-sans text-slate-500">
                <span>{activeProfile.location || 'Nigeria'}</span>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span>{activeProfile.storeCategory || 'Electronics'}</span>
                <span className="px-2 py-0.5 rounded-full bg-orange-50 text-orange-500 border border-orange-100 font-bold flex items-center gap-1 text-[10px]">
                  {activeProfile.isPro ? 'Pro Plan' : 'Free Plan'}
                </span>
              </div>

              <p className="text-[12px] font-sans text-slate-500 mt-2 leading-relaxed">
                {activeProfile.bio ||
                  'Your one-stop shop for authentic gadgets, phones, and accessories. Fast delivery across Nigeria. All products come with warranty.'}
              </p>

              <div className="flex items-center gap-2 mt-2 text-[11px] font-sans font-bold text-slate-700">
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  {avgRating} ({totalReviews} reviews)
                </span>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span>{totalSales} sales</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 mt-4 border-b border-slate-100 flex items-center gap-5">
          {(['wall', 'catalogue', 'settings'] as StoreTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative pb-2.5 text-xs font-sans cursor-pointer transition-colors outline-none border-0 bg-transparent appearance-none ${
                activeTab === tab ? 'text-slate-900 font-bold' : 'text-slate-400 font-medium'
              }`}
            >
              {tab === 'wall' ? 'Store Wall' : tab === 'catalogue' ? 'Catalogue' : 'Settings'}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* STORE WALL */}
          {activeTab === 'wall' && (
            <motion.div key="wall" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-4 mt-3">
              <div className="flex items-center gap-2.5 mb-4">
                <Avatar profile={activeProfile} size={36} />
                <input
                  value={postDraft}
                  onChange={(e) => setPostDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendPost()}
                  placeholder="Share an update with your customers…"
                  className="flex-1 text-[12px] font-sans px-3.5 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-purple-300 focus:bg-white transition-colors placeholder:text-slate-400"
                />
                <button
                  onClick={handleSendPost}
                  disabled={!postDraft.trim()}
                  className="w-10 h-10 rounded-full bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 text-white flex items-center justify-center shrink-0 cursor-pointer transition-colors outline-none shadow-sm shadow-orange-200 disabled:shadow-none"
                >
                  <Send className="w-4 h-4 -ml-0.5" />
                </button>
              </div>

              {wallError && (
                <div className="mb-3 p-2.5 bg-red-50 text-red-700 rounded-lg border border-red-100 text-[11px] font-sans font-semibold">
                  {wallError}
                </div>
              )}

              {wallLoading ? (
                <p className="text-[11px] font-sans text-slate-400 text-center mt-6">Loading wall posts…</p>
              ) : (
                <div className="space-y-3">
                  {sortedPosts.map((post) => (
                    <WallPostComponent
                      key={post.id}
                      post={post}
                      profile={activeProfile}
                      onToggleLike={toggleLike}
                      onTogglePin={togglePin}
                      onToggleComments={(postId) => setOpenCommentsFor(openCommentsFor === postId ? null : postId)}
                      onSendComment={handleSendComment}
                      openCommentsFor={openCommentsFor}
                      commentDrafts={commentDrafts}
                      setCommentDrafts={setCommentDrafts}
                    />
                  ))}
                  {sortedPosts.length === 0 && (
                    <p className="text-[11px] font-sans text-slate-400 text-center mt-6">No posts yet. Share an update above.</p>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* CATALOGUE */}
          {activeTab === 'catalogue' && (
            <motion.div key="catalogue" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-3">
              <div className="px-4 flex items-center gap-2 overflow-x-auto no-scrollbar pb-3">
                {CATEGORY_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => setActiveCategoryChip(chip)}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-sans font-bold cursor-pointer outline-none border ${
                      activeCategoryChip === chip
                        ? 'bg-orange-50 text-orange-500 border-orange-200'
                        : 'bg-white text-slate-500 border-slate-200'
                    }`}
                  >
                    {chip}
                  </button>
                ))}
              </div>

              <div className="px-4 grid grid-cols-2 gap-2">
                <button
                  onClick={openAddProduct}
                  className="aspect-square rounded-xl border-2 border-dashed border-slate-200 hover:border-purple-300 hover:bg-purple-50/40 flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-purple-500 transition-colors cursor-pointer outline-none"
                >
                  <Plus className="w-5 h-5" />
                  <span className="text-[10px] font-sans font-bold">Add Product</span>
                </button>

                {filteredProducts.map((prod) => (
                  <div key={prod.id} className="bg-white border border-slate-100 rounded-xl overflow-hidden group relative">
                    <div className="aspect-square w-full bg-slate-50 relative overflow-hidden">
                      <img src={prod.image} alt={prod.title} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                      <div className="absolute top-1.5 right-1.5 flex gap-1">
                        <button
                          onClick={() => openEditProduct(prod)}
                          className="w-6 h-6 rounded-full bg-white/90 backdrop-blur-sm border border-slate-100 flex items-center justify-center text-slate-500 hover:text-purple-600 cursor-pointer outline-none shadow-sm"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(prod.id)}
                          className="w-6 h-6 rounded-full bg-white/90 backdrop-blur-sm border border-slate-100 flex items-center justify-center text-slate-500 hover:text-rose-600 cursor-pointer outline-none shadow-sm"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="p-2 relative">
                      <h4 className="text-[10px] font-sans font-bold text-slate-800 line-clamp-1">{prod.title}</h4>
                      <div className="flex items-center gap-1 text-[9px] font-sans text-slate-400 mt-0.5">
                        <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                        {prod.rating} · Your listing
                      </div>
                      <p className="text-[10px] font-sans font-extrabold text-slate-800 mt-0.5">₦{prod.price.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>

              {filteredProducts.length === 0 && (
                <p className="text-[11px] font-sans text-slate-400 text-center mt-6 px-4">No products listed yet.</p>
              )}
            </motion.div>
          )}

          {/* SETTINGS */}
          {activeTab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-4 mt-3 space-y-2">
              <button
                onClick={openAddProduct}
                className="w-full flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-purple-50/40 hover:border-purple-200 transition-colors cursor-pointer outline-none text-left"
              >
                <div className="w-9 h-9 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500 shrink-0">
                  <Plus className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="block text-xs font-sans font-bold text-slate-800">Add Product</span>
                  <span className="block text-[10px] font-sans text-slate-400">List a new item in your catalogue</span>
                </div>
              </button>

              <div className="bg-slate-50 border border-slate-100 rounded-xl overflow-hidden">
                <div className="px-3 pt-3 pb-1 flex items-center gap-2">
                  <PackageSearch className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-wide">
                    Inventory Management
                  </span>
                </div>
                <div className="divide-y divide-slate-100">
                  {storeProducts.map((prod) => (
                    <div key={prod.id} className="flex items-center gap-2.5 px-3 py-2.5">
                      <div className="w-9 h-9 rounded-lg overflow-hidden bg-white border border-slate-100 shrink-0">
                        <img src={prod.image} alt={prod.title} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="block text-[11px] font-sans font-bold text-slate-800 truncate">{prod.title}</span>
                        <span className="block text-[9px] font-sans text-slate-400">₦{prod.price.toLocaleString()} · {prod.condition}</span>
                      </div>
                      <button
                        onClick={() => openEditProduct(prod)}
                        className="w-7 h-7 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-500 hover:text-purple-600 cursor-pointer outline-none shrink-0"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(prod.id)}
                        className="w-7 h-7 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-500 hover:text-rose-600 cursor-pointer outline-none shrink-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {storeProducts.length === 0 && (
                    <p className="text-[11px] font-sans text-slate-400 text-center py-4">No products yet.</p>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-wide">
                    Publishing Options
                  </span>
                </div>
                <p className="text-[10px] font-sans text-slate-500 leading-relaxed">
                  Choose where new products appear when you add them — Open Market, My Store, or kept private —
                  from the Add Product screen. Product images can be updated any time via Edit on a listing above.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {productSheetOpen && (
          <AddProductSheet
            editingProduct={editingProduct}
            keepPrivate={keepPrivate}
            setKeepPrivate={setKeepPrivate}
            submitError={productActionError}
            onClose={() => {
              setProductSheetOpen(false);
              setEditingProduct(null);
            }}
            onSubmit={handleAddOrEditProduct}
          />
        )}
      </AnimatePresence>
    </div>
  );
}