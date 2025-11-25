export * from './auth/user.types';
export * from './auth/auth.types';
export * from './api/response.types';
export * from './baseResource.types';
export * from './captions/caption.types';
export * from './captions/captions-list.types';
export * from './countries/country.types';
export * from './table/table.types';
export * from './resourceHookResult.types';

import { ApiResponse } from './api/response.types';
import { LoginResponse, RegisterResponse } from './auth/auth.types';
import { CaptionResponse, TransformedCaptionResponse } from './captions/caption.types';
import { CountryType } from './countries/country.types';

export type LoginApiResponse = ApiResponse<LoginResponse>;
export type RegisterApiResponse = ApiResponse<RegisterResponse>;
export type CaptionsListApiResponse = ApiResponse<CaptionResponse[]>;
export type CaptionApiResponse = ApiResponse<CaptionResponse>;
export type TransformedCaptionApiResponse = ApiResponse<TransformedCaptionResponse>;
export type CountriesApiResponse = ApiResponse<CountryType[]>;
