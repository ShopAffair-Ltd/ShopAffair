import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Eye, EyeOff, History, Landmark, Download, ArrowUpRight, ArrowDownLeft, Share2, Store, ShoppingCart, MessageSquare, Clock, ShieldCheck, ChevronRight, X, Phone, Wifi, Gift } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMarket } from '../context/MarketContext';
import { useWallet } from '../context/WalletContext';
import { useStore } from '../context/StoreContext';
import { useTrades } from '../context/TradeContext';
import QuickTransferModal from './QuickTransferModal';

const useLocalRoleOverride = () => {
  const { user, updateUser } = useAuth();
  const switchRole = (role: 'buyer' | 'seller') => {
    if (!user) return;
    updateUser({ ...user, role });
  };
  return { switchRole };
};

export default function HomeView() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { products } = useMarket();
  const { trades } = useTrades();
  const { openDeposit, openTransfer } = useWallet();
  const { openStoreUpgrade } = useStore();
  const { switchRole } = useLocalRoleOverride();

  const [showBalance, setShowBalance] = useState(true);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [referModalOpen, setReferModalOpen] = useState(false);
  const [quickTransferOpen, setQuickTransferOpen] = useState(false);

  if (!user) return null;

  const trendingProducts = products.slice(0, 6);
  const recentTrades = trades.slice(0, 6);
  const isSeller = user.role === 'seller';

  const handleOpenStoreUpgrade = () => {
    if (user.isPro) {
      navigate('/my-store');
    } else {
      openStoreUpgrade();
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white h-full overflow-y-auto no-scrollbar pb-24">

      <div className="px-4 pt-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setRoleModalOpen(true)}
            className="w-10 h-10 rounded-full bg-purple-100 border border-purple-200 text-purple-600 font-sans font-bold text-sm flex items-center justify-center cursor-pointer hover:bg-purple-200 transition-all shadow-md hover:shadow-lg"
          >
            {user.name.charAt(0).toUpperCase()}
          </button>
          <div>
            <span className="block text-slate-400 text-xs font-sans">Welcome back</span>
            <span className="text-sm font-sans font-extrabold text-slate-800 flex items-center gap-1">
              {user.name}
              {user.verificationStatus === 'VERIFIED' && (
                <ShieldCheck className="w-3.5 h-3.5 text-green-500 fill-green-50" />
              )}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setRoleModalOpen(true)}
            className={`text-[10px] font-sans font-extrabold px-2.5 py-1 rounded-full border cursor-pointer capitalize transition-all shadow-md hover:shadow-lg ${
              isSeller
                ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'
                : 'bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-100'
            }`}
          >
            Role: {user.role}
          </button>
          <button className="w-9 h-9 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 relative">
            <Bell className="w-4.5 h-4.5" />
            <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-purple-600 rounded-full" />
          </button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="px-4 mt-3"
      >
        <div className="bg-slate-900 text-white rounded-2xl px-4 py-3 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-600/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Landmark className="w-3 h-3 text-purple-400" />
              <span className="text-[9px] font-sans text-slate-400 tracking-wide font-medium">Available Balance</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="p-0.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                {showBalance ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
              <button className="p-0.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
                <History className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="mt-1">
            <span className="text-xl font-display font-black tracking-tight">
              {showBalance ? `₦${user.walletBalance.toLocaleString()}.00` : '•••••••'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 mt-2">
            <div className="bg-white/5 rounded-xl px-2 py-1.5 border border-white/5 flex items-center gap-1.5">
              <div className="p-0.5 bg-blue-500/10 text-blue-400 rounded-lg shadow-sm">
                <ArrowDownLeft className="w-3 h-3 stroke-[2.5]" />
              </div>
              <div>
                <span className="block text-[7px] font-sans text-slate-400 font-bold uppercase tracking-wider">Pending In</span>
                <span className="text-[9px] font-sans font-bold text-slate-200">
                  {showBalance ? `₦${user.walletBalance.toLocaleString()}.00` : '•••••••'}
                </span>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl px-2 py-1.5 border border-white/5 flex items-center gap-1.5">
              <div className="p-0.5 bg-amber-500/10 text-amber-400 rounded-lg shadow-sm">
                <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
              </div>
              <div>
                <span className="block text-[7px] font-sans text-slate-400 font-bold uppercase tracking-wider">Pending Out</span>
                <span className="text-[9px] font-sans font-bold text-slate-200">
                  {showBalance ? `₦${user.walletBalance.toLocaleString()}.00` : '•••••••'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="px-4 mt-4">
        <h3 className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-400 mb-2">Market Actions</h3>
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-40px' }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
          className="grid grid-cols-2 gap-2"
        >
          <motion.div
            variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
            whileHover={{ y: -2, scale: 1.01 }}
            onClick={() => navigate('/trade')}
            className="p-3 bg-white border border-slate-100 hover:border-green-300 shadow-md hover:shadow-xl rounded-xl flex items-center justify-between cursor-pointer transition-all duration-200 w-full h-[80px]"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-green-700 text-white flex items-center justify-center shrink-0 shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2)_0%,transparent_60%)]" />
                <ArrowUpRight className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-[11px] font-sans font-bold text-slate-800">Trade</span>
                <span className="text-[8px] font-sans text-slate-400">Create escrow</span>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          </motion.div>

          <motion.div
            variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
            whileHover={{ y: -2, scale: 1.01 }}
            onClick={handleOpenStoreUpgrade}
            className="p-3 bg-white border border-slate-100 hover:border-orange-300 shadow-md hover:shadow-xl rounded-xl flex items-center justify-between cursor-pointer transition-all duration-200 w-full h-[80px]"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 text-white flex items-center justify-center shrink-0 shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2)_0%,transparent_60%)]" />
                <Store className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-[11px] font-sans font-bold text-slate-800">My Store</span>
                <span className="text-[8px] font-sans text-slate-400">List items</span>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          </motion.div>

          <motion.div
            variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
            whileHover={{ y: -2, scale: 1.01 }}
            onClick={() => navigate('/chat')}
            className="p-3 bg-white border border-slate-100 hover:border-blue-300 shadow-md hover:shadow-xl rounded-xl flex items-center justify-between cursor-pointer transition-all duration-200 w-full h-[80px]"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center shrink-0 shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2)_0%,transparent_60%)]" />
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-[11px] font-sans font-bold text-slate-800">Chats</span>
                <span className="text-[8px] font-sans text-slate-400">User channels</span>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          </motion.div>

          <motion.div
            variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
            whileHover={{ y: -2, scale: 1.01 }}
            onClick={() => navigate('/trade')}
            className="p-3 bg-white border border-slate-100 hover:border-yellow-300 shadow-md hover:shadow-xl rounded-xl flex items-center justify-between cursor-pointer transition-all duration-200 w-full h-[80px]"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 text-white flex items-center justify-center shrink-0 shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2)_0%,transparent_60%)]" />
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-[11px] font-sans font-bold text-slate-800">Pending Trades</span>
                <span className="text-[8px] font-sans text-slate-400">Awaiting clearance</span>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="px-4 mt-4"
      >
        <motion.div
          whileHover={{ scale: 1.01 }}
          onClick={() => setReferModalOpen(true)}
          className="bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer relative overflow-hidden shadow-lg hover:shadow-xl transition-shadow w-full"
        >
          <div className="absolute top-2 right-12 w-8 h-8 bg-purple-500 rounded-full opacity-30" />
          <div className="absolute bottom-1 right-20 w-4 h-4 bg-purple-400 rounded-full opacity-20" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15)_0%,transparent_60%)]" />

          <div className="flex items-center gap-3 relative z-10">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white shadow-sm relative overflow-hidden border border-white/10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.3)_0%,transparent_60%)]" />
              <Gift className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-sm font-sans font-bold">Refer & Earn</span>
              <span className="text-[10px] font-sans text-purple-200">Get ₦500 for each friend invited!</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-purple-200 relative z-10" />
        </motion.div>
      </motion.div>

      <motion.div
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } } }}
        className="px-4 mt-4"
      >
        <h3 className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-400 mb-2">Quick Actions</h3>
        <div className="grid grid-cols-4 gap-2 text-center">
          <motion.button
            variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
            whileHover={{ y: -2 }}
            onClick={openDeposit}
            className="flex flex-col items-center gap-1.5 group cursor-pointer focus:outline-none w-full"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 text-purple-600 flex items-center justify-center shadow-md group-hover:shadow-xl group-hover:bg-purple-100 transition-all relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(124,58,237,0.08)_0%,transparent_60%)]" />
              <Download className="w-4.5 h-4.5 stroke-[2.5]" />
            </div>
            <span className="text-[10px] font-sans font-semibold text-slate-700">Deposit</span>
          </motion.button>

          <motion.button
            variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
            whileHover={{ y: -2 }}
            onClick={openTransfer}
            className="flex flex-col items-center gap-1.5 group cursor-pointer focus:outline-none w-full"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 text-purple-600 flex items-center justify-center shadow-md group-hover:shadow-xl group-hover:bg-purple-100 transition-all relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(124,58,237,0.08)_0%,transparent_60%)]" />
              <Share2 className="w-4.5 h-4.5 stroke-[2.5]" />
            </div>
            <span className="text-[10px] font-sans font-semibold text-slate-700">Transfer</span>
          </motion.button>

          <motion.button
            variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
            whileHover={{ y: -2 }}
            onClick={() => setQuickTransferOpen(true)}
            className="flex flex-col items-center gap-1.5 group cursor-pointer focus:outline-none w-full"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 text-purple-600 flex items-center justify-center shadow-md group-hover:shadow-xl group-hover:bg-purple-100 transition-all relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(124,58,237,0.08)_0%,transparent_60%)]" />
              <Phone className="w-4.5 h-4.5 stroke-[2.5]" />
            </div>
            <span className="text-[10px] font-sans font-semibold text-slate-700">Airtime</span>
          </motion.button>

          <motion.button
            variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
            whileHover={{ y: -2 }}
            onClick={() => setQuickTransferOpen(true)}
            className="flex flex-col items-center gap-1.5 group cursor-pointer focus:outline-none w-full"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 text-purple-600 flex items-center justify-center shadow-md group-hover:shadow-xl group-hover:bg-purple-100 transition-all relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(124,58,237,0.08)_0%,transparent_60%)]" />
              <Wifi className="w-4.5 h-4.5 stroke-[2.5]" />
            </div>
            <span className="text-[10px] font-sans font-semibold text-slate-700">Data</span>
          </motion.button>
        </div>
      </motion.div>

      {recentTrades.length > 0 && (
        <div className="px-4 mt-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-400">Recent Trades</h3>
            <button
              onClick={() => navigate('/trade')}
              className="text-[10px] font-sans font-bold text-purple-600 hover:text-purple-700 flex items-center gap-0.5 cursor-pointer shadow-sm hover:shadow-md transition-shadow"
            >
              View All <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto no-scrollbar -mx-1 px-1">
            <div className="flex gap-3 pb-2" style={{ minWidth: 'max-content' }}>
              {recentTrades.map((trade) => (
                <div
                  key={trade.id}
                  onClick={() => navigate(`/trade/${trade.id}`)}
                  className="w-[140px] shrink-0 bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col"
                >
                  <div className="aspect-square w-full bg-slate-50 relative overflow-hidden">
                    {trade.image ? (
                      <img
                        src={trade.image}
                        alt={trade.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <ShoppingCart className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="p-2.5 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[8px] font-sans font-semibold text-slate-400 block mb-0.5 capitalize">
                        {trade.status.toLowerCase()}
                      </span>
                      <h4 className="text-[9px] font-sans font-bold text-slate-800 line-clamp-1">{trade.title}</h4>
                    </div>
                    <p className="text-[10px] font-sans font-extrabold text-purple-600 mt-1">
                      ₦{trade.amount.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="px-4 mt-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-400">Market Top Products</h3>
          <button
            onClick={() => navigate('/market')}
            className="text-[10px] font-sans font-bold text-purple-600 hover:text-purple-700 flex items-center gap-0.5 cursor-pointer shadow-sm hover:shadow-md transition-shadow"
          >
            Open Market <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto no-scrollbar -mx-1 px-1">
          <div className="flex gap-3 pb-2" style={{ minWidth: 'max-content' }}>
            {trendingProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => navigate('/market', { state: { productId: product.id } })}
                className="w-[140px] shrink-0 bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col"
              >
                <div className="aspect-square w-full bg-slate-50 relative overflow-hidden">
                  <img src={product.image} alt={product.title} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                </div>
                <div className="p-2.5 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[8px] font-sans font-semibold text-slate-400 block mb-0.5">{product.salesCount} Sales</span>
                    <h4 className="text-[9px] font-sans font-bold text-slate-800 line-clamp-1">{product.title}</h4>
                  </div>
                  <p className="text-[10px] font-sans font-extrabold text-purple-600 mt-1">₦{product.price.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {roleModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-100 shadow-2xl relative"
            >
              <button
                onClick={() => setRoleModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors shadow-sm hover:shadow-md"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center pb-4 border-b border-slate-50">
                <h3 className="text-lg font-display font-bold text-slate-900">How will you use ShopAffair?</h3>
                <p className="text-xs font-sans text-slate-500 mt-1">Choose your workspace role. Verification state is retained.</p>
              </div>

              <div className="space-y-3 mt-4">
                <button
                  onClick={() => {
                    switchRole('buyer');
                    setRoleModalOpen(false);
                  }}
                  className={`w-full p-4 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer shadow-sm hover:shadow-md ${
                    user.role === 'buyer'
                      ? 'border-purple-600 bg-purple-50/50'
                      : 'border-slate-100 hover:bg-slate-50 bg-white'
                  }`}
                >
                  <div className={`p-2 rounded-xl shrink-0 shadow-sm ${user.role === 'buyer' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-xs font-sans font-bold text-slate-800">I am a Buyer</span>
                    <span className="text-[10px] font-sans text-slate-400 mt-0.5 block leading-relaxed">
                      Browse catalog items, checkout via multi-sig escrow, and message sellers.
                    </span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    switchRole('seller');
                    setRoleModalOpen(false);
                  }}
                  className={`w-full p-4 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer shadow-sm hover:shadow-md ${
                    user.role === 'seller'
                      ? 'border-purple-600 bg-purple-50/50'
                      : 'border-slate-100 hover:bg-slate-50 bg-white'
                  }`}
                >
                  <div className={`p-2 rounded-xl shrink-0 shadow-sm ${user.role === 'seller' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <Store className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-xs font-sans font-bold text-slate-800">I am a Seller</span>
                    <span className="text-[10px] font-sans text-slate-400 mt-0.5 block leading-relaxed">
                      Create trade terms, track customer escrows, and expand digital or physical product stores.
                    </span>
                  </div>
                </button>
              </div>

              <div className="mt-5">
                <button
                  onClick={() => setRoleModalOpen(false)}
                  className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white font-sans font-bold text-xs rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {referModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-100 shadow-2xl relative text-center space-y-4"
            >
              <button
                onClick={() => setReferModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors shadow-sm hover:shadow-md"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-50 to-purple-100 text-purple-600 flex items-center justify-center mx-auto shadow-lg relative overflow-hidden border-2 border-purple-200">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(124,58,237,0.1)_0%,transparent_60%)]" />
                <Gift className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-display font-bold text-slate-900">Your Invitation Code</h3>
                <p className="text-xs font-sans text-slate-500 mt-1">Share this with friends in Lagos, Abuja and beyond to earn ₦500 each!</p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-base font-bold text-slate-700 select-all shadow-inner">
                SHOPAFFAIR-{user.username.toUpperCase()}-REFER
              </div>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(`SHOPAFFAIR-${user.username.toUpperCase()}-REFER`);
                  alert('Referral link copied to clipboard!');
                  setReferModalOpen(false);
                }}
                className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-sans font-bold text-xs rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer border border-purple-400/50"
              >
                Copy & Share Link
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <QuickTransferModal open={quickTransferOpen} onClose={() => setQuickTransferOpen(false)} />
    </div>
  );
}