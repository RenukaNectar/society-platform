import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ label, error, className, ...props }, ref) => {
    const { mode } =useSelector((state: RootState) => state.theme);
    return (
      <div className="w-full">
        <div className="flex items-center justify-between">
          {label && (
            <label className={`text-sm font-medium text-gray-700 ${mode}:text-gray-300`}>
              {label}
            </label>
          )}
          <div className="relative">
            <input
              ref={ref}
              type="checkbox"
              className="sr-only"
              {...props}
            />
            <div
              className={clsx(
                'block w-10 h-6 rounded-full transition-colors duration-200 cursor-pointer',
                props.checked
                  ? 'bg-indigo-600'
                  : `bg-gray-300 ${mode}:bg-gray-600`,
                className
              )}
              onClick={() => props.onChange?.({ target: { checked: !props.checked } } as any)}
            >
              <div
                className={clsx(
                  'absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200',
                  props.checked ? 'transform translate-x-4' : ''
                )}
              />
            </div>
          </div>
        </div>
        {error && (
          <p className={`mt-1 text-xs text-red-600 ${mode}:text-red-400`}>{error}</p>
        )}
      </div>
    );
  }
);

Switch.displayName = 'Switch';