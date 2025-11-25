'use client';

import React, { useEffect } from 'react';
import { CaptionType } from '@/app/admin/lib/types';
import CaptionForm from '@/app/admin/components/forms/CaptionForm';
import { cn } from '@/app/admin/lib/utils/cn';

interface CaptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  caption?: CaptionType;
  onSubmit: (data: Omit<CaptionType, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  autoSave?: boolean;
  onAutoSave?: (data: Omit<CaptionType, 'id' | 'created_at' | 'updated_at'>) => void;
}

export default function CaptionModal({
  isOpen,
  onClose,
  caption,
  onSubmit,
  title,
  size = 'md',
  autoSave = false,
  onAutoSave
}: CaptionModalProps) {
  const handleSubmit = async (data: Omit<CaptionType, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      await onSubmit(data);
      onClose();
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
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
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalTitle = title || (caption ? 'Edit Caption' : 'Add New Caption');

  return (
    <div 
      className="fixed inset-0  m-0 z-50 flex items-center justify-center animate-fade-in !m-0"
      role="dialog"
      aria-modal="true"
      aria-labelledby="caption-modal-title"
      onClick={onClose}
    >
      <div 
        className="absolute  inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
        aria-hidden="true"
      />
      
      <div className="relative z-10 w-full max-h-screen overflow-y-auto p-4">
        <div 
          className={cn(
            'mx-auto bg-white rounded-xl shadow-2xl animate-slide-up',
            'border border-gray-200',
            size === 'sm' && 'max-w-sm',
            size === 'md' && 'max-w-lg',
            size === 'lg' && 'max-w-2xl',
            size === 'xl' && 'max-w-4xl'
          )}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <div>
                <h3 
                  id="caption-modal-title"
                  className="text-xl font-semibold text-gray-900"
                >
                  {modalTitle}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {caption 
                    ? 'Modify the caption details below' 
                    : 'Fill in the information to create a new caption'
                  }
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className={cn(
                'p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100',
                'rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary'
              )}
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="p-6">
            <CaptionForm
              caption={caption}
              onSubmit={handleSubmit}
              onCancel={onClose}
              autoSave={autoSave}
              onAutoSave={onAutoSave}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
