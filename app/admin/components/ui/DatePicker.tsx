'use client';

import React, { useState, useRef, useEffect, useCallback, useId } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/app/admin/lib/utils/cn';

const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseLocalDate = (value?: string): Date | null => {
  if (!value) {
    return null;
  }
  const [yearStr, monthStr, dayStr] = value.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  if (!year || !month || !day) {
    return null;
  }
  const parsed = new Date(year, month - 1, day);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  parsed.setHours(0, 0, 0, 0);
  return parsed;
};

interface DatePickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  min?: string;
  max?: string;
}

export default function DatePicker({
  value,
  onChange,
  placeholder = 'Select date...',
  label,
  error,
  disabled = false,
  className,
  id,
  min,
  max
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const initialParsedValue = parseLocalDate(value);
  const [selectedDate, setSelectedDate] = useState<Date | null>(initialParsedValue);
  const [viewDate, setViewDate] = useState<Date>(initialParsedValue ?? new Date());
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const prevValueRef = useRef<string | undefined>(value);
  const generatedId = useId();
  const inputId = id || `datepicker-${generatedId}`;

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatInputDate = (date: Date): string => {
    return formatLocalDate(date);
  };

  const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const generateCalendarDays = (): (number | null)[] => {
    const daysInMonth = getDaysInMonth(viewDate);
    const firstDay = getFirstDayOfMonth(viewDate);
    const days: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    setSelectedDate(newDate);
    onChange(formatInputDate(newDate));
    setIsOpen(false);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setViewDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    const today = new Date();
    setViewDate(today);
    setSelectedDate(today);
    onChange(formatInputDate(today));
    setIsOpen(false);
  };

  const clearSelection = () => {
    setSelectedDate(null);
    onChange('');
    setIsOpen(false);
  };

  const calculatePosition = useCallback(() => {
    if (isOpen && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const dropdownHeight = 350;
      
      let top = rect.bottom + 4;
      let left = rect.left;
      
      if (rect.bottom + dropdownHeight > viewportHeight) {
        top = rect.top - dropdownHeight - 4;
      }
      
      const dropdownWidth = 300;
      if (left + dropdownWidth > window.innerWidth) {
        left = window.innerWidth - dropdownWidth - 10;
      }
      
      if (left < 10) {
        left = 10;
      }
      
      setDropdownPosition({
        top,
        left,
        width: dropdownWidth
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        calculatePosition();
      });
    }
  }, [isOpen, calculatePosition]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current && 
        !inputRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleScroll = () => {
      if (isOpen) {
        calculatePosition();
      }
    };

    const handleResize = () => {
      if (isOpen) {
        calculatePosition();
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
  }, [isOpen, calculatePosition]);

  useEffect(() => {
    if (prevValueRef.current === value) {
      return;
    }

    const parsedDate = parseLocalDate(value);
    const normalizedDate =
      parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : null;

    const frameId = window.requestAnimationFrame(() => {
      setSelectedDate(normalizedDate);
      if (normalizedDate) {
        setViewDate(normalizedDate);
      }
    });

    prevValueRef.current = value;

    return () => window.cancelAnimationFrame(frameId);
  }, [value]);

  const calendarDays = generateCalendarDays();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className={cn('relative w-full', className)}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-semibold text-gray-900 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          value={selectedDate ? formatDate(selectedDate) : ''}
          placeholder={placeholder}
          readOnly
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={cn(
            'w-full px-4 py-2.5 text-sm border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 bg-white cursor-pointer',
            error 
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
              : 'border-gray-300 focus:border-primary focus:ring-primary/20 hover:border-gray-400',
            disabled && 'bg-gray-100 text-gray-500 cursor-not-allowed',
            isOpen && 'border-primary ring-2 ring-primary/20'
          )}
        />
        
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>

      {isOpen && typeof window !== 'undefined' && createPortal(
        <div
          ref={dropdownRef}
          className="bg-white border border-gray-300 rounded-lg shadow-lg p-4 animate-fade-in-scale"
          style={{
            position: 'fixed',
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
            zIndex: 9999,
            maxHeight: '400px',
            overflow: 'hidden'
          }}
        >
          <div className="datepicker-header">
            <button
              type="button"
              onClick={() => navigateMonth('prev')}
              className="datepicker-nav-button"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="datepicker-month-year">
              {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
            </div>
            
            <button
              type="button"
              onClick={() => navigateMonth('next')}
              className="datepicker-nav-button"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="datepicker-day-names">
            {dayNames.map(day => (
              <div key={day} className="datepicker-day-name">
                {day}
              </div>
            ))}
          </div>

          <div className="datepicker-calendar-grid">
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${viewDate.getFullYear()}-${viewDate.getMonth()}-${index}`} className="p-2 h-10" />;
              }

              const dayDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
              const isSelected = selectedDate && 
                dayDate.toDateString() === selectedDate.toDateString();
              const isToday = dayDate.toDateString() === new Date().toDateString();
              
              // Compare dates without time component - normalize to midnight
              let isDisabled = false;
              if (min) {
                const minDate = parseLocalDate(min);
                if (minDate) {
                  isDisabled = dayDate.getTime() < minDate.getTime();
                }
              }
              if (max) {
                const maxDate = parseLocalDate(max);
                if (maxDate) {
                  isDisabled = isDisabled || dayDate.getTime() > maxDate.getTime();
                }
              }

              return (
                <button
                  key={`${viewDate.getFullYear()}-${viewDate.getMonth()}-${day}`}
                  type="button"
                  onClick={() => !isDisabled && handleDateSelect(day)}
                  disabled={isDisabled}
                  className={cn(
                    'datepicker-day',
                    isSelected && 'datepicker-day-selected',
                    isToday && !isSelected && 'datepicker-day-today',
                    isDisabled && 'datepicker-day-disabled'
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="datepicker-footer">
            <button
              type="button"
              onClick={goToToday}
              className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              onClick={clearSelection}
              className="text-xs text-gray-500 hover:text-admin-gray-700 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>,
        document.body
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
}
