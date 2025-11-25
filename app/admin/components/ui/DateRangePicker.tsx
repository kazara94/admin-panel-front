'use client';

import React, { useState } from 'react';
import DatePicker from './DatePicker';
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

interface DateRangePickerProps {
  startValue?: string;
  endValue?: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  startLabel?: string;
  endLabel?: string;
  startPlaceholder?: string;
  endPlaceholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export default function DateRangePicker({
  startValue,
  endValue,
  onStartChange,
  onEndChange,
  startLabel = 'Start Date',
  endLabel = 'End Date',
  startPlaceholder = 'Select start date...',
  endPlaceholder = 'Select end date...',
  error,
  disabled = false,
  className
}: DateRangePickerProps) {
  const [startError, setStartError] = useState<string>('');
  const [endError, setEndError] = useState<string>('');

  const handleStartChange = (value: string) => {
    onStartChange(value);
    const parsedValue = parseLocalDate(value);
    const parsedEnd = parseLocalDate(endValue);
    if (parsedValue && parsedEnd && parsedValue.getTime() > parsedEnd.getTime()) {
      setStartError('Start date cannot be after end date');
      setEndError('');
    } else {
      setStartError('');
      setEndError('');
    }
  };

  const handleEndChange = (value: string) => {
    onEndChange(value);
    const parsedStart = parseLocalDate(startValue);
    const parsedValue = parseLocalDate(value);
    if (parsedStart && parsedValue && parsedStart.getTime() > parsedValue.getTime()) {
      setEndError('End date cannot be before start date');
      setStartError('');
    } else {
      setStartError('');
      setEndError('');
    }
  };

  return (
    <div className={cn(className)}>
      <div className="grid grid-cols-1 tablet-sm:grid-cols-2 gap-3 mb-3">
        <DatePicker
          value={startValue}
          onChange={handleStartChange}
          label={startLabel}
          placeholder={startPlaceholder}
          error={startError || (error && 'Invalid date range')}
          disabled={disabled}
          max={endValue || undefined}
        />
        
        <DatePicker
          value={endValue}
          onChange={handleEndChange}
          label={endLabel}
          placeholder={endPlaceholder}
          error={endError || (error && 'Invalid date range')}
          disabled={disabled}
          min={startValue || undefined}
        />
      </div>
      
      <div className="flex flex-wrap gap-1.5 justify-center tablet-sm:justify-start">
        <button
          type="button"
          onClick={() => {
            const today = new Date();
            const todayStr = formatLocalDate(today);
            handleStartChange(todayStr);
            handleEndChange(todayStr);
          }}
          disabled={disabled}
          className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Today
        </button>
        
        <button
          type="button"
          onClick={() => {
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            const yesterdayStr = formatLocalDate(yesterday);
            handleStartChange(yesterdayStr);
            handleEndChange(yesterdayStr);
          }}
          disabled={disabled}
          className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Yesterday
        </button>
        
        <button
          type="button"
          onClick={() => {
            const today = new Date();
            const lastWeek = new Date(today);
            lastWeek.setDate(today.getDate() - 7);
            handleStartChange(formatLocalDate(lastWeek));
            handleEndChange(formatLocalDate(today));
          }}
          disabled={disabled}
          className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Last 7 days
        </button>
        
        <button
          type="button"
          onClick={() => {
            const today = new Date();
            const lastMonth = new Date(today);
            lastMonth.setDate(today.getDate() - 30);
            handleStartChange(formatLocalDate(lastMonth));
            handleEndChange(formatLocalDate(today));
          }}
          disabled={disabled}
          className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Last 30 days
        </button>
        
        <button
          type="button"
          onClick={() => {
            handleStartChange('');
            handleEndChange('');
          }}
          disabled={disabled}
          className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-100 hover:bg-red-200 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
