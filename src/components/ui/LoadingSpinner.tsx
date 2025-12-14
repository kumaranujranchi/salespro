import React from 'react';

interface LoadingSpinnerProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    logoSrc?: string;
    fullScreen?: boolean;
}

export function LoadingSpinner({
    className = '',
    size = 'md',
    logoSrc = '/logo.png',
    fullScreen = false
}: LoadingSpinnerProps) {

    // Scale helper (since the css loader has fixed 60px width, we can use transform scale for sizing)
    const scaleClasses = {
        sm: 'scale-75',
        md: 'scale-100',
        lg: 'scale-125',
        xl: 'scale-150'
    };

    const containerClasses = fullScreen
        ? `fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-sm ${className}`
        : `flex flex-col items-center justify-center p-4 ${className}`;

    return (
        <div
            className={containerClasses}
            role="status"
            aria-live="polite"
        >
            <div className={`loader ${scaleClasses[size]}`}></div>
            <span className="sr-only">Loading...</span>
        </div>
    );
}
