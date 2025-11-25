'use client';

import React from 'react';
import { CardBody, NoSearchResults, NoDataAvailable } from '@/app/admin/components/ui';

type TableEmptyStateProps = {
  searchQuery?: string;
  onClearSearch?: () => void;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
};

export function TableEmptyState({
  searchQuery,
  onClearSearch,
  emptyStateTitle,
  emptyStateDescription
}: TableEmptyStateProps) {
  return (
    <CardBody className="p-8">
      {searchQuery ? (
        <NoSearchResults 
          searchQuery={searchQuery} 
          onClearSearch={onClearSearch || (() => {})} 
        />
      ) : (
        <NoDataAvailable 
          title={emptyStateTitle || "No data available"}
          description={emptyStateDescription || "There are no items to display."}
        />
      )}
    </CardBody>
  );
}

