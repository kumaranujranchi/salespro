import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'neutral' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary: 'bg-[#00E576] text-[#0A1C37] hover:bg-[#00C853] focus:ring-[#00E576] shadow-sm hover:shadow-md font-semibold',
      secondary: 'bg-[#0A1C37] text-white hover:bg-[#142842] focus:ring-[#0A1C37] shadow-sm',
      outline: 'border-2 border-[#00E576] text-[#00E576] hover:bg-[#00E576] hover:text-[#0A1C37] focus:ring-[#00E576] font-medium',
      ghost: 'text-[#0A1C37] hover:bg-gray-100 focus:ring-gray-300',
      danger: 'bg-[#C62828] text-white hover:bg-[#A01F1F] focus:ring-[#C62828] shadow-sm',
      neutral: 'bg-white border border-gray-300 text-[#0A1C37] hover:bg-gray-50 focus:ring-[#00E576] shadow-sm',
      gradient: 'bg-gradient-to-r from-[#00E576] to-[#00C853] text-[#0A1C37] hover:from-[#00C853] hover:to-[#00B048] shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-bold',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
