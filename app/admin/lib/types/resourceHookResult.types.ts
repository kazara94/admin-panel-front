import { BaseResource, ResourceCreateData } from './baseResource.types';

/**
 * Standard interface that all resource hooks must return.
 * This ensures consistency across all resources and enables generic components.
 */
export type ResourceHookResult<T extends BaseResource = BaseResource> = {
  items: T[];
  isLoading: boolean;
  error?: Error;

  filters: Record<string, unknown>;
  setFilter: (key: string, value: unknown) => void;
  clearFilters: () => void;
  hasActiveFilters?: boolean;
  activeFiltersCount?: number;

  page: number;
  pageSize: number;
  totalItems: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;

  sortBy?: string;
  sortOrder: 'asc' | 'desc';
  setSort: (key: string) => void;

  selectedIds?: (string | number)[];
  toggleSelect?: (id: string | number) => void;
  clearSelection?: () => void;
  selectedCount?: number;

  createItem?: (data: ResourceCreateData<T>) => Promise<void>;
  updateItem?: (item: T) => Promise<void>;
  deleteItem?: (item: T) => Promise<void>;
  bulkDeleteItems?: (items: T[]) => Promise<void>;

  modalOpen?: boolean;
  editingItem?: T | null;
  confirmationModal?: {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'danger' | 'warning' | 'info';
  };
  openModal?: (item?: T) => void;
  closeModal?: () => void;
  closeConfirmationModal?: () => void;
  actionLoading?: boolean;

  [key: string]: unknown;
};

