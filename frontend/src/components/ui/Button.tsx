import React from 'react';
import { clsx } from 'clsx';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className,
  ...props
}) => {
  const { mode } =useSelector((state: RootState) => state.theme);
  const baseClasses = 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: `bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow-md`,
    secondary: `bg-gray-100 hover:bg-gray-200 text-gray-900 ${mode}:bg-gray-800 ${mode}:hover:bg-gray-700 ${mode}:text-gray-100`,
    outline: `bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 ${mode}:border-gray-600 ${mode}:hover:bg-gray-800 ${mode}:text-gray-300`,
    ghost: `hover:bg-gray-100 text-gray-700 ${mode}:hover:bg-gray-800 ${mode}:text-gray-300`,
    danger: `bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow-md`,
    success: `bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md`,
  };  
  
  const sizes = {
    xs: 'px-2 py-1.5 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={clsx(
        baseClasses,
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
};