import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

interface RadioOption {
  value: string;
  label: string;
}

interface RadioGroupProps {
  label?: string;
  error?: string;
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  name: string;
  className?: string;
  required?: boolean;
}

export const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ label, error, options, value, onChange, name, className, required }, ref) => {
    const { mode } =useSelector((state: RootState) => state.theme);
    return (
      <div ref={ref} className={clsx('w-full', className)}>
        {label && (
          <label className={`block text-sm font-medium text-gray-700 ${mode}:text-gray-300 mb-2`}>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="space-y-2">
          {options.map((option) => (
            <div key={option.value} className="flex items-center">
              <input
                type="radio"
                id={`${name}-${option.value}`}
                name={name}
                value={option.value}
                checked={value === option.value}
                onChange={(e) => onChange?.(e.target.value)}
                className={clsx(
                  'h-4 w-4 border border-gray-300 text-indigo-600 transition-colors duration-200',
                  'focus:ring-2 focus:ring-indigo-500/20 focus:ring-offset-0',
                  `${mode}:border-gray-600 ${mode}:bg-gray-800`,
                  error && `border-red-500 ${mode}:border-red-400`
                )}
              />
              <label
                htmlFor={`${name}-${option.value}`}
                className={`ml-2 text-sm text-gray-700 ${mode}:text-gray-300`}
              >
                {option.label}
              </label>
            </div>
          ))}
        </div>
        {error && (
          <p className={`mt-1 text-xs text-red-600 ${mode}:text-red-400`}>{error}</p>
        )}
      </div>
    );
  }
);

RadioGroup.displayName = 'RadioGroup';