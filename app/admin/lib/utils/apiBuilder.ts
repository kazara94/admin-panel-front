import { DEFAULT_LANGUAGE, API_BASE_URL } from '@/app/admin/global/config/config';
import { buildEndpointUrl, _getRequest, _postRequest, _putRequest, _deleteRequest } from '@/app/admin/global/client/request';
import { ApiResponse, CaptionType, CountryType } from '@/app/admin/lib/types';
import { ResourceApiConfig, ApiEndpointConfig } from '../config/resourceConfig.types';
import { ResourceApiFunctions } from '../../hooks/useResourceTableLogic';
import { endpoints } from '@/app/admin/global/client/endpoints';
import { resourcesConfig, ResourceId, ResourceData } from '../config/resourcesConfig';

const LIST_PREFIXES = ['getAll', 'GetAll', 'list', 'List', 'fetch', 'Fetch'];

type UnknownObject = Record<string, unknown>;
type CaptionLike = Partial<CaptionType> & { createdAt?: string; updatedAt?: string };

const deriveCreatedAtFromId = (value: string | number | undefined): string => {
  if (!value) {
    return '';
  }

  const normalizedId = typeof value === 'number' ? String(value) : value;
  if (typeof normalizedId === 'string' && normalizedId.length === 24) {
    const hexTimestamp = normalizedId.slice(0, 8);
    const seconds = Number.parseInt(hexTimestamp, 16);
    if (!Number.isNaN(seconds)) {
      return new Date(seconds * 1000).toISOString();
    }
  }

  return '';
};

const ensureCaptionShape = (item: UnknownObject): CaptionType => {
  const captionData = item as CaptionLike & { Id?: string | number };
  const baseId =
    (captionData._id as string | number | undefined) ??
    (captionData.Id as string | number | undefined) ??
    (captionData.id as string | number | undefined) ??
    '';

  const createdAt =
    (captionData.created_at as string | undefined) ??
    (captionData.createdAt as string | undefined) ??
    deriveCreatedAtFromId(baseId);

  const national =
    typeof captionData.national === 'string' ? captionData.national : '';
  const foreign =
    typeof captionData.foreign === 'string' ? captionData.foreign : '';

  return {
    ...captionData,
    _id: captionData._id ?? captionData.Id ?? baseId,
    id: captionData.id ?? captionData.Id ?? baseId,
    national,
    foreign,
    created_at: createdAt,
  } as CaptionType;
};

const normalizeCaptionsResponse = (input: unknown): CaptionType[] => {
  if (!input) {
    return [];
  }

  if (Array.isArray(input)) {
    return (input as UnknownObject[]).map(ensureCaptionShape);
  }

  if (typeof input === 'object') {
    const obj = input as { data?: unknown; words?: unknown };
    if (Array.isArray(obj.words)) {
      return (obj.words as UnknownObject[]).map(ensureCaptionShape);
    }
    if (obj.words && typeof obj.words === 'object') {
      return normalizeCaptionsResponse(obj.words);
    }
    if (obj.data !== undefined) {
      return normalizeCaptionsResponse(obj.data);
    }
  }

  return [];
};

const normalizeCountriesResponse = (response: unknown): CountryType[] => {
  if (Array.isArray(response)) {
    return response as CountryType[];
  }

  if (!response || typeof response !== 'object') {
    return [];
  }

  const apiResponse = response as { statusCode?: boolean; data?: unknown };

  if (apiResponse.statusCode === false || !apiResponse.data) {
    return [];
  }

  if (Array.isArray(apiResponse.data)) {
    return apiResponse.data as CountryType[];
  }

  if (typeof apiResponse.data === 'object' && apiResponse.data !== null) {
    const dataObj = apiResponse.data as Record<string, unknown>;
    if (Array.isArray(dataObj.items)) {
      return dataObj.items as CountryType[];
    }
    if (Array.isArray(dataObj.data)) {
      return dataObj.data as CountryType[];
    }
  }

  return [];
};

const CRUD_PREFIXES: Record<'create' | 'update' | 'delete', string[]> = {
  create: ['add', 'Add', 'create', 'Create'],
  update: ['update', 'Update', 'edit', 'Edit'],
  delete: ['delete', 'Delete', 'remove', 'Remove'],
};

function removePrefix(value: string, prefixes: string[]): string {
  for (const prefix of prefixes) {
    if (value.startsWith(prefix)) {
      return value.slice(prefix.length);
    }
  }
  return value;
}

function singularize(word: string): string {
  if (word.endsWith('ies')) {
    return `${word.slice(0, -3)}y`;
  }
  if (word.endsWith('ses')) {
    return word.slice(0, -2);
  }
  if (word.endsWith('s') && !word.endsWith('ss')) {
    return word.slice(0, -1);
  }
  return word;
}

function buildResourceSuffixes(baseKey: string): string[] {
  const suffix = removePrefix(baseKey, LIST_PREFIXES);
  if (!suffix) {
    return [];
  }

  const variants = new Set<string>();
  variants.add(suffix);

  const singular = singularize(suffix);
  variants.add(singular);

  if (!suffix.endsWith('s')) {
    variants.add(`${suffix}s`);
  }

  return Array.from(variants).filter(Boolean);
}

function resolveCrudEndpoint(baseKey: string, action: 'create' | 'update' | 'delete'): string | undefined {
  const suffixes = buildResourceSuffixes(baseKey);
  if (!suffixes.length) {
    return undefined;
  }

  for (const suffix of suffixes) {
    for (const prefix of CRUD_PREFIXES[action]) {
      const candidate = `${prefix}${suffix}`;
      if (endpoints[candidate]) {
        return candidate;
      }
    }
  }

  return undefined;
}

function buildQueryString(params: Record<string, string | number | boolean>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    searchParams.append(key, String(value));
  });
  return searchParams.toString();
}

function buildUrlFromConfig(config: ApiEndpointConfig, params?: Record<string, unknown>): string {
  const { endpoint, apiType = 'baseapitype', baseUrl, queryParams, params: configParams } = config;
  const allParams = { ...configParams, ...params };
  const query = queryParams && Object.keys(queryParams).length > 0
    ? buildQueryString(queryParams)
    : false;
  const replaceValue = allParams?.id ?? allParams?.replace ?? false;

  if (baseUrl && apiType === 'custom') {
    let url = baseUrl;
    if (replaceValue && url.includes('{%}')) {
      url = url.replace('{%}', String(replaceValue));
    }
    if (query) {
      url += `?${query}`;
    }
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `${API_BASE_URL}${url}`;
  }

  const locale = (allParams?.locale as string) || DEFAULT_LANGUAGE;
  const requestApiType: 'baseapitype' | 'countries' = apiType === 'custom' ? 'baseapitype' : apiType;
  return buildEndpointUrl({
    locale,
    endpoint,
    query,
    replace: replaceValue ? String(replaceValue) : false,
    apiType: requestApiType
  });
}

async function makeApiRequest<T>(
  config: ApiEndpointConfig,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  data?: unknown,
  params?: Record<string, unknown>
): Promise<ApiResponse<T>> {
  const url = buildUrlFromConfig(config, params);
  
  switch (method) {
    case 'GET':
      return _getRequest(url) as Promise<ApiResponse<T>>;
    case 'POST':
      return _postRequest(url, data as Record<string, unknown>) as Promise<ApiResponse<T>>;
    case 'PUT':
      return _putRequest(url, data as Record<string, unknown>) as Promise<ApiResponse<T>>;
    case 'DELETE':
      return _deleteRequest(url) as Promise<ApiResponse<T>>;
    default:
      throw new Error(`Unsupported method: ${method}`);
  }
}

class ApiRequestError extends Error {
  response: ApiResponse<unknown>;

  constructor(response: ApiResponse<unknown>, fallbackMessage: string) {
    super(response.errors?.[0]?.message || fallbackMessage);
    this.response = response;
  }
}

const ensureSuccess = <T>(response: ApiResponse<T>, fallbackMessage: string): ApiResponse<T> => {
  if (!response.statusCode) {
    throw new ApiRequestError(response, fallbackMessage);
  }
  return response;
};

export function buildApiConfigFromBaseUrl(
  baseUrl: string,
  apiType: 'baseapitype' | 'rest' = 'baseapitype'
): ResourceApiConfig {
  const isEndpointKey = baseUrl in endpoints;
  const isRestEndpoint = baseUrl.startsWith('/api/');
  
  if (isEndpointKey) {
    const buildCrudConfig = (
      action: 'create' | 'update' | 'delete',
      method: 'POST' | 'PUT' | 'DELETE'
    ): ApiEndpointConfig | undefined => {
      const resolvedKey = resolveCrudEndpoint(baseUrl, action);
      if (!resolvedKey) {
        return undefined;
      }

      const path = endpoints[resolvedKey];
      const requiresId = path?.includes('{%}');

      if (action === 'create') {
        return {
          endpoint: resolvedKey,
          apiType: 'baseapitype',
          method,
        };
      }

      return {
        endpoint: resolvedKey,
        apiType: 'baseapitype',
        method,
        ...(requiresId && { params: { id: '{%}' } }),
      };
    };

    const createConfig = buildCrudConfig('create', 'POST');
    const updateConfig = buildCrudConfig('update', 'PUT');
    const deleteConfig = buildCrudConfig('delete', 'DELETE');
    
    const config: ResourceApiConfig = {
      list: {
        endpoint: baseUrl,
        apiType: 'baseapitype',
        method: 'GET',
      },
    };

    if (createConfig) {
      config.create = createConfig;
    }

    if (updateConfig) {
      config.update = updateConfig;
    }

    if (deleteConfig) {
      config.delete = deleteConfig;
    }

    return config;
  }
  
  if (isRestEndpoint || apiType === 'rest') {
    return {
      list: {
        endpoint: baseUrl,
        apiType: 'custom',
        baseUrl: baseUrl,
        method: 'GET',
      },
      create: {
        endpoint: baseUrl,
        apiType: 'custom',
        baseUrl: baseUrl,
        method: 'POST',
      },
      update: {
        endpoint: `${baseUrl}/{%}`,
        apiType: 'custom',
        baseUrl: `${baseUrl}/{%}`,
        method: 'PUT',
        params: { id: '{%}' },
      },
      delete: {
        endpoint: `${baseUrl}/{%}`,
        apiType: 'custom',
        baseUrl: `${baseUrl}/{%}`,
        method: 'DELETE',
        params: { id: '{%}' },
      },
    };
  }
  
  return {
    list: {
      endpoint: baseUrl,
      apiType: 'baseapitype',
      method: 'GET',
    },
    create: {
      endpoint: baseUrl,
      apiType: 'baseapitype',
      method: 'POST',
    },
    update: {
      endpoint: `${baseUrl}/{%}`,
      apiType: 'baseapitype',
      method: 'PUT',
      params: { id: '{%}' },
    },
    delete: {
      endpoint: `${baseUrl}/{%}`,
      apiType: 'baseapitype',
      method: 'DELETE',
      params: { id: '{%}' },
    },
  };
}

type ResourceTransformer<T> = (response: unknown) => T[];

const resourceTransformers: Record<string, ResourceTransformer<unknown>> = {
  captions: normalizeCaptionsResponse,
  documents: normalizeCaptionsResponse,
  countries: normalizeCountriesResponse,
};

function resolveTransformer<T>(resourceId?: string): ResourceTransformer<T> | undefined {
  if (!resourceId) return undefined;
  const transformer = resourceTransformers[resourceId];
  return transformer as ResourceTransformer<T> | undefined;
}

export function buildApiFunctions<T = unknown>(
  apiConfig: ResourceApiConfig<T>,
  getLocale?: () => string,
  resourceId?: string
): ResourceApiFunctions<T> {
  const locale = getLocale?.() || DEFAULT_LANGUAGE;
  const sharedTransformer = resolveTransformer<T>(resourceId);
  
  let finalApiConfig: ResourceApiConfig<T>;
  if ('baseUrl' in apiConfig && !('list' in apiConfig)) {
    const generatedConfig = buildApiConfigFromBaseUrl(apiConfig.baseUrl, apiConfig.apiType);
    finalApiConfig = {
      ...generatedConfig,
      transformResponse: apiConfig.transformResponse,
      transformRequest: apiConfig.transformRequest,
      getId: apiConfig.getId,
    } as ResourceApiConfig<T>;
  } else {
    finalApiConfig = apiConfig;
  }
  
  if (!('list' in finalApiConfig) || !finalApiConfig.list) {
    throw new Error('API config must have either baseUrl or list endpoint defined');
  }
  
  const transformerFn = finalApiConfig.transformResponse || sharedTransformer;

  const transformItems = (response: ApiResponse<unknown>): T[] => {
    if (transformerFn) {
      return transformerFn(response);
    }
    if (Array.isArray(response.data)) {
      return response.data as T[];
    }
    if (response.data && typeof response.data === 'object' && 'items' in (response.data as Record<string, unknown>)) {
      const paginatedData = response.data as { items: unknown[] };
      return paginatedData.items as T[];
    }
    return [];
  };

  const transformSingleItem = (response: ApiResponse<unknown>): T => {
    const items = transformItems(response);
    if (items.length > 0) {
      return items[0];
    }
    return response.data as T;
  };

  const listEndpoint = finalApiConfig.list;
  const createEndpoint = 'create' in finalApiConfig ? finalApiConfig.create : undefined;
  const updateEndpoint = 'update' in finalApiConfig ? finalApiConfig.update : undefined;
  const deleteEndpoint = 'delete' in finalApiConfig ? finalApiConfig.delete : undefined;

  const listRequest = () => {
    const method = listEndpoint.method || 'GET';
    return makeApiRequest<unknown>(listEndpoint, method, undefined, { locale });
  };

  const createRequest = createEndpoint
    ? (data: Omit<T, 'id' | 'created_at' | 'updated_at'>) => {
        const method = createEndpoint.method || 'POST';
        const transformedData = finalApiConfig.transformRequest
          ? finalApiConfig.transformRequest(data)
          : data;
        return makeApiRequest<T>(createEndpoint, method, transformedData, { locale });
      }
    : undefined;

  const updateRequest = updateEndpoint
    ? (id: string | number, data: Partial<T>) => {
        const method = updateEndpoint.method || 'PUT';
        const transformedData = finalApiConfig.transformRequest
          ? finalApiConfig.transformRequest(data)
          : data;
        return makeApiRequest<T>(
          { ...updateEndpoint, params: { ...updateEndpoint.params, id } },
          method,
          transformedData,
          { locale, id }
        );
      }
    : undefined;

  const deleteRequest = deleteEndpoint
    ? (id: string | number) => {
        const method = deleteEndpoint.method || 'DELETE';
        return makeApiRequest<void>(
          { ...deleteEndpoint, params: { ...deleteEndpoint.params, id } },
          method,
          undefined,
          { locale, id }
        );
      }
    : undefined;

  const fetchList = async (): Promise<T[]> => {
    const response = await listRequest();
    const success = ensureSuccess(response, 'Failed to fetch list');
    return transformItems(success);
  };

  const create = createRequest
    ? async (data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T> => {
        const response = await createRequest(data);
        const success = ensureSuccess(response, 'Failed to create item');
        return transformSingleItem(success);
      }
    : undefined;

  const update = updateRequest
    ? async (id: string | number, data: Partial<T>): Promise<T> => {
        const response = await updateRequest(id, data);
        const success = ensureSuccess(response, 'Failed to update item');
        return transformSingleItem(success);
      }
    : undefined;

  const deleteFn = deleteRequest
    ? async (id: string | number): Promise<void> => {
        const response = await deleteRequest(id);
        ensureSuccess(response, 'Failed to delete item');
      }
    : undefined;

  const raw = {
    fetchList: listRequest,
    ...(createRequest && { create: createRequest }),
    ...(updateRequest && { update: updateRequest }),
    ...(deleteRequest && { delete: deleteRequest }),
  };

  return {
    fetchList,
    ...(create && { create }),
    ...(update && { update }),
    ...(deleteFn && { delete: deleteFn }),
    raw
  };
}

type FetchSetEntry<T = unknown> = {
  fetchList: () => Promise<ApiResponse<T[]>>;
  createItem?: (data: Omit<T, 'id' | 'created_at' | 'updated_at'>) => Promise<ApiResponse<T>>;
  updateItem?: (id: string | number, data: Partial<T>) => Promise<ApiResponse<T>>;
  deleteItem?: (id: string | number) => Promise<ApiResponse<T>>;
};

function executeRawCall<R>(
  executor: (() => Promise<ApiResponse<unknown>>) | undefined,
  fallbackData: R
): Promise<ApiResponse<R>> {
  if (!executor) {
    return Promise.resolve({
      statusCode: false,
      data: fallbackData,
      errors: [{ message: 'Operation not supported' }],
      info: []
    });
  }
  return executor()
    .then((response) => response as ApiResponse<R>)
    .catch((error) => {
      if (error instanceof ApiRequestError) {
        return error.response as ApiResponse<R>;
      }
      return {
        statusCode: false,
        data: fallbackData,
        errors: [{ message: error instanceof Error ? error.message : 'Request failed' }],
        info: []
      };
    });
}

function buildFetchSetEntry<T = unknown>(api: ResourceApiFunctions<T>): FetchSetEntry<T> {
  return {
    fetchList: () => executeRawCall(api.raw?.fetchList, [] as T[]),
    ...(api.raw?.create && {
      createItem: (data: Omit<T, 'id' | 'created_at' | 'updated_at'>) =>
        executeRawCall(() => api.raw!.create!(data), {} as T)
    }),
    ...(api.raw?.update && {
      updateItem: (id: string | number, data: Partial<T>) =>
        executeRawCall(() => api.raw!.update!(id, data), {} as T)
    }),
    ...(api.raw?.delete && {
      deleteItem: (id: string | number) =>
        executeRawCall(() => api.raw!.delete!(id), {} as T)
    }),
  };
}

type FetchSetMap = Partial<Record<ResourceId, FetchSetEntry<unknown>>>;

const buildFetchSet = (): FetchSetMap => {
  const set: FetchSetMap = {};
  (Object.keys(resourcesConfig) as ResourceId[]).forEach((resourceId) => {
    const config = resourcesConfig[resourceId];
    if (!config.api) {
      return;
    }
    const apiFunctions = buildApiFunctions<ResourceData<typeof resourceId>>(
      config.api as ResourceApiConfig<ResourceData<typeof resourceId>>,
      () => DEFAULT_LANGUAGE,
      resourceId
    );
    set[resourceId] = buildFetchSetEntry(apiFunctions);
  });
  return set;
};

export const fetchSet = buildFetchSet();

