import { _getStorageJson, _setStorage, _removeStorage } from '@/app/admin/lib/auth';
import { _getTokenCookie, _setTokenCookie, _removeTokenCookie } from '@/app/admin/lib/auth/cookies';
import { AUTH_TOKEN_KEY, GUEST_TOKEN_KEY } from '@/app/admin/lib/utils/config';
import { TokenType } from '@/app/admin/lib/types';

export const getAuthToken = (): TokenType | null => {
  const cookieToken = _getTokenCookie(AUTH_TOKEN_KEY);
  if (cookieToken) return cookieToken;
  
  return _getStorageJson(AUTH_TOKEN_KEY);
}

export const setAuthToken = (token: TokenType) => {
  _setTokenCookie(AUTH_TOKEN_KEY, token);
  return _setStorage(AUTH_TOKEN_KEY, token);
}

export const removeAuthToken = () => {
  _removeTokenCookie(AUTH_TOKEN_KEY);
  return _removeStorage(AUTH_TOKEN_KEY);
}

export const getGuestToken = (): TokenType | null => {
  const cookieToken = _getTokenCookie(GUEST_TOKEN_KEY);
  if (cookieToken) return cookieToken;
  
  return _getStorageJson(GUEST_TOKEN_KEY);
}

export const setGuestToken = (token: TokenType) => {
  _setTokenCookie(GUEST_TOKEN_KEY, token);
  return _setStorage(GUEST_TOKEN_KEY, token);
}

export const removeGuestToken = () => {
  _removeTokenCookie(GUEST_TOKEN_KEY);
  return _removeStorage(GUEST_TOKEN_KEY);
}

export const isAuthenticated = (): boolean => {
  const token = getAuthToken();
  if (!token) return false;
  
  const expiresAt = new Date(token.expires_at);
  const now = new Date();
  
  return expiresAt > now;
}

export const isTokenExpiringSoon = (): boolean => {
  const token = getAuthToken();
  if (!token) return false;
  
  const expiresAt = new Date(token.expires_at);
  const now = new Date();
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
  
  return expiresAt <= fiveMinutesFromNow && expiresAt > now;
}

export const refreshAuthToken = async (): Promise<boolean> => {
  const currentToken = getAuthToken();
  if (!currentToken) return false;
  
  try {
    const { postRefreshTokenRequest } = await import('@/app/admin/global/client/api');
    const { DEFAULT_LANGUAGE } = await import('@/app/admin/global/config/config');
    const response = await postRefreshTokenRequest(DEFAULT_LANGUAGE, currentToken);
    
    if (response.statusCode && response.data) {
      const newToken: TokenType = {
        token: response.data.token,
        expires_at: response.data.expires_at,
        token_type: response.data.token_type,
      };
      setAuthToken(newToken);
      return true;
    }
  } catch {
    logout();
  }
  
  return false;
}

export const logout = () => {
  removeAuthToken();
  removeGuestToken();
}
