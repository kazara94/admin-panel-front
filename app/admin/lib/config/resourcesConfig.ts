import React from 'react';
import { captionColumnRenderers, countryColumnRenderers } from './columnRenderers';
import { CaptionType, CountryType } from '@/app/admin/lib/types';
import { ResourceConfig as ExtendedResourceConfig, FieldDefinition } from './resourceConfig.types';
import { COUNTRIES_CONFIG } from '@/app/admin/global/config/config';
import { extractUniqueRegions, extractUniqueCurrencies } from '@/app/admin/lib/utils/fieldUtils';

export type TableSortDirection = 'asc' | 'desc';

export type TableSortConfig = {
  key: string;
  direction: TableSortDirection;
};

export type Column<T = unknown> = {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  width?: string;
};

export type TableConfig<T = unknown> = {
  defaultPageSize: number;
  columns: readonly Column<T>[];
  defaultSort?: TableSortConfig;
};

export type TableResourceConfig<TData = unknown> = {
  id: string;
  label: string;
  path: string;
  showInNav: boolean;
  table: TableConfig<TData>;
};

type ResourceDataMap = {
  captions: CaptionType;
  countries: CountryType;
};

const CAPTION_SORT_OPTIONS = [
  { value: 'national', label: 'National' },
  { value: 'foreign', label: 'Foreign' },
  { value: 'created_at', label: 'Created Date' },
] as const;

const captionsConfig: ExtendedResourceConfig<CaptionType> = {
  id: 'captions',
  label: 'Captions',
  path: '/admin/[resource]',
  showInNav: true,
  fields: [
    {
      key: '_id',
      label: 'ID',
      type: 'text',
      inTable: true,
      inForm: false,
      sortable: true,
      width: 'w-20',
      render: (value: unknown, row: unknown) => {
        const caption = row as CaptionType;
        return captionColumnRenderers.id(caption);
      },
    },
    {
      key: 'national',
      label: 'National',
      type: 'text',
      inTable: true,
      inForm: true,
      required: true,
      sortable: true,
      width: 'w-1/3',
      filterable: true,
      filterType: 'search',
      placeholder: 'Enter national word...',
      render: (value: unknown, row: unknown) => {
        const caption = row as CaptionType;
        return captionColumnRenderers.national(caption);
      },
    },
    {
      key: 'foreign',
      label: 'Foreign',
      type: 'text',
      inTable: true,
      inForm: true,
      required: true,
      sortable: true,
      width: 'w-1/3',
      filterable: true,
      filterType: 'search',
      placeholder: 'Enter foreign word...',
      render: (value: unknown, row: unknown) => {
        const caption = row as CaptionType;
        return captionColumnRenderers.foreign(caption);
      },
    },
    {
      key: 'created_at',
      label: 'Created',
      type: 'date',
      inTable: true,
      inForm: false,
      sortable: true,
      width: 'w-32',
      filterable: true,
      filterType: 'dateRange',
      render: (value: unknown, row: unknown) => {
        const caption = row as CaptionType;
        return captionColumnRenderers.created_at(caption);
      },
    },
  ] as FieldDefinition[],
  api: {
    baseUrl: 'getAllWords',
    apiType: 'baseapitype',
  },
  
  filters: {
    type: 'url-synced',
    fields: [
      {
        key: 'search',
        type: 'search',
        label: 'Search',
        placeholder: 'Search captions...',
      },
      // {
      //   key: 'created_at',
      //   type: 'dateRange',
      //   label: 'Created Date',
      // },
      {
        key: 'sortBy',
        type: 'select',
        label: 'Sort By',
        options: [...CAPTION_SORT_OPTIONS],
      },
    ],
  },
  
  header: {
    title: 'Captions',
    description: 'Manage your application captions and translations',
    showAddButton: true,
    addButtonLabel: 'Add New Caption',
  },
  stats: {
    enabled: true,
    items: [
      {
        key: 'total',
        label: 'Total Captions',
        value: (data) => data.length,
      },
      {
        key: 'filtered',
        label: 'Filtered Results',
        value: (data) => data.length,
      },
      {
        key: 'selected',
        label: 'Selected',
        value: () => 0,
      },
      {
        key: 'filters',
        label: 'Active Filters',
        value: () => 0,
      },
    ],
  },
  table: {
    defaultPageSize: 15,
    defaultSort: {
      key: 'national',
      direction: 'asc',
    },
    columns: [],
  },
  actions: {
    enableSelection: true,
    enableEdit: true,
    enableDelete: true,
    enableBulkDelete: true,
  },
  modals: {
    edit: { enabled: true },
    delete: { enabled: true },
    add: { enabled: true },
  },
};



const countriesConfig: ExtendedResourceConfig<CountryType> = {
  id: 'countries',
  label: 'Countries',
  path: '/admin/[resource]',
  showInNav: true,
  api: {
    list: {
      endpoint: 'getAllCountries',
      apiType: 'countries',
      method: 'GET',
      queryParams: {
        fields: COUNTRIES_CONFIG.FIELDS.join(','),
      },
    },
  },
  filters: {
    type: 'url-synced',
    fields: [
      {
        key: 'search',
        type: 'search',
        label: 'Search Countries',
        placeholder: 'Search by name, capital, or country code...',
      },
      {
        key: 'region',
        type: 'select',
        label: 'Region',
        optionsGenerator: (items: unknown[]) => {
          return extractUniqueRegions(items as CountryType[]);
        },
      },
      {
        key: 'currency',
        type: 'select',
        label: 'Currency',
        optionsGenerator: (items: unknown[]) => {
          return extractUniqueCurrencies(items as CountryType[]);
        },
      },
      {
        key: 'independent',
        type: 'boolean',
        label: 'Independent Only',
      },
    ],
  },
  
  header: {
    title: 'Countries Explorer',
    description: 'Discover countries around the world with comprehensive filtering and search capabilities.',
  },
  stats: {
    enabled: false,
    items: [],
  },
  table: {
    defaultPageSize: 15,
    defaultSort: {
      key: 'name.common',
      direction: 'asc',
    },
    columns: [
      {
        key: 'name.common',
        label: 'Country',
        width: 'w-[180px]',
        sortable: true,
        render: countryColumnRenderers['name.common'],
      },
      {
        key: 'region',
        label: 'Region',
        width: 'w-[120px]',
        sortable: true,
        render: countryColumnRenderers.region,
      },
      {
        key: 'capital',
        label: 'Capital',
        width: 'w-[140px]',
        sortable: true,
        render: countryColumnRenderers.capital,
      },
      {
        key: 'currencies',
        label: 'Currency',
        width: 'w-[120px]',
        sortable: true,
        render: countryColumnRenderers.currencies,
      },
      {
        key: 'languages',
        label: 'Languages',
        width: 'w-[180px]',
        sortable: true,
        render: countryColumnRenderers.languages,
      },
      {
        key: 'independent',
        label: 'Status',
        width: 'w-[100px]',
        sortable: true,
        render: countryColumnRenderers.independent,
      },
    ],
  },
  actions: {
    enableSelection: false,
    enableEdit: false,
    enableDelete: false,
    enableBulkDelete: false,
  },
};

export const resourcesConfig = {
  captions: captionsConfig,
  countries: countriesConfig,
} as const;

export type ResourceId = keyof typeof resourcesConfig;

export type ResourceData<TId extends ResourceId> = ResourceDataMap[TId];

export type GetResourceConfig<TId extends ResourceId> = ExtendedResourceConfig<ResourceDataMap[TId]>;

export type { ExtendedResourceConfig as ResourceConfig };

