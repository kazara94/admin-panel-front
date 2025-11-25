'use client';

import React from 'react';
import { Button } from '@/app/admin/components/ui';
import { cn } from '@/app/admin/lib/utils/cn';
import { Column } from '@/app/admin/lib/config/resourcesConfig';

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (current && typeof current === 'object' && current !== null && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

type TableRowProps<T extends object = object> = {
  row: T;
  rowIndex: number;
  columns: readonly Column<T>[];
  rowId: number | string;
  isRowSelected: boolean;
  hasSelection: boolean;
  hasActions: boolean;
  onRowSelect: (rowId: number | string, selected: boolean) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  hoveredRowIndex: number | null;
  onMouseEnter: (index: number) => void;
  onMouseLeave: () => void;
};

export function TableRow<T extends object = object>({
  row,
  rowIndex,
  columns,
  rowId,
  isRowSelected,
  hasSelection,
  hasActions,
  onRowSelect,
  onEdit,
  onDelete,
  hoveredRowIndex,
  onMouseEnter,
  onMouseLeave
}: TableRowProps<T>) {
  return (
    <tr
      key={typeof rowId === 'string' || typeof rowId === 'number' ? rowId : rowIndex}
      className={cn(
        'hover:bg-gray-50 transition-colors',
        hoveredRowIndex === rowIndex && 'bg-gray-50'
      )}
      role="row"
      onMouseEnter={() => onMouseEnter(rowIndex)}
      onMouseLeave={onMouseLeave}
    >
      {hasSelection && (
        <td className="px-6 py-4" role="cell">
          <input
            type="checkbox"
            checked={isRowSelected}
            onChange={(e) => onRowSelect(rowId, e.target.checked)}
            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
            aria-label={`Select row ${rowIndex + 1}`}
          />
        </td>
      )}
      {columns.map((column) => {
        const cellValue = getNestedValue(row as Record<string, unknown>, column.key);
        
        return (
          <td
            key={column.key}
            className="px-6 py-4 whitespace-nowrap"
            role="cell"
          >
            {column.render ? column.render(row) : (
              <span className="text-gray-900">{cellValue != null ? String(cellValue) : ''}</span>
            )}
          </td>
        );
      })}
      {hasActions && (
        <td className="px-6 py-4 whitespace-nowrap" role="cell">
          <div className="flex items-center space-x-2">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(row)}
                className="hover:bg-blue-50 hover:text-blue-600"
                aria-label={`Edit row ${rowIndex + 1}`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(row)}
                className="hover:bg-red-50 hover:text-red-600"
                aria-label={`Delete row ${rowIndex + 1}`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </Button>
            )}
          </div>
        </td>
      )}
    </tr>
  );
}

