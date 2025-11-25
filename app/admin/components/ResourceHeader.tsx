'use client';

import React from 'react';
import { Button } from '@/app/admin/components/ui';
import { ResourceHookResult } from '@/app/admin/lib/types/resourceHookResult.types';
import { ResourceConfig } from '@/app/admin/lib/config/resourceConfig.types';
import { BaseResource } from '@/app/admin/lib/types/baseResource.types';

type ResourceHeaderProps<T = unknown> = {
  config: NonNullable<ResourceConfig<T>['header']>;
  hookResult: ResourceHookResult<T extends BaseResource ? T : BaseResource>;
};

export function ResourceHeader<T = unknown>({ config, hookResult }: ResourceHeaderProps<T>) {
  const { title, description, showAddButton, addButtonLabel } = config;

  const hasHandleAdd = (result: unknown): result is { handleAdd: () => void } => {
    return (
      typeof result === 'object' &&
      result !== null &&
      'handleAdd' in result &&
      typeof (result as { handleAdd?: unknown }).handleAdd === 'function'
    );
  };

  const hasSetModalOpen = (result: unknown): result is { setModalOpen: (open: boolean) => void } => {
    return (
      typeof result === 'object' &&
      result !== null &&
      'setModalOpen' in result &&
      typeof (result as { setModalOpen?: unknown }).setModalOpen === 'function'
    );
  };
  
  const handleAddClick = () => {
    if (hasHandleAdd(hookResult)) {
      hookResult.handleAdd();
    } else if (hookResult.openModal) {
      hookResult.openModal();
    } else if (hookResult.createItem && hasSetModalOpen(hookResult)) {
      hookResult.setModalOpen(true);
    }
  };

  return (
    <div className="flex flex-col laptop:flex-row laptop:items-center laptop:justify-between gap-4">
      <div className="space-y-1">
        <div className="flex items-center space-x-2">
          <h1 className="text-3xl font-bold text-gray-900">
            {title || 'Resource'}
          </h1>
        </div>
        {description && (
          <p className="text-gray-600">
            {description}
          </p>
        )}
      </div>
      {showAddButton && (
        <Button
          onClick={handleAddClick}
          variant="primary"
          size="lg"
          className="tablet-sm:w-auto w-full"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          }
        >
          <span className="hidden tablet-sm:inline">{addButtonLabel || 'Add New'}</span>
          <span className="tablet-sm:hidden">{addButtonLabel || 'Add'}</span>
        </Button>
      )}
    </div>
  );
}

