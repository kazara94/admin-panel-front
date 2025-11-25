'use client';

import React from 'react';
import { Column } from '@/app/admin/lib/config/resourcesConfig';
import { TableRow } from './TableRow';

type TableBodyProps<T extends object = object> = {
  data: T[];
  columns: readonly Column<T>[];
  getId: (row: T) => number | string;
  hasSelection: boolean;
  selectedItems: (number | string)[];
  hasActions: boolean;
  onRowSelect: (rowId: number | string, selected: boolean) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  hoveredRowIndex: number | null;
  onMouseEnter: (index: number) => void;
  onMouseLeave: () => void;
};

export function TableBody<T extends object = object>({
  data,
  columns,
  getId,
  hasSelection,
  selectedItems,
  hasActions,
  onRowSelect,
  onEdit,
  onDelete,
  hoveredRowIndex,
  onMouseEnter,
  onMouseLeave
}: TableBodyProps<T>) {
  const usedKeys = new Set<string>();

  return (
    <tbody className="bg-white divide-y divide-gray-200">
      {data.map((row, index) => {
        const rowId = getId(row);
        const isRowSelected = hasSelection && selectedItems.includes(rowId);
        
        const baseKey = (rowId !== undefined && rowId !== null && rowId !== '' && rowId !== 0)
          ? String(rowId)
          : `row-${index}`;
        
        let uniqueKey = baseKey;
        if (usedKeys.has(uniqueKey)) {
          let suffix = 1;
          while (usedKeys.has(`${baseKey}-${suffix}`)) {
            suffix += 1;
          }
          uniqueKey = `${baseKey}-${suffix}`;
        }
        usedKeys.add(uniqueKey);
        
        return (
          <TableRow
            key={uniqueKey}
            row={row}
            rowIndex={index}
            columns={columns}
            rowId={rowId}
            isRowSelected={isRowSelected}
            hasSelection={hasSelection}
            hasActions={hasActions}
            onRowSelect={onRowSelect}
            onEdit={onEdit}
            onDelete={onDelete}
            hoveredRowIndex={hoveredRowIndex}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
          />
        );
      })}
    </tbody>
  );
}

