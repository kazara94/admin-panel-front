import { ApiError, ApiResponse, ApiResult } from '@/app/admin/global/types';

export class ApiErrorHandler {
  static createError(message: string, code?: string, field?: string): ApiError {
    return { message, code, field };
  }

  static createErrorResponse<T>(errors: ApiError[]): ApiResponse<T> {
    return {
      data: {} as T,
      statusCode: false,
      errors,
      info: []
    };
  }

  static createSuccessResponse<T>(data: T): ApiResponse<T> {
    return {
      data,
      statusCode: true,
      errors: [],
      info: []
    };
  }

  static toResult<T>(response: ApiResponse<T>): ApiResult<T> {
    if (response.statusCode && response.errors.length === 0) {
      return { success: true, data: response.data };
    }
    return { success: false, errors: response.errors };
  }

  static handleNetworkError(error: unknown): ApiError[] {
    if (error instanceof Error) {
      return [this.createError(error.message, 'NETWORK_ERROR')];
    }
    return [this.createError('An unknown network error occurred', 'UNKNOWN_ERROR')];
  }

  static handleAuthError(): ApiError[] {
    return [this.createError('Authentication failed', 'AUTH_ERROR')];
  }

  static handleValidationError(field: string, message: string): ApiError[] {
    return [this.createError(message, 'VALIDATION_ERROR', field)];
  }
}

export const createNetworkErrorResponse = <T>(error: unknown): ApiResponse<T> => {
  return ApiErrorHandler.createErrorResponse<T>(ApiErrorHandler.handleNetworkError(error));
};

export const createAuthErrorResponse = <T>(): ApiResponse<T> => {
  return ApiErrorHandler.createErrorResponse<T>(ApiErrorHandler.handleAuthError());
};

export const createValidationErrorResponse = <T>(field: string, message: string): ApiResponse<T> => {
  return ApiErrorHandler.createErrorResponse<T>(ApiErrorHandler.handleValidationError(field, message));
};
