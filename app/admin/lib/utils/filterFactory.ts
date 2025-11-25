'use client';

import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { FilterConfig } from '../config/resourceConfig.types';
import { FilterManager } from '../../hooks/useResourceTableLogic';
import { BaseResource } from '../types/baseResource.types';
import { getNestedValue } from './fieldUtils';

type SortDirection = 'asc' | 'desc';
const SORT_FIELD_KEYS = new Set(['sortBy', 'sortOrder']);

/**
 * Get all searchable values from an object (including nested fields)
 */
function getAllSearchableValues(obj: unknown): string[] {
  const values: string[] = [];

  if (obj === null || obj === undefined) {
    return values;
  }

  if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
    values.push(String(obj).toLowerCase());
    return values;
  }

  if (Array.isArray(obj)) {
    obj.forEach(item => {
      values.push(...getAllSearchableValues(item));
    });
    return values;
  }

  if (typeof obj === 'object') {
    Object.values(obj).forEach(value => {
      values.push(...getAllSearchableValues(value));
    });
  }

  return values;
}

const SEARCH_TARGET_FIELDS = [
  'name.common',
  'name.official',
  'capital',
  'region',
  'subregion',
  'cca2',
  'cca3',
  'national',
  'foreign',
] as const;

function valueMatchesSearchTerm(value: unknown, searchTerm: string): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  if (Array.isArray(value)) {
    return value.some((item) => valueMatchesSearchTerm(item, searchTerm));
  }

  return String(value).toLowerCase().includes(searchTerm);
}

function matchesSearchTerm(item: BaseResource, searchTerm: string): boolean {
  if (!searchTerm) {
    return true;
  }

  const loweredTerm = searchTerm.toLowerCase();
  const captionNational = (item as { national?: string }).national;
  const captionForeign = (item as { foreign?: string }).foreign;

  const matchesField = (value?: string) =>
    typeof value === 'string' && value.toLowerCase().includes(loweredTerm);

  if (matchesField(captionNational) || matchesField(captionForeign)) {
    return true;
  }

  const targetedMatch = SEARCH_TARGET_FIELDS.some((field) => {
    const value = field.includes('.')
      ? getNestedValue(item, field)
      : (item as Record<string, unknown>)[field];
    return valueMatchesSearchTerm(value, loweredTerm);
  });

  if (targetedMatch) {
    return true;
  }

  const searchableValues = getAllSearchableValues(item);
  return searchableValues.some((value) => value.includes(loweredTerm));
}

function getDefaultFieldValue(field: FilterConfig['fields'][number]) {
  switch (field.type) {
    case 'multiSelect':
      return [];
    case 'boolean':
      return false;
    case 'dateRange':
      return { start: '', end: '' };
    default:
      return '';
  }
}

function arraysEqual(a: unknown[] = [], b: unknown[] = []) {
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
}

function rangesEqual(
  a: { start?: string; end?: string } = { start: '', end: '' },
  b: { start?: string; end?: string } = { start: '', end: '' }
) {
  return (a.start || '') === (b.start || '') && (a.end || '') === (b.end || '');
}

function filtersEqual(a: Record<string, unknown>, b: Record<string, unknown>) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    const aValue = a[key];
    const bValue = b[key];
    if (Array.isArray(aValue) && Array.isArray(bValue)) {
      if (!arraysEqual(aValue, bValue)) return false;
      continue;
    }
    if (
      typeof aValue === 'object' &&
      typeof bValue === 'object' &&
      aValue !== null &&
      bValue !== null &&
      'start' in aValue
    ) {
      if (!rangesEqual(aValue as { start?: string; end?: string }, bValue as { start?: string; end?: string })) {
        return false;
      }
      continue;
    }
    if (aValue !== bValue) return false;
  }
  return true;
}

function isDefaultFilterValue(
  field: FilterConfig['fields'][number],
  value: unknown,
  defaultValue: unknown,
  sortDefaults?: { sortBy?: string; sortOrder?: SortDirection }
) {
  if (field.key === 'sortBy') {
    if (!sortDefaults?.sortBy) {
      return (value ?? '') === '';
    }
    return (value as string | undefined) === sortDefaults.sortBy;
  }

  if (field.key === 'sortOrder') {
    const defaultOrder = sortDefaults?.sortOrder ?? 'asc';
    if (!value) {
      return defaultOrder === 'asc';
    }
    return (value as SortDirection) === defaultOrder;
  }

  if (field.type === 'multiSelect') {
    return arraysEqual(
      Array.isArray(value) ? (value as unknown[]) : [],
      Array.isArray(defaultValue) ? (defaultValue as unknown[]) : []
    );
  }

  if (field.type === 'dateRange') {
    return rangesEqual(
      (value as { start?: string; end?: string }) || { start: '', end: '' },
      (defaultValue as { start?: string; end?: string }) || { start: '', end: '' }
    );
  }

  if (field.type === 'boolean') {
    return value === defaultValue;
  }

  return (value ?? '') === (defaultValue ?? '');
}

function getTimestampValue(value: unknown): number | null {
  if (value instanceof Date) {
    return value.getTime();
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return null;
}

function getSafeValue(item: BaseResource, key: string): unknown {
  const rawValue = key.includes('.')
    ? getNestedValue(item, key)
    : (item as Record<string, unknown>)[key];

  if (Array.isArray(rawValue)) {
    const firstDefined = rawValue.find((value) => !isNullish(value));
    return firstDefined ?? '';
  }

  if (isNullish(rawValue)) {
    return '';
  }

  // Handle currencies object: { [key: string]: { name: string; symbol: string } }
  if (key === 'currencies' && typeof rawValue === 'object' && rawValue !== null && !Array.isArray(rawValue)) {
    const currencyKeys = Object.keys(rawValue);
    if (currencyKeys.length > 0) {
      // Return first currency code for sorting
      return currencyKeys[0];
    }
    return '';
  }

  // Handle languages object: { [key: string]: string }
  if (key === 'languages' && typeof rawValue === 'object' && rawValue !== null && !Array.isArray(rawValue)) {
    const languageValues = Object.values(rawValue);
    if (languageValues.length > 0) {
      // Return first language value for sorting
      const firstLanguage = languageValues[0];
      return typeof firstLanguage === 'string' ? firstLanguage : '';
    }
    return '';
  }

  return rawValue;
}

function isNullish(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

function isNumericLike(value: unknown): boolean {
  if (typeof value === 'number') {
    return Number.isFinite(value);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return false;
    }
    return Number.isFinite(Number(trimmed));
  }
  return false;
}

function compare(
  a: BaseResource,
  b: BaseResource,
  key: string,
  direction: SortDirection
): number {
  const aValue = getSafeValue(a, key);
  const bValue = getSafeValue(b, key);

  const aTimestamp = getTimestampValue(aValue);
  const bTimestamp = getTimestampValue(bValue);

  if (aTimestamp !== null && bTimestamp !== null) {
    const diff = aTimestamp - bTimestamp;
    return direction === 'desc' ? -diff : diff;
  }

  if (isNumericLike(aValue) && isNumericLike(bValue)) {
    const diff = Number(aValue) - Number(bValue);
    return direction === 'desc' ? -diff : diff;
  }

  const stringComparison = String(aValue).localeCompare(String(bValue), undefined, {
    sensitivity: 'base',
    numeric: true,
  });
  return direction === 'desc' ? -stringComparison : stringComparison;
}

export function useFilterManager<T extends BaseResource>(
  items: T[],
  filterConfig: FilterConfig,
  defaultSort?: { key: string; direction: SortDirection }
): FilterManager<T> {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const defaultFieldValues = useMemo(() => {
    const defaults: Record<string, unknown> = {};
    filterConfig.fields.forEach((field) => {
      defaults[field.key] = getDefaultFieldValue(field);
    });
    return defaults;
  }, [filterConfig.fields]);

  const defaultSortState = useMemo(() => {
    return {
      sortBy: defaultSort?.key,
      sortOrder: (defaultSort?.direction ?? 'asc') as SortDirection,
    };
  }, [defaultSort]);

  const deriveActiveFilters = useCallback(
    (currentFilters: Record<string, unknown>) => {
      const active: Record<string, unknown> = {};

      filterConfig.fields.forEach((field) => {
        const value = currentFilters[field.key];
        const defaultValue = defaultFieldValues[field.key];
        if (!isDefaultFilterValue(field, value, defaultValue, defaultSortState)) {
          active[field.key] = value;
        }
      });

      const currentSortBy = currentFilters.sortBy as string | undefined;
      const currentSortOrder = currentFilters.sortOrder as SortDirection | undefined;

      if (currentSortBy && currentSortBy !== defaultSortState.sortBy) {
        active.sortBy = currentSortBy;
      }
      if (
        currentSortOrder &&
        currentSortOrder !== undefined &&
        currentSortOrder !== defaultSortState.sortOrder
      ) {
        active.sortOrder = currentSortOrder;
      }

      return active;
    },
    [filterConfig.fields, defaultFieldValues, defaultSortState]
  );

  const readFiltersFromParams = useCallback(() => {
    if (filterConfig.type !== 'url-synced') {
      const simpleDefaults: Record<string, unknown> = {};
      filterConfig.fields.forEach((field) => {
        simpleDefaults[field.key] = getDefaultFieldValue(field);
      });
      return simpleDefaults;
    }

    const parsed: Record<string, unknown> = {};

    filterConfig.fields.forEach((field) => {
      if (field.type === 'dateRange') {
        const start = searchParams.get(`${field.key}_start`) || '';
        const end = searchParams.get(`${field.key}_end`) || '';
        if (start || end) {
          parsed[field.key] = { start, end };
        }
        return;
      }

      const rawValue = searchParams.get(field.key);
      if (rawValue === null) {
        return;
      }

      let parsedValue: unknown = rawValue;
      if (field.type === 'boolean') {
        parsedValue = rawValue === 'true';
      } else if (field.type === 'multiSelect') {
        parsedValue = rawValue ? rawValue.split(',') : [];
      }

      if (!isDefaultFilterValue(field, parsedValue, defaultFieldValues[field.key], defaultSortState)) {
        parsed[field.key] = parsedValue;
      }
    });

    const sortByParam = searchParams.get('sortBy');
    if (sortByParam) {
      parsed.sortBy = sortByParam;
    }

    const sortOrderParam = searchParams.get('sortOrder');
    if (sortOrderParam === 'asc' || sortOrderParam === 'desc') {
      parsed.sortOrder = sortOrderParam;
    } else if (parsed.sortBy && !parsed.sortOrder) {
      parsed.sortOrder = defaultSortState.sortOrder;
    }

    return parsed;
  }, [filterConfig, searchParams, defaultFieldValues, defaultSortState]);

  const urlFilters = useMemo(() => {
    const initial = readFiltersFromParams();
    return initial;
  }, [readFiltersFromParams]);

  const [filters, setFilters] = useState<Record<string, unknown>>(urlFilters);
  const filtersRef = useRef(filters);
  const pendingUrlSyncOptionsRef = useRef<{ preservePage?: boolean } | null>(null);
  const searchDebounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousUrlFiltersRef = useRef(urlFilters);

  // Get field keys that should be debounced (multiSelect only)
  const debouncedFieldKeys = useMemo(() => {
    return filterConfig.fields
      .filter((field) => field.type === 'multiSelect')
      .map((field) => field.key);
  }, [filterConfig.fields]);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);
  const activeFiltersSnapshot = useMemo(
    () => deriveActiveFilters(filters),
    [deriveActiveFilters, filters]
  );

  const writeFiltersToUrl = useCallback(
    (nextFilters: Record<string, unknown>, options?: { preservePage?: boolean }) => {
      if (filterConfig.type !== 'url-synced') {
        return;
      }

      const params = new URLSearchParams(searchParams.toString());
      const filterKeys = [
        ...filterConfig.fields.map((field) => field.key),
        ...filterConfig.fields
          .filter((field) => field.type === 'dateRange')
          .flatMap((field) => [`${field.key}_start`, `${field.key}_end`]),
        'sortBy',
        'sortOrder',
      ];

      filterKeys.forEach((key) => {
        params.delete(key);
      });

      filterConfig.fields.forEach((field) => {
        const value = nextFilters[field.key];
        const defaultValue = defaultFieldValues[field.key];

        if (field.type === 'dateRange') {
          const range = (value || { start: '', end: '' }) as { start?: string; end?: string };
          const defaultRange = (defaultValue || { start: '', end: '' }) as { start?: string; end?: string };
          
          // Handle start date
          if (range.start && range.start.trim() !== '' && range.start !== defaultRange.start) {
            params.set(`${field.key}_start`, range.start);
          } else {
            params.delete(`${field.key}_start`);
          }
          
          // Handle end date
          if (range.end && range.end.trim() !== '' && range.end !== defaultRange.end) {
            params.set(`${field.key}_end`, range.end);
          } else {
            params.delete(`${field.key}_end`);
          }
          return;
        }

        if (field.type === 'multiSelect') {
          const arrayValue = Array.isArray(value) ? value : [];
          if (!arraysEqual(arrayValue, defaultValue as unknown[])) {
            params.set(field.key, arrayValue.join(','));
          }
          return;
        }

        if (field.type === 'boolean') {
          if (Boolean(value) !== Boolean(defaultValue)) {
            params.set(field.key, Boolean(value).toString());
          }
          return;
        }

        const stringValue = typeof value === 'number' ? String(value) : (value as string | undefined);
        const defaultStringValue =
          typeof defaultValue === 'number' ? String(defaultValue) : (defaultValue as string | undefined);
        if (stringValue && stringValue !== defaultStringValue) {
          params.set(field.key, stringValue);
        }
      });

      const sortBy = nextFilters.sortBy as string | undefined;
      const sortOrder =
        (nextFilters.sortOrder as SortDirection) ||
        defaultSortState.sortOrder ||
        'asc';

      if (sortBy) {
        params.set('sortBy', sortBy);
        params.set('sortOrder', sortOrder);
      } else {
        params.delete('sortBy');
        params.delete('sortOrder');
      }

      if (options?.preservePage) {
        const currentPage = searchParams.get('page') || '1';
        params.set('page', currentPage);
      } else {
        params.set('page', '1');
      }

      const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;

      router.replace(newUrl, { scroll: false });
    },
    [filterConfig, defaultFieldValues, defaultSortState, pathname, router, searchParams]
  );

  useEffect(() => {
    const previous = previousUrlFiltersRef.current;
    const hasUrlChanged = !filtersEqual(previous, urlFilters);
    if (!hasUrlChanged) {
      return;
    }
    previousUrlFiltersRef.current = urlFilters;

    if (filtersEqual(filtersRef.current, urlFilters)) {
      return;
    }

    const rafId = window.requestAnimationFrame(() => {
      setFilters(urlFilters);
    });

    return () => window.cancelAnimationFrame(rafId);
  }, [urlFilters]);

  useEffect(() => {
    if (filterConfig.type !== 'url-synced') {
      return;
    }

    if (filtersEqual(filters, urlFilters)) {
      pendingUrlSyncOptionsRef.current = null;
      if (searchDebounceTimeoutRef.current) {
        clearTimeout(searchDebounceTimeoutRef.current);
        searchDebounceTimeoutRef.current = null;
      }
      return;
    }

    // Check if any debounced filters have changed
    const hasDebouncedFieldChanges = debouncedFieldKeys.some((key) => {
      const currentValue = filters[key];
      const urlValue = urlFilters[key];
      // Handle arrays for multiSelect
      if (Array.isArray(currentValue) && Array.isArray(urlValue)) {
        return !arraysEqual(currentValue, urlValue);
      }
      
      const currentStr = String(currentValue || '');
      const urlStr = String(urlValue || '');
      
      // For search fields: if current value is empty, update immediately (no debounce)
      const fieldConfig = filterConfig.fields.find((field) => field.key === key);
      if (fieldConfig?.type === 'search' && currentStr === '' && urlStr !== '') {
        return false; // Don't debounce empty search, handle it immediately
      }
      
      return currentStr !== urlStr;
    });

    // Check if any search fields became empty (should update immediately)
    const hasEmptySearchField = debouncedFieldKeys.some((key) => {
      const fieldConfig = filterConfig.fields.find((field) => field.key === key);
      if (fieldConfig?.type === 'search') {
        const currentValue = filters[key];
        const urlValue = urlFilters[key];
        const currentStr = String(currentValue || '');
        const urlStr = String(urlValue || '');
        // If search became empty but URL still has value, update immediately
        return currentStr === '' && urlStr !== '';
      }
      return false;
    });

    // Check if any non-debounced filters have changed (excluding sort fields which are checked separately)
    const hasNonDebouncedFieldChanges = Object.keys(filters).some((key) => {
      if (debouncedFieldKeys.includes(key) || SORT_FIELD_KEYS.has(key)) {
        return false;
      }
      const currentValue = filters[key];
      const urlValue = urlFilters[key];
      
      // Special handling for dateRange objects
      const fieldConfig = filterConfig.fields.find((field) => field.key === key);
      if (fieldConfig?.type === 'dateRange') {
        const currentRange = (currentValue || { start: '', end: '' }) as { start?: string; end?: string };
        const urlRange = (urlValue || { start: '', end: '' }) as { start?: string; end?: string };
        return (currentRange.start || '') !== (urlRange.start || '') || 
               (currentRange.end || '') !== (urlRange.end || '');
      }
      
      return String(currentValue || '') !== String(urlValue || '');
    });

    // Check if sort fields have changed (always update immediately)
    const hasSortChanges = (filters.sortBy !== urlFilters.sortBy) || 
                          (filters.sortOrder !== urlFilters.sortOrder);

    // If there are non-debounced changes (including sort) OR empty search, update immediately
    // Empty search should update immediately, but don't block other changes
    if (hasNonDebouncedFieldChanges || hasSortChanges || hasEmptySearchField) {
      // Clear any pending debounce since we're updating now
      if (searchDebounceTimeoutRef.current) {
        clearTimeout(searchDebounceTimeoutRef.current);
        searchDebounceTimeoutRef.current = null;
      }

      const pendingOptions = pendingUrlSyncOptionsRef.current ?? undefined;
      pendingUrlSyncOptionsRef.current = null;
      writeFiltersToUrl(filters, pendingOptions);
      return;
    }

    // If debounced filters changed (and no immediate updates needed), debounce the URL update
    if (hasDebouncedFieldChanges) {
      // Clear existing timeout
      if (searchDebounceTimeoutRef.current) {
        clearTimeout(searchDebounceTimeoutRef.current);
      }

      // Set new debounced timeout
      searchDebounceTimeoutRef.current = setTimeout(() => {
        searchDebounceTimeoutRef.current = null;
        const pendingOptions = pendingUrlSyncOptionsRef.current ?? undefined;
        pendingUrlSyncOptionsRef.current = null;
        // Use filtersRef.current to get the latest filter values
        writeFiltersToUrl(filtersRef.current, pendingOptions);
      }, 800);

      return;
    }
  }, [filterConfig.type, filters, urlFilters, writeFiltersToUrl, debouncedFieldKeys]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchDebounceTimeoutRef.current) {
        clearTimeout(searchDebounceTimeoutRef.current);
        searchDebounceTimeoutRef.current = null;
      }
    };
  }, []);

  const setFilter = useCallback(
    (key: string, value: unknown) => {
      setFilters((prev) => {
        const next = { ...prev };
        const fieldConfig = filterConfig.fields.find((field) => field.key === key);
        const defaultValue = defaultFieldValues[key];
        const shouldRemove =
          value === undefined ||
          (fieldConfig
            ? isDefaultFilterValue(fieldConfig, value, defaultValue, defaultSortState)
            : value === defaultValue);

        if (shouldRemove) {
          if (key in next) {
            delete next[key];
          }
          return next;
        }

        next[key] = value;
        return next;
      });
    },
    [filterConfig.fields, defaultFieldValues, defaultSortState]
  );

  const clearFilters = useCallback(() => {
    if (filterConfig.type !== 'url-synced') {
      setFilters({ ...defaultFieldValues });
      return;
    }

    const cleared: Record<string, unknown> = {};
    pendingUrlSyncOptionsRef.current = null;
    
    // Clear any pending debounce
    if (searchDebounceTimeoutRef.current) {
      clearTimeout(searchDebounceTimeoutRef.current);
      searchDebounceTimeoutRef.current = null;
    }
    
    setFilters(cleared);
    // Immediately update URL to clear filters
    writeFiltersToUrl(cleared);
  }, [defaultFieldValues, filterConfig.type, writeFiltersToUrl]);

  const filteredItems = useMemo(() => {
    let result = [...items];

    if (filterConfig.applyFilters) {
      result = filterConfig.applyFilters(result, filters);
    } else {
      result = result.filter((item) => {
        const shouldInclude = filterConfig.fields.every((field) => {
          if (SORT_FIELD_KEYS.has(field.key)) {
            return true;
          }

          const filterValue = filters[field.key];

          if (
            filterValue === undefined ||
            filterValue === null ||
            filterValue === '' ||
            (Array.isArray(filterValue) && filterValue.length === 0)
          ) {
            return true;
          }

          switch (field.type) {
            case 'search': {
              const searchTerm = String(filterValue).trim().toLowerCase();
              if (!searchTerm) {
                return true;
              }
              return matchesSearchTerm(item, searchTerm);
            }
            case 'select': {
              const normalizedFilterValue = String(filterValue).trim().toLowerCase();

              if (field.key === 'currency') {
                const currencies = (item as Record<string, unknown>).currencies;
                if (!currencies || typeof currencies !== 'object') {
                  return false;
                }
                const currencyCodes = Object.keys(currencies);
                return currencyCodes.some((code) => code.toLowerCase() === normalizedFilterValue);
              }

              const itemValue = field.key.includes('.')
                ? getNestedValue(item, field.key)
                : (item as Record<string, unknown>)[field.key];

              if (itemValue === undefined || itemValue === null) {
                return false;
              }

              return String(itemValue).toLowerCase() === normalizedFilterValue;
            }
            case 'multiSelect': {
              const itemValue = (item as Record<string, unknown>)[field.key];
              if (Array.isArray(filterValue)) {
                return filterValue.length === 0 || filterValue.includes(String(itemValue));
              }
              return true;
            }
            case 'boolean': {
              const itemValue = field.key.includes('.')
                ? getNestedValue(item, field.key)
                : (item as Record<string, unknown>)[field.key];

              if (field.key === 'independent') {
                return itemValue === filterValue;
              }

              return Boolean(itemValue) === Boolean(filterValue);
            }
            case 'dateRange': {
              const dateRange = filterValue as { start?: string; end?: string };
              const itemDate = (item as Record<string, unknown>)[field.key];
              if (!itemDate) return true;
              const itemDateStr = typeof itemDate === 'string' ? itemDate : String(itemDate);
              const itemTimestamp = new Date(itemDateStr).getTime();

              if (dateRange.start) {
                const startTimestamp = new Date(dateRange.start).getTime();
                if (itemTimestamp < startTimestamp) return false;
              }

              if (dateRange.end) {
                const endTimestamp = new Date(dateRange.end).getTime();
                if (itemTimestamp > endTimestamp) return false;
              }

              return true;
            }
            default:
              return true;
          }
        });

        return shouldInclude;
      });
    }

    const sortBy =
      (filters.sortBy as string | undefined) || (defaultSortState.sortBy as string | undefined);
    const sortOrder =
      (filters.sortOrder as SortDirection | undefined) ||
      defaultSortState.sortOrder ||
      'asc';

    if (sortBy) {
      if (filterConfig.applySort) {
        result = filterConfig.applySort(result, sortBy, sortOrder);
      } else {
        result.sort((a, b) => compare(a, b, sortBy, sortOrder));
      }
    }

    return result;
  }, [items, filters, filterConfig, defaultSortState]);

  const hasActiveFilters = useMemo(() => {
    return Object.keys(activeFiltersSnapshot).length > 0;
  }, [activeFiltersSnapshot]);

  const activeFiltersCount = useMemo(() => {
    return Object.keys(activeFiltersSnapshot).length;
  }, [activeFiltersSnapshot]);

  const sortBy =
    (filters.sortBy as string | undefined) || (defaultSortState.sortBy as string | undefined);
  const sortOrder =
    ((filters.sortOrder as SortDirection) ||
      defaultSortState.sortOrder ||
      'asc') as SortDirection;

  const setSort = useCallback(
    (key: string, direction?: SortDirection) => {
      setFilters((prev) => {
        const currentSortBy = prev.sortBy as string | undefined;
        const currentSortOrder =
          (prev.sortOrder as SortDirection | undefined) ||
          defaultSortState.sortOrder ||
          'asc';

        let nextSortOrder: SortDirection;
        if (direction) {
          nextSortOrder = direction;
        } else if (currentSortBy === key) {
          nextSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
        } else {
          nextSortOrder = 'asc';
        }

        const next: Record<string, unknown> = {
          ...prev,
          sortBy: key,
          sortOrder: nextSortOrder,
        };

        if (filterConfig.type === 'url-synced') {
          pendingUrlSyncOptionsRef.current = { preservePage: true };
        }
        return next;
      });
    },
    [defaultSortState.sortOrder, filterConfig.type]
  );

  return {
    filteredItems,
    filters,
    setFilter,
    clearFilters,
    hasActiveFilters,
    activeFiltersCount,
    sortBy,
    sortOrder,
    setSort,
  };
}


