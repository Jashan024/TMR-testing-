import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-gray-800/60 backdrop-blur-lg border border-gray-700 rounded-2xl shadow-lg p-6 ${className}`}>
      {children}
    </div>
  );
};

export default Card;