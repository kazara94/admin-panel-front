export const STORAGE_KEYS = {
  AUTH_TOKEN: "AuthToken",
  GUEST_TOKEN: "GuestToken",
} as const;

export const STORAGE_PREFIX = "smartsoft_";

export const LOCALE = {
  DEFAULT: "en",
  SUPPORTED: ["en", "ka"],
} as const;

export const API_ENDPOINTS = {
  MAIN: "https://lexiconapi.onrender.com",
  COUNTRIES: "https://restcountries.com/v3.1",
} as const;

export const APP_SETTINGS = {
  PAGE_SIZE: 15,
  AUTH_FORMS: ["login", "register", "forgotStart", "forgotFinish"],
  PASSWORD_PATTERN: /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/,
} as const;

export const API_BASE_URL = API_ENDPOINTS.MAIN;
export const COUNTRIES_API_URL = API_ENDPOINTS.COUNTRIES;
export const DEFAULT_LANGUAGE = LOCALE.DEFAULT;
export const AUTH_TOKEN_KEY = STORAGE_KEYS.AUTH_TOKEN;
export const GUEST_TOKEN_KEY = STORAGE_KEYS.GUEST_TOKEN;
