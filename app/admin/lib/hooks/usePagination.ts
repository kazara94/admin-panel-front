'use client';

import { useState, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

export interface UsePaginationReturn<T> {
  currentPage: number;
  totalPages: number;
  paginatedItems: T[];
  goToPage: (page: number) => void;
  setPageSize: (size: number) => void;
  pageSize: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startIndex: number;
  endIndex: number;
}

function clampPositive(value: number, fallback: number) {
  if (Number.isNaN(value) || value < 1) {
    return fallback;
  }
  return value;
}

export function usePagination<T>(
  items: T[] = [],
  defaultPageSize: number = 10,
  defaultPage: number = 1,
  enableUrlSync: boolean = false
): UsePaginationReturn<T> {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const urlPage = useMemo(() => {
    if (!enableUrlSync) return null;
    const pageParam = searchParams.get('page');
    return clampPositive(pageParam ? parseInt(pageParam, 10) : defaultPage, defaultPage);
  }, [enableUrlSync, searchParams, defaultPage]);

  const urlPageSize = useMemo(() => {
    if (!enableUrlSync) return null;
    const sizeParam = searchParams.get('pageSize');
    return clampPositive(sizeParam ? parseInt(sizeParam, 10) : defaultPageSize, defaultPageSize);
  }, [enableUrlSync, searchParams, defaultPageSize]);

  const [internalPage, setInternalPage] = useState(defaultPage);
  const [internalPageSize, setInternalPageSize] = useState(defaultPageSize);

  const currentPage = enableUrlSync ? (urlPage ?? defaultPage) : internalPage;
  const pageSize = enableUrlSync ? (urlPageSize ?? defaultPageSize) : internalPageSize;

  const safeItems = useMemo(() => (Array.isArray(items) ? items : []), [items]);
  const totalItems = safeItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize) || 1);
  const validCurrentPage = Math.max(1, Math.min(currentPage, totalPages));

  const updatePaginationInUrl = useCallback(
    (nextPage?: number, nextPageSize?: number) => {
      if (!enableUrlSync) return;

      const params = new URLSearchParams(searchParams.toString());
      const newPageSize = clampPositive(nextPageSize ?? pageSize, defaultPageSize);
      const newPage = clampPositive(nextPage ?? currentPage, 1);

      if (newPage <= 1) {
        params.delete('page');
      } else {
        params.set('page', String(newPage));
      }

      if (newPageSize === defaultPageSize) {
        params.delete('pageSize');
      } else {
        params.set('pageSize', String(newPageSize));
      }

      const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.replace(newUrl, { scroll: false });
    },
    [enableUrlSync, searchParams, router, pathname, pageSize, currentPage, defaultPageSize]
  );

  const paginatedItems = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);
    const result = safeItems.slice(startIndex, endIndex);
    return result;
  }, [safeItems, validCurrentPage, pageSize, totalItems]);

  const goToPage = useCallback(
    (page: number) => {
      const clamped = Math.max(1, Math.min(page, totalPages));
      if (enableUrlSync) {
        updatePaginationInUrl(clamped);
        return;
      }
      setInternalPage(clamped);
    },
    [enableUrlSync, totalPages, updatePaginationInUrl]
  );

  const setPageSize = useCallback(
    (size: number) => {
      const validSize = clampPositive(size, defaultPageSize);
      if (enableUrlSync) {
        updatePaginationInUrl(1, validSize);
        return;
      }
      setInternalPageSize(validSize);
      setInternalPage(1);
    },
    [enableUrlSync, defaultPageSize, updatePaginationInUrl]
  );

  const startIndex = (validCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  return {
    currentPage: validCurrentPage,
    totalPages,
    paginatedItems,
    goToPage,
    setPageSize,
    pageSize,
    totalItems,
    hasNextPage: validCurrentPage < totalPages,
    hasPreviousPage: validCurrentPage > 1,
    startIndex,
    endIndex,
  };
}