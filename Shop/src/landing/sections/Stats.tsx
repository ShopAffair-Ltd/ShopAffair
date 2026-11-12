import React, { useEffect, useState } from 'react';
import { Reveal, Counter } from '../motion-utils';
import { Coins, Users, Package, ShieldCheck } from 'lucide-react';
import { api } from '../../services/api';

interface LandingStats {
  totalTraders: number;
  totalProducts: number;
  completedTrades: number;
  totalEscrowedAmount: number;
}

export function Stats() {
  const [stats, setStats] = useState<LandingStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ stats: LandingStats }>('/products/landing-summary')
      .then((res) => {
        if (!cancelled && res.data?.stats) {
          setStats(res.data.stats);
        }
      })
      .catch(() => {
        // leave null if unavailable
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const statItems = [
    {
      icon: Coins,
      value: stats?.totalEscrowedAmount ?? 0,
      prefix: '₦',
      suffix: '',
      label: 'Volume Escrowed',
      desc: 'Total escrow trades funded on ShopAffair'
    },
    {
      icon: Users,
      value: stats?.totalTraders ?? 0,
      prefix: '',
      suffix: '',
      label: 'Registered Traders',
      desc: 'Active buyers and verified sellers'
    },
    {
      icon: Package,
      value: stats?.totalProducts ?? 0,
      prefix: '',
      suffix: '',
      label: 'Listed Products',
      desc: 'Live items available on the marketplace'
    },
    {
      icon: ShieldCheck,
      value: stats?.completedTrades ?? 0,
      prefix: '',
      suffix: '',
      label: 'Completed Escrows',
      desc: 'Trades verified via pickup code release'
    }
  ];

  return (
    <section className="px-6 py-20 bg-slate-950 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(139,92,246,0.08),transparent_50%)]" />

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {statItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Reveal key={idx} delay={idx * 0.1} className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-3">
                <div className="p-3 bg-white/5 border border-white/10 rounded-lg text-purple-400">
                  <Icon className="w-6 h-6 stroke-[1.5]" />
                </div>
                <div>
                  <h3 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                    <Counter to={item.value} prefix={item.prefix} suffix={item.suffix} />
                  </h3>
                  <p className="text-xs text-purple-300 font-bold uppercase tracking-wider mt-1">{item.label}</p>
                  <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed max-w-[200px]">{item.desc}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
