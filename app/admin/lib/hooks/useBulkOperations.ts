'use client';

import { useState, useCallback } from 'react';
import { CaptionType } from '@/app/admin/lib/types';

export interface UseBulkOperationsReturn {
  selectedItems: (string | number)[];
  isAllSelected: boolean;
  isSomeSelected: boolean;
  selectItem: (id: string | number) => void;
  unselectItem: (id: string | number) => void;
  toggleItem: (id: string | number) => void;
  selectAll: (items: CaptionType[]) => void;
  unselectAll: () => void;
  toggleAll: (items: CaptionType[]) => void;
  clearSelection: () => void;
  getSelectedItems: (items: CaptionType[]) => CaptionType[];
  selectedCount: number;
}

export function useBulkOperations(items: CaptionType[] = []): UseBulkOperationsReturn {
  const [selectedItems, setSelectedItems] = useState<(string | number)[]>([]);

  const selectedCount = selectedItems.length;
  const isAllSelected = items.length > 0 && selectedItems.length === items.length;
  const isSomeSelected = selectedItems.length > 0 && selectedItems.length < items.length;

  const selectItem = useCallback((id: string | number) => {
    setSelectedItems(prev => {
      if (!prev.includes(id)) {
        return [...prev, id];
      }
      return prev;
    });
  }, []);

  const unselectItem = useCallback((id: string | number) => {
    setSelectedItems(prev => prev.filter(itemId => itemId !== id));
  }, []);

  const toggleItem = useCallback((id: string | number) => {
    setSelectedItems(prev => {
      if (prev.includes(id)) {
        return prev.filter(itemId => itemId !== id);
      } else {
        return [...prev, id];
      }
    });
  }, []);

  const selectAll = useCallback((items: CaptionType[]) => {
    const allIds = items
      .map(item => item.id)
      .filter((id): id is string | number => id !== undefined && id !== null);
    setSelectedItems(allIds);
  }, []);

  const unselectAll = useCallback(() => {
    setSelectedItems([]);
  }, []);

  const toggleAll = useCallback((items: CaptionType[]) => {
    if (isAllSelected) {
      unselectAll();
    } else {
      selectAll(items);
    }
  }, [isAllSelected, selectAll, unselectAll]);

  const clearSelection = useCallback(() => {
    setSelectedItems([]);
  }, []);

  const getSelectedItems = useCallback((items: CaptionType[]): CaptionType[] => {
    return items.filter(item => item.id && selectedItems.includes(item.id));
  }, [selectedItems]);

  return {
    selectedItems,
    isAllSelected,
    isSomeSelected,
    selectItem,
    unselectItem,
    toggleItem,
    selectAll,
    unselectAll,
    toggleAll,
    clearSelection,
    getSelectedItems,
    selectedCount
  };
}
