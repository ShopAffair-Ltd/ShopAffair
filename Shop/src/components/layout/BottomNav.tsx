/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Home, RefreshCw, MessageSquare, ShoppingBag } from 'lucide-react';
import { UserProfile } from '../../types';

interface BottomNavProps {
  activeTab: 'home' | 'trade' | 'chat' | 'market' | 'profile' | 'checkout';
  onTabChange: (tab: 'home' | 'trade' | 'chat' | 'market' | 'profile') => void;
  unreadChatsCount: number;
  activeProfile: UserProfile | null;
}

export default function BottomNav({ activeTab, onTabChange, unreadChatsCount, activeProfile }: BottomNavProps) {
  const tabs = [
    { id: 'home' as const, label: 'Home', icon: Home },
    { id: 'trade' as const, label: 'Trade', icon: RefreshCw },
    { id: 'chat' as const, label: 'Chat', icon: MessageSquare, badge: unreadChatsCount },
    { id: 'market' as const, label: 'Market', icon: ShoppingBag },
  ];

  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#7C3AED] border-t border-[#8B5CF6] shadow-xl px-4 py-2 flex justify-center"
    >
      <motion.nav
        className="flex items-center justify-around w-full max-w-md px-2 relative overflow-visible"
        style={{ perspective: 800 }}
      >
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <motion.button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.92 }}
              className="flex flex-col items-center justify-center relative py-1 px-1 cursor-pointer select-none outline-none group text-purple-200 focus:outline-none"
              style={{ width: '25%' }}
            >
              {/* Highlight background pill with animation */}
              {isActive && (
                <motion.div
                  layoutId="activeTabPill"
                  className="absolute inset-0 bg-[#6D28D9] rounded-full -z-10 border border-[#8B5CF6]/40"
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                />
              )}

              {/* Icon container with animations */}
              <motion.div
                animate={{
                  scale: isActive ? 1.12 : 1,
                  y: isActive ? -2 : 0,
                  rotate: isActive ? [0, -5, 5, 0] : 0,
                }}
                transition={{ 
                  type: 'spring', 
                  stiffness: 500, 
                  damping: 15,
                  rotate: { duration: 0.5, ease: "easeInOut" }
                }}
                className={`relative p-0.5 rounded-full ${isActive ? 'text-white' : 'group-hover:text-white'}`}
              >
                <motion.div
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.4 }}
                >
                  <IconComponent className="w-5 h-5 stroke-[2]" />
                </motion.div>

                {/* Optional Badge Indicator with pulse animation */}
                {tab.badge && tab.badge > 0 ? (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                    className="absolute -top-1 -right-1 bg-rose-500 text-white font-sans font-bold text-[9px] w-4 h-4 flex items-center justify-center rounded-full border border-[#7C3AED] shadow-sm"
                  >
                    {tab.badge}
                  </motion.span>
                ) : null}
              </motion.div>

              {/* Tab label with animation */}
              <motion.span
                animate={{
                  scale: isActive ? 1.03 : 0.95,
                  opacity: isActive ? 1 : 0.85,
                  y: isActive ? -0.5 : 0,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className={`text-[9px] font-sans font-semibold mt-0.5 tracking-wide ${isActive ? 'text-white' : 'text-purple-200 group-hover:text-white'}`}
              >
                {tab.label}
              </motion.span>
            </motion.button>
          );
        })}
      </motion.nav>
    </motion.div>
  );
}