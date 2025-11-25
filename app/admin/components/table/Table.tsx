'use client';

import React, { useMemo, useState } from 'react';
import { 
  Card, 
  CardHeader, 
  CardBody, 
  Button, 
  Pagination,
  Skeleton,
  SkeletonTable
} from '@/app/admin/components/ui';
import { cn } from '@/app/admin/lib/utils/cn';
import { TableResourceConfig, Column } from '@/app/admin/lib/config/resourcesConfig';
import { TableHeader } from './TableHeader';
import { TableBody } from './TableBody';
import { TableEmptyState } from './TableEmptyState';

export type { Column };

export type TableProps<T extends object = object> = {
  config: TableResourceConfig<T>;
  data: T[];
  isLoading?: boolean;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
  };
  actions?: {
    onEdit?: (row: T) => void;
    onDelete?: (row: T) => void;
  };
  selectedItems?: (number | string)[];
  onSelectionChange?: (selected: (number | string)[]) => void;
  onBulkDelete?: (rows: T[]) => void;
  getRowId?: (row: T) => number | string;
  searchQuery?: string;
  onClearSearch?: () => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  className?: string;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
};

export default function Table<T extends object = object>({
  config,
  data,
  isLoading = false,
  pagination,
  actions,
  selectedItems = [],
  onSelectionChange,
  onBulkDelete,
  getRowId,
  searchQuery,
  onClearSearch,
  sortBy: sortByProp,
  sortOrder: sortOrderProp,
  onSort,
  className,
  emptyStateTitle,
  emptyStateDescription
}: TableProps<T>) {
  const [hoveredRowIndex, setHoveredRowIndex] = useState<number | null>(null);

  const columns = config.table.columns;
  const defaultSort = config.table.defaultSort;
  const sortBy = sortByProp || defaultSort?.key || undefined;
  const sortOrder = sortOrderProp || defaultSort?.direction || 'asc';
  const safeData = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const onEdit = actions?.onEdit;
  const onDelete = actions?.onDelete;

  const getId = useMemo(() => {
    if (getRowId) {
      return getRowId;
    }
    return (row: T): number | string => {
      if ('id' in row && (typeof row.id === 'number' || typeof row.id === 'string')) {
        return row.id;
      }
      if ('_id' in row && (typeof row._id === 'number' || typeof row._id === 'string')) {
        return row._id;
      }
      if ('cca3' in row && typeof row.cca3 === 'string') {
        return row.cca3;
      }
      return safeData.indexOf(row);
    };
  }, [getRowId, safeData]);

  const hasSelection = onSelectionChange !== undefined;
  const paginatedData = safeData;

  const isAllSelected = hasSelection && paginatedData.length > 0 && 
    paginatedData.every(row => {
      const id = getId(row);
      return selectedItems.includes(id);
    });
  
  const isSomeSelected = hasSelection && paginatedData.some(row => {
    const id = getId(row);
    return selectedItems.includes(id);
  });

  const handleRowSelect = (rowId: number | string, selected: boolean) => {
    if (!onSelectionChange) return;
    
    if (selected) {
      onSelectionChange([...selectedItems, rowId]);
    } else {
      onSelectionChange(selectedItems.filter(id => id !== rowId));
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (!onSelectionChange) return;
    
    if (selected) {
      const pageIds = paginatedData.map(row => getId(row));
      onSelectionChange([...new Set([...selectedItems, ...pageIds])]);
    } else {
      const pageIds = paginatedData.map(row => getId(row));
      onSelectionChange(selectedItems.filter(id => !pageIds.includes(id)));
    }
  };

  const selectedRows = useMemo(() => {
    if (!onBulkDelete || !hasSelection) return [];
    return safeData.filter(row => {
      const id = getId(row);
      return selectedItems.includes(id);
    });
  }, [safeData, selectedItems, onBulkDelete, hasSelection, getId]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton variant="text" width="150px" height="24px" />
            <Skeleton variant="text" width="100px" height="20px" />
          </div>
        </CardHeader>
        <CardBody className="p-0">
          <SkeletonTable 
            rows={pagination?.pageSize || config.table.defaultPageSize || 10} 
            columns={columns.length + (hasSelection ? 1 : 0) + ((onEdit || onDelete) ? 1 : 0)} 
            className="p-6" 
          />
        </CardBody>
      </Card>
    );
  }

  if (safeData.length === 0) {
    return (
      <Card className={className}>
        <TableEmptyState
          searchQuery={searchQuery}
          onClearSearch={onClearSearch}
          emptyStateTitle={emptyStateTitle}
          emptyStateDescription={emptyStateDescription}
        />
      </Card>
    );
  }

  const totalPages = pagination ? Math.ceil(pagination.total / pagination.pageSize) : 1;
  const hasActions = !!(onEdit || onDelete);

  return (
    <Card className={cn('animate-slide-up', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {pagination ? `Total: ${pagination.total}` : `Items (${safeData.length})`}
            </h3>
            {hasSelection && selectedItems.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {selectedItems.length} selected
                </span>
                {onBulkDelete && selectedRows.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onBulkDelete(selectedRows)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Selected
                  </Button>
                )}
              </div>
            )}
          </div>
          {pagination && paginatedData.length > 0 && (
            <div className="text-sm text-gray-500">
              Showing {((pagination.page - 1) * pagination.pageSize) + 1}-{Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total}
            </div>
          )}
        </div>
      </CardHeader>

      <CardBody className="p-0">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[700px]" role="table">
            <TableHeader
              columns={columns}
              hasSelection={hasSelection}
              hasActions={hasActions}
              isAllSelected={isAllSelected}
              isSomeSelected={isSomeSelected}
              onSelectAll={handleSelectAll}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={onSort}
            />
              <TableBody<T>
                data={paginatedData}
                columns={columns}
              getId={getId}
              hasSelection={hasSelection}
              selectedItems={selectedItems}
              hasActions={hasActions}
              onRowSelect={handleRowSelect}
              onEdit={onEdit}
              onDelete={onDelete}
              hoveredRowIndex={hoveredRowIndex}
              onMouseEnter={setHoveredRowIndex}
              onMouseLeave={() => setHoveredRowIndex(null)}
            />
          </table>
        </div>

        {pagination && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/50">
            <Pagination
              currentPage={pagination.page}
              totalPages={totalPages}
              onPageChange={pagination.onPageChange}
              onPageSizeChange={pagination.onPageSizeChange}
              totalItems={pagination.total}
              pageSize={pagination.pageSize}
              showPageSizeSelector={!!pagination.onPageSizeChange}
              showJumpToPage={totalPages > 5}
              showInfo={true}
            />
          </div>
        )}
      </CardBody>
    </Card>
  );
}

