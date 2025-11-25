'use client';

import React from 'react';
import Button from './Button';
import { cn } from '@/app/admin/lib/utils/cn';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showInfo?: boolean;
  totalItems?: number;
  pageSize?: number;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  showPageSizeSelector?: boolean;
  showJumpToPage?: boolean;
  className?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showInfo = true,
  totalItems = 0,
  pageSize = 15,
  onPageSizeChange,
  pageSizeOptions = [10, 15, 25, 50, 100],
  showPageSizeSelector = false,
  showJumpToPage = false,
  className
}: PaginationProps) {
  const [jumpToPageValue, setJumpToPageValue] = React.useState('');

  if (totalPages <= 1 && !showPageSizeSelector) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const handleJumpToPage = (e: React.FormEvent) => {
    e.preventDefault();
    const page = parseInt(jumpToPageValue);
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
      setJumpToPageValue('');
    }
  };

  const handlePageSizeChange = (newPageSize: number) => {
    if (onPageSizeChange) {
      onPageSizeChange(newPageSize);
    }
  };

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const visiblePages = getVisiblePages();

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex flex-col gap-3 tablet-sm:flex-row tablet-sm:items-center tablet-sm:justify-between">
        {showInfo && (
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{startItem}</span> to{' '}
            <span className="font-medium">{endItem}</span> of{' '}
            <span className="font-medium">{totalItems}</span> results
          </div>
        )}

        {showPageSizeSelector && onPageSizeChange && (
          <div className="flex flex-col gap-2 text-sm tablet-sm:flex-row tablet-sm:items-center tablet-sm:gap-2 w-full tablet-sm:w-auto">
            <span className="text-gray-700">Show:</span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary w-full tablet-sm:w-auto"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span className="text-gray-700">per page</span>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col gap-3 tablet-sm:flex-row tablet-sm:items-center tablet-sm:justify-between">
          {showJumpToPage && (
            <form onSubmit={handleJumpToPage} className="flex flex-wrap items-center gap-2 w-full tablet-sm:w-auto">
              <span className="text-sm text-gray-700 whitespace-nowrap">Go to page:</span>
              <input
                type="number"
                min="1"
                max={totalPages}
                value={jumpToPageValue}
                onChange={(e) => setJumpToPageValue(e.target.value)}
                placeholder="1"
                className="w-full tablet-sm:w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
              <Button
                type="submit"
                variant="secondary"
                size="sm"
                disabled={!jumpToPageValue || parseInt(jumpToPageValue) < 1 || parseInt(jumpToPageValue) > totalPages}
              >
                Go
              </Button>
            </form>
          )}

          <div className="flex flex-wrap items-center justify-center gap-2 w-full tablet-sm:w-auto tablet-sm:justify-end">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              }
            >
              Previous
            </Button>

            <div className="flex flex-wrap justify-center tablet-sm:justify-start gap-1">
              {visiblePages.map((page, index) => (
                <React.Fragment key={index}>
                  {page === '...' ? (
                    <span className="px-3 py-2 text-gray-500">...</span>
                  ) : (
                    <button
                      onClick={() => onPageChange(page as number)}
                      className={cn(
                        'px-3 py-2 text-sm font-medium rounded-md transition-colors hover-lift',
                        page === currentPage
                          ? 'bg-primary text-white shadow-sm'
                          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                      )}
                    >
                      {page}
                    </button>
                  )}
                </React.Fragment>
              ))}
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              }
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
