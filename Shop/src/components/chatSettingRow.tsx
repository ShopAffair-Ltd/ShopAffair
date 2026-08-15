import React from 'react';
import { motion } from 'motion/react';

interface SettingRowProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

export default function SettingRow({ icon, title, subtitle, checked, onChange }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-b-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <span className="block font-sans font-semibold text-sm text-slate-800">{title}</span>
          <span className="block font-sans text-xs text-slate-400 truncate">{subtitle}</span>
        </div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`shrink-0 w-11 h-6 rounded-full transition-colors relative ${
          checked ? 'bg-purple-600' : 'bg-slate-200'
        }`}
      >
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm ${
            checked ? 'left-5' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  );
}