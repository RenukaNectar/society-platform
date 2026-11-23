import React, { forwardRef } from 'react';
import { Check } from 'lucide-react';
import { clsx } from 'clsx';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, className, ...props }, ref) => {
    const { mode } = useSelector((state: RootState) => state.theme);
    return (
      <div className="">
        <div className="flex items-center">
          <div className="relative">
            <input
              ref={ref}
              type="checkbox"
              className={clsx(
                'h-4 w-4 rounded border border-gray-300 text-indigo-600 transition-colors duration-200',
                'focus:ring-2 focus:ring-indigo-500/20 focus:ring-offset-0',
                `${mode}:border-gray-600 ${mode}:bg-gray-800`,
                'checked:bg-indigo-600 checked:border-indigo-600',
                error && `border-red-500 ${mode}:border-red-400`,
                className
              )}
              {...props}
            />
            {props.checked && (
              <Check className="absolute inset-0 h-4 w-4 text-white pointer-events-none" />
            )}
          </div>
          {label && (
            <label className={`ml-2 text-sm text-gray-700 ${mode}:text-gray-300`}>
              {label}
            </label>
          )}
        </div>
        {error && (
          <p className={`mt-1 text-xs text-red-600 ${mode}:text-red-400`}>{error}</p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';