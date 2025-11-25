'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/app/admin/lib/contexts';

export function withPrivate<T extends Record<string, unknown>>(Component: React.ComponentType<T>) {
  return function ProtectedComponent(props: T) {
    const { state } = useUser();
    const router = useRouter();

    useEffect(() => {
      if (!state.loading && !state.isAuthenticated) {
        router.push('/admin/login');
      }
    }, [state.loading, state.isAuthenticated, router]);

    if (state.loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (!state.isAuthenticated) {
      return null;
    }

    return <Component {...props} />;
  };
}
