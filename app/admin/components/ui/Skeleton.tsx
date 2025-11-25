'use client';

import React from 'react';
import { cn } from '@/app/admin/lib/utils/cn';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  lines?: number;
  animation?: 'pulse' | 'wave' | 'none';
}

export default function Skeleton({
  className,
  variant = 'rectangular',
  width,
  height,
  lines = 1,
  animation = 'pulse'
}: SkeletonProps) {
  const baseClasses = 'bg-gray-200';
  
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: '',
    rounded: 'rounded-lg'
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-wave',
    none: ''
  };

  const skeletonStyle = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={cn(
              baseClasses,
              variantClasses[variant],
              animationClasses[animation],
              index === lines - 1 ? 'w-3/4' : 'w-full'
            )}
            style={{
              height: height || '1rem',
              width: index === lines - 1 ? '75%' : width || '100%'
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        animationClasses[animation],
        variant === 'text' && !height && 'h-4',
        variant === 'circular' && !width && !height && 'w-10 h-10',
        variant === 'rectangular' && !height && 'h-20',
        variant === 'rounded' && !height && 'h-20',
        className
      )}
      style={skeletonStyle}
    />
  );
}

export function SkeletonText({ 
  lines = 3, 
  className 
}: { 
  lines?: number; 
  className?: string; 
}) {
  return (
    <Skeleton 
      variant="text" 
      lines={lines} 
      className={className} 
    />
  );
}

export function SkeletonAvatar({ 
  size = 40, 
  className 
}: { 
  size?: number; 
  className?: string; 
}) {
  return (
    <Skeleton 
      variant="circular" 
      width={size} 
      height={size} 
      className={className} 
    />
  );
}

export function SkeletonCard({ 
  className 
}: { 
  className?: string; 
}) {
  return (
    <div className={cn('p-4 space-y-4', className)}>
      <Skeleton variant="rectangular" height={200} />
      <SkeletonText lines={2} />
      <div className="flex items-center space-x-2">
        <SkeletonAvatar size={24} />
        <Skeleton variant="text" width="60%" height={16} />
      </div>
    </div>
  );
}

export function SkeletonTable({ 
  rows = 5, 
  columns = 4, 
  className 
}: { 
  rows?: number; 
  columns?: number; 
  className?: string; 
}) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={`header-${index}`} variant="text" height={20} />
        ))}
      </div>
      
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div 
          key={`row-${rowIndex}`} 
          className="grid gap-4" 
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton 
              key={`cell-${rowIndex}-${colIndex}`} 
              variant="text" 
              height={16}
              width={colIndex === 0 ? '80%' : '100%'}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ 
  items = 5, 
  showAvatar = true, 
  className 
}: { 
  items?: number; 
  showAvatar?: boolean; 
  className?: string; 
}) {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center space-x-3">
          {showAvatar && <SkeletonAvatar size={32} />}
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="70%" height={16} />
            <Skeleton variant="text" width="40%" height={14} />
          </div>
        </div>
      ))}
    </div>
  );
}
