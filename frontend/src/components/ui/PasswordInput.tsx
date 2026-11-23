import React, { forwardRef, useState } from 'react';
import { clsx } from 'clsx';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  maxLength?: number;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, error, icon, className, maxLength, ...props }, ref) => {
    const { mode } = useSelector((state: RootState) => state.theme);
    const [showPassword, setShowPassword] = useState(false);

    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword);
    };

    return (
      <div className="w-full">
        {label && (
          <label className={`block text-sm font-medium text-gray-700 ${mode}:text-gray-300 mb-1`}>
            {label}
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
            type={showPassword ? 'text' : 'password'}
            className={clsx(
              'block w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm placeholder-gray-400 shadow-sm transition-colors duration-200',
              'focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none',
              `${mode}:border-gray-600 ${mode}:bg-gray-800 ${mode}:text-gray-100 ${mode}:placeholder-gray-500`,
              `${mode}:focus:border-indigo-400 ${mode}:focus:ring-indigo-400/20`,
              icon && 'pl-10',
              error && `border-red-500 ${mode}:border-red-400`,
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
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={togglePasswordVisibility}
          >
            {!showPassword ? (
              <EyeOff className={`h-4 w-4 text-gray-400 ${mode}:text-gray-500 hover:text-gray-600 ${mode}:hover:text-gray-300`} />
            ) : (
              <Eye className={`h-4 w-4 text-gray-400 ${mode}:text-gray-500 hover:text-gray-600 ${mode}:hover:text-gray-300`} />
            )}
          </button>
        </div>
        {error && (
          <p className={`mt-1 text-xs text-red-600 ${mode}:text-red-400`}>{error}</p>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';
