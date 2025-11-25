import { STORAGE_PREFIX } from '@/app/admin/lib/utils/config';

export const _getStorage = (key: string) => {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(STORAGE_PREFIX + key);
}

export const _existsStorage = (key: string) => {
  return _getStorage(key) !== null;
}

export const _lengthStorage = () => {
  return localStorage.length;
}

export const _getStorageJson = (key: string) => {
  const val = _getStorage(key);
  if (val === null) {
    return null;
  }
  return JSON.parse(val);
}

export const _setStorage = (key: string, val: string | object) => {
  return localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(val));
}

export const _removeStorage = (key: string) => {
  return localStorage.removeItem(STORAGE_PREFIX + key);
}

export const _clearStorage = () => {
  return localStorage.clear();
}

export const _dispatchStorage = () => {
  window.dispatchEvent(new Event("storage"))
}

