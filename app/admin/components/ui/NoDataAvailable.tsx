'use client';

import React from 'react';
import Button from './Button';

interface NoDataAvailableProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export default function NoDataAvailable({
  title = 'No data available',
  description = 'There are no items to display at the moment.',
  actionText,
  onAction,
  icon
}: NoDataAvailableProps) {
  const defaultIcon = (
    <svg className="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );

  return (
    <div className="text-center py-16 animate-fade-in">
      <div className="mx-auto w-32 h-32 bg-gray-50 rounded-full flex items-center justify-center mb-8">
        {icon || defaultIcon}
      </div>
      
      <div className="max-w-md mx-auto">
        <h3 className="text-xl font-semibold text-gray-900 mb-3">
          {title}
        </h3>
        <p className="text-gray-600 mb-8 leading-relaxed">
          {description}
        </p>
        
        {actionText && onAction && (
          <Button
            variant="primary"
            onClick={onAction}
            className="mx-auto"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            }
          >
            {actionText}
          </Button>
        )}
      </div>
    </div>
  );
}
