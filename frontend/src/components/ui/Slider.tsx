import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { RootState } from '../../store';
import { useSelector } from 'react-redux';

interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  showValue?: boolean;
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  ({ label, error, showValue = true, className, ...props }, ref) => {
    const { mode } =useSelector((state: RootState) => state.theme);
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-2">
          {label && (
            <label className={`text-sm font-medium text-gray-700 ${mode}:text-gray-300`}>
              {label}
            </label>
          )}
          {showValue && (
            <span className={`text-sm text-gray-500 ${mode}:text-gray-400`}>
              {props.value || props.min || 0}
            </span>
          )}
        </div>
        <input
          ref={ref}
          type="range"
          className={clsx(
            'w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer',
            `${mode}:bg-gray-700`,
            'slider-thumb:appearance-none slider-thumb:h-4 slider-thumb:w-4',
            'slider-thumb:rounded-full slider-thumb:bg-indigo-600',
            'slider-thumb:cursor-pointer slider-thumb:border-0',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500/20',
            className
          )}
          {...props}
        />
        {error && (
          <p className={`mt-1 text-xs text-red-600 ${mode}:text-red-400`}>{error}</p>
        )}
      </div>
    );
  }
);

Slider.displayName = 'Slider';