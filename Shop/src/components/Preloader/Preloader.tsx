/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Cpu } from 'lucide-react';

interface PreloaderProps {
  onComplete: () => void;
}

export default function Preloader({ onComplete }: PreloaderProps) {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Initializing secure channels...');

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }

        if (prev === 25) setStatusText('Verifying SSL security gates...');
        if (prev === 55) setStatusText('Synchronizing Nigerian banking API nodes...');
        if (prev === 80) setStatusText('Assembling secure escrow vaults...');
        if (prev === 95) setStatusText('Ready!');

        return prev + 5;
      });
    }, 100);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (progress === 100) {
      const delay = setTimeout(() => {
        onComplete();
      }, 500);
      return () => clearTimeout(delay);
    }
  }, [progress, onComplete]);

  return (
    <motion.div
      key="preloader"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white overflow-hidden"
    >
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-100 rounded-full blur-3xl opacity-60 animate-pulse" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-50 rounded-full blur-3xl opacity-60 animate-pulse" />

      <div className="relative flex flex-col items-center max-w-sm px-6 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative flex items-center justify-center w-24 h-24 rounded-3xl bg-white text-white shadow-xl shadow-purple-200 mb-8 border border-purple-100"
        >
          <img src="/Image/logo.png" alt="ShopAffairlogo" className="w-16 h-16 object-contain" />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
            className="absolute inset-0 border-4 border-purple-300 border-t-transparent rounded-3xl"
          />
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-4xl font-display font-bold tracking-tight text-slate-900"
        >
          ShopAffair
        </motion.h1>

        <motion.p
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 0.6 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-sm font-sans mt-2 tracking-widest text-slate-600 uppercase font-medium"
        >
          Secure Trade Escrow
        </motion.p>

        <div className="w-64 h-2 bg-slate-100 rounded-full overflow-hidden mt-10 relative">
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: 'easeInOut' }}
            className="h-full bg-purple-600 rounded-full"
          />
        </div>

        <div className="mt-4 flex flex-col items-center">
          <span className="text-xs font-mono font-bold text-purple-600">
            {progress}%
          </span>
          <span className="text-xs font-sans text-slate-400 mt-1 transition-all duration-300">
            {statusText}
          </span>
        </div>
      </div>

      <div className="absolute bottom-8 flex items-center gap-2 text-[10px] font-mono tracking-widest text-slate-300 uppercase">
        <Cpu className="w-3 h-3" /> Encrypted Escrow Core v1.0
      </div>
    </motion.div>
  );
}