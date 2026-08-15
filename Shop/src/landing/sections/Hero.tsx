import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, type Variants } from 'motion/react';
import { ShieldCheck, ArrowRight, Store } from 'lucide-react';
import { DepthField, usePrefersReducedMotion } from '../motion-utils';

interface HeroProps {
  onEnterPlatform: () => void;
  onRegister: () => void;
}

const CYCLE_MS = 20000;

interface HeroPhase {
  badge: string;
  heading: React.ReactNode;
  sub: string;
}

const PHASES: HeroPhase[] = [
  {
    badge: 'Multi-Sig Escrow Validator Active',
    heading: (
      <>
        Secure Digital Trade in <span className="text-green-600">Nigeria</span> With Absolute Trust.
      </>
    ),
    sub: 'Automated multi-signature escrows for buying and selling phones, laptops, and digital services with zero trust deficits.'
  },
  {
    badge: 'Real-Time Network Verification',
    heading: (
      <>
        Every Transaction, <span className="text-purple-600">Verified In Real Time.</span>
      </>
    ),
    sub: 'Every escrow is checked, synced, and settled across a validator mesh built for zero-compromise trading.'
  },
  {
    badge: '18,000+ Verified Traders Online',
    heading: (
      <>
        A Trusted Network of <span className="text-purple-600">Verified Traders.</span>
      </>
    ),
    sub: 'Join a growing web of buyers and sellers protected by automated, tamper-proof escrow logic.'
  }
];

const ParticleField: React.FC<{ reduced: boolean }> = ({ reduced }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    let width = parent.clientWidth;
    let height = parent.clientHeight;
    let frameId = 0;
    const dpr = Math.min(window.devicePixelRatio, 1.3);

    const resize = () => {
      width = parent.clientWidth;
      height = parent.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const count = Math.min(Math.max(Math.floor((width * height) / 34000), 18), 45);
    const dots = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.1,
      vy: (Math.random() - 0.5) * 0.1,
      r: Math.random() * 1.2 + 0.5
    }));

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      for (const dot of dots) {
        if (!reduced) {
          dot.x += dot.vx;
          dot.y += dot.vy;
          if (dot.x < 0 || dot.x > width) dot.vx *= -1;
          if (dot.y < 0 || dot.y > height) dot.vy *= -1;
        }
        ctx.fillStyle = 'rgba(139, 92, 246, 0.25)';
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
        ctx.fill();
      }
      frameId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(frameId);
    };
  }, [reduced]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
};

export const Hero: React.FC<HeroProps> = ({ onEnterPlatform, onRegister }) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const [phaseIndex, setPhaseIndex] = useState(0);
  const phase = PHASES[phaseIndex];

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start']
  });

  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.3]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhaseIndex((prev) => (prev + 1) % PHASES.length);
    }, CYCLE_MS);
    return () => clearInterval(interval);
  }, []);

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.14, delayChildren: 0.1 } }
  };
  const item: Variants = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const } }
  };

  return (
    <div ref={sectionRef} className="relative py-24 overflow-hidden text-center">
      <DepthField className="absolute inset-0 w-full h-full" density={54} tone="light" />
      <div className="absolute inset-0 bg-[radial-gradient(#8b5cf608_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-purple-300/20 blur-[120px] pointer-events-none" />
      <ParticleField reduced={reduced} />

      <motion.div
        style={{ opacity }}
        variants={container}
        initial="hidden"
        animate="show"
        className="max-w-4xl mx-auto px-4 space-y-8 relative z-10"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`badge-${phaseIndex}`}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 border border-purple-100 text-purple-700 shadow-sm shadow-purple-600/5"
          >
            <motion.span
              animate={reduced ? {} : { scale: [1, 1.15, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <ShieldCheck className="w-4 h-4 text-purple-600" />
            </motion.span>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">{phase.badge}</span>
          </motion.div>
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.h1
            key={`heading-${phaseIndex}`}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] as const }}
            className="text-4xl md:text-6xl font-display font-black text-slate-900 tracking-tight leading-[1.1] max-w-3xl mx-auto"
          >
            {phase.heading}
          </motion.h1>
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.p
            key={`sub-${phaseIndex}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.6 }}
            className="text-sm md:text-base text-slate-500 max-w-xl mx-auto leading-relaxed"
          >
            {phase.sub}
          </motion.p>
        </AnimatePresence>

        <motion.div variants={item} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <motion.button
            animate={reduced ? {} : { boxShadow: ['0 10px 30px -8px rgba(124,58,237,0.35)', '0 14px 40px -6px rgba(124,58,237,0.55)', '0 10px 30px -8px rgba(124,58,237,0.35)'] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.98 }}
            onClick={onEnterPlatform}
            className="w-full sm:w-auto px-9 py-4.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-black rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            Start Trading <ArrowRight className="w-4 h-4" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03, backgroundColor: 'rgba(139, 92, 246, 0.05)' }}
            whileTap={{ scale: 0.98 }}
            onClick={onRegister}
            className="w-full sm:w-auto px-8 py-4 bg-white text-purple-700 text-xs font-bold rounded-lg border border-purple-200 shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Store className="w-4 h-4" /> Register Merchant Account
          </motion.button>
        </motion.div>

        <motion.div
          variants={item}
          animate={reduced ? {} : { y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="pt-6 flex items-center justify-center gap-6 text-[10px] font-mono text-slate-400"
        >
          <span>₦2.4B+ Escrowed</span>
          <span className="w-1 h-1 rounded-full bg-purple-200" />
          <span>18,000+ Verified Traders</span>
        </motion.div>
      </motion.div>
    </div>
  );
};