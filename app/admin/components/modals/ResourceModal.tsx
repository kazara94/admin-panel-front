'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FieldDefinition } from '@/app/admin/lib/config/resourceConfig.types';
import { cn } from '@/app/admin/lib/utils/cn';
import Input from '@/app/admin/components/ui/Input';
import Select from '@/app/admin/components/ui/Select';
import DatePicker from '@/app/admin/components/ui/DatePicker';
import { Button } from '@/app/admin/components/ui';

type ResourceModalProps<T = unknown> = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<T>) => Promise<void>;
  fields: FieldDefinition[];
  initialData?: T;
  mode: 'add' | 'edit';
  title: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
};

export default function ResourceModal<T = unknown>({
  isOpen,
  onClose,
  onSubmit,
  fields,
  initialData,
  mode,
  title,
  size = 'md',
}: ResourceModalProps<T>) {
  const formFields = useMemo(() => fields.filter(field => field.inForm !== false), [fields]);

  const resolvePlaceholder = (field: FieldDefinition) => {
    if (field.placeholder) {
      return field.placeholder;
    }
    if (field.isPlaceholder) {
      return field.label;
    }
    return undefined;
  };

  const isFile = (value: unknown): value is File => {
    return value !== null && typeof value === 'object' && 'name' in value;
  };

  const getDefaultValue = (field: FieldDefinition): unknown => {
    if (field.isMultiple) {
      return [];
    }
    switch (field.type) {
      case 'boolean':
      case 'yesNo':
        return false;
      case 'number':
        return 0;
      case 'select':
        return field.options?.[0]?.value || '';
      case 'upload':
        return null;
      default:
        return '';
    }
  };
  
  const [formData, setFormData] = useState<Record<string, unknown>>(() => {
    const initial: Record<string, unknown> = {};
    formFields.forEach(field => {
      const value = initialData ? (initialData as Record<string, unknown>)[field.key] : undefined;
      initial[field.key] = value ?? getDefaultValue(field);
    });
    return initial;
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && initialData) {
      const newData: Record<string, unknown> = {};
      formFields.forEach(field => {
        newData[field.key] = (initialData as Record<string, unknown>)[field.key] ?? getDefaultValue(field);
      });
      setFormData(newData);
      setErrors({});
    } else if (isOpen && !initialData) {
      const newData: Record<string, unknown> = {};
      formFields.forEach(field => {
        newData[field.key] = getDefaultValue(field);
      });
      setFormData(newData);
      setErrors({});
    }
  }, [isOpen, initialData, formFields]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
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

  const validateField = (field: FieldDefinition, value: unknown): string | null => {
    if (field.isLabel) {
      return null;
    }
    if (field.isMultiple) {
      const arrayValue = Array.isArray(value) ? value : [];
      if (field.required && arrayValue.length === 0) {
        return `${field.label} is required`;
      }
      return null;
    }
    if (field.required && (!value || (typeof value === 'string' && !value.trim()))) {
      return `${field.label} is required`;
    }

    if (field.validation) {
      return field.validation(value);
    }

    return null;
  };

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    
    formFields.forEach(field => {
      const value = formData[field.key];
      const error = validateField(field, value);
      if (error) {
        newErrors[field.key] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, formFields]);

  const handleChange = (key: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[key];
      return newErrors;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData as Partial<T>);
      onClose();
    } catch (error) {
      if (error instanceof Error) {
        setErrors({ general: error.message });
      }
    } finally {
      setLoading(false);
    }
  };

  const renderFormField = (field: FieldDefinition) => {
    const value = formData[field.key];
    const error = errors[field.key];
    const placeholder = resolvePlaceholder(field);

    if (field.isLabel) {
      return (
        <div key={field.key} className="w-full">
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            {field.label}
          </label>
          <div className="text-sm text-gray-700 py-2">
            {value ? String(value) : '—'}
          </div>
        </div>
      );
    }

    switch (field.type) {
      case 'text':
      case 'email':
        return (
          <Input
            key={field.key}
            id={field.key}
            name={field.key}
            type={field.type}
            label={field.label}
            value={String(value || '')}
            onChange={(e) => handleChange(field.key, e.target.value)}
            placeholder={placeholder}
            error={error}
            required={field.required}
          />
        );

      case 'number':
        return (
          <Input
            key={field.key}
            id={field.key}
            name={field.key}
            type="number"
            label={field.label}
            value={value as number}
            onChange={(e) => handleChange(field.key, parseFloat(e.target.value) || 0)}
            placeholder={placeholder}
            error={error}
            required={field.required}
          />
        );

      case 'textarea':
      case 'editor':
        return (
          <div key={field.key} className="w-full">
            <label htmlFor={field.key} className="block text-sm font-semibold text-gray-900 mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
              id={field.key}
              name={field.key}
              value={String(value || '')}
              onChange={(e) => handleChange(field.key, e.target.value)}
              placeholder={placeholder}
              rows={field.type === 'editor' ? 6 : 4}
              className={cn(
                'w-full px-4 py-2.5 text-sm border rounded-lg transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-offset-1 bg-white',
                error
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                  : 'border-gray-300 focus:border-primary focus:ring-primary/20 hover:border-gray-400'
              )}
            />
            {error && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
            )}
          </div>
        );

      case 'select':
        if (field.isMultiple) {
          const selectedValues = Array.isArray(value) ? value.map(val => String(val)) : [];
          return (
            <div key={field.key} className="w-full">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <select
                multiple
                id={field.key}
                value={selectedValues}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
                  handleChange(field.key, selected);
                }}
                className={cn(
                  'w-full px-4 py-2.5 text-sm border rounded-lg transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-offset-1 bg-white',
                  error
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-gray-300 focus:border-primary focus:ring-primary/20 hover:border-gray-400'
                )}
              >
                {(field.options || []).map(option => (
                  <option key={`${field.key}-${option.value}`} value={String(option.value)}>
                    {option.label}
                  </option>
                ))}
              </select>
              {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
              )}
            </div>
          );
        }
        return (
          <Select
            key={field.key}
            id={field.key}
            label={field.label}
            options={(field.options || []).map(opt => ({
              label: opt.label,
              value: String(opt.value),
            }))}
            value={String(value || '')}
            onChange={(val) => handleChange(field.key, val)}
            placeholder={placeholder || `Select ${field.label.toLowerCase()}...`}
            error={error}
          />
        );

      case 'date':
        return (
          <DatePicker
            key={field.key}
            label={field.label}
            value={value ? String(value) : ''}
            onChange={(val) => handleChange(field.key, val)}
            placeholder={placeholder}
            error={error}
          />
        );

      case 'boolean':
      case 'yesNo':
        return (
          <div key={field.key} className="w-full">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                id={field.key}
                checked={Boolean(value)}
                onChange={(e) => handleChange(field.key, e.target.checked)}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <span className="text-sm font-semibold text-gray-900">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </span>
            </label>
            {error && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
            )}
          </div>
        );

      case 'upload':
        return (
          <div key={field.key} className="w-full">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="file"
              id={field.key}
              onChange={(e) => handleChange(field.key, e.target.files?.[0] || null)}
              className={cn(
                'w-full text-sm text-gray-900',
                'file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0',
                'file:text-sm file:font-semibold file:bg-primary/10 file:text-primary',
                'hover:file:bg-primary/20'
              )}
            />
            {isFile(value) && (
              <p className="mt-1 text-sm text-gray-600">{value.name}</p>
            )}
            {error && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in !m-0"
      role="dialog"
      aria-modal="true"
      aria-labelledby="resource-modal-title"
      onClick={onClose}
    >
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={(e) => {
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
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h3 
                id="resource-modal-title"
                className="text-xl font-semibold text-gray-900"
              >
                {title}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {mode === 'edit' ? 'Modify the details below' : 'Fill in the information to create a new item'}
              </p>
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
          
          <form onSubmit={handleSubmit} className="p-6">
            {errors.general && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{errors.general}</p>
              </div>
            )}

            <div className="space-y-4">
              {formFields.map(field => renderFormField(field))}
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                loading={loading}
              >
                {mode === 'edit' ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
