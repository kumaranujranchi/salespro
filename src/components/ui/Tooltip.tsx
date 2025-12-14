import { ReactNode, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
    content: string;
    children: ReactNode;
    position?: 'top' | 'bottom' | 'left' | 'right';
    className?: string;
    delay?: number;
}

export function Tooltip({ content, children, position = 'top', className = '', delay = 200 }: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout>();

    const showTooltip = () => {
        if (!content) return;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            if (!triggerRef.current) return;

            const rect = triggerRef.current.getBoundingClientRect();
            const gap = 8; // spacing

            let top = 0;
            let left = 0;

            // Calculate fixed position based on viewport
            switch (position) {
                case 'top':
                    top = rect.top - gap;
                    left = rect.left + rect.width / 2;
                    break;
                case 'bottom':
                    top = rect.bottom + gap;
                    left = rect.left + rect.width / 2;
                    break;
                case 'left':
                    top = rect.top + rect.height / 2;
                    left = rect.left - gap;
                    break;
                case 'right':
                    top = rect.top + rect.height / 2;
                    left = rect.right + gap;
                    break;
            }

            setCoords({ top, left });
            setIsVisible(true);
        }, delay);
    };

    const hideTooltip = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsVisible(false);
    };

    // Clean up timeout
    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    return (
        <>
            <div
                ref={triggerRef}
                className={`inline-flex ${className}`}
                onMouseEnter={showTooltip}
                onMouseLeave={hideTooltip}
                onFocus={showTooltip}
                onBlur={hideTooltip}
                onClick={hideTooltip} // Hide immediately on click
            >
                {children}
            </div>
            {isVisible && createPortal(
                <div
                    className="fixed z-[9999] px-2.5 py-1.5 text-xs font-medium text-white bg-gray-900 rounded shadow-lg pointer-events-none whitespace-nowrap animate-fadeIn"
                    style={{
                        top: coords.top,
                        left: coords.left,
                        transform:
                            position === 'top' ? 'translate(-50%, -100%)' :
                                position === 'bottom' ? 'translate(-50%, 0)' :
                                    position === 'left' ? 'translate(-100%, -50%)' :
                                        'translate(0, -50%)',
                        animationDuration: '0.3s'
                    }}
                    role="tooltip"
                >
                    {content}
                    <div className={`absolute w-2 h-2 bg-gray-900 rotate-45 transform 
                ${position === 'top' ? 'bottom-[-4px] left-1/2 -translate-x-1/2' : ''}
                ${position === 'bottom' ? 'top-[-4px] left-1/2 -translate-x-1/2' : ''}
                ${position === 'left' ? 'right-[-4px] top-1/2 -translate-y-1/2' : ''}
                ${position === 'right' ? 'left-[-4px] top-1/2 -translate-y-1/2' : ''}
            `} />
                </div>,
                document.body
            )}
        </>
    );
}
