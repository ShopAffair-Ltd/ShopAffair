import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Phone, MoreVertical, Bot, Sparkles, Star,
  Smile, Paperclip, Send, Store, PinOff, Trash2, Ban, Package, ChevronRight
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

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 26, stiffness: 240 }}
      className="fixed inset-0 z-[100] bg-white flex flex-col h-full overflow-hidden"
    >
      <div className={`sticky top-0 z-10 px-4 py-3 border-b border-slate-100 flex items-center justify-between ${
        isAIChat ? 'bg-gradient-to-r from-purple-50 to-purple-100' : 'bg-white'
      }`}>
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className={`w-11 h-11 rounded-full flex items-center justify-center border-2 relative shrink-0 ${
            isAIChat
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
              <span className={`block text-[15px] font-sans font-bold leading-tight truncate ${
                isAIChat ? 'text-purple-700' : 'text-slate-800'
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
                className={`max-w-[82%] rounded-[26px] px-5 py-4 text-[15px] leading-relaxed font-sans ${
                  isMe
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
                <span className={`text-[12px] font-sans mt-2 px-1 ${
                  isAI ? 'text-purple-400' : 'text-slate-400'
                }`}>
                  {time}
                </span>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={onSend} className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
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
          className={`p-3 rounded-full shadow-sm transition-colors shrink-0 ${
            isAIChat
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
            {['😀','😂','😍','👍','🙏','🔥','🎉','😢','😮','❤️','✅','🤝'].map((emoji) => (
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