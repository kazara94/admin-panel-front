'use client';

import { useCallback } from 'react';
import { ResourceConfig, FilterConfig } from '@/app/admin/lib/config/resourceConfig.types';
import { ResourceHookResult } from '@/app/admin/lib/types/resourceHookResult.types';
import { BaseResource, ApiResponse } from '@/app/admin/lib/types';
import { usePagination } from '@/app/admin/lib/hooks/usePagination';
import { useFilterManager } from '@/app/admin/lib/utils/filterFactory';
import { useResourceData } from './resource-logic/useResourceData';
import { useResourceActions } from './resource-logic/useResourceActions';

/**
 * Filter manager interface for useResourceTableLogic
 * This allows different filter implementations (URL-synced, non-URL-synced, etc.)
 */
export interface FilterManager<T> {
  /** Filtered items after applying all filters */
  filteredItems: T[];
  /** Current filter state as a flat Record */
  filters: Record<string, unknown>;
  /** Set a filter value */
  setFilter: (key: string, value: unknown) => void;
  /** Clear all filters */
  clearFilters: () => void;
  /** Whether any filters are active */
  hasActiveFilters?: boolean;
  /** Count of active filters */
  activeFiltersCount?: number;
  /** Current sort key (optional, may be part of filters) */
  sortBy?: string;
  /** Current sort order */
  sortOrder?: 'asc' | 'desc';
  /** Set sort (optional, may be part of setFilter) */
  setSort?: (key: string) => void;
}

/**
 * API functions for CRUD operations
 */
export interface ResourceApiFunctions<T> {
  /** Fetch list of items */
  fetchList: () => Promise<T[]>;
  /** Create a new item */
  create?: (data: Omit<T, 'id' | 'created_at' | 'updated_at'>) => Promise<T>;
  /** Update an existing item */
  update?: (id: string | number, data: Partial<T>) => Promise<T>;
  /** Delete an item */
  delete?: (id: string | number) => Promise<void>;
  /** Raw ApiResponse accessors */
  raw?: {
    fetchList: () => Promise<ApiResponse<unknown>>;
    create?: (data: Omit<T, 'id' | 'created_at' | 'updated_at'>) => Promise<ApiResponse<unknown>>;
    update?: (id: string | number, data: Partial<T>) => Promise<ApiResponse<unknown>>;
    delete?: (id: string | number) => Promise<ApiResponse<unknown>>;
  };
}

/**
 * Options for useResourceTableLogic
 */
export interface UseResourceTableLogicOptions<T> {
  /** Resource configuration */
  config: ResourceConfig<T>;
  /** API functions for data operations */
  api: ResourceApiFunctions<T>;
  /** Filter manager that handles filtering and sorting (optional if filterConfig provided) */
  filterManager?: FilterManager<T>;
  /** Filter configuration - used to build filterManager if filterManager not provided */
  filterConfig?: FilterConfig;
  /** Enable selection feature */
  enableSelection?: boolean;
  /** Transform raw API response to items array */
  transformResponse?: (response: unknown) => T[];
  /** Get item ID from item */
  getItemId?: (item: T) => string | number;
  /** External items state - if provided, hook will sync with it instead of managing internally */
  externalItems?: T[];
  /** Callback to update external items */
  onItemsChange?: (items: T[]) => void;
  /** External loading state */
  externalLoading?: boolean;
}

/**
 * Generic hook for resource table logic
 * Aggregates data fetching, filtering, pagination, sorting, selection, CRUD, and modals
 */
export function useResourceTableLogic<T = unknown>({
  config,
  api,
  filterManager: externalFilterManager,
  filterConfig,
  enableSelection = false,
  transformResponse,
  getItemId,
  externalItems,
  onItemsChange,
  externalLoading,
}: UseResourceTableLogicOptions<T>): ResourceHookResult<BaseResource> {
  const fallbackGetItemId = useCallback((item: T) => {
    if (item && typeof item === 'object' && 'id' in item) {
      return (item as { id?: string | number }).id || '';
    }
    return '';
  }, []);

  const resolvedGetItemId = getItemId ?? fallbackGetItemId;

  const dataResult = useResourceData<T>({
    api,
    transformResponse,
    getItemId: resolvedGetItemId,
    externalItems,
    onItemsChange,
    externalLoading,
  });

  const finalFilterConfig = filterConfig || config.filters || {
    type: 'simple' as const,
    fields: [],
  };
  
  const builtFilterManager = useFilterManager(
    dataResult.items as BaseResource[],
    finalFilterConfig,
    config.table.defaultSort
  );

  const filterManager = (externalFilterManager || builtFilterManager) as FilterManager<T>;

  const actionsResult = useResourceActions<T>({
    api,
    getItemId: resolvedGetItemId,
    items: dataResult.items,
    setItems: dataResult.setItems,
    filterManager,
    enableSelection,
  });

  const defaultPageSize = config.table.defaultPageSize || 15;
  const filteredItemsForPagination = filterManager.filteredItems as T[];
  
  const isUrlSynced = finalFilterConfig.type === 'url-synced';
  
  const {
    currentPage,
    goToPage,
    setPageSize,
    pageSize,
    totalItems,
    paginatedItems,
  } = usePagination(
    filteredItemsForPagination, 
    defaultPageSize, 
    1,
    isUrlSynced
  );

  return {
    items: dataResult.items as BaseResource[],
    isLoading: dataResult.loading,
    
    filters: filterManager.filters,
    setFilter: filterManager.setFilter,
    clearFilters: filterManager.clearFilters,
    hasActiveFilters: filterManager.hasActiveFilters,
    activeFiltersCount: filterManager.activeFiltersCount,
    
    page: currentPage,
    pageSize,
    totalItems,
    setPage: goToPage,
    setPageSize,
    paginatedItems: paginatedItems as BaseResource[],
    filteredItems: filterManager.filteredItems as BaseResource[],
    
    sortBy: filterManager.sortBy,
    sortOrder: filterManager.sortOrder || 'asc',
    setSort: actionsResult.setSort,
    
    selectedIds: actionsResult.selectedIds,
    toggleSelect: actionsResult.toggleSelect,
    clearSelection: actionsResult.clearSelection,
    selectedCount: actionsResult.selectedCount,
    
    createItem: actionsResult.createItem as ResourceHookResult<BaseResource>['createItem'] | undefined,
    updateItem: actionsResult.updateItem as ((item: BaseResource) => Promise<void>) | undefined,
    deleteItem: actionsResult.deleteItem as ((item: BaseResource) => Promise<void>) | undefined,
    bulkDeleteItems: actionsResult.bulkDeleteItems as ((items: BaseResource[]) => Promise<void>) | undefined,
    
    modalOpen: actionsResult.modalOpen,
    editingItem: (actionsResult.editingItem || null) as BaseResource | null,
    confirmationModal: actionsResult.confirmationModal,
    openModal: actionsResult.openModal as (item?: BaseResource) => void,
    closeModal: actionsResult.closeModal,
    closeConfirmationModal: actionsResult.closeConfirmationModal,
    actionLoading: actionsResult.actionLoading,
  };
}
