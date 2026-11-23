import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, className, ...props }, ref) => {
    const { mode } =useSelector((state: RootState) => state.theme);
    return (
      <div className="w-full">
        {label && (
          <label className={`block text-sm font-medium text-gray-700 ${mode}:text-gray-300 mb-1`}>
            {label}
          </label>
        )}
        {hint && (
          <p className={`mb-1 text-xs text-gray-500 ${mode}:text-gray-400`}>{hint}</p>
        )}
        <textarea
          ref={ref}
          className={clsx(
            'block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 shadow-sm transition-colors duration-200',
            'focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none',
            `${mode}:border-gray-600 ${mode}:bg-gray-800 ${mode}:text-gray-100 ${mode}:placeholder-gray-500`,
            `${mode}:focus:border-indigo-400 ${mode}:focus:ring-indigo-400/20`,
            error && `border-red-500 ${mode}:border-red-400`,
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

Textarea.displayName = 'Textarea';