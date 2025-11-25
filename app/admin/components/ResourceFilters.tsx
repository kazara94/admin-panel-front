'use client';

import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { Card, CardBody, Button, Input, Select, DatePicker, FilterChip } from '@/app/admin/components/ui';
import { ResourceHookResult } from '@/app/admin/lib/types/resourceHookResult.types';
import { ResourceConfig } from '@/app/admin/lib/config/resourceConfig.types';
import { BaseResource } from '@/app/admin/lib/types/baseResource.types';

type ResourceFiltersProps<T = unknown> = {
  config: NonNullable<ResourceConfig<T>['filters']>;
  hookResult: ResourceHookResult<T extends BaseResource ? T : BaseResource>;
};

export function ResourceFilters<T = unknown>({ config, hookResult }: ResourceFiltersProps<T>) {
  const filterFields = useMemo(() => {
    return 'fields' in config ? config.fields : ('items' in config ? (config as { items: Array<{ type: string; key: string; label: string; placeholder?: string; options?: Array<{ value: string; label: string }> }> }).items : []);
  }, [config]);
  
  const isEnabled = 'enabled' in config ? config.enabled : filterFields.length > 0;
  
  const filterItemsWithOptions = useMemo(() => {
    return filterFields.map(field => {
      if ('optionsGenerator' in field && field.optionsGenerator && typeof field.optionsGenerator === 'function') {
        const items = Array.isArray(hookResult.items) ? hookResult.items : [];
        try {
          const generatedOptions = field.optionsGenerator(items);
          return {
            ...field,
            options: Array.isArray(generatedOptions) ? generatedOptions : [],
          };
        } catch {
          return {
            ...field,
            options: [],
          };
        }
      }
      return field;
    });
  }, [filterFields, hookResult.items]);
  
  const filterItems = filterItemsWithOptions;
  const searchFieldKeys = useMemo(
    () => filterItems.filter((field) => field.type === 'search').map((field) => field.key),
    [filterItems]
  );

  const {
    filters,
    setFilter,
    clearFilters,
    hasActiveFilters,
    sortBy: activeSortBy,
    sortOrder: activeSortOrder,
  } = hookResult;

  const isValid = setFilter && typeof setFilter === 'function';
  const [localSearchValues, setLocalSearchValues] = useState<Record<string, string>>({});
  const searchDebounceRefs = useRef<Record<string, ReturnType<typeof setTimeout> | null>>({});

  const handleFilterChange = useCallback((key: string, value: unknown) => {
    if (!setFilter || typeof setFilter !== 'function') {
      return;
    }
    try {
      setFilter(key, value);
      if (hookResult.setPage) {
        hookResult.setPage(1);
      }
    } catch {
    }
  }, [setFilter, hookResult]);

  useEffect(() => {
    setLocalSearchValues((prev) => {
      if (searchFieldKeys.length === 0) {
        return Object.keys(prev).length ? {} : prev;
      }
      let changed = false;
      const next = { ...prev };
      searchFieldKeys.forEach((key) => {
        const filterValue = typeof filters[key] === 'string' ? (filters[key] as string) : '';
        if (!(key in next) || next[key] !== filterValue) {
          next[key] = filterValue;
          changed = true;
        }
      });
      Object.keys(next).forEach((key) => {
        if (!searchFieldKeys.includes(key)) {
          delete next[key];
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [filters, searchFieldKeys]);

  useEffect(() => {
    if (searchFieldKeys.length === 0) {
      return;
    }
    searchFieldKeys.forEach((key) => {
      const localValue =
        localSearchValues[key] ?? (typeof filters[key] === 'string' ? (filters[key] as string) : '');
      const normalizedLocal = typeof localValue === 'string' ? localValue : '';
      const filterValue = typeof filters[key] === 'string' ? (filters[key] as string) : '';
      if (normalizedLocal === filterValue) {
        if (searchDebounceRefs.current[key]) {
          clearTimeout(searchDebounceRefs.current[key]!);
          searchDebounceRefs.current[key] = null;
        }
        return;
      }
      if (searchDebounceRefs.current[key]) {
        clearTimeout(searchDebounceRefs.current[key]!);
      }
      searchDebounceRefs.current[key] = setTimeout(() => {
        const nextValue = normalizedLocal === '' ? undefined : normalizedLocal;
        handleFilterChange(key, nextValue);
        searchDebounceRefs.current[key] = null;
      }, 500);
    });
    Object.keys(searchDebounceRefs.current).forEach((key) => {
      if (!searchFieldKeys.includes(key)) {
        const timeoutId = searchDebounceRefs.current[key];
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        delete searchDebounceRefs.current[key];
      }
    });
  }, [localSearchValues, searchFieldKeys, filters, handleFilterChange]);

  useEffect(() => {
    return () => {
      Object.values(searchDebounceRefs.current).forEach((timeoutId) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      });
    };
  }, []);

  const getFilterValue = useCallback((key: string): unknown => {
    if (key === 'sortBy') {
      return (filters[key] as string | undefined) ?? activeSortBy ?? '';
    }
    if (key === 'sortOrder') {
      return (filters[key] as string | undefined) ?? activeSortOrder ?? 'asc';
    }

    const fieldConfig = filterItems.find(f => f.key === key);
    if (!fieldConfig) return undefined;
    
    const value = filters[key];
    
    if (value === undefined || value === null) {
      if (fieldConfig.type === 'boolean') {
        return false;
      } else if (fieldConfig.type === 'multiSelect') {
        return [];
      }
      return '';
    }
    
    return value;
  }, [filters, filterItems, activeSortBy, activeSortOrder]);

  if (!isEnabled || filterItems.length === 0 || !isValid) {
    return null;
  }

  const renderFilter = (filterConfig: typeof filterItemsWithOptions[0]) => {
    const { type, key, label, placeholder } = filterConfig;
    const options = 'options' in filterConfig ? filterConfig.options : undefined;
    const value = getFilterValue(key);

    switch (type) {
      case 'search':
        const searchValue = searchFieldKeys.includes(key)
          ? (localSearchValues[key] ?? ((value as string) || ''))
          : (value as string) || '';
        return (
          <div key={key} className="tablet-md:col-span-2 laptop:col-span-1">
            <Input
              label={label}
              placeholder={placeholder || `Search ${label.toLowerCase()}...`}
              value={searchValue}
              onChange={(e) => {
                if (searchFieldKeys.includes(key)) {
                  const nextValue = e.target.value;
                  setLocalSearchValues((prev) => {
                    if (prev[key] === nextValue) {
                      return prev;
                    }
                    return {
                      ...prev,
                      [key]: nextValue,
                    };
                  });
                  return;
                }
                handleFilterChange(key, e.target.value);
              }}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
              className="w-full"
            />
          </div>
        );

      case 'dateRange':
        const dateRange = (value as { start?: string; end?: string }) || { start: '', end: '' };
        return (
          <React.Fragment key={key}>
            <div>
              <DatePicker
                label={`${label} - Start`}
                value={dateRange.start || ''}
                onChange={(val) => {
                  const newRange = { ...dateRange, start: val };
                  // If start date is cleared, also clear end date if it's before the cleared start
                  if (!val && dateRange.end) {
                    newRange.end = '';
                  }
                  handleFilterChange(key, newRange);
                }}
                placeholder="Start date"
                max={dateRange.end || undefined}
                className="w-full"
              />
            </div>
            <div>
              <DatePicker
                label={`${label} - End`}
                value={dateRange.end || ''}
                onChange={(val) => handleFilterChange(key, { ...dateRange, end: val })}
                placeholder="End date"
                min={dateRange.start || undefined}
                className="w-full"
              />
            </div>
          </React.Fragment>
        );

      case 'select':
        const selectOptions = options || [];
        const selectValue = (value as string) || '';
        return (
          <div key={key}>
            <Select
              label={label}
              options={selectOptions}
              value={selectValue}
              onChange={(val) => {
                const nextValue = !val ? undefined : val;
                handleFilterChange(key, nextValue);
              }}
              placeholder={placeholder || `Select ${label.toLowerCase()}...`}
              className="w-full"
            />
          </div>
        );

      case 'multiSelect':
        const selectedValues = (Array.isArray(value) ? value : []) as string[];
        return (
          <div key={key}>
            <Select
              label={label}
              options={options || []}
              value={selectedValues[0] || ''}
              onChange={(val) => {
                const newValues = selectedValues.includes(val)
                  ? selectedValues.filter(v => v !== val)
                  : [...selectedValues, val];
                handleFilterChange(key, newValues.length ? newValues : undefined);
              }}
              placeholder={placeholder || `Select ${label.toLowerCase()}...`}
              className="w-full"
            />
          </div>
        );

      case 'boolean':
        const boolValue = value === true || value === 'true' || String(value) === 'true';
        return (
          <div key={key} className="flex items-center">
            <label htmlFor={key} className="flex items-center space-x-3 cursor-pointer w-full">
              <input
                type="checkbox"
                id={key}
                checked={boolValue}
                onChange={(e) => {
                  e.stopPropagation();
                  handleFilterChange(key, e.target.checked);
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary cursor-pointer"
              />
              <span className="text-sm font-medium text-gray-700 cursor-pointer select-none">
                {label}
              </span>
            </label>
          </div>
        );

      default:
        return null;
    }
  };

  const renderFilterChip = (filterConfig: typeof filterItemsWithOptions[0]) => {
    const { type, key, label } = filterConfig;

    if (key === 'sortBy' || key === 'sortOrder') {
      return null;
    }
    const options = 'options' in filterConfig ? filterConfig.options : undefined;
    const value = getFilterValue(key);

    if (!value || (typeof value === 'object' && Object.keys(value).length === 0)) {
      return null;
    }

    const handleRemove = () => {
      handleFilterChange(key, undefined);
      if (type === 'search') {
        setLocalSearchValues((prev) => {
          if (!(key in prev) || prev[key] === '') {
            return prev;
          }
          return { ...prev, [key]: '' };
        });
        const timeoutId = searchDebounceRefs.current[key];
        if (timeoutId) {
          clearTimeout(timeoutId);
          searchDebounceRefs.current[key] = null;
        }
      }
    };

    let chipLabel = '';
    if (type === 'search') {
      chipLabel = `Search: "${value}"`;
    } else if (type === 'dateRange') {
      const dateRange = value as { start?: string; end?: string };
      chipLabel = `Date: ${dateRange.start || 'Any'} - ${dateRange.end || 'Any'}`;
    } else if (type === 'select' || type === 'multiSelect') {
      const selected = type === 'multiSelect' ? (value as string[]) : [value as string];
      const labels = selected
        .map(v => options?.find(opt => opt.value === v)?.label || v)
        .join(', ');
      chipLabel = `${label}: ${labels}`;
    }

    if (!chipLabel) return null;

    return (
      <FilterChip
        key={key}
        label={chipLabel}
        onRemove={handleRemove}
        variant="primary"
      />
    );
  };

  return (
    <Card>
      <CardBody className="p-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 tablet-md:grid-cols-2 laptop:grid-cols-4 gap-4">
            {filterItems.map(renderFilter)}
          </div>

          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Active filters:</span>
              {filterItems.map(renderFilterChip)}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  clearFilters();
                  if (hookResult.setPage) {
                    hookResult.setPage(1);
                  }
                  if (searchFieldKeys.length) {
                    setLocalSearchValues((prev) => {
                      if (!Object.keys(prev).length) {
                        return prev;
                      }
                      let changed = false;
                      const next = { ...prev };
                      searchFieldKeys.forEach((key) => {
                        if (next[key] !== '') {
                          next[key] = '';
                          changed = true;
                        }
                      });
                      return changed ? next : prev;
                    });
                    searchFieldKeys.forEach((key) => {
                      const timeoutId = searchDebounceRefs.current[key];
                      if (timeoutId) {
                        clearTimeout(timeoutId);
                        searchDebounceRefs.current[key] = null;
                      }
                    });
                  }
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                Clear all
              </Button>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

