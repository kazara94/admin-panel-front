'use client';

import React, { useMemo } from 'react';
import { resourcesConfig } from '@/app/admin/lib/config/resourcesConfig';
import { ResourceConfig } from '@/app/admin/lib/config/resourceConfig.types';
import { BaseResource } from '@/app/admin/lib/types/baseResource.types';
import { ResourceHeader } from './ResourceHeader';
import { ResourceStats } from './ResourceStats';
import { ResourceFilters } from './ResourceFilters';
import { ResourceTable } from './ResourceTable';
import ApiErrorBoundary from './ApiErrorBoundary';
import ResourceModal from './modals/ResourceModal';
import ConfirmationModal from './modals/ConfirmationModal';
import { useResourceFromConfig } from '@/app/admin/hooks/useResourceFromConfig';
import { generateFilterConfig, generateTableColumns } from '@/app/admin/lib/utils/fieldUtils';

type ResourcePageProps = {
  resourceId: keyof typeof resourcesConfig;
};

export function ResourcePage({ resourceId }: ResourcePageProps) {
  const config = resourcesConfig[resourceId];

  const enhancedConfig = useMemo(() => {
  if (!config) {
      return null;
    }
    let filterConfig = config.filters;
    
    if (!filterConfig && config.fields && config.fields.length > 0) {
      filterConfig = generateFilterConfig(config.fields);
    }
    
    let tableConfig = config.table;
    if (config.fields && config.fields.length > 0) {
      if (!tableConfig.columns || tableConfig.columns.length === 0) {
        const generatedColumns = generateTableColumns(config.fields);
        tableConfig = {
          ...tableConfig,
          columns: generatedColumns,
        };
      }
    }
    
    return {
      ...config,
      filters: filterConfig,
      table: tableConfig,
    };
  }, [config]);

  const defaultHookResult = useResourceFromConfig(
    config ? (config as unknown as ResourceConfig<BaseResource>) : null as unknown as ResourceConfig<BaseResource>
  );
  
  const hookResult = !config 
    ? null 
    : (config.hook 
        ? config.hook() 
        : defaultHookResult);

  if (!config || !enhancedConfig || !hookResult) {
    return <div>Unknown resource</div>;
  }

  const filteredItems = 
    ('filteredItems' in hookResult && Array.isArray(hookResult.filteredItems))
      ? hookResult.filteredItems as BaseResource[]
    : ('filteredCaptions' in hookResult && Array.isArray(hookResult.filteredCaptions)) 
      ? hookResult.filteredCaptions as BaseResource[]
    : ('filteredCountries' in hookResult && Array.isArray(hookResult.filteredCountries))
      ? hookResult.filteredCountries as BaseResource[]
    : hookResult.items;
  
  const selectedCount = hookResult.selectedCount ?? (hookResult.selectedIds?.length ?? 0);
  const activeFiltersCount = hookResult.activeFiltersCount ?? 0;

  const enhancedStats = config.stats?.enabled ? {
    ...config.stats,
    items: config.stats.items.map(stat => {
      const originalValue = stat.value;
      return {
        ...stat,
        value: (data: BaseResource[]) => {
          if (stat.key === 'filtered') {
            return filteredItems.length;
          } else if (stat.key === 'selected') {
            return selectedCount;
          } else if (stat.key === 'filters') {
            return activeFiltersCount;
          }
          return (originalValue as (data: unknown[]) => number)(data);
        },
      };
    }),
  } : config.stats;

  return (
    <ApiErrorBoundary>
      <div className="space-y-6 animate-fade-in">
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-white px-4 py-2 rounded-md z-50"
        >
          Skip to main content
        </a>

        {config.header && (
          <ResourceHeader config={config.header} hookResult={hookResult} />
        )}

        {enhancedStats && (
          <ResourceStats
            config={{
              enabled: enhancedStats.enabled,
              items: enhancedStats.items.map(stat => ({
                ...stat,
                value: (data: unknown[]) => {
                  if (stat.key === 'filtered') {
                    return filteredItems.length;
                  } else if (stat.key === 'selected') {
                    return selectedCount;
                  } else if (stat.key === 'filters') {
                    return activeFiltersCount;
                  }
                  return (stat.value as (data: unknown[]) => number)(data);
                },
              })),
            } as NonNullable<ResourceConfig<unknown>['stats']>} 
            items={hookResult.items as unknown[]} 
          />
        )}

        {enhancedConfig.filters && (
          (('enabled' in enhancedConfig.filters && enhancedConfig.filters.enabled !== false) || 
           ('fields' in enhancedConfig.filters && enhancedConfig.filters.fields.length > 0) ||
           ('items' in enhancedConfig.filters && (enhancedConfig.filters as { items: unknown[] }).items.length > 0)) && (
          <ResourceFilters config={enhancedConfig.filters} hookResult={hookResult} />
          )
        )}

        <ResourceTable config={config as unknown as ResourceConfig<BaseResource>} hookResult={hookResult} />

        {config.fields && config.modals && (config.modals.edit?.enabled || config.modals.add?.enabled) && (
          <ResourceModal
            isOpen={hookResult.modalOpen || false}
            onClose={hookResult.closeModal || (() => {})}
            fields={config.fields}
            initialData={hookResult.editingItem || undefined}
            mode={hookResult.editingItem ? 'edit' : 'add'}
            title={hookResult.editingItem 
              ? `Edit ${config.label}` 
              : `Add New ${config.label}`}
            onSubmit={async (data) => {
              if (hookResult.createItem && !hookResult.editingItem) {
                await hookResult.createItem(data);
              } else if (hookResult.updateItem && hookResult.editingItem) {
                await hookResult.updateItem({ ...hookResult.editingItem, ...data } as BaseResource);
              }
            }}
            size="md"
          />
        )}

        {config.modals?.delete?.enabled && hookResult.confirmationModal && (
          <ConfirmationModal
            isOpen={hookResult.confirmationModal.isOpen}
            onClose={hookResult.closeConfirmationModal || (() => {})}
            onConfirm={hookResult.confirmationModal.onConfirm}
            title={hookResult.confirmationModal.title}
            message={hookResult.confirmationModal.message}
            variant={hookResult.confirmationModal.variant}
            loading={hookResult.actionLoading}
          />
        )}
      </div>
    </ApiErrorBoundary>
  );
}

