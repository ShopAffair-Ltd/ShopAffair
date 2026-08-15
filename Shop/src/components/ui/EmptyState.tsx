import React from 'react';
import { Sparkles } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center bg-purple-50/20 rounded-3xl border border-purple-100/40">
      <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
        <Sparkles className="w-6 h-6" />
      </div>
      <h3 className="text-xs font-sans font-black text-slate-800 uppercase tracking-wider">{title}</h3>
      <p className="text-[11px] text-slate-400 mt-1 max-w-xs">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-sans font-bold text-[10px] rounded-xl transition-all cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
