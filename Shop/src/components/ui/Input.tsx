import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className = '',
  id,
  ...props
}) => {
  return (
    <div className="space-y-1.5 w-full text-left">
      {label && (
        <label htmlFor={id} className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 font-sans">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`w-full px-4 py-3 text-xs bg-white border rounded-xl focus:outline-none focus:border-purple-500/80 focus:ring-2 focus:ring-purple-500/10 placeholder-slate-400 font-sans transition-all shadow-xs ${
          error ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/10' : 'border-purple-100/80'
        } ${className}`}
        {...props}
      />
      {error && (
        <p className="text-[10px] text-red-500 font-medium font-sans">{error}</p>
      )}
    </div>
  );
};
