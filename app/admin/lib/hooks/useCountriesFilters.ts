'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { resourcesConfig } from '@/app/admin/lib/config/resourcesConfig';

export interface CountriesFilters {
  independent: boolean;
  currency: string;
  region: string;
  search: string;
  page: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface UseCountriesFiltersReturn {
  filters: CountriesFilters;
  updateFilter: <K extends keyof CountriesFilters>(key: K, value: CountriesFilters[K]) => void;
  updateFilters: (newFilters: Partial<CountriesFilters>) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
  isLoading: boolean;
}

const DEFAULT_FILTERS: CountriesFilters = {
  independent: false,
  currency: '',
  region: '',
  search: '',
  page: 1
};

export const useCountriesFilters = (): UseCountriesFiltersReturn => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [filters, setFilters] = useState<CountriesFilters>(DEFAULT_FILTERS);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingUrlUpdate, setPendingUrlUpdate] = useState<CountriesFilters | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const isInitializedRef = useRef(false);
  const lastUrlFiltersRef = useRef<string>('');
  const isSyncingFromUrlRef = useRef(false);
  
  const defaultSort = resourcesConfig.countries.table.defaultSort;

  const parseFiltersFromURL = useCallback((searchParams: URLSearchParams): CountriesFilters => {
    const sortOrderParam = searchParams.get('sortOrder');
    return {
      independent: searchParams.get('independent') === 'true',
      currency: searchParams.get('currency') || '',
      region: searchParams.get('region') || '',
      search: searchParams.get('search') || '',
      page: Math.max(1, parseInt(searchParams.get('page') || '1', 10)),
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: (sortOrderParam === 'asc' || sortOrderParam === 'desc') ? sortOrderParam : undefined
    };
  }, []);

  const buildURL = useCallback((newFilters: CountriesFilters): string => {
    const params = new URLSearchParams();
    
    if (newFilters.independent) {
      params.set('independent', 'true');
    }
    
    if (newFilters.currency) {
      params.set('currency', newFilters.currency);
    }
    
    if (newFilters.region) {
      params.set('region', newFilters.region);
    }
    
    if (newFilters.search) {
      params.set('search', newFilters.search);
    }
    
    params.set('page', newFilters.page.toString());
    
    const sortBy = newFilters.sortBy || defaultSort?.key || '';
    const sortOrder = newFilters.sortOrder || defaultSort?.direction || 'asc';
    
    if (sortBy) {
      params.set('sortBy', sortBy);
    }
    
    if (sortOrder) {
      params.set('sortOrder', sortOrder);
    }
    
    const queryString = params.toString();
    return queryString ? `${pathname}?${queryString}` : pathname;
  }, [pathname, defaultSort]);

  const scheduleUrlUpdate = useCallback((newFilters: CountriesFilters, immediate = false) => {
    if (!isInitializedRef.current) return;
    
    if (immediate || newFilters.page !== filters.page || newFilters.sortBy !== filters.sortBy || newFilters.sortOrder !== filters.sortOrder) {
      setPendingUrlUpdate(newFilters);
    } else {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      searchTimeoutRef.current = setTimeout(() => {
        setPendingUrlUpdate(newFilters);
      }, 800);
    }
  }, [filters.page, filters.sortBy, filters.sortOrder]);

  const updateFilter = useCallback(<K extends keyof CountriesFilters>(
    key: K, 
    value: CountriesFilters[K]
  ) => {
    setFilters(prevFilters => {
      const newFilters = { ...prevFilters, [key]: value };
      
      if (key !== 'page') {
        newFilters.page = 1;
      }
      
      const shouldUpdateImmediately = key !== 'search';
      scheduleUrlUpdate(newFilters, shouldUpdateImmediately);
      
      return newFilters;
    });
  }, [scheduleUrlUpdate]);

  const updateFilters = useCallback((newFilters: Partial<CountriesFilters>) => {
    setFilters(prevFilters => {
      const updatedFilters = { ...prevFilters, ...newFilters };
      
      if (Object.keys(newFilters).some(key => key !== 'page')) {
        updatedFilters.page = 1;
      }
      
      scheduleUrlUpdate(updatedFilters, true);
      return updatedFilters;
    });
  }, [scheduleUrlUpdate]);

  const clearFilters = useCallback(() => {
    const clearedFilters = { ...DEFAULT_FILTERS };
    setFilters(clearedFilters);
    scheduleUrlUpdate(clearedFilters, true);
  }, [scheduleUrlUpdate]);

  const hasActiveFilters = filters.independent || 
                          filters.currency !== '' || 
                          filters.region !== '' || 
                          filters.search !== '';

  useEffect(() => {
    if (!isInitializedRef.current) {
      const urlFilters = parseFiltersFromURL(searchParams);
      
      const finalFilters: CountriesFilters = {
        ...urlFilters,
        sortBy: urlFilters.sortBy || defaultSort?.key || undefined,
        sortOrder: urlFilters.sortOrder || defaultSort?.direction || 'asc'
      };
      
      lastUrlFiltersRef.current = JSON.stringify(finalFilters);
      isInitializedRef.current = true;
      
      setTimeout(() => {
        setFilters(finalFilters);
        setIsLoading(false);
      }, 0);
      
      const pageParam = searchParams.get('page');
      const sortByParam = searchParams.get('sortBy');
      const sortOrderParam = searchParams.get('sortOrder');
      
      const needsUpdate = !pageParam || !sortByParam || !sortOrderParam;
      
      if (needsUpdate) {
        const filtersWithDefaults = {
          ...finalFilters,
          page: finalFilters.page || 1,
          sortBy: finalFilters.sortBy || defaultSort?.key || undefined,
          sortOrder: finalFilters.sortOrder || defaultSort?.direction || 'asc'
        };
        
        setTimeout(() => {
          setPendingUrlUpdate(filtersWithDefaults);
        }, 0);
      }
    }
  }, [searchParams, parseFiltersFromURL, defaultSort]);

  useEffect(() => {
    if (!isInitializedRef.current) return;
    
    const urlFilters = parseFiltersFromURL(searchParams);
    const urlFiltersString = JSON.stringify(urlFilters);
    
    if (urlFiltersString !== lastUrlFiltersRef.current) {
      isSyncingFromUrlRef.current = true;
      lastUrlFiltersRef.current = urlFiltersString;
      
      setTimeout(() => {
        setFilters(urlFilters);
        isSyncingFromUrlRef.current = false;
      }, 0);
    }
  }, [searchParams, parseFiltersFromURL]);

  useEffect(() => {
    if (!isInitializedRef.current || !pendingUrlUpdate) return;
    
    if (isSyncingFromUrlRef.current) {
      setTimeout(() => {
      setPendingUrlUpdate(null);
      }, 0);
      return;
    }

    const newURL = buildURL(pendingUrlUpdate);
    const currentFiltersString = JSON.stringify(pendingUrlUpdate);
    
    if (currentFiltersString !== lastUrlFiltersRef.current) {
      lastUrlFiltersRef.current = currentFiltersString;
      router.push(newURL, { scroll: false });
    }
    
    setTimeout(() => {
    setPendingUrlUpdate(null);
    }, 0);
  }, [pendingUrlUpdate, buildURL, router]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return {
    filters,
    updateFilter,
    updateFilters,
    clearFilters,
    hasActiveFilters,
    isLoading
  };
};
