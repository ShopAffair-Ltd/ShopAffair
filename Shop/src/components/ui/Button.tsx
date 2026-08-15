import React from 'react';
import { motion } from 'motion/react';

interface ButtonProps
  extends Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration' | 'onDrag' | 'onDragStart' | 'onDragEnd'
  > {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyle = "px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer select-none border";
  
  const variants = {
    primary: "bg-purple-600 hover:bg-purple-700 text-white border-purple-600 shadow-md shadow-purple-600/10",
    secondary: "bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-100",
    outline: "bg-white hover:bg-purple-50/40 text-purple-700 border-purple-200 shadow-xs",
    danger: "bg-red-500 hover:bg-red-600 text-white border-red-500 shadow-md shadow-red-500/10"
  };

  const isBtnDisabled = disabled || isLoading;

  return (
    <motion.button
      whileHover={isBtnDisabled ? {} : { scale: 1.01, y: -1 }}
      whileTap={isBtnDisabled ? {} : { scale: 0.98 }}
      className={`${baseStyle} ${variants[variant]} ${isBtnDisabled ? 'opacity-60 cursor-not-allowed' : ''} ${className}`}
      disabled={isBtnDisabled}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : null}
      {children}
    </motion.button>
  );
};