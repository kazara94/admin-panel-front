'use client';

import React from 'react';
import { cn } from '@/app/admin/lib/utils/cn';

interface FilterChipProps {
  label: string;
  value?: string;
  onRemove: () => void;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  className?: string;
  removable?: boolean;
}

export default function FilterChip({
  label,
  value,
  onRemove,
  variant = 'default',
  size = 'md',
  icon,
  className,
  removable = true
}: FilterChipProps) {
  const baseClasses = 'inline-flex items-center rounded-full font-medium transition-all duration-200 hover:shadow-sm';
  
  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const variantClasses = {
    default: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
    primary: 'bg-primary/10 text-primary hover:bg-primary/20',
    secondary: 'bg-blue-50 text-blue-700 hover:bg-blue-100',
    success: 'bg-green-50 text-green-700 hover:bg-green-100',
    warning: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100',
    danger: 'bg-red-50 text-red-700 hover:bg-red-100'
  };

  const removeButtonClasses = {
    default: 'text-gray-500 hover:text-gray-700 hover:bg-gray-300',
    primary: 'text-primary/70 hover:text-primary hover:bg-primary/30',
    secondary: 'text-blue-500 hover:text-blue-700 hover:bg-blue-200',
    success: 'text-green-500 hover:text-green-700 hover:bg-green-200',
    warning: 'text-yellow-500 hover:text-yellow-700 hover:bg-yellow-200',
    danger: 'text-red-500 hover:text-red-700 hover:bg-red-200'
  };

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <span className={cn(
      baseClasses,
      sizeClasses[size],
      variantClasses[variant],
      className
    )}>
      {icon && (
        <span className={cn(
          'flex-shrink-0 mr-1.5',
          iconSizeClasses[size]
        )}>
          {icon}
        </span>
      )}

      <span className="flex-1 min-w-0">
        {value ? (
          <>
            <span className="font-medium">{label}:</span>
            <span className="ml-1 font-normal truncate">&quot;{value}&quot;</span>
          </>
        ) : (
          <span className="truncate">{label}</span>
        )}
      </span>

      {removable && (
        <button
          type="button"
          onClick={onRemove}
          className={cn(
            'flex-shrink-0 ml-1.5 rounded-full p-0.5 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-current',
            removeButtonClasses[variant],
            size === 'sm' && 'ml-1 p-0.5',
            size === 'lg' && 'ml-2 p-1'
          )}
          aria-label={`Remove ${label} filter`}
        >
          <svg 
            className={cn(
              iconSizeClasses[size],
              size === 'sm' && 'w-2.5 h-2.5',
              size === 'lg' && 'w-4 h-4'
            )} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  );
}

export function SearchFilterChip({ 
  searchQuery, 
  onClear 
}: { 
  searchQuery: string; 
  onClear: () => void; 
}) {
  return (
    <FilterChip
      label="Search"
      value={searchQuery}
      onRemove={onClear}
      variant="primary"
      icon={
        <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      }
    />
  );
}

export function RegionFilterChip({ 
  region, 
  onClear 
}: { 
  region: string; 
  onClear: () => void; 
}) {
  return (
    <FilterChip
      label="Region"
      value={region}
      onRemove={onClear}
      variant="secondary"
      icon={
        <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      }
    />
  );
}

export function CurrencyFilterChip({ 
  currency, 
  onClear 
}: { 
  currency: string; 
  onClear: () => void; 
}) {
  return (
    <FilterChip
      label="Currency"
      value={currency}
      onRemove={onClear}
      variant="success"
      icon={
        <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      }
    />
  );
}

export function StatusFilterChip({ 
  status, 
  onClear 
}: { 
  status: string; 
  onClear: () => void; 
}) {
  return (
    <FilterChip
      label="Status"
      value={status}
      onRemove={onClear}
      variant="warning"
      icon={
        <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      }
    />
  );
}

export function FilterChipContainer({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <div className={cn(
      'flex flex-wrap gap-2 items-center',
      className
    )}>
      {children}
    </div>
  );
}
