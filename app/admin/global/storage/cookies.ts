import { getCookie, setCookie } from 'react-use-cookie';
import { 
  STORAGE_PREFIX 
} from '@/app/admin/global/config/config';
import { TokenType } from '@/app/admin/global/types';

const SECURE_COOKIE_OPTIONS = {
  days: 1,
  SameSite: 'Strict' as const,
  secure: process.env.NODE_ENV === 'production',
};

export const _getCookie = (name: string, prefix = true) => {
  return getCookie((prefix ? STORAGE_PREFIX : "") + name);
}

export const _setCookie = (name: string, value: string, options: object = {}) => {
  const finalOptions = { 
    ...SECURE_COOKIE_OPTIONS, 
    ...options,
    SameSite: (options as { SameSite?: string })?.SameSite || SECURE_COOKIE_OPTIONS.SameSite
  } as { days: number; SameSite: 'Strict' | 'Lax' | 'None'; secure: boolean };
  return setCookie(STORAGE_PREFIX + name, value, finalOptions);
}

export const _updateCookie = (name: string, value: string, options: object = {}) => {
  const finalOptions = { 
    ...SECURE_COOKIE_OPTIONS, 
    ...options,
    SameSite: (options as { SameSite?: string })?.SameSite || SECURE_COOKIE_OPTIONS.SameSite
  } as { days: number; SameSite: 'Strict' | 'Lax' | 'None'; secure: boolean };
  return setCookie(name, value, finalOptions);
}

export const _removeCookie = (name: string, options: object = {}) => {
  return setCookie(STORAGE_PREFIX + name, '', {...options, ...{days: 0 }});
}

export const _clearCookie = () => {
  document.cookie.split(";").forEach((c) => {
		document.cookie = c
			.replace(/^ +/, "")
			.replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
	});
}

export const _getTokenCookie = (key: string): TokenType | null => {
  const tokenString = _getCookie(key);
  if (!tokenString) return null;
  
  try {
    return JSON.parse(tokenString) as TokenType;
  } catch {
    return null;
  }
}

export const _setTokenCookie = (key: string, token: TokenType): void => {
  const expirationDate = new Date(token.expires_at);
  const now = new Date();
  const daysUntilExpiration = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  _setCookie(key, JSON.stringify(token), {
    days: Math.max(daysUntilExpiration, 1),
  });
}

export const _removeTokenCookie = (key: string): void => {
  _removeCookie(key);
}
