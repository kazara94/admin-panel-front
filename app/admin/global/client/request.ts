import { endpoints } from "@/app/admin/global/client/endpoints";
import { _response, _responseAuth } from '@/app/admin/global/client/response';
import { getAuthToken, getGuestToken, isAuthenticated, refreshAuthToken } from '@/app/admin/global/core/auth';
import { API_BASE_URL, COUNTRIES_API_URL, DEFAULT_LANGUAGE } from "@/app/admin/global/config/config";
import { ApiResponse } from "@/app/admin/lib/types";
import { TokenType } from "@/app/admin/global/types";

type ApiType = 'baseapitype' | 'countries';

type BuildRequestParams = {
  locale?: string;
  endpoint: string;
  query?: string | false;
  replace?: number | string | false;
  apiType?: ApiType;
};

type RequestHeaders = Record<string, string>;

type TokenRequirement = 'optional' | 'required' | 'required-auth';

type ExecuteOptions = {
  data?: Record<string, unknown>;
  headers?: RequestHeaders;
  skipToken?: boolean;
  handler?: typeof _response | typeof _responseAuth;
  refreshOnExpire?: boolean;
  tokenRequirement?: TokenRequirement;
};

const AUTH_ERROR = (message: string): ApiResponse<unknown> => ({
  data: {},
  statusCode: false,
  errors: [{ message, type: 'AUTH_ERROR' }],
  info: []
});

const NETWORK_ERROR: ApiResponse<unknown> = {
  data: {},
  statusCode: false,
  errors: [{ message: 'Network error: Please check your internet connection', type: 'NETWORK_ERROR' }],
  info: []
};

const BASE_URLS: Record<ApiType, string> = {
  baseapitype: API_BASE_URL,
  countries: COUNTRIES_API_URL
};

const resolveEndpointPath = (endpoint: string): string => {
  if (endpoints[endpoint]) {
    return endpoints[endpoint];
  }
  return endpoint;
};

export const _buildRequest = (
  locale: string = DEFAULT_LANGUAGE,
  endpoint: string,
  query: (string | false) = false,
  replace: (number | string | false) = false,
  apiType: ApiType = 'baseapitype'
) => {
  return buildEndpointUrl({ locale, endpoint, query, replace, apiType });
};

export const buildEndpointUrl = ({
  locale = DEFAULT_LANGUAGE,
  endpoint,
  query = false,
  replace = false,
  apiType = 'baseapitype'
}: BuildRequestParams): string => {
  void locale;
  const baseUrl = BASE_URLS[apiType];
  const path = resolveEndpointPath(endpoint);
  let url = `${baseUrl}/${path}`;
  if (replace) {
    url = url.replace('{%}', replace.toString());
  }
  if (query) {
    url += `?${query}`;
  }
  return url;
};

const mergeHeaders = (base: RequestHeaders, extra?: RequestHeaders): HeadersInit => {
  return {
    ...base,
    ...(extra || {})
  };
};

const needsClientAuth = (url: string): boolean => url.includes('/Api/Client/');

const resolveToken = (requirement: TokenRequirement): TokenType | null => {
  const authToken = getAuthToken();
  if (authToken) {
    return authToken;
  }
  if (requirement === 'required-auth') {
    return null;
  }
  return getGuestToken();
};

const validateToken = (
  token: TokenType | null,
  url: string,
  requirement: TokenRequirement
): ApiResponse<unknown> | null => {
  if ((requirement === 'required' || requirement === 'required-auth') && !token) {
    return AUTH_ERROR('No authentication token available');
  }
  if (needsClientAuth(url) && !token) {
    return AUTH_ERROR('No authentication token available');
  }
  return null;
};

const handleExpiredToken = async (url: string, refreshOnExpire?: boolean): Promise<ApiResponse<unknown> | null> => {
  if (!needsClientAuth(url)) {
    return null;
  }
  if (isAuthenticated()) {
    return null;
  }
  if (!refreshOnExpire) {
    return AUTH_ERROR('Authentication token has expired. Please login again.');
  }
  const refreshed = await refreshAuthToken();
  if (!refreshed) {
    return AUTH_ERROR('Authentication token has expired. Please login again.');
  }
  return null;
};

const executeRequest = async (
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string,
  { data, headers = {}, skipToken, handler = _response, refreshOnExpire, tokenRequirement = 'optional' }: ExecuteOptions = {}
): Promise<ApiResponse<unknown>> => {
  let token: TokenType | null = null;
  if (!skipToken) {
    token = resolveToken(tokenRequirement);
    const tokenError = validateToken(token, url, tokenRequirement);
    if (tokenError) {
      return tokenError;
    }
  }

  if (needsClientAuth(url) && !skipToken) {
    const expiredResult = await handleExpiredToken(url, refreshOnExpire);
    if (expiredResult) {
      return expiredResult;
    }
    if (!skipToken) {
      token = resolveToken(tokenRequirement);
      const validationAfterRefresh = validateToken(token, url, tokenRequirement);
      if (validationAfterRefresh) {
        return validationAfterRefresh;
      }
    }
  }

  const baseHeaders: RequestHeaders = {
    'Content-type': 'application/json',
    ...(method === 'GET' ? { 'Cache-Control': 'no-store' } : {}),
    ...(token && !skipToken ? { Authorization: `Bearer ${token.token}` } : {})
  };

  const requestInit: RequestInit = {
    method,
    headers: mergeHeaders(baseHeaders, headers)
  };

  if (data && method !== 'GET' && method !== 'DELETE') {
    requestInit.body = JSON.stringify(data);
  }

  try {
    const res = await fetch(url, requestInit);
    return handler(res);
  } catch (error) {
    if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('network'))) {
      return NETWORK_ERROR;
    }
    return handler(null);
  }
};

export const _getRequest = async (url: string, headers: RequestHeaders = { 'Cache-Control': 'no-store' }) => {
  return executeRequest('GET', url, { headers, tokenRequirement: 'optional' });
};

export const _postRequest = async (url: string, data: Record<string, unknown>, headers: RequestHeaders = {}) => {
  return executeRequest('POST', url, { data, headers, refreshOnExpire: true, tokenRequirement: 'required' });
};

export const _postRequestSkipToken = async (url: string, data: Record<string, unknown>, headers: RequestHeaders = {}) => {
  return executeRequest('POST', url, { data, headers, skipToken: true });
};

export const _putRequest = async (url: string, data: Record<string, unknown>, headers: RequestHeaders = {}) => {
  return executeRequest('PUT', url, { data, headers, refreshOnExpire: true, tokenRequirement: 'optional' });
};

export const _deleteRequest = async (url: string, headers: RequestHeaders = {}) => {
  return executeRequest('DELETE', url, { headers, refreshOnExpire: true, tokenRequirement: 'required-auth' });
};

export const _processAuth = async (url: string, data: Record<string, unknown>) => {
  return executeRequest('POST', url, {
    data,
    handler: _responseAuth,
    skipToken: true
  });
};
