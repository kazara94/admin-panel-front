'use client';

import React, { useEffect } from 'react';
import { Button } from '@/app/admin/components/ui';
import { cn } from '@/app/admin/lib/utils/cn';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
  icon?: React.ReactNode;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
  icon
}: ConfirmationModalProps) {
  const handleConfirm = async () => {
    try {
      await onConfirm();
      onClose();
    } catch {
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          confirmButton: 'danger' as const
        };
      case 'warning':
        return {
          iconBg: 'bg-yellow-100',
          iconColor: 'text-yellow-600',
          confirmButton: 'danger' as const
        };
      case 'info':
        return {
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          confirmButton: 'primary' as const
        };
      default:
        return {
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          confirmButton: 'danger' as const
        };
    }
  };

  const variantStyles = getVariantStyles();

  const getDefaultIcon = () => {
    switch (variant) {
      case 'danger':
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, loading]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 m-0 flex items-center justify-center animate-fade-in !m-0"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-modal-title"
      aria-describedby="confirmation-modal-description"
    >
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={loading ? undefined : onClose}
        aria-hidden="true"
      />
      
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-white rounded-xl shadow-2xl animate-slide-up border border-gray-200">
          <div className="p-6">
            <div className="flex items-start space-x-4">
              <div className={cn(
                'flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center',
                variantStyles.iconBg
              )}>
                <div className={variantStyles.iconColor}>
                  {icon || getDefaultIcon()}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 
                  id="confirmation-modal-title"
                  className="text-lg font-semibold text-gray-900 mb-2"
                >
                  {title}
                </h3>
                <p 
                  id="confirmation-modal-description"
                  className="text-sm text-gray-600 leading-relaxed"
                >
                  {message}
                </p>
              </div>
            </div>
            
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 space-y-3 space-y-reverse sm:space-y-0 mt-6">
              <Button
                variant="secondary"
                onClick={onClose}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                {cancelText}
              </Button>
              <Button
                variant={variantStyles.confirmButton}
                onClick={handleConfirm}
                loading={loading}
                className="w-full sm:w-auto"
                autoFocus
              >
                {confirmText}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
