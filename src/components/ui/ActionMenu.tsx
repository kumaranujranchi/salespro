import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ActionItem {
  label: string;
  icon?: React.ElementType;
  onClick: () => void;
  variant?: 'default' | 'danger' | 'warning' | 'success';
  disabled?: boolean;
}

interface ActionMenuProps {
  actions: ActionItem[];
  className?: string;
  align?: 'left' | 'right';
}

export function ActionMenu({ actions, className, align = 'right' }: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [menuDirection, setMenuDirection] = useState<'down' | 'up'>('down');
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Also close on scroll to avoid detached floating menus
      window.addEventListener('scroll', () => setIsOpen(false), true);
      window.addEventListener('resize', () => setIsOpen(false));
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', () => setIsOpen(false), true);
      window.removeEventListener('resize', () => setIsOpen(false));
    };
  }, [isOpen]);

  const toggleMenu = () => {
    if (isOpen) {
      setIsOpen(false);
      return;
    }

    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const MENU_HEIGHT = actions.length * 40 + 16; // Approx height
      const SPACE_BELOW = window.innerHeight - rect.bottom;

      // Decide direction: Open UP if space below is small (< 200px) and space above is larger
      const openUp = SPACE_BELOW < Math.min(MENU_HEIGHT, 300) && rect.top > MENU_HEIGHT;

      setMenuDirection(openUp ? 'up' : 'down');

      setPosition({
        top: openUp ? rect.top : rect.bottom, // If up, align bottom of menu to top of button
        // Align right edge of menu to right edge of button
        left: align === 'right' ? rect.right : rect.left,
      });
      setIsOpen(true);
    }
  };

  const menu = (
    <div
      ref={menuRef}
      className={clsx(
        "fixed z-[9999] w-48 rounded-xl shadow-xl bg-white dark:bg-[#1e293b] ring-1 ring-black/5 dark:ring-white/10 focus:outline-none overflow-hidden animate-in fade-in zoom-in-95 duration-100",
      )}
      style={{
        top: position.top,
        left: position.left,
        // Adjust position based on alignment and direction
        transform: `translate(${align === 'right' ? '-100%' : '0'}, ${menuDirection === 'up' ? '-100%' : '8px'})`
      }}
    >
      <div className="py-1" role="menu" aria-orientation="vertical">
        {actions.map((action, index) => {
          const Icon = action.icon;

          let textColor = "text-gray-700 dark:text-gray-200";
          let hoverColor = "hover:bg-gray-50 dark:hover:bg-white/5";

          if (action.variant === 'danger') {
            textColor = "text-red-600 dark:text-red-400";
            hoverColor = "hover:bg-red-50 dark:hover:bg-red-900/10";
          } else if (action.variant === 'warning') {
            textColor = "text-orange-600 dark:text-orange-400";
            hoverColor = "hover:bg-orange-50 dark:hover:bg-orange-900/10";
          } else if (action.variant === 'success') {
            textColor = "text-green-600 dark:text-green-400";
            hoverColor = "hover:bg-green-50 dark:hover:bg-green-900/10";
          }

          if (action.disabled) return null;

          return (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation(); // Prevent row click
                action.onClick();
                setIsOpen(false);
              }}
              className={twMerge(
                "flex items-center w-full px-4 py-2.5 text-sm transition-colors text-left",
                textColor,
                hoverColor
              )}
              role="menuitem"
            >
              {Icon && <Icon size={16} className="mr-3 opacity-75" />}
              {action.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className={twMerge("inline-flex", className)}>
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation(); // Prevent row click if any
          toggleMenu();
        }}
        className={clsx(
          "p-2 rounded-full transition-colors focus:outline-none",
          isOpen
            ? "bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
            : "hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        )}
      >
        <MoreVertical size={16} />
      </button>

      {isOpen && createPortal(menu, document.body)}
    </div>
  );
}
