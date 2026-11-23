import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  maxLength?: number;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, maxLength,required, ...props }, ref) => {

    const { mode } =useSelector((state: RootState) => state.theme);
    return (
      <div className="w-full">
        {label && (
          <label className={`block text-sm font-medium text-gray-700 ${mode === 'dark' ? 'text-gray-300' : ''} mb-1`}>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={clsx(
              'block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 shadow-sm transition-colors duration-200',
              'focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none',
              mode === 'dark' ? 'border-gray-600 bg-gray-800 text-gray-100 placeholder-gray-500' : '',
              mode === 'dark' ? 'focus:border-indigo-400 focus:ring-indigo-400/20' : '',
              icon && 'pl-10',
              error && `border-red-500 ${mode === 'dark' ? 'border-red-400' : ''}`,
              className
            )}
            {...props}
            maxLength={maxLength}
            onChange={(e) => {
              if (maxLength && e.target.value.length > maxLength) {
                e.preventDefault();
                return;
              }
              // Call the parent's onChange handler
              props.onChange?.(e);
            }}
          />
        </div>
        {error && (
          <p className={`mt-1 text-xs text-red-600 ${mode === 'dark' ? 'text-red-400' : ''}`}>{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';