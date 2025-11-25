'use client';

import { useState, useCallback } from 'react';
import { useSnackbar } from '@/app/admin/components/ui/Snackbar';
import { ResourceApiFunctions, FilterManager } from '../useResourceTableLogic';

/**
 * Options for useResourceActions hook
 */
export interface UseResourceActionsOptions<T> {
  /** API functions for CRUD operations */
  api: ResourceApiFunctions<T>;
  /** Get item ID from item */
  getItemId: (item: T) => string | number;
  /** Current items array */
  items: T[];
  /** Function to update items */
  setItems: (newItems: T[] | ((prev: T[]) => T[])) => void;
  /** Filter manager for sort operations */
  filterManager: FilterManager<T>;
  /** Enable selection feature */
  enableSelection?: boolean;
}

/**
 * Confirmation modal state
 */
export interface ConfirmationModalState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

/**
 * Result returned by useResourceActions hook
 */
export interface UseResourceActionsResult<T> {
  createItem?: (data: Omit<T, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateItem?: (item: T) => Promise<void>;
  deleteItem?: (item: T) => Promise<void>;
  bulkDeleteItems?: (items: T[]) => Promise<void>;
  modalOpen: boolean;
  editingItem: T | undefined;
  confirmationModal: ConfirmationModalState;
  openModal: (item?: T) => void;
  closeModal: () => void;
  closeConfirmationModal: () => void;
  actionLoading: boolean;
  selectedIds?: (string | number)[];
  toggleSelect?: (id: string | number) => void;
  clearSelection?: () => void;
  selectedCount?: number;
  setSort: (key: string) => void;
}

/**
 * Hook for managing resource CRUD operations, modals, selection, and sorting
 */
export function useResourceActions<T = unknown>({
  api,
  getItemId,
  setItems,
  filterManager,
  enableSelection = false,
}: UseResourceActionsOptions<T>): UseResourceActionsResult<T> {
  const { addSnackbar } = useSnackbar();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<T | undefined>();
  const [confirmationModal, setConfirmationModal] = useState<ConfirmationModalState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);

  const toggleSelect = useCallback((id: string | number) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((itemId) => itemId !== id);
      } else {
        return [...prev, id];
      }
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const createItem = useCallback(async (data: Omit<T, 'id' | 'created_at' | 'updated_at'>) => {
    if (!api.create) {
      throw new Error('Create operation not supported');
    }

    try {
      setActionLoading(true);
      const newItem = await api.create(data);
      let refreshedItems: T[] | null = null;

      try {
        refreshedItems = await api.fetchList();
      } catch {
        refreshedItems = null;
      }

      if (refreshedItems && Array.isArray(refreshedItems)) {
        setItems(refreshedItems);
      } else {
        setItems((prev) => [newItem, ...prev]);
      }

      setModalOpen(false);
      setEditingItem(undefined);
      
      addSnackbar({
        type: 'success',
        message: 'Item created successfully',
      });
    } catch (error) {
      addSnackbar({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to create item',
      });
      throw error;
    } finally {
      setActionLoading(false);
    }
  }, [api, addSnackbar, setItems]);

  const updateItem = useCallback(async (item: T) => {
    if (!api.update) {
      throw new Error('Update operation not supported');
    }

    const itemId = getItemId(item);
    if (!itemId) {
      throw new Error('Item ID is missing');
    }

    if (modalOpen && editingItem) {
      try {
        setActionLoading(true);
        const updatedItem = await api.update(itemId, item);

        let refreshedItems: T[] | null = null;
        try {
          refreshedItems = await api.fetchList();
        } catch {
          refreshedItems = null;
        }

        if (refreshedItems && Array.isArray(refreshedItems)) {
          setItems(refreshedItems);
        } else {
          setItems((prev) =>
            prev.map((i) => {
              const currentId = getItemId(i);
              return currentId === itemId ? updatedItem : i;
            })
          );
        }

        setModalOpen(false);
        setEditingItem(undefined);
        
        addSnackbar({
          type: 'success',
          message: 'Item updated successfully',
        });
      } catch (error) {
        addSnackbar({
          type: 'error',
          message: error instanceof Error ? error.message : 'Failed to update item',
        });
        throw error;
      } finally {
        setActionLoading(false);
      }
    } else {
      setEditingItem(item);
      setModalOpen(true);
    }
  }, [api, getItemId, modalOpen, editingItem, setItems, addSnackbar]);

  const deleteItem = useCallback(async (item: T) => {
    if (!api.delete) {
      throw new Error('Delete operation not supported');
    }

    const itemId = getItemId(item);
    if (!itemId) {
      throw new Error('Item ID is missing');
    }

    const deleteFn = api.delete;

    setConfirmationModal({
      isOpen: true,
      title: 'Delete Item',
      message: `Are you sure you want to delete this item? This action cannot be undone.`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          setActionLoading(true);
          await deleteFn(itemId);
          setItems((prev) => prev.filter((i) => getItemId(i) !== itemId));
          clearSelection();
          
          addSnackbar({
            type: 'success',
            message: 'Item deleted successfully',
          });
        } catch (error) {
          addSnackbar({
            type: 'error',
            message: error instanceof Error ? error.message : 'Failed to delete item',
          });
        } finally {
          setActionLoading(false);
        }
      },
    });
  }, [api, getItemId, clearSelection, addSnackbar, setItems]);

  const bulkDeleteItems = useCallback(async (itemsToDelete: T[]) => {
    if (!api.delete) {
      throw new Error('Bulk delete operation not supported');
    }

    const deleteFn = api.delete;

    setConfirmationModal({
      isOpen: true,
      title: 'Delete Multiple Items',
      message: `Are you sure you want to delete ${itemsToDelete.length} item(s)? This action cannot be undone.`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          setActionLoading(true);
          
          const deleteResults: { success: boolean; id: string | number; error?: string }[] = [];
          
          for (const item of itemsToDelete) {
            const itemId = getItemId(item);
            if (itemId) {
              try {
                await deleteFn(itemId);
                deleteResults.push({ success: true, id: itemId });
              } catch (error) {
                deleteResults.push({
                  success: false,
                  id: itemId,
                  error: error instanceof Error ? error.message : 'Failed to delete',
                });
              }
            }
          }
          
          const successfulDeletes = deleteResults.filter((r) => r.success);
          const failedDeletes = deleteResults.filter((r) => !r.success);
          
          if (successfulDeletes.length > 0) {
            const idsToDelete = successfulDeletes.map((r) => r.id);
            setItems((prev) => prev.filter((i) => {
              const id = getItemId(i);
              return !id || !idsToDelete.includes(id);
            }));
            clearSelection();
          }
          
          if (failedDeletes.length === 0) {
            addSnackbar({
              type: 'success',
              message: `Successfully deleted ${successfulDeletes.length} item(s)`,
            });
          } else if (successfulDeletes.length === 0) {
            addSnackbar({
              type: 'error',
              message: `Failed to delete items: ${failedDeletes[0]?.error || 'Unknown error'}`,
            });
          } else {
            addSnackbar({
              type: 'error',
              message: `Deleted ${successfulDeletes.length} item(s), but ${failedDeletes.length} failed: ${failedDeletes[0]?.error || 'Unknown error'}`,
            });
          }
        } catch (error) {
          addSnackbar({
            type: 'error',
            message: error instanceof Error ? error.message : 'Failed to delete items',
          });
        } finally {
          setActionLoading(false);
        }
      },
    });
  }, [api, getItemId, clearSelection, addSnackbar, setItems]);

  const openModal = useCallback((item?: T) => {
    setModalOpen(true);
    setEditingItem(item);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditingItem(undefined);
  }, []);

  const closeConfirmationModal = useCallback(() => {
    setConfirmationModal((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const setSort = useCallback((key: string) => {
    if (filterManager.setSort) {
      filterManager.setSort(key);
    } else {
      const currentSortBy = filterManager.sortBy;
      const currentSortOrder = filterManager.sortOrder || 'asc';
      
      if (currentSortBy === key) {
        filterManager.setFilter('sortOrder', currentSortOrder === 'asc' ? 'desc' : 'asc');
      } else {
        filterManager.setFilter('sortBy', key);
        filterManager.setFilter('sortOrder', 'asc');
      }
    }
  }, [filterManager]);

  return {
    createItem: api.create ? createItem : undefined,
    updateItem: api.update ? updateItem : undefined,
    deleteItem: api.delete ? deleteItem : undefined,
    bulkDeleteItems: api.delete && enableSelection ? bulkDeleteItems : undefined,
    modalOpen,
    editingItem,
    confirmationModal,
    openModal,
    closeModal,
    closeConfirmationModal,
    actionLoading,
    selectedIds: enableSelection ? selectedIds : undefined,
    toggleSelect: enableSelection ? toggleSelect : undefined,
    clearSelection: enableSelection ? clearSelection : undefined,
    selectedCount: enableSelection ? selectedIds.length : undefined,
    setSort,
  };
}

