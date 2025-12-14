import { InputHTMLAttributes, forwardRef, useState, ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showPasswordToggle?: boolean;
  rightIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, helperText, showPasswordToggle, rightIcon, type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPasswordField = type === 'password';
    const shouldShowToggle = isPasswordField && showPasswordToggle !== false;

    // Determine the actual input type based on password visibility
    const inputType = shouldShowToggle && showPassword ? 'text' : type;

    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      // Allow toggling with Space or Enter when focused on the button
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        togglePasswordVisibility();
      }
    };

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-[#0A1C37] dark:text-gray-200 mb-1.5">
            {label}
            {props.required && <span className="text-[#C62828] ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            type={inputType}
            className={`
              w-full px-3 py-2 border rounded-lg text-[#0A1C37] dark:text-white placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-900
              focus:outline-none focus:ring-2 focus:ring-[#1673FF] dark:focus:ring-blue-500 focus:border-transparent
              disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:cursor-not-allowed
              transition-all duration-200
              ${error ? 'border-[#C62828] focus:ring-[#C62828]' : 'border-gray-300 dark:border-gray-700'}
              ${(shouldShowToggle || rightIcon) ? 'pr-10' : ''}
              ${className}
            `}
            {...props}
          />

          {/* Password visibility toggle button */}
          {shouldShowToggle && (
            <button
              type="button"
              onClick={togglePasswordVisibility}
              onKeyDown={handleKeyDown}
              tabIndex={0}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#1673FF] focus:outline-none focus:text-[#1673FF] transition-colors duration-200 p-1 rounded"
            >
              {showPassword ? (
                <EyeOff size={20} className="transition-transform duration-200" aria-hidden="true" />
              ) : (
                <Eye size={20} className="transition-transform duration-200" aria-hidden="true" />
              )}
            </button>
          )}

          {/* Custom right icon (if provided and not a password field) */}
          {!shouldShowToggle && rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
              {rightIcon}
            </div>
          )}
        </div>

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

Input.displayName = 'Input';
