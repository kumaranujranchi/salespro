import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { AlertCircle, HelpCircle } from 'lucide-react';

type DialogType = 'alert' | 'confirm' | 'prompt';

interface DialogOptions {
    title?: string;
    confirmText?: string;
    cancelText?: string;
    defaultValue?: string;
    placeholder?: string;
    variant?: 'default' | 'danger' | 'warning' | 'success';
}

interface DialogState {
    isOpen: boolean;
    type: DialogType;
    message: string;
    title: string;
    options: DialogOptions;
    resolve: (value: any) => void;
}

interface DialogContextType {
    alert: (message: string, options?: DialogOptions) => Promise<void>;
    confirm: (message: string, options?: DialogOptions) => Promise<boolean>;
    prompt: (message: string, options?: DialogOptions) => Promise<string | null>;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export function DialogProvider({ children }: { children: ReactNode }) {
    const [dialog, setDialog] = useState<DialogState | null>(null);
    const [inputValue, setInputValue] = useState('');

    const alert = useCallback((message: string, options?: DialogOptions) => {
        return new Promise<void>((resolve) => {
            setDialog({
                isOpen: true,
                type: 'alert',
                message,
                title: options?.title || 'Alert',
                options: options || {},
                resolve: () => {
                    resolve();
                    setDialog((prev) => (prev ? { ...prev, isOpen: false } : null));
                    setTimeout(() => setDialog(null), 200);
                },
            });
        });
    }, []);

    const confirm = useCallback((message: string, options?: DialogOptions) => {
        return new Promise<boolean>((resolve) => {
            setDialog({
                isOpen: true,
                type: 'confirm',
                message,
                title: options?.title || 'Confirm',
                options: options || {},
                resolve: (value: boolean) => {
                    resolve(value);
                    setDialog((prev) => (prev ? { ...prev, isOpen: false } : null));
                    setTimeout(() => setDialog(null), 200);
                },
            });
        });
    }, []);

    const prompt = useCallback((message: string, options?: DialogOptions) => {
        return new Promise<string | null>((resolve) => {
            setInputValue(options?.defaultValue || '');
            setDialog({
                isOpen: true,
                type: 'prompt',
                message,
                title: options?.title || 'Input',
                options: options || {},
                resolve: (value: string | null) => {
                    resolve(value);
                    setDialog((prev) => (prev ? { ...prev, isOpen: false } : null));
                    setTimeout(() => {
                        setDialog(null);
                        setInputValue('');
                    }, 200);
                },
            });
        });
    }, []);

    const handleConfirm = () => {
        if (dialog?.type === 'prompt') {
            dialog.resolve(inputValue);
        } else if (dialog?.type === 'confirm') {
            dialog.resolve(true);
        } else {
            dialog?.resolve(undefined);
        }
    };

    const handleCancel = () => {
        if (dialog?.type === 'prompt') {
            dialog.resolve(null);
        } else if (dialog?.type === 'confirm') {
            dialog.resolve(false);
        } else {
            dialog?.resolve(undefined);
        }
    };

    const getIcon = () => {
        if (!dialog) return null;
        if (dialog.type === 'alert') return <AlertCircle className="text-blue-500" size={24} />;
        if (dialog.type === 'confirm') {
            if (dialog.options.variant === 'danger') return <AlertCircle className="text-red-500" size={24} />;
            return <HelpCircle className="text-blue-500" size={24} />;
        }
        return <HelpCircle className="text-blue-500" size={24} />;
    };

    return (
        <DialogContext.Provider value={{ alert, confirm, prompt }}>
            {children}
            {dialog && (
                <Modal
                    isOpen={dialog.isOpen}
                    onClose={handleCancel}
                    title={dialog.title}
                    size="sm"
                    footer={
                        <div className="flex items-center justify-end gap-3 w-full">
                            {dialog.type !== 'alert' && (
                                <Button variant="outline" onClick={handleCancel}>
                                    {dialog.options.cancelText || 'Cancel'}
                                </Button>
                            )}
                            <Button
                                variant={dialog.options.variant === 'danger' ? 'danger' : 'primary'}
                                onClick={handleConfirm}
                            >
                                {dialog.options.confirmText || 'OK'}
                            </Button>
                        </div>
                    }
                >
                    <div className="flex gap-4">
                        <div className="flex-shrink-0 mt-1">
                            {getIcon()}
                        </div>
                        <div className="flex-1 space-y-4">
                            <p className="text-gray-600 leading-relaxed text-[15px]">{dialog.message}</p>
                            {dialog.type === 'prompt' && (
                                <Input
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder={dialog.options.placeholder}
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleConfirm();
                                        if (e.key === 'Escape') handleCancel();
                                    }}
                                />
                            )}
                        </div>
                    </div>
                </Modal>
            )}
        </DialogContext.Provider>
    );
}

export function useDialog() {
    const context = useContext(DialogContext);
    if (context === undefined) {
        throw new Error('useDialog must be used within a DialogProvider');
    }
    return context;
}
