
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-gray-800 shadow-lg rounded-lg overflow-hidden ${className}`}>
      <div className="p-5">
        {children}
      </div>
    </div>
  );
};

interface CardHeaderProps {
    children: React.ReactNode;
    className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({children, className}) => {
    return (
        <div className={`border-b border-gray-700 pb-4 mb-4 ${className}`}>
            {children}
        </div>
    )
}

interface CardTitleProps {
    children: React.ReactNode;
}

export const CardTitle: React.FC<CardTitleProps> = ({children}) => {
    return <h2 className="text-xl font-bold text-white">{children}</h2>
}
