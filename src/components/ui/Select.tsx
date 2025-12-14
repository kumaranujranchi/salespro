import { SelectHTMLAttributes, forwardRef } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', label, error, helperText, options, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-slate-800 dark:text-gray-200 mb-1.5">
            {label}
            {props.required && <span className="text-[#C62828] ml-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
          className={`
            w-full px-3 py-2 border rounded-lg text-slate-900 dark:text-white bg-white dark:bg-gray-900
            focus:outline-none focus:ring-2 focus:ring-[#1673FF] dark:focus:ring-blue-500 focus:border-transparent
            disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:cursor-not-allowed
            transition-all duration-200
            ${error ? 'border-[#C62828] focus:ring-[#C62828]' : 'border-gray-300 dark:border-gray-700'}
            ${className}
          `}
          {...props}
        >
          <option value="" className="dark:bg-gray-900">Select an option</option>
          {options.map((option) => (
            <option key={option.value} value={option.value} className="dark:bg-gray-900">
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="mt-1 text-sm text-[#C62828]">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
