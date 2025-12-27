import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-white border border-zinc-200 rounded-3xl shadow-sm p-6 sm:p-8 transition-all duration-500 hover:shadow-md hover:border-emerald-200/50 ${className}`}>
      {children}
    </div>
  );
};

export default Card;