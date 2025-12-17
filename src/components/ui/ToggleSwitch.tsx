import React from 'react';

interface ToggleSwitchProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'success' | 'danger';
}

export function ToggleSwitch({
  id,
  checked,
  onChange,
  label,
  disabled = false,
  className = '',
  size = 'md',
  variant = 'primary'
}: ToggleSwitchProps) {
  const sizeClasses = {
    sm: 'w-10 h-5',
    md: 'w-14 h-7',
    lg: 'w-16 h-8'
  };

  const thumbSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-7 h-7'
  };

  const translateClasses = {
    sm: 'translate-x-5',
    md: 'translate-x-7',
    lg: 'translate-x-8'
  };

  const variantClasses = {
    primary: checked ? 'bg-[#1673FF]' : 'bg-gray-300 dark:bg-gray-600',
    success: checked ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600',
    danger: checked ? 'bg-red-500' : 'bg-gray-300 dark:bg-gray-600'
  };

  const handleToggle = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label || 'Toggle switch'}
        disabled={disabled}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={`
          relative inline-flex items-center rounded-full
          transition-colors duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1673FF]
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        {/* Toggle Thumb */}
        <span
          className={`
            inline-block rounded-full bg-white shadow-lg
            transform transition-transform duration-200 ease-in-out
            ${thumbSizeClasses[size]}
            ${checked ? translateClasses[size] : 'translate-x-0.5'}
          `}
          aria-hidden="true"
        />
      </button>

      {label && (
        <label
          htmlFor={id}
          className={`
            text-sm font-medium text-gray-700 dark:text-gray-300
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          onClick={!disabled ? handleToggle : undefined}
        >
          {label}
        </label>
      )}
    </div>
  );
}

// Accessible toggle with description
interface ToggleSwitchWithDescriptionProps extends ToggleSwitchProps {
  description?: string;
}

export function ToggleSwitchWithDescription({
  description,
  ...props
}: ToggleSwitchWithDescriptionProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col">
        {props.label && (
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {props.label}
          </span>
        )}
        {description && (
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {description}
          </span>
        )}
      </div>
      <ToggleSwitch {...props} label={undefined} />
    </div>
  );
}
