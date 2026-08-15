/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronRight } from 'lucide-react';

import { Hero } from './sections/Hero';
import { About } from './sections/About';
import { HowItWorks } from './sections/HowItWorks';
import { Stats } from './sections/Stats';
import { Pricing } from './sections/Pricing';
import { Testimonials } from './sections/Testimonials';
import { Contact } from './sections/Contact';
import { Footer } from './sections/Footer';
import { Navbar } from './sections/Navbar';
import { Reveal, usePrefersReducedMotion } from './motion-utils';

interface LandingPageProps {
  onEnterPlatform: () => void;
  onLogin: () => void;
  onRegister: () => void;
}

const faqs = [
  {
    q: 'What is ShopAffair?',
    a: "ShopAffair is Nigeria's most secure multi-sig escrow system designed for peer-to-peer commerce. We hold buyers' funds securely in dedicated bank assignment vaults until the physical or digital items are fully delivered and verified, completely eliminating payment fraud."
  },
  {
    q: 'How fast do sellers get paid?',
    a: "As soon as the buyer clicks 'Release Funds' or our delivery logistics partner confirms a flawless physical dropoff, funds are instantly credited to the seller's virtual wallet and can be disbursed to any external Nigerian bank account within seconds."
  },
  {
    q: 'What are the fees?',
    a: 'Creating an account and browsing the market is 100% free. Standard trades attract a minimal 1% escrow administration fee. Verified Pro Merchants enjoy absolute zero-fee transactions, high-volume listing limits, and instant settlement channels.'
  },
  {
    q: 'How does the compliance audit work?',
    a: 'To ensure absolute security, all active traders submit a fast, one-time ID and BVN verification. Compliance Desk Admins review documents instantly in the auditing console. Once approved, you receive your dedicated deposit vault.'
  }
];

export default function LandingPage({ onEnterPlatform, onLogin, onRegister }: LandingPageProps) {
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const reduced = usePrefersReducedMotion();

  return (
    <motion.div
      initial={reduced ? { opacity: 1 } : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
      className="min-h-screen bg-white text-slate-800 flex flex-col font-sans selection:bg-purple-600 selection:text-white relative overflow-x-hidden"
    >
      <div className="absolute top-[-10%] left-[-20%] w-[800px] h-[800px] rounded-full bg-purple-100/40 blur-[130px] pointer-events-none" />
      <div className="absolute top-[30%] right-[-25%] w-[700px] h-[700px] rounded-full bg-purple-50/40 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[-15%] w-[600px] h-[600px] rounded-full bg-purple-100/30 blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8b5cf608_1px,transparent_1px),linear-gradient(to_bottom,#8b5cf608_1px,transparent_1px)] bg-[size:16px_16px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_80%,transparent_100%)] pointer-events-none" />

      <Navbar onLogin={onLogin} onRegister={onRegister} />

      {/* spacer for fixed navbar + marquee height */}
      <div className="h-[92px]" />

      <Hero onEnterPlatform={onEnterPlatform} onRegister={onRegister} />
      <About />
      <HowItWorks />
      <Stats />
      <Pricing onEnterPlatform={onEnterPlatform} onRegister={onRegister} />
      <Testimonials />

      {/* FAQ */}
      <section id="faq" className="scroll-mt-28 px-6 py-24 bg-purple-50/20 border-t border-purple-100 relative z-10">
        <div className="max-w-2xl mx-auto space-y-16">
          <Reveal className="text-center space-y-3">
            <span className="text-[10px] font-sans font-extrabold text-purple-600 uppercase tracking-widest block">Got Questions?</span>
            <h2 className="text-3xl md:text-4xl font-display font-black text-slate-900">Frequently Asked Questions</h2>
            <p className="text-xs md:text-sm text-slate-500">Everything you need to know about the secure transaction protocol.</p>
          </Reveal>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <Reveal key={idx} delay={idx * 0.05}>
                <div className="bg-white border border-purple-100/80 rounded-lg overflow-hidden shadow-xs">
                  <button
                    onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
                    aria-expanded={faqOpen === idx}
                    className="w-full p-5 text-left flex items-center justify-between text-xs md:text-sm font-bold text-slate-800 font-sans hover:bg-purple-50/10 transition-colors"
                  >
                    <span className="pr-4">{faq.q}</span>
                    <motion.span animate={{ rotate: faqOpen === idx ? 90 : 0 }} transition={{ duration: 0.2 }}>
                      {faqOpen === idx ? <ChevronDown className="w-4 h-4 text-purple-600 shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />}
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {faqOpen === idx && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] as const }}
                        className="px-5 pb-5 text-xs md:text-sm text-slate-500 leading-relaxed font-sans border-t border-purple-50 pt-3 bg-purple-50/5 text-left overflow-hidden"
                      >
                        {faq.a}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CINEMATIC CTA */}
      <section className="px-6 py-20 text-center max-w-2xl mx-auto w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] as const }}
          whileHover={{ scale: 1.005 }}
          className="relative p-8 md:p-12 rounded-xl space-y-6 shadow-sm border border-purple-200 overflow-hidden"
        >
          <motion.div
            className="absolute inset-0 -z-10"
            style={{
              background: 'linear-gradient(120deg, rgba(245,243,255,1), rgba(237,233,254,0.6), rgba(245,243,255,1))',
              backgroundSize: '200% 200%'
            }}
            animate={reduced ? {} : { backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          />
          <h2 className="text-2xl md:text-3xl font-display font-black text-slate-900">Ready for Fraud-Free Trading?</h2>
          <p className="text-xs md:text-sm text-slate-600 leading-relaxed max-w-lg mx-auto font-sans">
            Create your account in 2 minutes, verify your documents via our sandbox compliance console, and secure your transactions today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <motion.button
              whileHover={{ scale: 1.03, boxShadow: '0 20px 40px -10px rgba(124,58,237,0.35)' }}
              whileTap={{ scale: 0.98 }}
              onClick={onRegister}
              className="w-full sm:w-auto px-7 py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
            >
              Get Started for Free
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={onEnterPlatform}
              className="w-full sm:w-auto px-7 py-3.5 bg-white hover:bg-purple-50/40 text-purple-700 font-bold text-xs rounded-xl cursor-pointer border border-purple-200 shadow-xs"
            >
              Explore Public Marketplace
            </motion.button>
          </div>
        </motion.div>
      </section>

      <Contact />
      <Footer />
    </motion.div>
  );
}