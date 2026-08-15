import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, Target } from 'lucide-react';

interface NavbarProps {
  onLogin: () => void;
  onRegister: () => void;
}

const navItems = [
  { label: 'Benefits', href: '#about' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Plans', href: '#pricing' },
  { label: 'FAQ', href: '#faq' }
];

export function Navbar({ onLogin, onRegister }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState('#about');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstMenuLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const sections = navItems
      .map((item) => document.querySelector(item.href))
      .filter(Boolean) as Element[];

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActive(`#${entry.target.id}`);
          }
        });
      },
      { rootMargin: '-40% 0px -50% 0px' }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
      firstMenuLinkRef.current?.focus();
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && menuOpen) {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="bg-purple-950 text-purple-100 overflow-hidden group">
        <motion.div
          className="flex whitespace-nowrap py-1.5 text-[10px] font-mono font-bold tracking-wide"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 22, ease: 'linear', repeat: Infinity }}
          style={{ animationPlayState: 'running' }}
          whileHover={{}}
        >
          {[...Array(2)].map((_, i) => (
            <span key={i} className="flex items-center shrink-0 group-hover:[animation-play-state:paused]">
              {Array.from({ length: 6 }).map((_, j) => (
                <span key={j} className="flex items-center gap-2 px-6">
                  <Target className="w-3 h-3 text-purple-300" />
                  Smart Escrow, Zero Trust Deficits
                </span>
              ))}
            </span>
          ))}
        </motion.div>
      </div>

      <motion.header
        animate={{
          backgroundColor: scrolled ? 'rgba(255, 255, 255, 0.75)' : 'rgba(255, 255, 255, 0.0)',
          borderBottomColor: scrolled ? 'rgba(237, 233, 254, 1)' : 'rgba(237, 233, 254, 0)',
          boxShadow: scrolled ? '0 4px 20px -2px rgba(109, 40, 217, 0.06)' : '0 0 0 0 rgba(0,0,0,0)'
        }}
        transition={{ duration: 0.25 }}
        className="backdrop-blur-xl border-b px-6 py-4"
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <a href="#" className="flex items-center gap-2.5">
            <motion.img
              whileHover={{ scale: 1.05, rotate: 3 }}
              src="/Image/logo.png"
              alt="ShopAffair logo"
              className="w-10 h-10 object-contain"
            />
            <span className="font-display font-black tracking-tight text-xl">
              <span className="bg-gradient-to-r from-purple-950 to-purple-600 bg-clip-text text-transparent">
                Shop
              </span>
              <span className="text-green-600">Affair</span>
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-8 text-xs text-slate-600 font-bold">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`relative py-1 transition-colors ${active === item.href ? 'text-purple-700' : 'hover:text-purple-600'}`}
              >
                {item.label}
                {active === item.href && (
                  <motion.span
                    layoutId="nav-active-indicator"
                    className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-purple-600 rounded-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={onLogin}
              className="px-4 py-2.5 text-xs text-slate-600 hover:text-purple-700 font-bold transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <motion.button
              whileHover={{ scale: 1.02, backgroundColor: '#6d28d9' }}
              whileTap={{ scale: 0.98 }}
              onClick={onRegister}
              className="px-5 py-2.5 bg-purple-600 text-white font-bold text-xs rounded-lg shadow-lg shadow-purple-600/15 transition-all cursor-pointer"
            >
              Get Started
            </motion.button>
          </div>

          <button
            ref={menuButtonRef}
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg bg-purple-50 text-purple-700"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </motion.header>

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-40 md:hidden"
              aria-hidden="true"
            />
            <motion.div
              id="mobile-menu"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              className="fixed top-0 right-0 bottom-0 w-[80%] max-w-xs bg-white z-50 md:hidden flex flex-col p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <span className="font-display font-black text-slate-900">Menu</span>
                <button
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close menu"
                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-purple-50 text-purple-700"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <motion.nav
                initial="hidden"
                animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
                className="flex flex-col gap-2"
              >
                {navItems.map((item, i) => (
                  <motion.a
                    key={item.href}
                    ref={i === 0 ? firstMenuLinkRef : undefined}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    variants={{ hidden: { opacity: 0, x: 24 }, show: { opacity: 1, x: 0 } }}
                    className="text-sm font-bold text-slate-700 py-3 border-b border-purple-50"
                  >
                    {item.label}
                  </motion.a>
                ))}
              </motion.nav>

              <motion.div
                variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
                initial="hidden"
                animate="show"
                transition={{ delay: 0.3 }}
                className="mt-auto flex flex-col gap-3 pt-6"
              >
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onLogin();
                  }}
                  className="w-full py-3 text-xs font-bold text-purple-700 border border-purple-200 rounded-lg"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onRegister();
                  }}
                  className="w-full py-3 bg-purple-600 text-white font-bold text-xs rounded-lg shadow-lg shadow-purple-600/15"
                >
                  Get Started
                </button>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}