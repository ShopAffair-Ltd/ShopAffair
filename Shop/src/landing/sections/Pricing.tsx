import React from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';

interface PricingProps {
  onEnterPlatform: () => void;
  onRegister: () => void;
}

export const Pricing: React.FC<PricingProps> = ({ onEnterPlatform, onRegister }) => {
  return (
    <section className="py-20 px-6 bg-slate-50/30 rounded-xl border border-slate-100">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <span className="text-[10px] font-mono font-extrabold text-purple-600 uppercase tracking-widest bg-purple-50 px-2.5 py-1 rounded-md">TRANSPARENT RATES</span>
          <h2 className="text-2xl md:text-3xl font-display font-black text-slate-900">Simple, Affordable Pricing</h2>
          <p className="text-xs md:text-sm text-slate-500 max-w-sm mx-auto">Simple tier options for buyers, casual sellers, and professional merchants.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto" style={{ perspective: 1200 }}>
          <motion.div 
            whileHover={{ 
              y: -10, 
              rotateX: 4, 
              rotateY: -4, 
              z: 20,
              borderColor: '#ddd6fe',
              boxShadow: '0 20px 40px -15px rgba(109,40,217,0.1)'
            }}
            style={{ transformStyle: "preserve-3d" }}
            className="bg-white p-8 rounded-lg border border-purple-100 flex flex-col justify-between space-y-8 relative overflow-hidden shadow-xs transition-all duration-300 text-left"
          >
            <div className="space-y-6" style={{ transform: "translateZ(20px)" }}>
              <span className="text-[9px] font-mono font-bold bg-purple-50 text-purple-600 px-2.5 py-1 rounded-full uppercase">Standard Member</span>
              <div>
                <h3 className="text-lg font-sans font-black text-slate-900 font-display">Free Access</h3>
                <p className="text-[11px] text-slate-400 mt-1">For buyers and casual community traders.</p>
              </div>
              <div className="space-y-2.5 border-t border-purple-50 pt-5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-600" /> <span>Browse verified listings</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-600" /> <span>Initiate secure escrows</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-600" /> <span>Standard 1.5% fee on trades</span>
                </div>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={onEnterPlatform}
              className="w-full py-3.5 bg-white hover:bg-purple-50/40 text-purple-700 font-bold text-xs rounded-lg transition-all cursor-pointer border border-purple-200 shadow-xs"
              style={{ transform: "translateZ(30px)" }}
            >
              Start Browsing
            </motion.button>
          </motion.div>

          <motion.div 
            whileHover={{ 
              y: -10, 
              rotateX: 4, 
              rotateY: -4, 
              z: 20,
              borderColor: '#c084fc',
              boxShadow: '0 20px 40px -15px rgba(109,40,217,0.15)'
            }}
            style={{ transformStyle: "preserve-3d" }}
            className="bg-gradient-to-b from-white to-purple-50/40 p-8 rounded-lg border border-purple-300 flex flex-col justify-between space-y-8 relative overflow-hidden shadow-md shadow-purple-600/5 transition-all duration-300 text-left"
          >
            <div className="absolute top-4 right-4 bg-purple-600 text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider" style={{ transform: "translateZ(30px)" }}>
              Most Popular
            </div>

            <div className="space-y-6" style={{ transform: "translateZ(20px)" }}>
              <span className="text-[9px] font-mono font-bold bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full uppercase">Premium Store</span>
              <div>
                <div className="flex items-baseline gap-1.5">
                  <h3 className="text-2xl font-sans font-black text-slate-900 font-display">₦15,000</h3>
                  <span className="text-[10px] text-slate-400 font-mono">/ month</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">For professional high-volume merchants.</p>
              </div>
              <div className="space-y-2.5 border-t border-purple-100 pt-5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-600" /> <span>Create persistent store page</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-600" /> <span>Priority dashboard analytics</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-600" /> <span>Zero escrow fee (0%) on trades</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-600" /> <span>Pro seller verification label</span>
                </div>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={onRegister}
              className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg shadow-lg shadow-purple-600/10 transition-all cursor-pointer"
              style={{ transform: "translateZ(30px)" }}
            >
              Launch Pro Store
            </motion.button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};