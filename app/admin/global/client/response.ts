import { removeAuthToken, removeGuestToken } from "@/app/admin/global/core/auth";
import { ApiError, ApiInfo, ApiResponse } from "@/app/admin/lib/types";
import { ApiErrorHandler } from "@/app/admin/global/utils/errorHandler";

type ResponseType = {
  data: object | number;
  status?: number;
  statusCode: boolean;
  errors: ApiError[];
  info?: ApiInfo[];
};

const toCamelCase = (obj: unknown): unknown => {
  if (Array.isArray(obj)) {
    return obj.map(v => toCamelCase(v));
  }
  if (typeof obj === 'object' && obj !== null) {
    const objRecord = obj as Record<string, unknown>;
    return Object.keys(objRecord).reduce((result, key) => {
      const newKey = key.replace(/(_\w)/g, matches => matches[1].toUpperCase());
      (result as Record<string, unknown>)[newKey] = toCamelCase(objRecord[key]);
      return result;
    }, {} as Record<string, unknown>);
  }
  return obj;
};

const httpErrorMessage = (res: Response | null): string => {
  if (!res) {
    return 'HTTP Unknown error';
  }
  if (res.status === 500) {
    return 'Server error';
  }
  return `HTTP ${res.status} error`;
};

const buildHttpError = (res: Response | null, type: 'HTTP_ERROR' | 'AUTH_ERROR', customMessage?: string) => {
  const message = customMessage
    ? customMessage
    : type === 'AUTH_ERROR'
      ? 'Authentication failed'
      : httpErrorMessage(res);
  return ApiErrorHandler.createErrorResponse([
    ApiErrorHandler.createError(message, type)
  ]);
};

const parseJsonSafe = async (res: Response | null): Promise<unknown> => {
  if (!res) {
    return null;
  }
  try {
    return await res.json();
  } catch {
    return null;
  }
};

const extractErrors = (payload: unknown): ApiError[] => {
  if (!payload || typeof payload !== 'object') {
    return [];
  }
  const obj = payload as Record<string, unknown>;
  if (Array.isArray(obj.errors)) {
    return obj.errors as ApiError[];
  }
  if (obj.data && typeof obj.data === 'object' && Array.isArray((obj.data as Record<string, unknown>).errors)) {
    return (obj.data as Record<string, unknown>).errors as ApiError[];
  }
  return [];
};

const extractInfo = (payload: unknown): ApiInfo[] => {
  if (!payload || typeof payload !== 'object') {
    return [];
  }
  const info = (payload as Record<string, unknown>).info;
  return Array.isArray(info) ? info as ApiInfo[] : [];
};

const extractData = (payload: unknown): unknown => {
  if (Array.isArray(payload)) {
    return toCamelCase(payload);
  }
  if (!payload || typeof payload !== 'object') {
    return payload;
  }
  const obj = payload as Record<string, unknown>;
  if (obj.data !== undefined) {
    const dataObj = obj.data as Record<string, unknown>;
    if (dataObj && dataObj.data !== undefined) {
      return toCamelCase(dataObj.data);
    }
    return toCamelCase(obj.data);
  }
  return toCamelCase(payload);
};

const hasApiErrorStatus = (payload: unknown): boolean => {
  if (!payload || typeof payload !== 'object') {
    return false;
  }
  const status = (payload as Record<string, unknown>).status;
  return typeof status === 'number' && status >= 400;
};

const handleAuthPayload = (payload: unknown, status: number): ApiResponse<unknown> => {
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    if (obj._id && obj.username && obj.token) {
      const processedData = {
        token: obj.token,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        token_type: 'Bearer',
        user: {
          id: obj._id,
          name: obj.username,
          email: obj.email || obj.username,
          role: 'user'
        }
      };
      return {
        data: processedData,
        statusCode: true,
        errors: [],
        info: extractInfo(payload)
      };
    }
  }
  const errors = extractErrors(payload);
  const data = extractData(payload);
  return {
    data,
    statusCode: ([200, 201].includes(status) && errors.length === 0),
    errors,
    info: extractInfo(payload)
  };
};

const handleGeneralPayload = (payload: unknown, status: number): ApiResponse<unknown> => {
  if (hasApiErrorStatus(payload)) {
    const obj = payload as Record<string, unknown>;
    return ApiErrorHandler.createErrorResponse([
      ApiErrorHandler.createError(
        (obj.errorMessage as string) || (obj.message as string) || 'API Error',
        'API_ERROR'
      )
    ]);
  }
  if (Array.isArray(payload)) {
    return {
      data: toCamelCase(payload),
      statusCode: true,
      errors: [],
      info: []
    };
  }
  const errors = extractErrors(payload);
  const data = extractData(payload);
  return {
    data,
    statusCode: ([200, 201].includes(status) && errors.length === 0),
    errors,
    info: extractInfo(payload)
  };
};

export const _responseAuth = async (res: Response | null): Promise<ApiResponse<unknown>> => {
  if (!res || !res.ok) {
    if (res?.status === 401) {
      return buildHttpError(res, 'AUTH_ERROR', 'Authentication failed - please login again');
    }
    return buildHttpError(res, 'HTTP_ERROR');
  }
  const payload = await parseJsonSafe(res);
  if (!payload) {
    return ApiErrorHandler.createErrorResponse([
      ApiErrorHandler.createError('Failed to parse response', 'PARSE_ERROR')
    ]);
  }
  if (hasApiErrorStatus(payload)) {
    const obj = payload as Record<string, unknown>;
    const errorMessage = obj.errorMessage || obj.message || `HTTP ${res.status} error`;
    return {
      data: {},
      statusCode: false,
      errors: [{ message: String(errorMessage), type: 'API_ERROR' }],
      info: []
    };
  }
  return handleAuthPayload(payload, res.status);
};

const handleUnauthorized = async (): Promise<void> => {
  try {
    const { refreshAuthToken } = await import('@/app/admin/global/core/auth');
    const refreshed = await refreshAuthToken();
    if (!refreshed) {
      removeAuthToken();
      removeGuestToken();
    }
  } catch {
    removeAuthToken();
    removeGuestToken();
  }
};

export const _response = async (res: Response | null): Promise<ApiResponse<unknown>> => {
  if (!res || !res.ok) {
    if (res?.status === 401) {
      await handleUnauthorized();
      return buildHttpError(res, 'AUTH_ERROR');
    }
    return buildHttpError(res, 'HTTP_ERROR');
  }
  const payload = await parseJsonSafe(res);
  if (!payload) {
    return ApiErrorHandler.createErrorResponse([
      ApiErrorHandler.createError('Failed to parse response', 'PARSE_ERROR')
    ]);
  }
  return handleGeneralPayload(payload, res.status);
};

export const _responseFile = async (res: Response | null): Promise<ResponseType> => {
  if (!res || !res.ok) {
    if (res?.status === 401) {
      removeAuthToken();
      removeGuestToken();
    }
    const errorMessage = httpErrorMessage(res);
    return {
      data: {},
      status: 500,
      statusCode: false,
      errors: [ApiErrorHandler.createError(errorMessage, 'HTTP_ERROR')]
    };
  }
  try {
    const response = await res.clone().text();
    const resObj = !response ? await res.clone().json() : {};
    const parsed = resObj as Record<string, unknown>;
    let errors: ApiError[] = [];
    if (Array.isArray(parsed.errors)) {
      errors = parsed.errors as ApiError[];
    } else if (parsed.data && typeof parsed.data === 'object') {
      const dataObj = parsed.data as Record<string, unknown>;
      if (Array.isArray(dataObj.errors)) {
        errors = dataObj.errors as ApiError[];
      }
    }
    return {
      data: response as unknown as object,
      statusCode: [200, 201].includes(res.status),
      errors
    };
  } catch {
    return {
      data: {},
      status: 500,
      statusCode: false,
      errors: [ApiErrorHandler.createError('Failed to process file response', 'FILE_PARSE_ERROR')]
    };
  }
};
