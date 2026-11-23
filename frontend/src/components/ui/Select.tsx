import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

interface SelectProps {
  label?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  placeholder?: string;
  error?: string;
  children: React.ReactNode;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  value,
  onChange,
  placeholder,
  error,
  children,
  disabled = false,
  required = false,
  className,
}) => {
  const { mode } = useSelector((state: RootState) => state.theme);

  return (
    <div className="space-y-1">
      {label && (
        <label className={`block text-sm font-medium text-gray-700 ${mode}:text-gray-300`}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`block w-full rounded-lg px-3 py-2 text-sm border ${className} ${
          error 
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
            : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500/20'
        } focus:outline-none focus:ring-2 ${
          disabled 
            ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
            : `${mode}:border-gray-600 ${mode}:bg-gray-800 ${mode}:text-gray-100`
        }`}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {children}
      </select>
      {error && (
        <p className="text-red-600 text-sm">{error}</p>
      )}
    </div>
  );
};