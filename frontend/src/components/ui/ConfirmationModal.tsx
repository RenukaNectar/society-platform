import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './Button';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    loading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger',
    loading = false
}) => {
    if (!isOpen) return null;

    const getVariantStyles = () => {
        switch (variant) {
            case 'danger':
                return {
                    icon: 'text-red-400',
                    button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
                    border: 'border-red-600'
                };
            case 'warning':
                return {
                    icon: 'text-yellow-400',
                    button: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
                    border: 'border-yellow-600'
                };
            case 'info':
                return {
                    icon: 'text-blue-400',
                    button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
                    border: 'border-blue-600'
                };
            default:
                return {
                    icon: 'text-red-400',
                    button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
                    border: 'border-red-600'
                };
        }
    };

    const styles = getVariantStyles();

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                {/* Backdrop */}
                <div 
                    className="fixed inset-0 bg-black bg-opacity-60 transition-opacity"
                    onClick={onClose}
                />
                
                <div className="relative transform overflow-hidden rounded-lg bg-gray-800 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                    <div className="bg-gray-800 px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-900 sm:mx-0 sm:h-10 sm:w-10`}>
                                <AlertTriangle className={`h-6 w-6 ${styles.icon}`} />
                            </div>
                            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                                <h3 className="text-lg font-medium leading-6 text-white">
                                    {title}
                                </h3>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-300">
                                        {message}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className={`bg-gray-700 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 ${styles.border}`}>
                        <Button
                            onClick={onConfirm}
                            className={`${styles.button} text-white focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto`}
                            disabled={loading}
                        >
                            {confirmText}
                        </Button>
                        <Button
                            onClick={onClose}
                            variant="outline"
                            className="mt-3 w-full sm:mt-0 sm:w-auto"
                            loading={loading}
                        >
                            {cancelText}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
