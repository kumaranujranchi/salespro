import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`
        p-2 rounded-full transition-all duration-300
        ${theme === 'dark' 
          ? 'bg-surface-highlight text-primary hover:bg-surface-highlight/80' 
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
      `}
      aria-label="Toggle Theme"
    >
      {theme === 'dark' ? (
        <Sun size={20} className="animate-spin-slow" />
      ) : (
        <Moon size={20} />
      )}
    </button>
  );
}
