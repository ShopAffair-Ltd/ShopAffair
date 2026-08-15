import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'purple' | 'green' | 'red' | 'yellow' | 'gray';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'purple',
  className = ''
}) => {
  const styles = {
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
    green: 'bg-green-50 text-green-700 border-green-100',
    red: 'bg-red-50 text-red-700 border-red-100',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-100',
    gray: 'bg-slate-50 text-slate-600 border-slate-100'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-wider rounded-md border ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
};
