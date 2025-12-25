import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-3xl shadow-2xl p-6 sm:p-8 transition-all duration-500 hover:border-white/[0.15] hover:bg-white/[0.05] ${className}`}>
      {children}
    </div>
  );
};

export default Card;