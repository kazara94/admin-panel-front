'use client';

import { HTMLAttributes } from 'react';
import { cn } from '@/app/admin/lib/utils/cn';

interface LoadingSpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'spinner' | 'dots' | 'pulse';
}

export default function LoadingSpinner({ 
  className, 
  size = 'md', 
  variant = 'spinner',
  ...props 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  if (variant === 'dots') {
    return (
      <div className={cn('loading-dots', className)} {...props}>
        <div className="loading-dot" style={{ animationDelay: '0ms' }} />
        <div className="loading-dot" style={{ animationDelay: '150ms' }} />
        <div className="loading-dot" style={{ animationDelay: '300ms' }} />
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div 
        className={cn(
          'bg-primary rounded-full animate-pulse',
          sizeClasses[size],
          className
        )} 
        {...props}
      />
    );
  }

  return (
    <div 
      className={cn(
        'loading-spinner',
        sizeClasses[size],
        className
      )} 
      {...props}
    />
  );
}
