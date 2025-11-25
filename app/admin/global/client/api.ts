import { DEFAULT_LANGUAGE } from '@/app/admin/global/config/config';
import { _processAuth, _postRequest, buildEndpointUrl } from "@/app/admin/global/client/request";
import { 
  CaptionResponse,
  LoginResponse,
  RegisterResponse,
  LoginApiResponse, 
  RegisterApiResponse,
  CaptionsListApiResponse, 
  CaptionApiResponse, 
  CountriesApiResponse,
  TokenType,
  CountryType,
  LoginData,
  RegisterData,
  CaptionData
} from '@/app/admin/lib/types';
import { fetchSet } from '@/app/admin/lib/utils/apiBuilder';

type localeType = string | undefined;

const buildErrorResponse = <T>(data: T, message: string) => ({
  statusCode: false,
  data,
  errors: [{ message }],
  info: []
});

const buildAuthUrl = (endpoint: string, locale: localeType) => {
  return buildEndpointUrl({
    locale: locale || DEFAULT_LANGUAGE,
    endpoint,
    apiType: 'baseapitype'
  });
};

export const postLoginRequest = async (locale: localeType, data: LoginData): Promise<LoginApiResponse> => {
  try {
    const url = buildAuthUrl('auth', locale);
    const response = await _processAuth(url, data);
    return response as LoginApiResponse;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Authentication failed';
    return buildErrorResponse({} as LoginResponse, message);
  }
};

export const postRegisterRequest = async (locale: localeType, data: RegisterData): Promise<RegisterApiResponse> => {
  try {
    const url = buildAuthUrl('register', locale);
    const response = await _processAuth(url, data);
    return response as RegisterApiResponse;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    return buildErrorResponse({} as RegisterResponse, message);
  }
};

export const postRefreshTokenRequest = async (locale: localeType, currentToken: TokenType): Promise<LoginApiResponse> => {
  try {
    const url = buildAuthUrl('refreshToken', locale);
    const response = await _postRequest(url, { token: currentToken.token });
    return response as LoginApiResponse;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Token refresh failed';
    return buildErrorResponse({} as LoginResponse, message);
  }
};

const captionsFetchSet = fetchSet.captions;

export const getAllWords = async (locale: localeType = DEFAULT_LANGUAGE): Promise<CaptionsListApiResponse> => {
  void locale;
  if (!captionsFetchSet) {
    return buildErrorResponse([], 'Captions API not configured');
  }
  return captionsFetchSet.fetchList() as Promise<CaptionsListApiResponse>;
};

export const addWord = async (locale: localeType, data: CaptionData): Promise<CaptionApiResponse> => {
  void locale;
  if (!captionsFetchSet?.createItem) {
    return buildErrorResponse({} as CaptionResponse, 'Create operation not supported');
  }
  return captionsFetchSet.createItem(data) as Promise<CaptionApiResponse>;
};

export const updateWord = async (locale: localeType, id: string, data: CaptionData): Promise<CaptionApiResponse> => {
  void locale;
  if (!captionsFetchSet?.updateItem) {
    return buildErrorResponse({} as CaptionResponse, 'Update operation not supported');
  }
  return captionsFetchSet.updateItem(id, data) as Promise<CaptionApiResponse>;
};

export const deleteWord = async (locale: localeType, id: string): Promise<CaptionApiResponse> => {
  void locale;
  if (!captionsFetchSet?.deleteItem) {
    return buildErrorResponse({} as CaptionResponse, 'Delete operation not supported');
  }
  return captionsFetchSet.deleteItem(id) as Promise<CaptionApiResponse>;
};

let countriesCache: { data: CountryType[], timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000;

export const getAllCountries = async (): Promise<CountriesApiResponse> => {
  if (countriesCache && (Date.now() - countriesCache.timestamp) < CACHE_DURATION) {
    return {
      statusCode: true,
      data: countriesCache.data,
      errors: [],
      info: []
    };
  }

  try {
    const { COUNTRIES_CONFIG, buildQueryUrl } = await import('@/app/admin/global/config/config');
    
    const url = buildQueryUrl(
      COUNTRIES_CONFIG.BASE_URL,
      COUNTRIES_CONFIG.ENDPOINTS.ALL,
      COUNTRIES_CONFIG.FIELDS
    );
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!Array.isArray(data)) {
      throw new Error('Invalid response format: expected array');
    }
    
    countriesCache = {
      data: data as CountryType[],
      timestamp: Date.now()
    };
    
    return {
      statusCode: true,
      data: data as CountryType[],
      errors: [],
      info: []
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch countries';
    
    if (countriesCache) {
      return {
        statusCode: true,
        data: countriesCache.data,
        errors: [],
        info: [{ message: `Using cached data due to API error: ${errorMessage}`, type: 'warning' }]
      };
    }
    
    return {
      statusCode: false,
      data: [],
      errors: [{ message: errorMessage }]
    };
  }
}
