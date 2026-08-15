import React from 'react';
import { motion } from 'motion/react';
import { Lock, ShieldCheck, Zap } from 'lucide-react';

export const About: React.FC = () => {
  const cards = [
    {
      icon: Lock,
      title: 'Multi-Sig Locked Accounts',
      desc: 'Funds stay safely locked in secure, automated bank-backed vaults. No manual intervention, complete transaction transparency.',
      color: 'text-purple-600',
    },
    {
      icon: ShieldCheck,
      title: '100% Verified Members',
      desc: 'Every participant is fully vetted using standard BVN checking and document validation. No anonymous accounts or shadow sellers.',
      color: 'text-purple-700',
    },
    {
      icon: Zap,
      title: 'Instant Wallet Clearing',
      desc: 'Disburse your wallet earnings to any Nigerian checking account instantly. No settlement hold times or processing delays.',
      color: 'text-purple-800',
    }
  ];

  return (
    <section className="py-20 bg-slate-50/50 rounded-xl border border-slate-100 px-6">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <span className="text-[10px] font-mono font-extrabold text-purple-600 uppercase tracking-widest bg-purple-50 px-2.5 py-1 rounded-md">CORE SAFEGUARDS</span>
          <h2 className="text-2xl md:text-3xl font-display font-black text-slate-900">Built to Protect Every Transaction</h2>
          <p className="text-xs md:text-sm text-slate-500 max-w-lg mx-auto">Engineered to eliminate trust deficits in the Nigerian digital landscape.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" style={{ perspective: 1200 }}>
          {cards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={idx}
                whileHover={{ 
                  y: -8, 
                  rotateX: 6, 
                  rotateY: -6, 
                  z: 20,
                  borderColor: '#a78bfa', 
                  boxShadow: '0 15px 35px -10px rgba(109,40,217,0.12)' 
                }}
                style={{ transformStyle: "preserve-3d" }}
                className="bg-white p-8 rounded-lg border border-purple-100 flex flex-col justify-between space-y-6 shadow-xs transition-all duration-300 text-left"
              >
                <div className={`w-12 h-12 rounded-lg bg-purple-50 ${card.color} flex items-center justify-center border border-purple-100`} style={{ transform: "translateZ(30px)" }}>
                  <Icon className="w-6 h-6" />
                </div>
                <div style={{ transform: "translateZ(20px)" }}>
                  <h3 className="text-sm font-sans font-black text-slate-900">{card.title}</h3>
                  <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">{card.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};