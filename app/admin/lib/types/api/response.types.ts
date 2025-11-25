export interface ApiError {
  message: string;
  code?: string;
  field?: string;
  type?: string;
}

export interface ApiInfo {
  message: string;
  type?: 'success' | 'warning' | 'info';
}

export interface ApiResponse<T> {
  data: T;
  statusCode: boolean;
  errors: ApiError[];
  info?: ApiInfo[];
}

export type ApiState<T> = 
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; errors: ApiError[] };

export type ApiResult<T> = 
  | { success: true; data: T }
  | { success: false; errors: ApiError[] };

