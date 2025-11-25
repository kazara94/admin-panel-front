'use client';

import { useState, useEffect, useCallback } from 'react';
import { CaptionType } from '@/app/admin/lib/types';
import { Button, Input } from '@/app/admin/components/ui';
import { cn } from '@/app/admin/lib/utils/cn';

interface CaptionFormProps {
  caption?: CaptionType;
  onSubmit: (data: Omit<CaptionType, 'id' | 'created_at' | 'updated_at'>) => void;
  onCancel: () => void;
  autoSave?: boolean;
  onAutoSave?: (data: Omit<CaptionType, 'id' | 'created_at' | 'updated_at'>) => void;
}

interface FormData {
  national: string;
  foreign: string;
}

interface FormErrors {
  national?: string;
  foreign?: string;
  general?: string;
}

export default function CaptionForm({ 
  caption, 
  onSubmit, 
  onCancel, 
  autoSave = false,
  onAutoSave 
}: CaptionFormProps) {
  const [formData, setFormData] = useState<FormData>({
    national: caption?.national || '',
    foreign: caption?.foreign || ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const validateField = useCallback((name: keyof FormData, value: string): string | undefined => {
    switch (name) {
      case 'national':
        if (!value.trim()) return 'National word is required';
        if (value.length < 2) return 'National word must be at least 2 characters';
        if (value.length > 100) return 'National word must be less than 100 characters';
        if (!/^[\p{L}\p{N}\s\-'.,!?]+$/u.test(value)) return 'National word contains invalid characters';
        break;
      case 'foreign':
        if (!value.trim()) return 'Foreign word is required';
        if (value.length < 2) return 'Foreign word must be at least 2 characters';
        if (value.length > 100) return 'Foreign word must be less than 100 characters';
        if (!/^[\p{L}\p{N}\s\-'.,!?]+$/u.test(value)) return 'Foreign word contains invalid characters';
        break;
    }
    return undefined;
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const fieldName = name as keyof FormData;
    
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
    
    const fieldError = validateField(fieldName, value);
    setErrors(prev => ({
      ...prev,
      [fieldName]: fieldError,
      general: undefined
    }));
  };

  const validateForm = useCallback((silent = false): boolean => {
    const newErrors: FormErrors = {};
    
    Object.entries(formData).forEach(([key, value]) => {
      const error = validateField(key as keyof FormData, value);
      if (error) {
        newErrors[key as keyof FormErrors] = error;
      }
    });

    if (formData.national.toLowerCase().trim() === formData.foreign.toLowerCase().trim()) {
      newErrors.general = 'National and foreign words cannot be the same';
    }

    if (!silent) {
      setErrors(newErrors);
    }
    
    return Object.keys(newErrors).length === 0;
  }, [formData, validateField]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        general: error instanceof Error ? error.message : 'An error occurred while saving'
      }));
    } finally {
      setLoading(false);
    }
  }, [formData, onSubmit, validateForm]);

  const isFormValid = useCallback(() => {
    const hasErrors = Object.values(errors).some(error => error !== undefined && error !== '');
    const hasRequiredFields = formData.national.trim().length >= 2 && formData.foreign.trim().length >= 2;
    const wordsNotSame = formData.national.toLowerCase().trim() !== formData.foreign.toLowerCase().trim();
    
    const isValid = !hasErrors && hasRequiredFields && wordsNotSame;
    return isValid;
  }, [errors, formData]);
  
  const formIsValid = isFormValid();

  useEffect(() => {
    if (caption) {
      setFormData({
        national: caption.national || '',
        foreign: caption.foreign || ''
      });
      setErrors({});
      setIsDirty(false);
      setHasChanges(false);
    } else {
      setFormData({
        national: '',
        foreign: ''
      });
      setErrors({});
      setIsDirty(false);
      setHasChanges(false);
    }
  }, [caption]);

  useEffect(() => {
    const hasFormChanges = 
      formData.national !== (caption?.national || '') ||
      formData.foreign !== (caption?.foreign || '');
    
    setHasChanges(hasFormChanges);
    setIsDirty(hasFormChanges);
  }, [formData, caption]);

  useEffect(() => {
    if (!autoSave || !onAutoSave || !hasChanges || !isDirty) return;

    const timer = setTimeout(() => {
      if (validateForm(true)) {
        onAutoSave(formData);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [formData, autoSave, onAutoSave, hasChanges, isDirty, validateForm]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault();
            if (!loading && validateForm(true)) {
              const syntheticEvent = {
                preventDefault: () => {},
                target: e.target
              } as React.FormEvent;
              handleSubmit(syntheticEvent);
            }
            break;
          case 'Escape':
            e.preventDefault();
            onCancel();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [loading, onCancel, validateForm, handleSubmit]);

  return (
    <div className="space-y-6 animate-fade-in">
      {autoSave && hasChanges && (
        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Auto-saving...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.general && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg animate-shake">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-700 font-medium">{errors.general}</span>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Input
            label="National Word"
            name="national"
            value={formData.national}
            onChange={handleChange}
            error={errors.national}
            placeholder="Enter the national word"
            required
            autoFocus={!caption}
            help={`The word in your native language (${formData.national.length}/100 characters)`}
            className={cn(
              'transition-all duration-200',
              errors.national && 'animate-shake',
              formData.national && !errors.national && 'border-green-300 focus:border-green-500'
            )}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
            }
          />
          {formData.national && !errors.national && (
            <div className="flex items-center space-x-1 text-green-600 text-sm animate-fade-in">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Looks good!</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Input
            label="Foreign Word"
            name="foreign"
            value={formData.foreign}
            onChange={handleChange}
            error={errors.foreign}
            placeholder="Enter the foreign word"
            required
            help={`The translation in the foreign language (${formData.foreign.length}/100 characters)`}
            className={cn(
              'transition-all duration-200',
              errors.foreign && 'animate-shake',
              formData.foreign && !errors.foreign && 'border-green-300 focus:border-green-500'
            )}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9c-5 0-9-4-9-9s4-9 9-9" />
              </svg>
            }
          />
          {formData.foreign && !errors.foreign && (
            <div className="flex items-center space-x-1 text-green-600 text-sm animate-fade-in">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Looks good!</span>
            </div>
          )}
        </div>

        <div className="flex flex-col tablet-sm:flex-row tablet-sm:justify-end tablet-sm:space-x-3 space-y-3 tablet-sm:space-y-0 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
            className="w-full tablet-sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={!formIsValid || loading}
            className={cn(
              'w-full tablet-sm:w-auto transition-all duration-200',
              formIsValid && 'animate-pulse-subtle'
            )}
            icon={!loading && (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={caption ? "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" : "M12 6v6m0 0v6m0-6h6m-6 0H6"} />
              </svg>
            )}
          >
            {caption ? 'Update Caption' : 'Add Caption'}
          </Button>
        </div>

        <div className="text-center pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+S</kbd> to save • 
            <kbd className="px-2 py-1 bg-gray-100 rounded text-xs ml-2">Esc</kbd> to cancel
          </p>
        </div>
      </form>
    </div>
  );
}