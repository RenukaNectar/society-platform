import React from 'react';
import { clsx } from 'clsx';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className,
  padding = 'sm' 
}) => {
  const paddingClasses = {
    none: '',
    xs: 'p-2',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };
  const { mode } = useSelector((state: RootState) => state.theme);

  return (
    <div className={clsx(
      `bg-white ${mode}:bg-gray-800 rounded-lg shadow-sm border border-gray-200 ${mode}:border-gray-700`,
      paddingClasses[padding],
      className
    )}>
      {children}
    </div>
  );
};