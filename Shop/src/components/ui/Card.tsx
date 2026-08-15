import React from 'react';
import { motion } from 'motion/react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  isHoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  isHoverable = false
}) => {
  return (
    <motion.div
      whileHover={isHoverable ? { y: -4, boxShadow: '0 12px 30px -10px rgba(109,40,217,0.08)', borderColor: '#e9d5ff' } : {}}
      className={`bg-white border border-purple-100/60 rounded-2xl p-5 shadow-xs transition-all duration-200 ${className}`}
    >
      {children}
    </motion.div>
  );
};
