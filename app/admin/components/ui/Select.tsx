'use client';

import React, { useState, useRef, useEffect, useCallback, useId } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/app/admin/lib/utils/cn';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  help?: string;
  searchable?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  id?: string;
}

export default function Select({
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  label,
  error,
  help,
  searchable = false,
  disabled = false,
  size = 'md',
  className,
  id
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const selectRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const selectId = id || `select-${generatedId}`;

  const filteredOptions = searchable && searchQuery
    ? options.filter(option => 
        option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        option.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  const selectedOption = options.find(option => option.value === value);

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-4 py-3 text-base'
  };

  const handleOptionSelect = (optionValue: string) => {
    if (!onChange || typeof onChange !== 'function') {
      return;
    }
    onChange(optionValue);
    setIsOpen(false);
    setSearchQuery('');
    setFocusedIndex(-1);
  };

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (disabled) return;

    switch (event.key) {
      case 'Enter':
      case ' ':
        if (!isOpen) {
          setIsOpen(true);
          setFocusedIndex(0);
        } else if (focusedIndex >= 0 && filteredOptions[focusedIndex]) {
          onChange(filteredOptions[focusedIndex].value);
          setIsOpen(false);
          setSearchQuery('');
          setFocusedIndex(-1);
        }
        event.preventDefault();
        break;

      case 'Escape':
        setIsOpen(false);
        setSearchQuery('');
        setFocusedIndex(-1);
        event.preventDefault();
        break;

      case 'ArrowDown':
        if (!isOpen) {
          setIsOpen(true);
          setFocusedIndex(0);
        } else {
          setFocusedIndex(prev => 
            prev < filteredOptions.length - 1 ? prev + 1 : prev
          );
        }
        event.preventDefault();
        break;

      case 'ArrowUp':
        if (isOpen) {
          setFocusedIndex(prev => prev > 0 ? prev - 1 : prev);
        }
        event.preventDefault();
        break;

      case 'Tab':
        if (isOpen) {
          setIsOpen(false);
          setSearchQuery('');
          setFocusedIndex(-1);
        }
        break;
    }
  }, [isOpen, focusedIndex, filteredOptions, onChange, disabled]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      const isOutsideSelect = selectRef.current && !selectRef.current.contains(target);
      const isOutsideDropdown = optionsRef.current && !optionsRef.current.contains(target);
      
      if (isOutsideSelect && isOutsideDropdown) {
        setIsOpen(false);
        setSearchQuery('');
        setFocusedIndex(-1);
      }
    };

    const handleScroll = () => {
      if (isOpen && selectRef.current) {
        const rect = selectRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + 4,
          left: rect.left,
          width: rect.width
        });
      }
    };

    const handleResize = () => {
      if (isOpen) {
        setIsOpen(false);
        setSearchQuery('');
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && selectRef.current) {
      const rect = selectRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const dropdownHeight = 240;
      
      let top = rect.bottom + 4;
      let left = rect.left;
      
      if (rect.bottom + dropdownHeight > viewportHeight) {
        top = rect.top - dropdownHeight - 4;
      }
      
      if (left + rect.width > window.innerWidth) {
        left = window.innerWidth - rect.width - 10;
      }
      
      if (left < 10) {
        left = 10;
      }
      
      setDropdownPosition({
        top,
        left,
        width: rect.width
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  useEffect(() => {
    if (focusedIndex >= 0 && optionsRef.current) {
      const optionsContainer = optionsRef.current.querySelector('[role="listbox"]');
      if (optionsContainer) {
        const focusedElement = optionsContainer.children[focusedIndex] as HTMLElement;
        if (focusedElement) {
          focusedElement.scrollIntoView({ block: 'nearest' });
        }
      }
    }
  }, [focusedIndex]);

  return (
    <div className={cn('relative w-full', className)}>
      {label && (
        <label htmlFor={selectId} className="block text-sm font-semibold text-gray-900 mb-2">
          {label}
        </label>
      )}
      
      <div
        ref={selectRef}
        className="relative"
      >
        <button
          id={selectId}
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={cn(
            'w-full border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 bg-white text-left flex items-center justify-between min-h-[48px]',
            sizeClasses[size],
            error 
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
              : 'border-gray-300 focus:border-primary focus:ring-primary/20 hover:border-gray-400',
            disabled && 'bg-gray-50 text-gray-500 cursor-not-allowed',
            isOpen && 'border-primary ring-2 ring-primary/20'
          )}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-labelledby={label ? `${selectId}-label` : undefined}
        >
          <div className="flex items-center flex-1 min-w-0">
            {selectedOption?.icon && (
              <span className="mr-2 flex-shrink-0">{selectedOption.icon}</span>
            )}
            <span className={cn(
              'block truncate',
              !selectedOption && 'text-gray-500'
            )}>
              {selectedOption?.label || placeholder}
            </span>
          </div>
          
          <svg
            className={cn(
              'w-5 h-5 text-gray-400 transition-transform duration-200 flex-shrink-0 ml-2',
              isOpen && 'transform rotate-180'
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && typeof window !== 'undefined' && createPortal(
          <div 
            ref={optionsRef}
            className="bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden animate-fade-in-scale"
            style={{
              position: 'fixed',
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              zIndex: 9999
            }}
          >
            {searchable && (
              <div className="p-2 border-b border-gray-200">
                <div className="relative">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setFocusedIndex(0);
                    }}
                    placeholder="Search options..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                  <svg
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            )}

            <div
              className="max-h-48 overflow-y-auto"
              role="listbox"
              aria-labelledby={selectId}
            >
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  No options found
                </div>
              ) : (
                filteredOptions.map((option, index) => (
                  <button
                    key={option.value}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleOptionSelect(option.value);
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleOptionSelect(option.value);
                    }}
                    className={cn(
                      'w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors duration-150 flex items-center',
                      index === focusedIndex && 'bg-gray-50',
                      option.value === value && 'bg-primary/5 text-primary font-medium'
                    )}
                    role="option"
                    aria-selected={option.value === value}
                  >
                    {option.icon && (
                      <span className="mr-3 flex-shrink-0">{option.icon}</span>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900">
                        {option.label}
                      </div>
                      {option.description && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          {option.description}
                        </div>
                      )}
                    </div>
                    {option.value === value && (
                      <svg
                        className="w-4 h-4 text-primary flex-shrink-0 ml-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>,
          document.body
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}

      {help && !error && (
        <p className="mt-1 text-sm text-gray-600">{help}</p>
      )}
    </div>
  );
}
