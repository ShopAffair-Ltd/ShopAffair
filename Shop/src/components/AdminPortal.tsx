import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, Users, Store, Package, Layers, ShoppingCart, 
  CreditCard, ArrowDownCircle, Star, Tag, BarChart3, FileText, 
  Bell, LifeBuoy, AlertTriangle, Edit3, Clock, Lock, 
  Activity, Settings, AlertCircle, Search
} from 'lucide-react';
import { EscrowStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTrades } from '../context/TradeContext';
import { fetchDashboard } from '../services/adminService';
import { fetchSettings } from '../services/settingsService';

import { OverviewTab } from './admin/OverviewTab';
import { UsersTab } from './admin/UsersTab';
import { VendorsTab } from './admin/VendorsTab';
import { ProductsTab } from './admin/ProductsTab';
import { CategoriesTab } from './admin/CategoriesTab';
import { OrdersTab } from './admin/OrdersTab';
import { PaymentsTab } from './admin/PaymentsTab';
import { WithdrawalsTab } from './admin/WithdrawalsTab';
import { ReviewsTab } from './admin/ReviewsTab';
import { PromotionsTab } from './admin/PromotionsTab';
import { AnalyticsTab } from './admin/AnalyticsTab';
import { ReportsTab } from './admin/ReportsTab';
import { NotificationsTab } from './admin/NotificationsTab';
import { SupportTab } from './admin/SupportTab';
import { DisputesTab } from './admin/DisputesTab';
import { PendingGroupsTab } from './admin/PendingGroupsTab';
import { CMSTab } from './admin/CMSTab';
import { ActivityLogsTab } from './admin/ActivityLogsTab';
import { SecurityTab } from './admin/SecurityTab';
import { SystemMonitoringTab } from './admin/SystemMonitoringTab';
import { SettingsTab } from './admin/SettingsTab';

export default function AdminPortal() {
  const navigate = useNavigate();
  const { user: activeProfile, logout } = useAuth();
  const { trades, forceCancelTrade } = useTrades();
  const [pendingKycCount, setPendingKycCount] = useState(0);

  useEffect(() => {
    fetchDashboard().then((d) => setPendingKycCount(d.pendingKycCount)).catch(() => {});
  }, []);

  const onForceCancelTrade = (tradeId: string) => forceCancelTrade(tradeId);
  const onClose = () => {
    logout();
    navigate('/');
  };

  const [activeSection, setActiveSection] = useState<string>('Overview');
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [systemOnline, setSystemOnline] = useState(true);
  useEffect(() => {
    fetchSettings().then((s) => {
      if (s.system_online) setSystemOnline(s.system_online === 'true');
    }).catch(() => {});
  }, []);

  if (!activeProfile || activeProfile.role !== 'admin') {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-6 text-center max-w-sm border border-slate-100 shadow-2xl space-y-4">
          <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-red-50 text-red-500">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-display font-bold text-slate-900">Access Denied</h3>
            <p className="text-xs font-sans text-slate-500 mt-2">
              The Admin Portal is restricted to compliance personnel only. Please sign in with an authorized administrator account.
            </p>
          </div>
          <button onClick={onClose} className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-sans font-bold text-xs rounded-xl cursor-pointer">
            Go Back
          </button>
        </div>
      </div>
    );
  }


  const sections = [
    { name: 'Overview', icon: LayoutDashboard, category: 'Main' },
    { name: 'Users', icon: Users, category: 'People' },
    { name: 'Vendors', icon: Store, category: 'People' },
    { name: 'Products', icon: Package, category: 'Catalog' },
    { name: 'Categories', icon: Layers, category: 'Catalog' },
    { name: 'Orders', icon: ShoppingCart, category: 'Sales' },
    { name: 'Payments', icon: CreditCard, category: 'Sales' },
    { name: 'Withdrawals', icon: ArrowDownCircle, category: 'Finances' },
    { name: 'Reviews', icon: Star, category: 'Customer' },
    { name: 'Promotions', icon: Tag, category: 'Marketing' },
    { name: 'Analytics', icon: BarChart3, category: 'Intelligence' },
    { name: 'Reports', icon: FileText, category: 'Intelligence' },
    { name: 'Notifications', icon: Bell, category: 'Marketing' },
    { name: 'Support', icon: LifeBuoy, category: 'Customer' },
    { name: 'Disputes', icon: AlertTriangle, category: 'Finances' },
    { name: 'Pending Groups', icon: AlertTriangle, category: 'Finances' },
    { name: 'CMS', icon: Edit3, category: 'System' },
    { name: 'Activity Logs', icon: Clock, category: 'System' },
    { name: 'Security', icon: Lock, category: 'System' },
    { name: 'System Monitoring', icon: Activity, category: 'System' },
    { name: 'Settings', icon: Settings, category: 'System' }
  ];

  const filteredSections = sections.filter(sec => 
    sec.name.toLowerCase().includes(sidebarSearch.toLowerCase())
  );

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'Overview':
        return (
          <OverviewTab
            trades={trades}
            setActiveSection={setActiveSection}
          />
        );
      case 'Users':
        return (
          <UsersTab />
        );
      case 'Vendors':
        return <VendorsTab />;
      case 'Products':
        return <ProductsTab />;
      case 'Categories':
        return <CategoriesTab />;
      case 'Orders':
        return <OrdersTab />;
      case 'Payments':
        return <PaymentsTab />;
      case 'Withdrawals':
        return <WithdrawalsTab />;
      case 'Reviews':
        return <ReviewsTab />;
      case 'Promotions':
        return <PromotionsTab />;
      case 'Analytics':
        return <AnalyticsTab />;
      case 'Reports':
        return <ReportsTab />;
      case 'Notifications':
        return <NotificationsTab />;
      case 'Support':
        return <SupportTab />;
      case 'Disputes':
        return <DisputesTab trades={trades} onForceCancelTrade={onForceCancelTrade} />;
      case 'Pending Groups':
        return <PendingGroupsTab />;
      case 'CMS':
        return <CMSTab />;
      case 'Activity Logs':
        return <ActivityLogsTab />;
      case 'Security':
        return <SecurityTab setActiveSection={setActiveSection} />;
      case 'System Monitoring':
        return <SystemMonitoringTab />;
      case 'Settings':
        return <SettingsTab />;
      default:
        return (
          <OverviewTab
            trades={trades}
            setActiveSection={setActiveSection}
          />
        );
    }
  };

  return (
    <div id="admin-portal-workspace" className="fixed inset-0 z-50 bg-[#F8FAFC] text-slate-800 flex flex-col h-full overflow-hidden font-sans">
      <style>{`
        #admin-portal-workspace .bg-\\[\\#020617\\],
        #admin-portal-workspace .bg-slate-900,
        #admin-portal-workspace .bg-slate-950,
        #admin-portal-workspace .bg-slate-900\\/60,
        #admin-portal-workspace .bg-slate-900\\/40 {
          background-color: #ffffff !important;
          color: #1e293b !important;
          border-color: #f3e8ff !important;
        }
        #admin-portal-workspace .text-white,
        #admin-portal-workspace .text-slate-100,
        #admin-portal-workspace .text-slate-200 {
          color: #1e1b4b !important;
        }
        #admin-portal-workspace .text-slate-300,
        #admin-portal-workspace .text-slate-400 {
          color: #4b5563 !important;
        }
        #admin-portal-workspace .text-slate-500 {
          color: #6b7280 !important;
        }
        #admin-portal-workspace .border-slate-800,
        #admin-portal-workspace .border-slate-700,
        #admin-portal-workspace .border-slate-900 {
          border-color: #e9d5ff !important;
        }
        #admin-portal-workspace input,
        #admin-portal-workspace select,
        #admin-portal-workspace textarea {
          background-color: #ffffff !important;
          border-color: #ddd6fe !important;
          color: #1e1b4b !important;
        }
        #admin-portal-workspace .text-purple-400 {
          color: #7c3aed !important;
        }
        #admin-portal-workspace .bg-purple-500\\/10,
        #admin-portal-workspace .bg-purple-600\\/10 {
          background-color: #f3e8ff !important;
          color: #7c3aed !important;
        }
        #admin-portal-workspace .bg-purple-950\\/10 {
          background-color: #faf5ff !important;
          border-color: #d8b4fe !important;
        }
        #admin-portal-workspace .text-emerald-500 {
          color: #059669 !important;
        }
        #admin-portal-workspace .bg-emerald-500\\/10,
        #admin-portal-workspace .bg-green-500\\/10 {
          background-color: #ecfdf5 !important;
          color: #059669 !important;
        }
        #admin-portal-workspace .bg-green-600 {
          background-color: #059669 !important;
          color: #ffffff !important;
        }
        #admin-portal-workspace .bg-green-600:hover {
          background-color: #047857 !important;
        }
        #admin-portal-workspace .bg-slate-800 {
          background-color: #faf5ff !important;
          border-color: #f3e8ff !important;
          color: #6b21a8 !important;
        }
        #admin-portal-workspace .bg-slate-800:hover {
          background-color: #f3e8ff !important;
        }
        #admin-portal-workspace .bg-emerald-500 {
          background-color: #10b981 !important;
        }
      `}</style>

      <div className="bg-white px-4 md:px-6 py-3 flex items-center justify-between border-b border-purple-100 shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-purple-600 hover:text-purple-800 p-1 text-lg font-bold"
          >
            ☰
          </button>
          <img src="/Image/logo.png" alt="ShopFair logo" className="w-9 h-9 object-contain" />
          <div>
            <div className="flex items-center gap-2">
              <span className="block text-[8px] font-black text-purple-600 uppercase tracking-widest">Compliance Suite</span>
              <span className={`w-1.5 h-1.5 rounded-full ${systemOnline ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`} />
            </div>
            <h1 className="text-xs md:text-sm font-black text-purple-950 flex items-center gap-1.5">
              ShopFair Escrow Admin Console
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-block text-[11px] bg-purple-50 border border-purple-100 px-3 py-1 rounded-lg text-purple-800 font-bold">
            Role: <strong className="text-purple-700 font-extrabold uppercase">Compliance Admin</strong>
          </span>
          <button
            onClick={onClose}
            className="text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl transition-all cursor-pointer shadow-sm"
          >
            Exit Console
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        <aside className={`
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:translate-x-0 transition-transform duration-200 ease-in-out
          fixed md:relative top-0 bottom-0 left-0 z-40
          w-64 bg-white border-r border-purple-100 flex flex-col h-full shrink-0
        `}>
          <div className="p-3 border-b border-purple-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-purple-400" />
              <input
                type="text"
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
                placeholder="Search dashboard..."
                className="w-full pl-8 pr-3 py-1.5 bg-purple-50/40 border border-purple-100 rounded-lg text-[11px] text-purple-900 placeholder-purple-400 focus:outline-none focus:border-purple-600 focus:bg-white"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-3">
            {['Main', 'People', 'Catalog', 'Sales', 'Finances', 'Customer', 'Marketing', 'Intelligence', 'System'].map((cat) => {
              const catSections = filteredSections.filter(s => s.category === cat);
              if (catSections.length === 0) return null;
              return (
                <div key={cat} className="space-y-1">
                  <span className="block text-[8px] font-black text-purple-400 uppercase tracking-widest px-3 mb-1">
                    {cat}
                  </span>
                  {catSections.map((sec) => {
                    const Icon = sec.icon;
                    const isActive = activeSection === sec.name;
                    return (
                      <button
                        key={sec.name}
                        onClick={() => {
                          setActiveSection(sec.name);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 rounded-lg flex items-center justify-between text-[11px] font-bold transition-all cursor-pointer ${
                          isActive 
                            ? 'bg-purple-600 text-white shadow-sm' 
                            : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50/50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="w-3.5 h-3.5" />
                          <span>{sec.name}</span>
                        </div>
                        {sec.name === 'Users' && pendingKycCount > 0 && (
                          <span className="bg-emerald-500 text-white font-mono text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                            {pendingKycCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto no-scrollbar p-4 md:p-6 bg-[#F8FAFC] space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-purple-950 flex items-center gap-2">
                {activeSection} Workspace
              </h2>
              <p className="text-[10px] text-slate-500 mt-0.5">ShopFair Administration and Override Terminal</p>
            </div>
            <div className="text-[10px] text-emerald-600 font-mono flex items-center gap-1.5 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Live System State: Optimal
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="space-y-6 text-left"
            >
              {renderActiveSection()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}