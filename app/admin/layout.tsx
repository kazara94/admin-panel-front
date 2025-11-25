'use client';

import { useState } from 'react';
import { UserProvider } from '@/app/admin/lib/contexts';
import { withPrivate } from '@/app/admin/lib/utils/withPrivate';
import { useUser } from '@/app/admin/lib/contexts';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import ErrorBoundary from '@/app/admin/components/ErrorBoundary';
import Button from '@/app/admin/components/ui/Button';
import { SnackbarProvider } from '@/app/admin/components/ui/Snackbar';
import { cn } from '@/app/admin/lib/utils/cn';
import { resourcesConfig } from '@/app/admin/lib/config/resourcesConfig';

function AdminLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { state, dispatch } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    router.push('/admin/login');
  };

  const navigation = Object.entries(resourcesConfig)
    .filter(([, resource]) => resource.showInNav)
    .map(([resourceKey, resource]) => {
      const icons: Record<string, React.ReactNode> = {
        captions: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
      ),
        countries: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      };

      return {
        id: resourceKey, // Use resource key as unique identifier
        name: resource.label,
        href: `/admin/${resourceKey}`, // Use resourceKey instead of resource.id
        icon: icons[resource.id] || (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        ),
      };
    });

  return (
    <div className="admin-container">
      <header className="admin-header">
        <div className="max-w-7xl mx-auto px-4 tablet-sm:px-6 laptop:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h1 className="text-xl tablet-sm:text-2xl font-bold text-admin-text-dark">
                SmartSoft Admin
              </h1>
            </div>

            <div className="hidden tablet-sm:flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">
                    {state.user?.name?.charAt(0)}
                  </span>
                </div>
                <div className="text-sm">
                  <p className="font-medium text-admin-text-dark">
                    {state.user?.name}
                  </p>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleLogout}
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                }
              >
                Logout
              </Button>
            </div>

            <div className="tablet-sm:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md text-admin-text-light hover:text-admin-text-dark hover:bg-admin-bg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <nav className="admin-nav">
        <div className="max-w-7xl mx-auto px-4 tablet-sm:px-6 laptop:px-8">
          <div className="hidden tablet-sm:flex space-x-8">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    'nav-link flex items-center space-x-2 py-4',
                    isActive && 'nav-link-active'
                  )}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {mobileMenuOpen && (
            <div className="tablet-sm:hidden py-4 space-y-2 animate-slide-up">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'nav-link flex items-center space-x-3 py-3',
                      isActive && 'nav-link-active'
                    )}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              <div className="border-t border-admin-border pt-4 mt-4">
                <div className="flex items-center space-x-3 px-4 py-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {state.user?.name?.charAt(0)}
                    </span>
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-admin-text-dark">
                      {state.user?.name}
                    </p>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleLogout}
                  className="mx-4 mt-3 w-auto"
                  icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  }
                >
                  Logout
                </Button>
              </div>
            </div>
          )}
        </div>
      </nav>

      <main className="admin-main">
        {children}
      </main>
    </div>
  );
}

const ProtectedAdminLayout = withPrivate(AdminLayoutContent);

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  if (pathname === '/admin/login' || pathname === '/admin/register') {
    return (
      <ErrorBoundary>
        <SnackbarProvider>
          <UserProvider>
            {children}
          </UserProvider>
        </SnackbarProvider>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <SnackbarProvider>
        <UserProvider>
          <ProtectedAdminLayout>
            {children}
          </ProtectedAdminLayout>
        </UserProvider>
      </SnackbarProvider>
    </ErrorBoundary>
  );
}
