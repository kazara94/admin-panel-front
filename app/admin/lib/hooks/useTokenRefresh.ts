'use client';

import { useEffect, useCallback } from 'react';
import { isTokenExpiringSoon, refreshAuthToken, isAuthenticated } from '@/app/admin/lib/auth/auth';

export const useTokenRefresh = () => {
  const checkAndRefreshToken = useCallback(async () => {
    if (!isAuthenticated()) return;
    
    if (isTokenExpiringSoon()) {
      await refreshAuthToken();
    }
  }, []);

  useEffect(() => {
    checkAndRefreshToken();

    const interval = setInterval(checkAndRefreshToken, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [checkAndRefreshToken]);

  return { checkAndRefreshToken };
};
