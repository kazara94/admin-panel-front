'use client';

import React from 'react';
import { cn } from '@/app/admin/lib/utils/cn';
import Button from './Button';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  illustration?: 'search' | 'data' | 'filter' | 'error' | 'custom';
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SearchIllustration = () => (
  <svg className="w-24 h-24 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const DataIllustration = () => (
  <svg className="w-24 h-24 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const FilterIllustration = () => (
  <svg className="w-24 h-24 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

const ErrorIllustration = () => (
  <svg className="w-24 h-24 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const illustrations = {
  search: SearchIllustration,
  data: DataIllustration,
  filter: FilterIllustration,
  error: ErrorIllustration,
  custom: () => null
};

export default function EmptyState({
  title,
  description,
  icon,
  illustration = 'data',
  action,
  secondaryAction,
  className,
  size = 'md'
}: EmptyStateProps) {
  const IllustrationComponent = illustrations[illustration];

  const sizeClasses = {
    sm: 'py-8',
    md: 'py-12',
    lg: 'py-16'
  };

  const titleSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  const descriptionSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <div className={cn(
      'flex flex-col items-center justify-center text-center',
      sizeClasses[size],
      className
    )}>
      <div className="mb-6">
        {icon ? (
          <div className="w-24 h-24 flex items-center justify-center text-gray-300">
            {icon}
          </div>
        ) : (
          <IllustrationComponent />
        )}
      </div>

      <h3 className={cn(
        'font-semibold text-gray-900 mb-2',
        titleSizeClasses[size]
      )}>
        {title}
      </h3>

      {description && (
        <p className={cn(
          'text-gray-600 max-w-sm mb-6',
          descriptionSizeClasses[size]
        )}>
          {description}
        </p>
      )}

      {(action || secondaryAction) && (
        <div className="flex flex-col tablet-sm:flex-row gap-3">
          {action && (
            <Button
              variant={action.variant || 'primary'}
              onClick={action.onClick}
              size={size === 'sm' ? 'sm' : 'md'}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="ghost"
              onClick={secondaryAction.onClick}
              size={size === 'sm' ? 'sm' : 'md'}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export function NoSearchResults({ 
  searchQuery, 
  onClearSearch 
}: { 
  searchQuery: string; 
  onClearSearch: () => void; 
}) {
  return (
    <EmptyState
      illustration="search"
      title="No results found"
      description={`We couldn't find any results for "${searchQuery}". Try adjusting your search terms.`}
      action={{
        label: 'Clear search',
        onClick: onClearSearch,
        variant: 'secondary'
      }}
    />
  );
}

export function NoDataAvailable({ 
  title = "No data available",
  description = "There's no data to display at the moment.",
  onRefresh
}: { 
  title?: string;
  description?: string;
  onRefresh?: () => void;
}) {
  return (
    <EmptyState
      illustration="data"
      title={title}
      description={description}
      action={onRefresh ? {
        label: 'Refresh',
        onClick: onRefresh,
        variant: 'primary'
      } : undefined}
    />
  );
}

export function NoFilterResults({ 
  onClearFilters 
}: { 
  onClearFilters: () => void; 
}) {
  return (
    <EmptyState
      illustration="filter"
      title="No matches found"
      description="No items match your current filters. Try adjusting or clearing your filters to see more results."
      action={{
        label: 'Clear all filters',
        onClick: onClearFilters,
        variant: 'secondary'
      }}
    />
  );
}

export function ErrorState({ 
  title = "Something went wrong",
  description = "We encountered an error while loading the data.",
  onRetry
}: { 
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <EmptyState
      illustration="error"
      title={title}
      description={description}
      action={onRetry ? {
        label: 'Try again',
        onClick: onRetry,
        variant: 'primary'
      } : undefined}
    />
  );
}
