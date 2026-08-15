import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'success',
  onClose,
  duration = 4000
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const config = {
    success: {
      bg: 'bg-emerald-50 border-emerald-100 text-emerald-800',
      icon: CheckCircle2,
      iconColor: 'text-emerald-500'
    },
    error: {
      bg: 'bg-rose-50 border-rose-100 text-rose-800',
      icon: AlertCircle,
      iconColor: 'text-rose-500'
    },
    info: {
      bg: 'bg-purple-50 border-purple-100 text-purple-800',
      icon: AlertCircle,
      iconColor: 'text-purple-500'
    }
  };

  const current = config[type];
  const Icon = current.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-lg ${current.bg}`}
    >
      <Icon className={`w-5 h-5 ${current.iconColor} shrink-0`} />
      <span className="text-xs font-sans font-bold">{message}</span>
      <button onClick={onClose} className="hover:opacity-75 transition-opacity cursor-pointer">
        <X className="w-4 h-4 text-slate-400" />
      </button>
    </motion.div>
  );
};
