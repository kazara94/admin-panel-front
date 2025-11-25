'use client';

import React, { useMemo } from 'react';
import Table from '@/app/admin/components/table/Table';
import { ResourceHookResult } from '@/app/admin/lib/types/resourceHookResult.types';
import { ResourceConfig } from '@/app/admin/lib/config/resourceConfig.types';
import { TableResourceConfig } from '@/app/admin/lib/config/resourcesConfig';
import { generateTableColumns } from '@/app/admin/lib/utils/fieldUtils';

import { BaseResource } from '@/app/admin/lib/types/baseResource.types';

type ResourceTableProps<T = unknown> = {
  config: ResourceConfig<T>;
  hookResult: ResourceHookResult<T extends BaseResource ? T : BaseResource>;
};

export function ResourceTable<T = unknown>({ config, hookResult }: ResourceTableProps<T>) {
  const {
    items,
    isLoading,
    page,
    pageSize,
    totalItems,
    setPage,
    setPageSize,
    sortBy,
    sortOrder,
    setSort,
    selectedIds,
    toggleSelect,
    updateItem,
    deleteItem,
    bulkDeleteItems,
  } = hookResult;

  const tableConfigWithColumns = useMemo(() => {
    let tableConfig = config.table;
    
    if ((!tableConfig.columns || tableConfig.columns.length === 0) && config.fields && config.fields.length > 0) {
      const generatedColumns = generateTableColumns<T>(config.fields);
      tableConfig = {
        ...tableConfig,
        columns: generatedColumns,
      };
    }
    
    return {
      id: config.id,
      label: config.label,
      path: config.path,
      showInNav: config.showInNav,
      table: tableConfig,
    } as TableResourceConfig<Record<string, unknown>>;
  }, [config.id, config.label, config.path, config.showInNav, config.table, config.fields]);

  const paginatedItems = ('paginatedItems' in hookResult && Array.isArray(hookResult.paginatedItems))
    ? (hookResult.paginatedItems as Record<string, unknown>[])
    : (items as Record<string, unknown>[]);

  const handleSelectionChange = config.actions?.enableSelection
    ? (selected: (string | number)[]) => {
        if (toggleSelect) {
          const currentSet = new Set(selectedIds || []);
          const newSet = new Set(selected);
          
          newSet.forEach(id => {
            if (!currentSet.has(id)) {
              toggleSelect(id);
            }
          });
          
          currentSet.forEach(id => {
            if (!newSet.has(id)) {
              toggleSelect(id);
            }
          });
        }
      }
    : undefined;

  const handleBulkDelete = config.actions?.enableBulkDelete && bulkDeleteItems
    ? (rows: Record<string, unknown>[]) => {
        void bulkDeleteItems(rows as unknown as Parameters<typeof bulkDeleteItems>[0]);
      }
    : undefined;

  const getRowId = useMemo(() => {
    return (row: Record<string, unknown>): string | number => {
      if ('id' in row && (row.id !== undefined && row.id !== null && row.id !== '' && row.id !== 0)) {
        return row.id as string | number;
      }
      if ('_id' in row && row._id !== undefined && row._id !== null) {
        return row._id as string | number;
      }
      if ('cca3' in row && typeof row.cca3 === 'string') {
        return row.cca3 as string;
      }
      return paginatedItems.indexOf(row);
    };
  }, [paginatedItems]);

  return (
    <div id="main-content">
      <Table<Record<string, unknown>>
        config={tableConfigWithColumns}
        data={paginatedItems}
        isLoading={isLoading}
        pagination={{
          page,
          pageSize,
          total: totalItems,
          onPageChange: setPage,
          onPageSizeChange: setPageSize,
        }}
        actions={
          config.actions?.enableEdit || config.actions?.enableDelete
            ? {
                onEdit: config.actions?.enableEdit && updateItem 
                  ? (item: Record<string, unknown>) => {
                      void updateItem(item as unknown as Parameters<typeof updateItem>[0]).catch(() => {});
                    }
                  : undefined,
                onDelete: config.actions?.enableDelete && deleteItem 
                  ? (item: Record<string, unknown>) => {
                      void deleteItem(item as unknown as Parameters<typeof deleteItem>[0]).catch(() => {});
                    }
                  : undefined,
              }
            : undefined
        }
        selectedItems={config.actions?.enableSelection ? selectedIds : undefined}
        onSelectionChange={handleSelectionChange}
        onBulkDelete={handleBulkDelete}
        getRowId={getRowId}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={setSort}
        className="animate-slide-up"
      />
    </div>
  );
}

