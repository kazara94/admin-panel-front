import React from 'react';
import { ResourceHookResult } from '../types/resourceHookResult.types';
import { BaseResource } from '../types/baseResource.types';
import { TableConfig } from './resourcesConfig';

export type FieldType =
  | 'text'
  | 'number'
  | 'email'
  | 'select'
  | 'textarea'
  | 'date'
  | 'boolean'
  | 'yesNo'
  | 'editor'
  | 'upload';

export type FieldDefinition = {
  key: string;
  label: string;
  type: FieldType;
  inTable?: boolean;
  inForm?: boolean;
  filterable?: boolean;
  sortable?: boolean;
  width?: string;
  render?: (value: unknown, row: unknown) => React.ReactNode;
  required?: boolean;
  placeholder?: string;
  validation?: (value: unknown) => string | null;
  options?: Array<{ label: string; value: string | number }>;
  filterType?: 'search' | 'select' | 'dateRange' | 'boolean';
  isLabel?: boolean;
  isPlaceholder?: boolean;
  isMultiple?: boolean;
};

/**
 * API Endpoint Configuration
 * Defines how to call an API endpoint for resource operations
 */
export type ApiEndpointConfig = {
  /** Endpoint key from endpoints.ts or custom path */
  endpoint: string;
  /** API type: 'baseapitype' | 'countries' | 'custom' */
  apiType?: 'baseapitype' | 'countries' | 'custom';
  /** Custom base URL if apiType is 'custom' */
  baseUrl?: string;
  /** HTTP method */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  /** Parameters for endpoint (e.g., locale, path params like ID) */
  params?: Record<string, unknown>;
  /** Query string parameters */
  queryParams?: Record<string, string | number | boolean>;
};

/**
 * Resource API Configuration
 * Defines all API endpoints and transformations for a resource
 * 
 * Note: T can extend BaseResource or be any type (for external APIs like Countries)
 * 
 * Supports two formats:
 * 1. Simplified: { baseUrl: string, apiType?: 'baseapitype' | 'rest' } - auto-generates CRUD endpoints
 * 2. Detailed: { list, create?, update?, delete? } - explicit endpoint configuration
 */
type ResourceApiExplicitConfig = {
  list: ApiEndpointConfig;
  create?: ApiEndpointConfig;
  update?: ApiEndpointConfig;
  delete?: ApiEndpointConfig;
};

type ResourceApiGeneratedConfig = {
  baseUrl: string;
  apiType?: 'baseapitype' | 'rest';
};

export type ResourceApiConfig<T = unknown> = (
  | ResourceApiExplicitConfig
  | ResourceApiGeneratedConfig
) & {
  transformResponse?: (response: unknown) => T[];
  transformRequest?: (data: unknown) => unknown;
  getId?: (item: unknown) => string | number;
};

/**
 * Filter Configuration
 * Defines filter behavior and field configurations
 */
export type FilterConfig = {
  /** Filter type: 'simple' (no URL sync) | 'url-synced' */
  type?: 'simple' | 'url-synced';
  /** Filter fields configuration */
  fields: Array<{
    key: string;
    type: 'search' | 'dateRange' | 'select' | 'multiSelect' | 'boolean';
    label: string;
    placeholder?: string;
    /** Static options for select/multiSelect filters */
    options?: Array<{ value: string; label: string }>;
    /** Dynamic options generator function - generates options from items data */
    optionsGenerator?: <T>(items: T[]) => Array<{ value: string; label: string }>;
  }>;
  /** Custom filter logic function (optional) */
  applyFilters?: <T>(items: T[], filters: Record<string, unknown>) => T[];
  /** Custom sort logic function (optional) */
  applySort?: <T>(items: T[], sortBy: string, sortOrder: 'asc' | 'desc') => T[];
};

/**
 * Extended ResourceConfig type that includes hook reference and UI configuration.
 * This enables fully configuration-driven resource pages.
 * 
 * Note: T can extend BaseResource or be any type (for external APIs like Countries)
 * 
 * Supports two configuration approaches:
 * 1. Unified fields array (Low-Code): Define fields once, auto-generate table/form/filters
 * 2. Explicit configuration (Legacy): Define table.columns, filters.fields separately
 */
export type ResourceConfig<T = unknown> = {
  id: string;
  label: string;
  path: string;
  showInNav: boolean;
  
  /** Unified fields array - auto-generates table columns, form inputs, and filters */
  fields?: FieldDefinition[];
  
  api?: ResourceApiConfig<T>;
  
  filters?: FilterConfig;
  
  hook?: () => ResourceHookResult<BaseResource>;
  
  header?: {
    title?: string;
    description?: string;
    showAddButton?: boolean;
    addButtonLabel?: string;
  };
  
  stats?: {
    enabled: boolean;
    items: Array<{
      key: string;
      label: string;
      value: (data: T[]) => number;
      icon?: React.ReactNode;
      color?: string;
    }>;
  };
  
  table: TableConfig<T>;
  
  actions?: {
    enableSelection?: boolean;
    enableEdit?: boolean;
    enableDelete?: boolean;
    enableBulkDelete?: boolean;
  };
  
  modals?: {
    edit?: { enabled: boolean };
    delete?: { enabled: boolean; confirmationMessage?: (item: T) => string };
    add?: { enabled: boolean };
  };
};

