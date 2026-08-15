import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, MoreVertical, Pin, Users, Bot, Sparkles,
  MessageSquarePlus, UsersIcon, Users2, ArrowLeftRight, PinOff, Trash2, Ban
} from 'lucide-react';
import { ChatRoom } from '../types';
import { userService, User } from '../services/userService';

interface ChatSidebarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeTab: 'All' | 'Chats' | 'Groups' | 'Community';
  setActiveTab: (tab: 'All' | 'Chats' | 'Groups' | 'Community') => void;
  pinnedChats: ChatRoom[];
  recentChats: ChatRoom[];
  filteredRooms: ChatRoom[];
  onSelectRoom: (room: ChatRoom) => void;
  onShowNewChat: () => void;
  showOverflowMenu: boolean;
  setShowOverflowMenu: (show: boolean) => void;
  onShowNewGroup: () => void;
  onShowNewCommunity: () => void;
}

export default function ChatSidebar({
  searchQuery,
  setSearchQuery,
  activeTab,
  setActiveTab,
  pinnedChats,
  recentChats,
  filteredRooms,
  onSelectRoom,
  onShowNewChat,
  showOverflowMenu,
  setShowOverflowMenu,
  onShowNewGroup,
  onShowNewCommunity,
}: ChatSidebarProps) {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const response = await userService.getAllUsers();
        setAllUsers(response.data.users);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  return (
    <div className="w-full flex-col h-full flex">
      <div className="sticky top-0 bg-[#F8F9FC] z-10 px-4 pt-4 pb-0 border-b border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-display font-bold text-slate-900">Chats</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={onShowNewChat}
              className="w-10 h-10 rounded-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center shadow-lg shadow-purple-100 transition-all"
            >
              <Plus className="w-5 h-5" />
            </button>
            <div className="relative">
              <button
                onClick={() => setShowOverflowMenu(!showOverflowMenu)}
                className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              <AnimatePresence>
                {showOverflowMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => setShowOverflowMenu(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-12 z-30 w-52 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden"
                    >
                      <button
                        onClick={() => {
                          setShowOverflowMenu(false);
                          onShowNewChat();
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-left text-xs font-sans font-semibold text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-50"
                      >
                        <MessageSquarePlus className="w-4 h-4 text-slate-400" /> Create Chat
                      </button>
                      <button
                        onClick={() => {
                          setShowOverflowMenu(false);
                          onShowNewCommunity();
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-left text-xs font-sans font-semibold text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-50"
                      >
                        <UsersIcon className="w-4 h-4 text-slate-400" /> Create Community
                      </button>
                      <button
                        onClick={() => {
                          setShowOverflowMenu(false);
                          onShowNewGroup();
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-left text-xs font-sans font-semibold text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-50"
                      >
                        <Users2 className="w-4 h-4 text-slate-400" /> Create Group
                      </button>
                      <button
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-left text-xs font-sans font-semibold text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-50"
                        onClick={() => setShowOverflowMenu(false)}
                      >
                        <ArrowLeftRight className="w-4 h-4 text-slate-400" /> Create Trade
                      </button>
                      <button
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-left text-xs font-sans font-semibold text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-50"
                        onClick={() => setShowOverflowMenu(false)}
                      >
                        <PinOff className="w-4 h-4 text-slate-400" /> Pin Chat
                      </button>
                      <button
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-left text-xs font-sans font-semibold text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-50"
                        onClick={() => setShowOverflowMenu(false)}
                      >
                        <Trash2 className="w-4 h-4 text-slate-400" /> Clear Chat
                      </button>
                      <button
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-left text-xs font-sans font-semibold text-red-500 hover:bg-red-50 transition-colors"
                        onClick={() => setShowOverflowMenu(false)}
                      >
                        <Ban className="w-4 h-4 text-red-500" /> Block Account
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="relative mb-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats, trades..."
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl font-sans text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600/15 focus:border-purple-600 transition-all shadow-sm"
          />
          <Search className="absolute left-4 top-3 w-4 h-4 text-slate-400" />
        </div>

        <div className="flex items-center gap-6">
          {(['All', 'Chats', 'Groups', 'Community'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-sans font-semibold transition-all relative ${
                activeTab === tab ? 'text-purple-600' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div
                  layoutId="chatTabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-[3px] bg-purple-600 rounded-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 no-scrollbar">
        {pinnedChats.length > 0 && (
          <div className="mb-4">
            <span className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-wider block mb-2">PINNED CHATS</span>
            {pinnedChats.map((room) => {
              const isAI = room.participantRole === 'ai';
              return (
                <div
                  key={room.id}
                  onClick={() => onSelectRoom(room)}
                  className={`p-3 rounded-xl shadow-sm hover:shadow-md cursor-pointer flex items-center justify-between transition-all mb-2 border ${
                    isAI
                      ? 'bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200'
                      : 'bg-white border-slate-100/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-2 relative ${
                      isAI
                        ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white border-purple-300'
                        : 'bg-gradient-to-br from-purple-100 to-purple-200 text-purple-600 border-purple-200'
                    }`}>
                      {isAI ? (
                        <Bot className="w-6 h-6" />
                      ) : (
                        room.participantName.charAt(0)
                      )}
                      {!isAI && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                      )}
                      {isAI && (
                        <span className="absolute -top-1 -right-1">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-sans font-bold text-sm truncate ${
                          isAI ? 'text-purple-700' : 'text-slate-800'
                        }`}>
                          {room.participantName}
                        </span>
                        <Pin className="w-3 h-3 text-purple-400 rotate-45" />
                        {isAI && (
                          <span className="text-[8px] font-sans font-bold text-purple-600 bg-purple-200/50 px-1.5 py-0.5 rounded-full">
                            AI
                          </span>
                        )}
                      </div>
                      <p className={`text-xs truncate ${
                        isAI ? 'text-purple-600/70' : 'text-slate-400'
                      }`}>
                        {room.lastMessage}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <span className={`text-[10px] font-sans block ${
                      isAI ? 'text-purple-400' : 'text-slate-400'
                    }`}>
                      {room.lastMessageTime}
                    </span>
                    {room.unreadCount > 0 && (
                      <span className="inline-flex bg-purple-600 text-white font-sans font-bold text-[10px] px-2 py-0.5 rounded-full shadow-xs mt-1">
                        {room.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {recentChats.length > 0 && (
          <div>
            <span className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-wider block mb-2">RECENT CHATS</span>
            {recentChats.map((room) => (
              <div
                key={room.id}
                onClick={() => onSelectRoom(room)}
                className="p-3 bg-white rounded-xl shadow-sm hover:shadow-md cursor-pointer flex items-center justify-between transition-all mb-2 border border-slate-100/50"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 font-sans font-bold text-lg flex items-center justify-center shrink-0 border-2 border-slate-200 relative">
                    {room.participantName.charAt(0)}
                    {room.type === 'group' && (
                      <Users className="w-3 h-3 text-slate-400 absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-0.5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-sans font-bold text-sm text-slate-800 truncate">
                        {room.participantName}
                      </span>
                      {room.type === 'group' && (
                        <span className="text-[8px] text-slate-400 font-medium bg-slate-100 px-1.5 py-0.5 rounded">Group</span>
                      )}
                      {room.type === 'community' && (
                        <span className="text-[8px] text-purple-400 font-medium bg-purple-50 px-1.5 py-0.5 rounded">Community</span>
                      )}
                    </div>
                    <p className="text-xs font-sans text-slate-400 truncate">
                      {room.lastMessage}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <span className="text-[10px] font-sans text-slate-400 block">
                    {room.lastMessageTime}
                  </span>
                  {room.unreadCount > 0 && (
                    <span className="inline-flex bg-purple-600 text-white font-sans font-bold text-[10px] px-2 py-0.5 rounded-full shadow-xs mt-1">
                      {room.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredRooms.length === 0 && (
          <div className="text-center py-20 px-6">
            <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-sans text-slate-500 font-medium">No active conversation threads.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Plus(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
}