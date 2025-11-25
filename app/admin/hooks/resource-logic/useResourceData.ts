'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSnackbar } from '@/app/admin/components/ui/Snackbar';
import { ResourceApiFunctions } from '../useResourceTableLogic';

/**
 * Options for useResourceData hook
 */
export interface UseResourceDataOptions<T> {
  /** API functions for data operations */
  api: ResourceApiFunctions<T>;
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
 * Result returned by useResourceData hook
 */
export interface UseResourceDataResult<T> {
  /** Current items array (external or internal) */
  items: T[];
  /** Loading state (external or internal) */
  loading: boolean;
  /** Function to update items */
  setItems: (newItems: T[] | ((prev: T[]) => T[])) => void;
}

/**
 * Hook for managing resource data fetching and state
 * Handles both internal state management and external state synchronization
 */
export function useResourceData<T = unknown>({
  api,
  transformResponse,
  getItemId = (item) => {
    if (item && typeof item === 'object' && 'id' in item) {
      return (item as { id?: string | number }).id || '';
    }
    return '';
  },
  externalItems,
  onItemsChange,
  externalLoading,
}: UseResourceDataOptions<T>): UseResourceDataResult<T> {
  const { addSnackbar } = useSnackbar();

  const [internalItems, setInternalItems] = useState<T[]>([]);
  const [internalLoading, setInternalLoading] = useState(true);

  const items = externalItems !== undefined ? externalItems : internalItems;
  const loading = externalLoading !== undefined ? externalLoading : internalLoading;

  const setItems = useCallback((newItems: T[] | ((prev: T[]) => T[])) => {
    if (externalItems !== undefined && onItemsChange) {
      const updated = typeof newItems === 'function' ? newItems(externalItems) : newItems;
      onItemsChange(updated);
    } else {
      setInternalItems(newItems);
    }
  }, [externalItems, onItemsChange]);

  const fetchData = useCallback(async () => {
    if (externalItems !== undefined) {
      return;
    }

    try {
      setInternalLoading(true);
      const response = await api.fetchList();

      let dataArray: T[] = [];

      if (transformResponse) {
        dataArray = transformResponse(response);
      } else if (Array.isArray(response)) {
        dataArray = response;
      } else if (response && typeof response === 'object' && 'data' in response) {
        const responseData = (response as { data: unknown }).data;
        dataArray = Array.isArray(responseData) ? responseData : [];
      }

      const transformedItems = dataArray.map((item: T) => {
        const idValue = getItemId(item);
        return {
          ...item,
          id: idValue,
        };
      });

      setItems(transformedItems);
    } catch (error) {
      setItems([]);

      if (error instanceof Error && error.message !== 'AUTH_ERROR') {
        addSnackbar({
          type: 'error',
          message: error.message || 'Failed to fetch data',
          duration: 5000,
        });
      }
    } finally {
      setInternalLoading(false);
    }
  }, [api, transformResponse, getItemId, addSnackbar, externalItems, setItems]);

  useEffect(() => {
    if (externalItems === undefined) {
      fetchData();
    }
  }, [externalItems, fetchData]);

  return {
    items,
    loading,
    setItems,
  };
}

