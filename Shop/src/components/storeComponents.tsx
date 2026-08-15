import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  ShieldCheck,
  Star,
  Plus,
  Send,
  Pin,
  X,
  Image as ImageIcon,
  ChevronDown,
  Globe,
  Store,
  EyeOff,
  Heart,
  MessageCircle,
  Pencil,
  Trash2,
  PackageSearch,
  SlidersHorizontal,
  Share
} from 'lucide-react';
import { UserProfile, MarketProduct } from '../types';
import { WallPost, WallComment, timeAgo } from './storeConstants';

interface AvatarProps {
  profile: UserProfile;
  size?: number;
}

export function Avatar({ profile, size = 32 }: AvatarProps) {
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full bg-gradient-to-br from-purple-400 to-purple-600 text-white font-sans font-bold flex items-center justify-center shrink-0 overflow-hidden ring-2 ring-white shadow-sm"
    >
      {profile.profilePicture ? (
        <img src={profile.profilePicture} alt="" className="w-full h-full object-cover" />
      ) : (
        <span style={{ fontSize: size * 0.4 }}>{profile.name.charAt(0).toUpperCase()}</span>
      )}
    </div>
  );
}

interface WallPostComponentProps {
  post: WallPost;
  profile: UserProfile;
  onToggleLike: (postId: string) => void;
  onTogglePin: (postId: string) => void;
  onToggleComments: (postId: string) => void;
  onSendComment: (postId: string) => void;
  openCommentsFor: string | null;
  commentDrafts: Record<string, string>;
  setCommentDrafts: (drafts: Record<string, string>) => void;
}

export function WallPostComponent({
  post,
  profile,
  onToggleLike,
  onTogglePin,
  onToggleComments,
  onSendComment,
  openCommentsFor,
  commentDrafts,
  setCommentDrafts
}: WallPostComponentProps) {
  const isOpen = openCommentsFor === post.id;

  return (
    <div
      className={`rounded-2xl overflow-hidden transition-colors ${
        post.isPinned
          ? 'bg-gradient-to-b from-amber-50 to-orange-50/40 border border-amber-200/70 shadow-[0_1px_2px_rgba(217,119,6,0.06)]'
          : 'bg-white border border-slate-100 shadow-[0_1px_2px_rgba(15,23,42,0.04)]'
      }`}
    >
      {post.isPinned && (
        <div className="px-3.5 pt-2.5 pb-0 flex items-center gap-1 text-amber-600">
          <Pin className="w-3 h-3 fill-amber-500 text-amber-500" />
          <span className="text-[9px] font-sans font-extrabold uppercase tracking-wider">Pinned Post</span>
        </div>
      )}

      <div className="px-3.5 pt-2.5 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar profile={profile} size={32} />
          <div className="min-w-0">
            <span className="text-[12px] font-sans font-bold text-slate-900 truncate block leading-tight">
              {profile.name}
            </span>
            <span className="text-[10px] font-sans text-slate-400 leading-tight">{timeAgo(post.timestamp)}</span>
          </div>
        </div>
        {!post.isPinned && (
          <button
            onClick={() => onTogglePin(post.id)}
            className="shrink-0 flex items-center gap-1 text-[9px] font-sans font-bold uppercase tracking-wide px-2.5 py-1.5 rounded-full cursor-pointer outline-none text-slate-400 border border-slate-200 hover:text-amber-600 hover:border-amber-200 hover:bg-amber-50 transition-colors"
          >
            <Pin className="w-2.5 h-2.5" />
            Pin
          </button>
        )}
        {post.isPinned && (
          <button
            onClick={() => onTogglePin(post.id)}
            className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer outline-none text-amber-400 hover:text-amber-600 hover:bg-amber-100/60 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      <p className="text-[12.5px] font-sans text-slate-700 whitespace-pre-line leading-relaxed mt-2.5 px-3.5">
        {post.caption}
      </p>

      {post.images && post.images.length > 0 && (
        <div className="mt-2.5 mx-3.5 rounded-xl overflow-hidden bg-slate-900">
          <img src={post.images[0]} alt="" className="w-full h-44 object-cover" />
        </div>
      )}

      <div className="flex items-center gap-1 mt-3 px-2 pb-1">
        <button
          onClick={() => onToggleLike(post.id)}
          className="flex items-center gap-1.5 text-[11px] font-sans font-bold text-slate-500 cursor-pointer outline-none px-1.5 py-2 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <Heart
            className={`w-4 h-4 transition-all ${
              post.likedByMe ? 'text-rose-500 fill-rose-500 scale-110' : 'text-slate-400'
            }`}
          />
          {post.likes}
        </button>
        <button
          onClick={() => onToggleComments(post.id)}
          className={`flex items-center gap-1.5 text-[11px] font-sans font-bold cursor-pointer outline-none px-1.5 py-2 rounded-lg transition-colors ${
            isOpen ? 'text-purple-600 bg-purple-50' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <MessageCircle className={`w-4 h-4 ${isOpen ? 'text-purple-500' : 'text-slate-400'}`} />
          {post.comments.length}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3.5 pb-3.5 pt-2 border-t border-slate-100 space-y-3">
              {post.comments.map((c) => (
                <div key={c.id} className="flex items-start gap-2">
                  <div
                    className={`w-6 h-6 rounded-full text-[9px] font-sans font-bold flex items-center justify-center shrink-0 ${
                      c.isSeller ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {c.authorName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 bg-slate-50 rounded-xl rounded-tl-sm px-3 py-2 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10.5px] font-sans font-bold text-slate-800">{c.authorName}</span>
                      {c.isSeller && (
                        <span className="text-[8px] font-sans font-bold text-orange-600 bg-orange-100 rounded-full px-1.5 py-px">
                          Seller
                        </span>
                      )}
                      <span className="text-[9px] font-sans text-slate-400 ml-auto">{timeAgo(c.timestamp)}</span>
                    </div>
                    <p className="text-[11px] font-sans text-slate-600 mt-0.5 leading-snug">{c.content}</p>
                  </div>
                </div>
              ))}

              <div className="flex items-center gap-2 pt-0.5">
                <input
                  value={commentDrafts[post.id] || ''}
                  onChange={(e) =>
                    setCommentDrafts({ ...commentDrafts, [post.id]: e.target.value })
                  }
                  onKeyDown={(e) => e.key === 'Enter' && onSendComment(post.id)}
                  placeholder="Reply as seller…"
                  className="flex-1 text-[11px] font-sans px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-full outline-none focus:border-purple-300 focus:bg-white transition-colors"
                />
                <button
                  onClick={() => onSendComment(post.id)}
                  disabled={!(commentDrafts[post.id] || '').trim()}
                  className="w-8 h-8 rounded-full bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 text-white flex items-center justify-center shrink-0 cursor-pointer transition-colors outline-none"
                >
                  <Send className="w-3.5 h-3.5 -ml-0.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}