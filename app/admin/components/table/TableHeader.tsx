'use client';

import React from 'react';
import { cn } from '@/app/admin/lib/utils/cn';
import { Column } from '@/app/admin/lib/config/resourcesConfig';

type TableHeaderProps<T = unknown> = {
  columns: readonly Column<T>[];
  hasSelection: boolean;
  hasActions: boolean;
  isAllSelected: boolean;
  isSomeSelected: boolean;
  onSelectAll: (selected: boolean) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string) => void;
};

export function TableHeader<T = unknown>({
  columns,
  hasSelection,
  hasActions,
  isAllSelected,
  isSomeSelected,
  onSelectAll,
  sortBy,
  sortOrder,
  onSort
}: TableHeaderProps<T>) {
  const handleSort = (key: string) => {
    if (!onSort) return;
    onSort(key);
  };

  return (
    <thead className="bg-gray-50 border-b border-gray-200">
      <tr role="row">
        {hasSelection && (
          <th className="w-12 px-6 py-3" scope="col">
            <input
              type="checkbox"
              checked={isAllSelected}
              ref={(input) => {
                if (input) input.indeterminate = isSomeSelected && !isAllSelected;
              }}
              onChange={(e) => onSelectAll(e.target.checked)}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
              aria-label="Select all items on this page"
            />
          </th>
        )}
        {columns.map((column) => (
          <th
            key={column.key}
            className={cn(
              'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
              column.width,
              column.sortable && onSort && 'cursor-pointer hover:bg-gray-100 transition-colors'
            )}
            style={column.width && !column.width.startsWith('w-') ? { width: column.width } : undefined}
            scope="col"
            role="columnheader"
            onClick={() => column.sortable && onSort && handleSort(column.key)}
          >
            <div className="flex items-center space-x-1">
              <span>{column.label}</span>
              {column.sortable && onSort && (
                <div className="flex flex-col">
                  <svg 
                    className={cn(
                      'w-3 h-3 -mb-1',
                      sortBy === column.key && sortOrder === 'asc' ? 'text-primary' : 'text-gray-400'
                    )} 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                  <svg 
                    className={cn(
                      'w-3 h-3',
                      sortBy === column.key && sortOrder === 'desc' ? 'text-primary' : 'text-gray-400'
                    )} 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </th>
        ))}
        {hasActions && (
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" scope="col">
            Actions
          </th>
        )}
      </tr>
    </thead>
  );
}

