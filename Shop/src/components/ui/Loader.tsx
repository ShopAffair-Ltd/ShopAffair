import React from 'react';

export const Loader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-10 space-y-3">
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 border-4 border-purple-100 rounded-full" />
        <div className="absolute inset-0 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest animate-pulse">
        Securing connection...
      </span>
    </div>
  );
};
