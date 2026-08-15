import React, { useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Twitter, Instagram, Linkedin, Facebook, ArrowUpRight, Fingerprint, Lock, BadgeCheck } from 'lucide-react';
import { Reveal } from '../motion-utils';

const TrustNetworkCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const nodeCount = 22;
    const nodes = Array.from({ length: nodeCount }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
      pulse: Math.random() * Math.PI * 2,
      verified: Math.random() > 0.6
    }));

    const maxDist = 120;
    let raf = 0;

    const tick = () => {
      ctx.clearRect(0, 0, width, height);

      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        n.pulse += 0.02;

        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;
      }

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < maxDist) {
            const opacity = (1 - dist / maxDist) * 0.35;
            ctx.strokeStyle = `rgba(139, 92, 246, ${opacity})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      for (const n of nodes) {
        const r = n.verified ? 2.4 + Math.sin(n.pulse) * 0.6 : 1.6;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = n.verified ? 'rgba(124, 58, 237, 0.9)' : 'rgba(196, 181, 253, 0.7)';
        ctx.fill();

        if (n.verified) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, r + 3 + Math.sin(n.pulse) * 2, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(124, 58, 237, ${0.25 - Math.sin(n.pulse) * 0.1})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
};

const linkGroups = [
  {
    title: 'Platform',
    links: ['Marketplace', 'Create Escrow', 'Merchant Stores', 'Dispute Center']
  },
  {
    title: 'Company',
    links: ['About Us', 'Careers', 'Press Kit', 'Blog']
  },
  {
    title: 'Legal',
    links: ['Terms of Service', 'Privacy Policy', 'Compliance', 'Refund Policy']
  }
];

const badges = [
  { icon: Fingerprint, label: 'BVN Verified' },
  { icon: Lock, label: 'Multi-Sig Secured' },
  { icon: BadgeCheck, label: 'CBN Aligned' }
];

const socials = [
  { icon: Twitter, href: '#' },
  { icon: Instagram, href: 'https://www.instagram.com/shopaffair.app?igsh=d2ZvdWlxaHJzaHFj' },
  { icon: Facebook, href: '#' },
  { icon: Linkedin, href: '#' }
];

export const Footer: React.FC = () => {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] as const }}
      className="relative bg-slate-950 text-slate-300 overflow-hidden"
    >
      <div className="relative h-40 border-b border-white/5">
        <TrustNetworkCanvas />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/40 to-slate-950" />
        <div className="relative h-full max-w-5xl mx-auto px-6 flex items-end pb-6">
          <span className="text-[10px] font-mono font-bold text-purple-300 uppercase tracking-widest">
            Live network · every node a verified transaction
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 pt-14 pb-10 grid grid-cols-1 md:grid-cols-[1.3fr_1fr_1fr_1fr] gap-10 text-left">
        <div className="space-y-5">
          <div className="flex items-center gap-2.5">
            <img src="/Image/logo.png" alt="ShopAffair logo" className="w-9 h-9 object-contain" />
            <span className="font-display font-black tracking-tight text-lg text-white">
              Shop<span className="text-green-600">Affair</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
            Multi-signature escrow infrastructure for Nigeria's digital and physical trade, built so no one has to trade on trust alone.
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            {badges.map((badge, idx) => {
              const Icon = badge.icon;
              return (
                <motion.div
                  key={idx}
                  whileHover={{ y: -3, rotateX: 8, borderColor: 'rgba(167, 139, 250, 0.5)' }}
                  style={{ transformStyle: 'preserve-3d' }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-mono text-slate-300"
                >
                  <Icon className="w-3 h-3 text-purple-400" />
                  {badge.label}
                </motion.div>
              );
            })}
          </div>
        </div>

        {linkGroups.map((group, idx) => (
          <div key={idx} className="space-y-3.5">
            <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-purple-300">{group.title}</h4>
            <ul className="space-y-2.5">
              {group.links.map((link, i) => (
                <li key={i}>
                  <a href="#" className="text-xs text-slate-400 hover:text-white transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="max-w-5xl mx-auto px-6 pb-10">
        <div className="rounded-lg bg-white/5 border border-white/10 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-xs font-bold text-white">Get settlement updates</h4>
            <p className="text-[11px] text-slate-400 mt-1">One email a month. Escrow policy changes, no spam.</p>
          </div>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex w-full sm:w-auto gap-2"
          >
            <input
              type="email"
              placeholder="you@email.com"
              className="flex-1 sm:w-56 px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-400/60"
            />
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shrink-0"
            >
              Subscribe <ArrowUpRight className="w-3.5 h-3.5" />
            </motion.button>
          </form>
        </div>
      </div>

      <div className="border-t border-white/5">
        <div className="max-w-5xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[10px] text-slate-500 font-mono">
            &copy; {new Date().getFullYear()} ShopAffair Nigeria. All settlements final upon release.
          </p>
          <div className="flex items-center gap-3">
            {socials.map((social, idx) => {
              const Icon = social.icon;
              return (
                <motion.a
                  key={idx}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ y: -2, backgroundColor: 'rgba(124, 58, 237, 0.15)' }}
                  className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-purple-300 transition-colors"
                >
                  <Icon className="w-3.5 h-3.5" />
                </motion.a>
              );
            })}
          </div>
        </div>
      </div>
    </motion.footer>
  );
};