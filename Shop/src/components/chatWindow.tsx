import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Phone, MoreVertical, Bot, Sparkles, Star,
  Smile, Paperclip, Send, Store, PinOff, Trash2, Ban, Package, ChevronRight, Check, CheckCheck
} from 'lucide-react';
import { ChatRoom } from '../types';
import { formatMessageTime } from './chatConstants';

interface ChatWindowProps {
  selectedRoom: ChatRoom;
  activeUsername: string;
  messageText: string;
  setMessageText: (text: string) => void;
  onSend: (e: React.FormEvent) => void;
  onBack: () => void;
  onVoiceCall: () => void;
  onVisitStore: () => void;
  onViewProfile: () => void;
  callToast: string | null;
  showChatMenu: boolean;
  setShowChatMenu: (show: boolean) => void;
  showEmojiPicker: boolean;
  setShowEmojiPicker: (show: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  storeIconShake: boolean;
  isAIChat: boolean;
  isSellerChat: boolean;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
}

export default function ChatWindow({
  selectedRoom,
  activeUsername,
  messageText,
  setMessageText,
  onSend,
  onBack,
  onVoiceCall,
  onVisitStore,
  onViewProfile,
  callToast,
  showChatMenu,
  setShowChatMenu,
  showEmojiPicker,
  setShowEmojiPicker,
  fileInputRef,
  onFileSelect,
  storeIconShake,
  isAIChat,
  isSellerChat,
  onTypingStart,
  onTypingStop,
}: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedRoom?.messages]);

  // 100dvh alone isn't reliable on iOS Safari once the keyboard's own
  // accessory bar (autofill/next-field row) is showing - dvh can under-
  // report the space that bar actually takes, leaving a blank gap above
  // the input. window.visualViewport tracks the real visible area
  // continuously and is the standard fix for this class of bug; falls
  // back to 100dvh on browsers without visualViewport support.
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
  const [viewportOffsetTop, setViewportOffsetTop] = useState<number>(0);

  useEffect(() => {
    if (!window.visualViewport) return;
    const vv = window.visualViewport;
    const update = () => {
      // offsetTop is how far the visual viewport (what's actually on
      // screen) has scrolled down from the layout viewport's top - this
      // is non-zero whenever the browser's address bar is still showing,
      // and a fixed/top:0 element must be shifted by that same amount or
      // it ends up positioned above what's actually visible, leaving a
      // blank gap at the top on real devices (not reproducible in
      // simulators/webviews, which don't have collapsing browser chrome).
      setViewportHeight(vv.height);
      setViewportOffsetTop(vv.offsetTop);
    };
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);

    // iOS's own autofill accessory bar (key/card/location icons) can
    // attach above the keyboard even with autocomplete="off" - iOS often
    // ignores that hint on fields it heuristically flags. The bar slides
    // in with its own animation that is NOT finished when the first
    // visualViewport "resize" event fires, so that first reading is
    // stale by the bar's height, leaving a blank gap at the top (fixed
    // top is offset from a viewport that's briefly taller than reality).
    // Re-measuring a few times after focus, after the animation has had
    // time to settle, corrects for that without needing to detect the
    // bar directly.
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target || (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA')) return;
      [50, 150, 300, 500].forEach((delay) => {
        window.setTimeout(update, delay);
      });
    };
    window.addEventListener('focusin', handleFocusIn);

    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
      window.removeEventListener('focusin', handleFocusIn);
    };
  }, []);

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 26, stiffness: 240 }}
      className="fixed inset-x-0 z-[100] bg-white flex flex-col overflow-hidden"
      // Prefer the live visualViewport measurement (handles iOS Safari's
      // keyboard accessory bar correctly); 100dvh is the fallback for
      // browsers where visualViewport isn't available yet. top is offset
      // by visualViewport.offsetTop so the panel tracks the part of the
      // screen that's actually visible, not the full layout viewport.
      style={
        viewportHeight !== null
          ? { height: `${viewportHeight}px`, top: `${viewportOffsetTop}px` }
          : { height: '100dvh', top: 0 }
      }
    >
      {/* shrink-0 (not sticky - sticky only matters inside a scrolling
          container, and this header is a flex sibling of the message
          list, not inside it) keeps the header pinned at a fixed size so
          the keyboard opening can never compress or push it out of view;
          only the message list below is allowed to resize/scroll. */}
      <div className={`shrink-0 px-4 py-3 border-b border-slate-100 flex items-center justify-between ${isAIChat ? 'bg-gradient-to-r from-purple-50 to-purple-100' : 'bg-white'
        }`}>
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div
            onClick={!isAIChat ? onViewProfile : undefined}
            className={`w-11 h-11 rounded-full flex items-center justify-center border-2 relative shrink-0 ${!isAIChat ? 'cursor-pointer' : ''
              } ${isAIChat
                ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white border-purple-300'
                : 'bg-gradient-to-br from-purple-100 to-purple-200 text-purple-600 border-purple-200'
              }`}>
            {isAIChat ? (
              <Bot className="w-5.5 h-5.5" />
            ) : (
              selectedRoom.participantName.charAt(0)
            )}
            {isAIChat && (
              <span className="absolute -top-1 -right-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              </span>
            )}
            {!isAIChat && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span
                onClick={!isAIChat ? onViewProfile : undefined}
                className={`block text-[15px] font-sans font-bold leading-tight truncate ${!isAIChat ? 'cursor-pointer hover:underline' : ''
                  } ${isAIChat ? 'text-purple-700' : 'text-slate-800'
                  }`}>
                {selectedRoom.participantName}
              </span>
              {isAIChat && (
                <span className="text-[9px] font-sans font-bold text-purple-600 bg-purple-200/50 px-2 py-0.5 rounded-full">AI</span>
              )}
              {!isAIChat && (
                <span className="text-[10px] font-sans font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full shrink-0">
                  Online
                </span>
              )}
            </div>
            {isAIChat ? (
              <span className="text-[11px] font-sans text-purple-500 font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Your AI Trade Assistant
              </span>
            ) : selectedRoom.participantRole === 'seller' ? (
              <span className="text-[11px] font-sans text-slate-500 font-medium flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                {(selectedRoom.rating ?? 0).toFixed(1)}
                <span className="text-slate-400">
                  ({selectedRoom.reviewCount ?? 0} reviews)
                </span>
              </span>
            ) : (
              <span className="text-[11px] font-sans text-slate-400 font-medium capitalize">
                {selectedRoom.participantRole === 'buyer'
                  ? 'Buyer'
                  : selectedRoom.participantRole}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 text-slate-400 shrink-0">
          <button
            onClick={onVoiceCall}
            aria-label="Voice call"
            className="p-2 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
          >
            <Phone className="w-4.5 h-4.5" />
          </button>

          {isSellerChat && (
            <motion.button
              onClick={onVisitStore}
              aria-label="Visit Store"
              className="p-2 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-colors relative"
              animate={storeIconShake ? {
                rotate: [0, -10, 10, -10, 10, 0],
                scale: [1, 1.1, 1, 1.1, 1],
              } : {
                rotate: 0,
                scale: 1,
              }}
              transition={{
                duration: 0.8,
                repeat: storeIconShake ? Infinity : 0,
                ease: "easeInOut",
              }}
            >
              <Store className="w-4.5 h-4.5 text-purple-600" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full" />
            </motion.button>
          )}

          <div className="relative">
            <button
              onClick={() => setShowChatMenu(!showChatMenu)}
              aria-label="More options"
              className="p-2 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors"
            >
              <MoreVertical className="w-4.5 h-4.5" />
            </button>
            <AnimatePresence>
              {showChatMenu && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setShowChatMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-12 z-30 w-48 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden"
                  >
                    {isSellerChat && (
                      <button
                        onClick={() => {
                          setShowChatMenu(false);
                          onVisitStore();
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-left text-xs font-sans font-semibold text-purple-600 hover:bg-purple-50 transition-colors border-b border-slate-50"
                      >
                        <Store className="w-4 h-4" /> Visit Store
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowChatMenu(false);
                        onVoiceCall();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-left text-xs font-sans font-semibold text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-50"
                    >
                      <Phone className="w-4 h-4 text-slate-400" /> Voice call
                    </button>
                    <button
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-left text-xs font-sans font-semibold text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-50"
                      onClick={() => setShowChatMenu(false)}
                    >
                      <PinOff className="w-4 h-4 text-slate-400" /> Pin chat
                    </button>
                    <button
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-left text-xs font-sans font-semibold text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-50"
                      onClick={() => setShowChatMenu(false)}
                    >
                      <Trash2 className="w-4 h-4 text-slate-400" /> Clear chat
                    </button>
                    <button
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-left text-xs font-sans font-semibold text-red-500 hover:bg-red-50 transition-colors"
                      onClick={() => setShowChatMenu(false)}
                    >
                      <Ban className="w-4 h-4 text-red-500" /> Block account
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {selectedRoom.activeTrade && !['COMPLETED', 'REFUNDED'].includes(selectedRoom.activeTrade.status) && (
        <button
          onClick={() => navigate(`/trade?open=${selectedRoom.activeTrade!.id}`)}
          className="w-full flex items-center gap-3 px-4 py-2.5 bg-amber-50 border-b border-amber-100 hover:bg-amber-100/70 transition-colors text-left"
        >
          <div className="w-8 h-8 rounded-lg bg-white border border-amber-200 overflow-hidden shrink-0 flex items-center justify-center">
            {selectedRoom.activeTrade.image ? (
              <img src={selectedRoom.activeTrade.image} alt={selectedRoom.activeTrade.title} className="w-full h-full object-cover" />
            ) : (
              <Package className="w-4 h-4 text-amber-400" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-sans font-bold text-amber-600 uppercase tracking-wide">
              Active Trade · {selectedRoom.activeTrade.status}
            </p>
            <p className="text-xs font-sans font-semibold text-slate-800 truncate">
              {selectedRoom.activeTrade.title} · ₦{selectedRoom.activeTrade.amount.toLocaleString()}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-amber-400 shrink-0" />
        </button>
      )}

      <AnimatePresence>
        {callToast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mx-4 mt-3 bg-purple-50 border border-purple-100 text-purple-700 text-xs font-sans font-semibold rounded-xl px-4 py-2.5 text-center"
          >
            {callToast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5 no-scrollbar bg-[#F8F9FC]">
        {isAIChat && (
          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-purple-200" />
            <span className="text-[11px] font-sans text-purple-600 bg-purple-50 px-3 py-1 rounded-full whitespace-nowrap flex items-center gap-1">
              <Bot className="w-3.5 h-3.5" /> AI Assistant Online
            </span>
            <div className="flex-1 h-px bg-purple-200" />
          </div>
        )}

        {selectedRoom.messages.map((msg) => {
          const isSystem = msg.senderRole === 'system';
          const isMe = msg.senderRole === 'user' || msg.senderUsername === activeUsername;
          const isAI = msg.senderRole === 'ai';
          const time = formatMessageTime(msg.timestamp);

          if (isSystem) {
            return (
              <div key={msg.id} className="flex justify-center my-1">
                <span className="text-[12px] font-sans text-slate-500 bg-slate-100 px-4 py-2 rounded-full text-center max-w-[85%]">
                  {msg.content}
                </span>
              </div>
            );
          }

          if (msg.sharedTrade) {
            const trade = msg.sharedTrade;
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <button
                  onClick={() => navigate(`/trade?open=${trade.id}`)}
                  className="max-w-[82%] w-72 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all text-left cursor-pointer overflow-hidden"
                >
                  <div className="flex items-center gap-3 p-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                      {trade.image ? (
                        <img src={trade.image} alt={trade.title} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-5 h-5 text-slate-300" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-sans font-bold text-slate-800 truncate">{trade.title}</p>
                      <p className="text-sm font-sans font-bold text-purple-600 mt-0.5">
                        ₦{trade.amount.toLocaleString()}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                  </div>
                </button>
                {time && (
                  <span className="text-[12px] font-sans mt-2 px-1 text-slate-400">{time}</span>
                )}
              </div>
            );
          }

          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div
                className={`max-w-[82%] rounded-[26px] px-5 py-4 text-[15px] leading-relaxed font-sans ${isMe
                  ? 'bg-purple-600 text-white rounded-br-lg'
                  : isAI
                    ? 'bg-gradient-to-r from-purple-100 to-purple-50 text-purple-800 rounded-bl-lg border border-purple-200'
                    : 'bg-white text-slate-800 rounded-bl-lg'
                  }`}
              >
                {isAI && !isMe && (
                  <div className="flex items-center gap-1.5 mb-1">
                    <Bot className="w-3.5 h-3.5 text-purple-500" />
                    <span className="text-[10px] font-sans font-bold text-purple-600">Micha AI</span>
                  </div>
                )}
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
              {time && (
                <div className={`flex items-center gap-1 mt-2 px-1 ${isAI ? 'text-purple-400' : 'text-slate-400'
                  }`}>
                  <span className="text-[12px] font-sans">{time}</span>
                  {isMe && !msg.id.startsWith('temp_') && (
                    msg.isRead ? (
                      <CheckCheck className="w-3.5 h-3.5 text-purple-500" />
                    ) : (
                      <Check className="w-3.5 h-3.5 text-slate-400" />
                    )
                  )}
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={onSend}
        // Extra bottom padding (beyond the keyboard's own space) so the
        // input bar isn't flush against the keyboard or the phone's
        // on-screen nav bar - env() falls back to 0 on devices that don't
        // need it.
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))' }}
        className="shrink-0 p-3 bg-white border-t border-slate-100 flex items-center gap-2"
      >
        <div className="flex-1 flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-2.5">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            aria-label="Emoji"
            className="shrink-0"
          >
            <Smile className="w-5 h-5 text-slate-400" />
          </button>
          <input
            type="text"
            // Tells Safari explicitly this is a plain chat message field,
            // not a credential - without this, iOS Safari can misjudge a
            // plain text input and attach its password/autofill accessory
            // bar above the keyboard, which eats extra vertical space and
            // pushes the rest of the layout further off-screen.
            name="chat-message"
            autoComplete="off"
            autoCorrect="on"
            autoCapitalize="sentences"
            spellCheck
            value={messageText}
            onChange={(e) => {
              setMessageText(e.target.value);
              if (e.target.value.length > 0) {
                onTypingStart?.();
              } else {
                onTypingStop?.();
              }
            }}
            onFocus={onTypingStart}
            onBlur={onTypingStop}
            placeholder={isAIChat ? "Ask Micha AI anything..." : "Message"}
            className="flex-1 bg-transparent font-sans text-sm text-slate-800 placeholder-slate-400 focus:outline-none min-w-0"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Attach file"
            className="shrink-0"
          >
            <Paperclip className="w-4.5 h-4.5 text-slate-400" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={onFileSelect}
            accept="image/*,.pdf,.doc,.docx"
          />
        </div>
        <button
          type="submit"
          className={`p-3 rounded-full shadow-sm transition-colors shrink-0 ${isAIChat
            ? 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white'
            : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
        >
          <Send className="w-4 h-4 stroke-[2]" />
        </button>
      </form>

      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="px-3 pb-3 bg-white border-t border-slate-100 flex flex-wrap gap-2"
          >
            {['😀', '😂', '😍', '👍', '🙏', '🔥', '🎉', '😢', '😮', '❤️', '✅', '🤝'].map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  setMessageText(messageText + emoji);
                  setShowEmojiPicker(false);
                }}
                className="text-xl w-9 h-9 flex items-center justify-center hover:bg-slate-50 rounded-lg transition-colors"
              >
                {emoji}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}