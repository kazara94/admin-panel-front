'use client';

/**
 * Captions Filters Hook
 * 
 * NOTE: URL synchronization is intentionally not implemented for captions filters.
 * Unlike countries (which are browsed and filtered by end users who may want to share URLs),
 * captions are administrative data that is:
 * - Typically managed in a single session
 * - Not shared via URL links
 * - Has simpler filter requirements (search, date range, sort)
 * 
 * If URL sync is needed in the future, follow the pattern in useCountriesFilters.ts
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { CaptionType } from '@/app/admin/lib/types';

export interface CaptionsFilters {
  search: string;
  dateRange: {
    start: string;
    end: string;
  };
  sortBy: keyof CaptionType | null;
  sortOrder: 'asc' | 'desc';
}

export interface UseCaptionsFiltersReturn {
  filters: CaptionsFilters;
  filteredCaptions: CaptionType[];
  updateFilter: <K extends keyof CaptionsFilters>(key: K, value: CaptionsFilters[K]) => void;
  updateFilters: (newFilters: Partial<CaptionsFilters>) => void;
  clearFilters: () => void;
  clearAll: () => void;
  clearSearch: () => void;
  clearDateRange: () => void;
  clearSort: () => void;
  setSearch: (search: string) => void;
  setSortBy: (sortBy: keyof CaptionType | null) => void;
  setSortOrder: (sortOrder: 'asc' | 'desc') => void;
  setDateRange: (start: string, end: string) => void;
  activeFiltersCount: number;
  hasActiveFilters: boolean;
  dateRangeError: string | null;
}

const initialFilters: CaptionsFilters = {
  search: '',
  dateRange: {
    start: '',
    end: ''
  },
  sortBy: 'created_at',
  sortOrder: 'desc'
};

export function useCaptionsFilters(
  captions: CaptionType[],
  defaultSort?: { key: string; direction: 'asc' | 'desc' }
): UseCaptionsFiltersReturn {
  const getInitialFilters = (): CaptionsFilters => {
    if (defaultSort) {
      return {
        ...initialFilters,
        sortBy: defaultSort.key as keyof CaptionType,
        sortOrder: defaultSort.direction
      };
    }
    return initialFilters;
  };

  const [filters, setFilters] = useState<CaptionsFilters>(getInitialFilters());
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);
  const [dateRangeError, setDateRangeError] = useState<string | null>(null);

  const filteredCaptions = useMemo(() => {
    let result = [...captions];

    if (debouncedSearch.trim()) {
      const searchLower = debouncedSearch.toLowerCase().trim();
      result = result.filter(caption => 
        caption.national?.toLowerCase().includes(searchLower) ||
        caption.foreign?.toLowerCase().includes(searchLower) ||
        caption.id?.toString().includes(searchLower)
      );
    }

    if (filters.dateRange.start || filters.dateRange.end) {
      result = result.filter(caption => {
        if (!caption.created_at) return false;
        
        const captionDate = new Date(caption.created_at);
        const startDate = filters.dateRange.start ? new Date(filters.dateRange.start) : null;
        const endDate = filters.dateRange.end ? new Date(filters.dateRange.end) : null;

        if (startDate && captionDate < startDate) return false;
        if (endDate && captionDate > endDate) return false;
        
        return true;
      });
    }

    if (filters.sortBy) {
      result.sort((a, b) => {
        const aValue = a[filters.sortBy!];
        const bValue = b[filters.sortBy!];

        if (aValue === undefined || aValue === null) return 1;
        if (bValue === undefined || bValue === null) return -1;

        let comparison = 0;
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          comparison = aValue.localeCompare(bValue);
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue;
        } else if (aValue && bValue && typeof aValue === 'object' && typeof bValue === 'object' && 
                   'getTime' in aValue && 'getTime' in bValue && 
                   typeof (aValue as { getTime?: () => number }).getTime === 'function' &&
                   typeof (bValue as { getTime?: () => number }).getTime === 'function') {
          comparison = (aValue as Date).getTime() - (bValue as Date).getTime();
        } else {
          const aStr = String(aValue);
          const bStr = String(bValue);
          comparison = aStr.localeCompare(bStr);
        }

        return filters.sortOrder === 'desc' ? -comparison : comparison;
      });
    }

    return result;
  }, [captions, debouncedSearch, filters.dateRange, filters.sortBy, filters.sortOrder]);

  const updateFilter = useCallback(<K extends keyof CaptionsFilters>(
    key: K, 
    value: CaptionsFilters[K]
  ) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const updateFilters = useCallback((newFilters: Partial<CaptionsFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  const clearAll = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  const clearSearch = useCallback(() => {
    updateFilter('search', '');
  }, [updateFilter]);

  const clearDateRange = useCallback(() => {
    setDateRangeError(null);
    updateFilter('dateRange', { start: '', end: '' });
  }, [updateFilter]);

  const clearSort = useCallback(() => {
    const defaultSortKey = defaultSort?.key as keyof CaptionType || 'created_at';
    const defaultSortOrder = defaultSort?.direction || 'desc';
    updateFilters({
      sortBy: defaultSortKey,
      sortOrder: defaultSortOrder
    });
  }, [updateFilters, defaultSort]);

  const setSearch = useCallback((search: string) => {
    updateFilter('search', search);
  }, [updateFilter]);

  const setSortBy = useCallback((sortBy: keyof CaptionType | null) => {
    updateFilter('sortBy', sortBy);
  }, [updateFilter]);

  const setSortOrder = useCallback((sortOrder: 'asc' | 'desc') => {
    updateFilter('sortOrder', sortOrder);
  }, [updateFilter]);

  const setDateRange = useCallback((start: string, end: string) => {
    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);
      
      if (startDate > endDate) {
        setDateRangeError('Start date must be before or equal to end date');
        return;
      }
    }
    
    setDateRangeError(null);
    updateFilter('dateRange', { start, end });
  }, [updateFilter]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    
    if (filters.search.trim()) count++;
    if (filters.dateRange.start || filters.dateRange.end) count++;
    if (filters.sortBy && filters.sortBy !== 'created_at') count++;
    if (filters.sortBy === 'created_at' && filters.sortOrder === 'asc') count++;
    
    return count;
  }, [filters.search, filters.dateRange, filters.sortBy, filters.sortOrder]);

  const hasActiveFilters = activeFiltersCount > 0;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 800);

    return () => clearTimeout(timer);
  }, [filters.search]);

  return {
    filters,
    filteredCaptions,
    updateFilter,
    updateFilters,
    clearFilters,
    clearAll,
    clearSearch,
    clearDateRange,
    clearSort,
    setSearch,
    setSortBy,
    setSortOrder,
    setDateRange,
    activeFiltersCount,
    hasActiveFilters,
    dateRangeError
  };
}
