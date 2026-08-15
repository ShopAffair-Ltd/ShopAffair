import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, MapPin, BarChart3, CreditCard, History, Star, 
  AlertCircle, RefreshCw, Settings, ChevronRight, Copy, 
  Check, Camera, ArrowLeft, Upload, LogOut, ShieldCheck, 
  Bell, Lock, Eye, Trash2, HelpCircle, Sparkles, DollarSign, TrendingUp
} from 'lucide-react';
import { UserProfile } from '../../types';
import { Dropdown } from '../ui/Dropdown';
import { useAuth } from '../../context/AuthContext';
import { useTrades } from '../../context/TradeContext';

type SubScreen = 'main' | 'profile-info' | 'delivery-address' | 'analytics' | 'subscription' | 'transactions' | 'settings' | 'reviews' | 'disputes' | 'trades';

export default function ProfileView() {
  const navigate = useNavigate();
  const { user: activeProfile, updateUser: onUpdateProfile, logout } = useAuth();
  const { trades } = useTrades();
  const onLogout = () => {
    logout();
    navigate('/market');
  };

  const [currentScreen, setCurrentScreen] = useState<SubScreen>('main');
  const [copiedId, setCopiedId] = useState(false);
  
  // Local form states
  const [editName, setEditName] = useState(activeProfile?.name ?? '');
  const [editUsername, setEditUsername] = useState(activeProfile?.username ?? '');
  const [editEmail, setEditEmail] = useState(activeProfile?.email ?? '');
  const [editPhone, setEditPhone] = useState(activeProfile?.phoneNumber || '');
  const [editAddress, setEditAddress] = useState(activeProfile?.deliveryAddress || '12, Joel Ogunnaike Street, Ikeja GRA, Lagos');
  
  // Settings toggle states
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [tradingPin, setTradingPin] = useState('****');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Copy Profile ID
  const handleCopyId = () => {
    if (!activeProfile) return;
    const profileId = activeProfile.tempId || 'TR-2024-8847291';
    navigator.clipboard.writeText(profileId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Image Upload handler (Base64 conversion for persistence in localStorage)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeProfile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateProfile({
          ...activeProfile,
          profilePicture: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfileInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProfile) return;
    onUpdateProfile({
      ...activeProfile,
      name: editName,
      username: editUsername,
      email: editEmail,
      phoneNumber: editPhone
    });
    setCurrentScreen('main');
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProfile) return;
    onUpdateProfile({
      ...activeProfile,
      deliveryAddress: editAddress
    });
    setCurrentScreen('main');
  };

  if (!activeProfile) return null;

  return (
    <div className="flex-1 flex flex-col bg-slate-50 h-full overflow-hidden pb-24">
      
      {/* HEADER BAR */}
      <div className="sticky top-0 bg-white z-10 px-4 py-4 border-b border-slate-100 flex items-center justify-between shadow-xs">
        {currentScreen !== 'main' ? (
          <button 
            onClick={() => setCurrentScreen('main')}
            className="p-1.5 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer text-slate-600 flex items-center gap-1.5"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-xs font-sans font-bold">Back</span>
          </button>
        ) : (
          <h1 className="text-xl font-display font-black text-slate-900 tracking-tight">Profile</h1>
        )}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold bg-purple-50 text-purple-600 px-2.5 py-1 rounded-full uppercase">
            {activeProfile.verificationStatus}
          </span>
        </div>
      </div>

      {/* VIEWPORT CONTROLLER */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <AnimatePresence mode="wait">
          
          {/* 1. MAIN PROFILE DASHBOARD */}
          {currentScreen === 'main' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 space-y-6"
            >
              {/* Profile Card Info */}
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
                <div className="relative group mb-3">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-3 border-purple-100 bg-slate-100 flex items-center justify-center shadow-md">
                    {activeProfile.profilePicture ? (
                      <img 
                        src={activeProfile.profilePicture} 
                        alt={activeProfile.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-slate-400">
                        {activeProfile.name?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 p-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-full border-2 border-white shadow-sm transition-colors cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                    accept="image/*" 
                    className="hidden" 
                  />
                </div>

                <div>
                  <h2 className="text-lg font-sans font-black text-slate-900 flex items-center justify-center gap-1.5">
                    {activeProfile.name}
                    {activeProfile.verificationStatus === 'VERIFIED' && (
                      <ShieldCheck className="w-4.5 h-4.5 text-orange-500 fill-orange-500/10" />
                    )}
                  </h2>
                  <p className="text-xs text-slate-400 font-sans">@{activeProfile.username}</p>
                </div>

                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200/50 rounded-xl">
                  <span className="text-[10px] font-mono text-slate-500">ID: #{activeProfile.tempId || 'TR-2024-8847291'}</span>
                  <button 
                    onClick={handleCopyId}
                    className="p-1 hover:bg-slate-200/50 rounded-md transition-colors cursor-pointer text-slate-400 hover:text-slate-600"
                  >
                    {copiedId ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Upgrade Banner */}
              <button 
                onClick={() => setCurrentScreen('subscription')}
                className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white p-4 rounded-2xl flex items-center justify-between shadow-md shadow-orange-500/10 transition-all text-left cursor-pointer border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-xl">
                    <Sparkles className="w-5 h-5 text-amber-200" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold tracking-wide text-orange-100 uppercase">Upgrade to Tier 3</span>
                    <span className="text-[11px] text-white/90">Increase your transaction & daily payout limits!</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/80" />
              </button>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white p-3.5 rounded-2xl border border-slate-100 text-center shadow-xs">
                  <span className="block text-lg font-sans font-black text-slate-900">{activeProfile.totalTrades || 132}</span>
                  <span className="text-[10px] text-slate-400 font-sans font-medium">Total Trades</span>
                </div>
                <div className="bg-white p-3.5 rounded-2xl border border-slate-100 text-center shadow-xs">
                  <span className="block text-lg font-sans font-black text-emerald-600">{activeProfile.completionRate || '95%'}</span>
                  <span className="text-[10px] text-slate-400 font-sans font-medium">Completion</span>
                </div>
                <div className="bg-white p-3.5 rounded-2xl border border-slate-100 text-center shadow-xs">
                  <span className="block text-lg font-sans font-black text-slate-900">{activeProfile.completedTrades || 126}</span>
                  <span className="text-[10px] text-slate-400 font-sans font-medium">Completed</span>
                </div>
              </div>

              {/* ACCOUNT SECTION LIST */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest pl-1 block">Account</span>
                
                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs divide-y divide-slate-50">
                  <button 
                    onClick={() => setCurrentScreen('profile-info')}
                    className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 text-slate-700">
                      <User className="w-4.5 h-4.5 text-purple-600" />
                      <div>
                        <span className="block text-xs font-bold text-slate-800">Profile Information</span>
                        <span className="text-[10px] text-slate-400">Identity, verification, and public profile</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button 
                    onClick={() => setCurrentScreen('delivery-address')}
                    className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 text-slate-700">
                      <MapPin className="w-4.5 h-4.5 text-purple-600" />
                      <div>
                        <span className="block text-xs font-bold text-slate-800">Delivery Address</span>
                        <span className="text-[10px] text-slate-400">Delivery locations for orders.</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button 
                    onClick={() => setCurrentScreen('analytics')}
                    className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 text-slate-700">
                      <BarChart3 className="w-4.5 h-4.5 text-purple-600" />
                      <div>
                        <span className="block text-xs font-bold text-slate-800">Store Analytics</span>
                        <span className="text-[10px] text-slate-400">Monitor your sales and progress</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button 
                    onClick={() => setCurrentScreen('subscription')}
                    className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 text-slate-700">
                      <CreditCard className="w-4.5 h-4.5 text-purple-600" />
                      <div>
                        <span className="block text-xs font-bold text-slate-800">Subscription Tiers</span>
                        <span className="text-[10px] text-slate-400">Check your subscription level.</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button 
                    onClick={() => setCurrentScreen('transactions')}
                    className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 text-slate-700">
                      <History className="w-4.5 h-4.5 text-purple-600" />
                      <div>
                        <span className="block text-xs font-bold text-slate-800">Transaction History</span>
                        <span className="text-[10px] text-slate-400">Record of wallet and trade activity</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>

              {/* SYSTEM SECTION LIST */}
              <div className="space-y-2 pb-6">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest pl-1 block">System</span>
                
                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs divide-y divide-slate-50">
                  <button 
                    onClick={() => setCurrentScreen('reviews')}
                    className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 text-slate-700">
                      <Star className="w-4.5 h-4.5 text-amber-500 fill-amber-500/15" />
                      <div>
                        <span className="block text-xs font-bold text-slate-800">Review History</span>
                        <span className="text-[10px] text-slate-400">48 reviews from other buyers</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button 
                    onClick={() => setCurrentScreen('disputes')}
                    className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 text-slate-700">
                      <AlertCircle className="w-4.5 h-4.5 text-red-500" />
                      <div>
                        <span className="block text-xs font-bold text-slate-800">Disputes Portal</span>
                        <span className="text-[10px] text-slate-400">Report or check escrow dispute cases</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button 
                    onClick={() => setCurrentScreen('trades')}
                    className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 text-slate-700">
                      <RefreshCw className="w-4.5 h-4.5 text-blue-500" />
                      <div>
                        <span className="block text-xs font-bold text-slate-800">Trade History</span>
                        <span className="text-[10px] text-slate-400">Past buyer and seller escrow sheets</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button 
                    onClick={() => setCurrentScreen('settings')}
                    className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 text-slate-700">
                      <Settings className="w-4.5 h-4.5 text-slate-500" />
                      <div>
                        <span className="block text-xs font-bold text-slate-800">Settings</span>
                        <span className="text-[10px] text-slate-400">Security, pins & notification parameters</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Logout Button */}
              <button 
                onClick={onLogout}
                className="w-full py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-2xl text-xs font-sans font-bold flex items-center justify-center gap-2 border border-rose-150 cursor-pointer shadow-xs transition-colors"
              >
                <LogOut className="w-4.5 h-4.5" /> Logout from Account
              </button>
            </motion.div>
          )}

          {/* 2. PROFILE INFORMATION */}
          {currentScreen === 'profile-info' && (
            <motion.form
              onSubmit={handleSaveProfileInfo}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4 space-y-4"
            >
              <div className="bg-white p-5 rounded-2xl border border-slate-100 space-y-4">
                <h3 className="text-sm font-sans font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <User className="w-4.5 h-4.5 text-purple-600" /> Public Identity Details
                </h3>

                <div className="space-y-3 font-sans text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Full Legal Name</label>
                    <input 
                      type="text" 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-purple-600 transition-colors text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Username Handle</label>
                    <input 
                      type="text" 
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      required
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-purple-600 transition-colors text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Primary Email Address</label>
                    <input 
                      type="email" 
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      required
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-purple-600 transition-colors text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Contact Phone Number</label>
                    <input 
                      type="tel" 
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="+234..."
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-purple-600 transition-colors text-sm"
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-sans font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer text-center"
              >
                Save Identity Updates
              </button>
            </motion.form>
          )}

          {/* 3. DELIVERY ADDRESS */}
          {currentScreen === 'delivery-address' && (
            <motion.form
              onSubmit={handleSaveAddress}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4 space-y-4"
            >
              <div className="bg-white p-5 rounded-2xl border border-slate-100 space-y-4">
                <h3 className="text-sm font-sans font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <MapPin className="w-4.5 h-4.5 text-purple-600" /> Default Shipping Address
                </h3>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Specify where physical trade dispatch packages should be delivered. Ensure NIPOST or third-party courier channels can easily reach this destination.
                </p>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Full Shipping & Delivery Address</label>
                  <textarea 
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    required
                    rows={4}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-purple-600 transition-colors text-xs font-sans leading-relaxed"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-sans font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer text-center"
              >
                Save Address Credentials
              </button>
            </motion.form>
          )}

          {/* 4. STORE ANALYTICS */}
          {currentScreen === 'analytics' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4 space-y-4"
            >
              {/* Main revenue card */}
              <div className="bg-gradient-to-br from-purple-900 via-purple-950 to-indigo-950 text-white p-5 rounded-3xl relative overflow-hidden shadow-lg border border-purple-800">
                <div className="relative z-10 space-y-2">
                  <span className="text-[10px] font-sans font-extrabold text-purple-200 uppercase tracking-widest block">Naira Store Revenue</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-sans font-black tracking-tight">₦4,250,000</span>
                    <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-0.5">
                      <TrendingUp className="w-3.5 h-3.5" /> +15.4%
                    </span>
                  </div>
                  <p className="text-[10px] text-purple-200/80 leading-normal">Total payouts disbursed automatically to your NUBAN vaults.</p>
                </div>
                <div className="absolute -right-4 -bottom-6 w-32 h-32 bg-purple-600/10 rounded-full blur-2xl" />
              </div>

              {/* Stats overview */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide">Monthly Sales</span>
                  <strong className="text-slate-800 text-base font-sans mt-1 block">34 orders</strong>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide">Avg Payout Time</span>
                  <strong className="text-slate-800 text-base font-sans mt-1 block">42 minutes</strong>
                </div>
              </div>

              {/* Elegant Bar Chart Visualization via standard DOM representation */}
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Weekly Transaction Flows</span>
                
                <div className="h-32 flex items-end justify-between gap-2.5 pt-4 px-2">
                  {[45, 60, 30, 85, 55, 90, 75].map((val, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <div className="w-full bg-slate-50 rounded-md relative h-full flex items-end">
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: `${val}%` }}
                          transition={{ duration: 0.8, delay: i * 0.05 }}
                          className="w-full bg-purple-600 rounded-md hover:bg-purple-700 transition-colors"
                        />
                      </div>
                      <span className="text-[8px] font-mono text-slate-400">Day {i + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* 5. SUBSCRIPTION TIERS */}
          {currentScreen === 'subscription' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4 space-y-4"
            >
              <div className="bg-white p-5 rounded-2xl border border-slate-100 space-y-4">
                <h3 className="text-sm font-sans font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <CreditCard className="w-4.5 h-4.5 text-purple-600" /> Membership & Payout Tiers
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Your current level dictates daily settlement limits and vault routing clearance times. Choose a plan that fuels your business volume.
                </p>

                {/* TIER CARDS */}
                <div className="space-y-3">
                  {/* Tier 1 */}
                  <div className="p-4 bg-slate-50 border border-slate-200/50 rounded-xl relative overflow-hidden flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Standard Tier (Tier 1)</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Daily Limit: ₦100,000</p>
                      <p className="text-[10px] text-purple-600 mt-1.5 font-bold">Free • Active</p>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                      <Check className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Tier 2 */}
                  <div className="p-4 bg-white border border-purple-200 rounded-xl relative overflow-hidden flex justify-between items-center shadow-xs">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Merchant Pro (Tier 2)</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Daily Limit: ₦2,000,000 • 0% Escrow Fee</p>
                      <p className="text-[10px] text-purple-600 mt-1.5 font-bold">₦10,000 / month</p>
                    </div>
                    <button className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold rounded-lg cursor-pointer">
                      Upgrade
                    </button>
                  </div>

                  {/* Tier 3 */}
                  <div className="p-4 bg-white border border-slate-100 rounded-xl relative overflow-hidden flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Enterprise Settlement (Tier 3)</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Daily Limit: Unlimited • Instant Disbursements</p>
                      <p className="text-[10px] text-purple-600 mt-1.5 font-bold">Custom Quotation</p>
                    </div>
                    <button className="px-3 py-1.5 bg-slate-900 hover:bg-slate-855 text-white text-[10px] font-bold rounded-lg cursor-pointer">
                      Contact
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 6. TRANSACTION HISTORY */}
          {currentScreen === 'transactions' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4 space-y-3"
            >
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Wallet Statement Logs</span>
                
                <div className="divide-y divide-slate-50 font-sans text-xs">
                  {/* Tx 1 */}
                  <div className="py-2.5 flex justify-between items-center">
                    <div>
                      <strong className="block text-slate-800">Escrow Contract Funded</strong>
                      <span className="text-[9px] text-slate-400">TRD-101 • iPhone 15 Pro</span>
                    </div>
                    <div className="text-right">
                      <span className="block font-bold text-rose-600">-₦910,000</span>
                      <span className="text-[9px] text-slate-400 font-mono">18 July 2026</span>
                    </div>
                  </div>

                  {/* Tx 2 */}
                  <div className="py-2.5 flex justify-between items-center">
                    <div>
                      <strong className="block text-slate-800">Virtual Bank Account Topup</strong>
                      <span className="text-[9px] text-slate-400">NUBAN Credit Transfer</span>
                    </div>
                    <div className="text-right">
                      <span className="block font-bold text-green-600">+₦1,000,000</span>
                      <span className="text-[9px] text-slate-400 font-mono">18 July 2026</span>
                    </div>
                  </div>

                  {/* Tx 3 */}
                  <div className="py-2.5 flex justify-between items-center">
                    <div>
                      <strong className="block text-slate-800">Automatic Wallet Registration</strong>
                      <span className="text-[9px] text-slate-400">Welcome Balance bonus</span>
                    </div>
                    <div className="text-right">
                      <span className="block font-bold text-green-600">+₦82,000</span>
                      <span className="text-[9px] text-slate-400 font-mono">16 July 2026</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 7. SETTINGS */}
          {currentScreen === 'settings' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4 space-y-4"
            >
              <div className="bg-white p-5 rounded-2xl border border-slate-100 space-y-4 font-sans text-xs">
                <h3 className="text-sm font-sans font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <Settings className="w-4.5 h-4.5 text-purple-600" /> Configuration Parameters
                </h3>

                {/* Notifications */}
                <div className="space-y-3 border-b border-slate-50 pb-3">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                    <Bell className="w-3.5 h-3.5" /> Notifications Preferences
                  </span>
                  <div className="flex items-center justify-between">
                    <span>Email alerts on escrow status changes</span>
                    <input 
                      type="checkbox" 
                      checked={emailNotifications}
                      onChange={(e) => setEmailNotifications(e.target.checked)}
                      className="w-4 h-4 text-purple-600"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Push notification sound & popups</span>
                    <input 
                      type="checkbox" 
                      checked={pushNotifications}
                      onChange={(e) => setPushNotifications(e.target.checked)}
                      className="w-4 h-4 text-purple-600"
                    />
                  </div>
                </div>

                {/* Security */}
                <div className="space-y-3 pt-1">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" /> Security & Payout PINs
                  </span>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="block font-semibold">2-Factor Multi-Sig Auth</span>
                      <span className="text-[10px] text-slate-400">Require secondary email signature to disburse</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={twoFactorAuth}
                      onChange={(e) => setTwoFactorAuth(e.target.checked)}
                      className="w-4 h-4 text-purple-600"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                    <div>
                      <span className="block font-semibold">4-Digit Escrow PIN</span>
                      <span className="text-[10px] text-slate-400">Used to unlock funding authorizations</span>
                    </div>
                    <button 
                      onClick={() => {
                        const newPin = prompt('Enter a new 4-digit security PIN:');
                        if (newPin && newPin.length === 4 && !isNaN(Number(newPin))) {
                          setTradingPin(newPin);
                          alert('Escrow Authorisation PIN updated successfully!');
                        } else {
                          alert('Invalid PIN. Must be exactly 4 digits.');
                        }
                      }}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer text-[10px]"
                    >
                      Update ({tradingPin})
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 8. REVIEWS */}
          {currentScreen === 'reviews' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4 space-y-3"
            >
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-50 pb-2.5">
                  <span className="block text-sm font-sans font-bold text-slate-800">Customer Reviews</span>
                  <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                    <Star className="w-4 h-4 fill-amber-500" /> 4.8 / 5.0
                  </div>
                </div>

                <div className="divide-y divide-slate-50 space-y-3 font-sans text-xs">
                  {/* Review 1 */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-1">
                      <strong className="text-slate-800">Adebayo O.</strong>
                      <span className="text-[9px] text-slate-400">Verified Buyer</span>
                    </div>
                    <div className="flex items-center gap-0.5 text-amber-500 mb-1">
                      {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-amber-500 stroke-amber-500" />)}
                    </div>
                    <p className="text-slate-600 leading-normal text-[11px]">
                      "Extremely fast disbursement. Safe multi-sig channel kept my cash safe till items arrived Ikeja GRA. Highly recommend TESM!"
                    </p>
                  </div>

                  {/* Review 2 */}
                  <div className="pt-3">
                    <div className="flex items-center justify-between mb-1">
                      <strong className="text-slate-800">Precious I.</strong>
                      <span className="text-[9px] text-slate-400">Verified Buyer</span>
                    </div>
                    <div className="flex items-center gap-0.5 text-amber-500 mb-1">
                      {[...Array(4)].map((_, i) => <Star key={i} className="w-3 h-3 fill-amber-500 stroke-amber-500" />)}
                    </div>
                    <p className="text-slate-600 leading-normal text-[11px]">
                      "Product arrived exactly as configured in the physical specs listing. Safe and reliable payment gate."
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 9. DISPUTES */}
          {currentScreen === 'disputes' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4 space-y-4"
            >
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4 font-sans text-xs">
                <h3 className="text-sm font-sans font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <AlertCircle className="w-4.5 h-4.5 text-red-500" /> Escrow Dispute Resolution
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Have an issue with an item delivery, quality, or seller? Raise an official dispute case to pause the escrow multi-sig settlement vault. Our administrators will review the evidence.
                </p>

                <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-xl">
                  <strong className="block text-slate-700">No active dispute cases!</strong>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Your trades are proceeding smoothly with 100% completion success.</span>
                </div>

                <button 
                  onClick={() => alert('To initiate a dispute, select an active trade from your "Trade" screen and click "Initiate Refund Dispute".')}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-855 text-white font-sans font-bold text-xs rounded-xl transition-all cursor-pointer text-center"
                >
                  Learn how to raise disputes
                </button>
              </div>
            </motion.div>
          )}

          {/* 10. TRADE HISTORY */}
          {currentScreen === 'trades' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4 space-y-3"
            >
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Archived Escrow Trade Records</span>
                
                <div className="divide-y divide-slate-50 font-sans text-xs">
                  {trades.length > 0 ? (
                    trades.map((t) => (
                      <div key={t.id} className="py-2.5 flex justify-between items-center">
                        <div>
                          <strong className="block text-slate-800">{t.title}</strong>
                          <span className="text-[9px] text-slate-400">Escrow ID: {t.id} • {t.type}</span>
                        </div>
                        <div className="text-right">
                          <span className="block font-bold text-slate-950">₦{t.amount.toLocaleString()}</span>
                          <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${
                            t.status === 'COMPLETED' ? 'bg-green-50 text-green-700' :
                            t.status === 'REFUNDED' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {t.status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-6 text-slate-400">No past trades found.</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

    </div>
  );
}