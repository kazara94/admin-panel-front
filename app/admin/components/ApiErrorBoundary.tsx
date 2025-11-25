'use client';

import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import Button from './ui/Button';
import { Card, CardBody } from './ui/Card';

interface ApiErrorBoundaryProps {
  children: React.ReactNode;
  onRetry?: () => void;
}

export function ApiErrorBoundary({ children, onRetry }: ApiErrorBoundaryProps) {
  const handleError = (error: Error) => {
    if (process.env.NODE_ENV === 'production') {
      void error;
    }
  };

  const fallbackUI = (
    <Card className="border-error/20 bg-error/5">
      <CardBody className="text-center py-12">
        <div className="flex items-center justify-center w-16 h-16 bg-error/10 rounded-full mx-auto mb-6">
          <svg
            className="w-8 h-8 text-error"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        
        <h3 className="text-xl font-semibold text-admin-text-dark mb-3">
          Oops! Something went wrong
        </h3>
        
        <p className="text-admin-text-light mb-6 max-w-md mx-auto">
          We couldn&apos;t load the data right now. This might be due to a network issue or server problem. Please try again.
        </p>
        
        <div className="flex flex-col tablet-sm:flex-row justify-center gap-3">
          {onRetry && (
            <Button
              onClick={onRetry}
              variant="primary"
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              }
            >
              Try Again
            </Button>
          )}
          <Button
            onClick={() => window.location.reload()}
            variant="secondary"
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            }
          >
            Refresh Page
          </Button>
        </div>

        <div className="mt-8 pt-6 border-t border-admin-border">
          <p className="text-xs text-admin-text-light">
            If this problem persists, please contact support.
          </p>
        </div>
      </CardBody>
    </Card>
  );

  return (
    <ErrorBoundary fallback={fallbackUI} onError={handleError}>
      {children}
    </ErrorBoundary>
  );
}

export default ApiErrorBoundary;
