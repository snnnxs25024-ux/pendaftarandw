
import React from 'react';

interface CardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ title, children, className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <h4 className="text-xl font-bold text-slate-800 border-b-2 border-orange-500 pb-2 mb-4">
        {title}
      </h4>
      {children}
    </div>
  );
};

export default Card;
