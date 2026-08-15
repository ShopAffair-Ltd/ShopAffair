import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, User, Settings, LogOut, ArrowLeft } from 'lucide-react';
import { UserProfile } from '../../types';

type ActiveTab = 'home' | 'trade' | 'chat' | 'market' | 'profile' | 'checkout' | 'myStore' | 'storeProfile';

interface AppHeaderProps {
  activeTab: ActiveTab;
  activeProfile: UserProfile;
  onNavigateTab: (tab: ActiveTab) => void;
  onLogout: () => void;
  showBackButton?: boolean;
  onBack?: () => void;
  chatPartnerName?: string;
}

const TAB_TITLES: Partial<Record<ActiveTab, string>> = {
  home: 'Secured Wallet',
  trade: 'Escrow Trades',
  market: 'Open Market',
  chat: 'Direct Chats',
  profile: 'Member Profile'
};

export default function AppHeader({ 
  activeTab, 
  activeProfile, 
  onNavigateTab, 
  onLogout,
  showBackButton = false,
  onBack,
  chatPartnerName
}: AppHeaderProps) {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  return (
    <div className="bg-white px-4 py-3 border-b border-slate-100 flex items-center justify-between shadow-xs sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {showBackButton && onBack ? (
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
        ) : (
          <span className="w-2 h-2 rounded-full bg-purple-600" />
        )}
        <h2 className="text-sm font-sans font-black text-slate-950 tracking-tight">
          {showBackButton && chatPartnerName ? chatPartnerName : (TAB_TITLES[activeTab] ?? '')}
        </h2>
      </div>

      <div className="flex items-center gap-2.5 relative">
        <button
          onClick={() => alert('Notifications: No unread compliance or payment alerts at this time.')}
          className="w-9 h-9 rounded-full bg-slate-50 border border-slate-100/80 flex items-center justify-center text-slate-500 relative hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-purple-600 rounded-full animate-pulse" />
        </button>

        <div className="relative">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="w-9 h-9 rounded-full overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center cursor-pointer hover:border-purple-300 transition-colors"
          >
            {activeProfile.profilePicture ? (
              <img src={activeProfile.profilePicture} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-sans font-bold text-slate-500">
                {activeProfile.name?.charAt(0).toUpperCase()}
              </span>
            )}
          </button>

          <AnimatePresence>
            {profileDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfileDropdownOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 py-1.5 divide-y divide-slate-50"
                >
                  <div className="px-3 py-2 text-left">
                    <span className="block text-xs font-sans font-bold text-slate-800 truncate">{activeProfile.name}</span>
                    <span className="block text-[10px] text-slate-400 font-mono truncate">@{activeProfile.username}</span>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        onNavigateTab('profile');
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-sans hover:bg-slate-50 text-slate-700 flex items-center gap-2 cursor-pointer border-0 bg-transparent"
                    >
                      <User className="w-4 h-4 text-slate-400" /> View Profile
                    </button>
                    <button
                      onClick={() => {
                        onNavigateTab('profile');
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-sans hover:bg-slate-50 text-slate-700 flex items-center gap-2 cursor-pointer border-0 bg-transparent"
                    >
                      <Settings className="w-4 h-4 text-slate-400" /> Settings
                    </button>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        onLogout();
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-sans hover:bg-rose-50 text-rose-600 flex items-center gap-2 cursor-pointer border-0 bg-transparent"
                    >
                      <LogOut className="w-4 h-4 text-rose-400" /> Logout
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}