'use client';

import { useMemo } from 'react';
import { useResourceTableLogic } from './useResourceTableLogic';
import { buildApiFunctions } from '@/app/admin/lib/utils/apiBuilder';
import { ResourceConfig } from '@/app/admin/lib/config/resourceConfig.types';
import { ResourceHookResult } from '@/app/admin/lib/types/resourceHookResult.types';
import { BaseResource } from '@/app/admin/lib/types/baseResource.types';
import { DEFAULT_LANGUAGE } from '@/app/admin/global/config/config';
import { generateTableColumns, generateFilterConfig } from '@/app/admin/lib/utils/fieldUtils';

/**
 * Single Hook Pattern: Auto-generate a resource hook from configuration
 * This eliminates the need for resource-specific hooks in simple cases.
 * 
 * The hook automatically:
 * - Builds API functions from config.api (supports baseUrl or explicit endpoints)
 * - Auto-generates table columns from config.fields if table.columns is missing
 * - Auto-generates filter config from config.fields if filters is missing
 * - Builds filter manager from config.filters (auto-generated or explicit)
 * - Uses config.actions for feature flags
 * - Handles all common patterns via useResourceTableLogic
 * 
 * Usage:
 * ```ts
 * export function useMyResourceLogic() {
 *   return useResourceFromConfig(myResourceConfig);
 * }
 * ```
 * 
 * For complex cases (custom filters, API transformations), you can still
 * create resource-specific hooks that use useResourceTableLogic directly.
 */
export function useResourceFromConfig<T = unknown>(
  config: ResourceConfig<T>
): ResourceHookResult<BaseResource> {
  const locale = DEFAULT_LANGUAGE;
  
  const enhancedConfig = useMemo(() => {
    let tableConfig = config.table;
    let filterConfig = config.filters;
    
    if (config.fields && config.fields.length > 0) {
      if (!tableConfig.columns || tableConfig.columns.length === 0) {
        const generatedColumns = generateTableColumns<T>(config.fields);
        tableConfig = {
          ...tableConfig,
          columns: generatedColumns,
        };
      }
      
      if (!filterConfig) {
        filterConfig = generateFilterConfig(config.fields);
      }
    }
    
    return {
      ...config,
      table: tableConfig,
      filters: filterConfig,
    };
  }, [config]);
  
  const apiConfig = enhancedConfig.api;
  const api = useMemo(() => {
    if (!apiConfig) {
      throw new Error(`Resource config "${enhancedConfig.id}" is missing API configuration. Add api config to use useResourceFromConfig.`);
    }
    
    return buildApiFunctions(
      apiConfig as unknown as import('@/app/admin/lib/config/resourceConfig.types').ResourceApiConfig<BaseResource>, 
      () => locale,
      enhancedConfig.id
    );
  }, [apiConfig, locale, enhancedConfig.id]);
  
  const getIdFn = apiConfig?.getId;
  const getItemId = useMemo(() => {
    if (!getIdFn) {
      return undefined;
    }
    return (item: BaseResource) => getIdFn(item);
  }, [getIdFn]);
  
  const result = useResourceTableLogic<BaseResource>({
    config: enhancedConfig as unknown as ResourceConfig<BaseResource>,
    api,
    filterConfig: enhancedConfig.filters,
    enableSelection: enhancedConfig.actions?.enableSelection || false,
    getItemId,
  });
  
  return result;
}
