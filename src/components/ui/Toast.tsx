import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export function Toast({
  message,
  type = 'success',
  isVisible,
  onClose,
  duration = 3000
}: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.3 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
          className="fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg"
        >
          <div
            className={twMerge(
              "flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border",
              type === 'success' && "bg-white dark:bg-gray-800 border-emerald-500 text-emerald-700 dark:text-emerald-400",
              type === 'error' && "bg-white dark:bg-gray-800 border-red-500 text-red-700 dark:text-red-400",
              type === 'info' && "bg-white dark:bg-gray-800 border-blue-500 text-blue-700 dark:text-blue-400"
            )}
          >
            {type === 'success' && <CheckCircle className="w-5 h-5" />}
            {type === 'error' && <XCircle className="w-5 h-5" />}
            
            <p className="font-medium text-sm text-gray-800 dark:text-gray-100">{message}</p>
            
            <button 
              onClick={onClose} 
              className="ml-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full p-1 transition-colors"
            >
              <X className="w-4 h-4 opacity-60" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
