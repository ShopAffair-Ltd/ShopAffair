import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  error?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
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
      <div className="relative">
        <select
          id={id}
          className={`w-full px-4 py-3 text-xs bg-white border rounded-xl appearance-none focus:outline-none focus:border-purple-500/80 focus:ring-2 focus:ring-purple-500/10 font-sans transition-all shadow-xs ${
            error ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/10' : 'border-purple-100/80'
          } ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && (
        <p className="text-[10px] text-red-500 font-medium font-sans">{error}</p>
      )}
    </div>
  );
};
