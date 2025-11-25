'use client';

import React from 'react';
import Button from './Button';

interface NoSearchResultsProps {
  searchQuery: string;
  onClearSearch: () => void;
  title?: string;
  description?: string;
}

export default function NoSearchResults({
  searchQuery,
  onClearSearch,
  title,
  description
}: NoSearchResultsProps) {
  return (
    <div className="text-center py-12 animate-fade-in">
      <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      
      <div className="max-w-md mx-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {title || 'No results found'}
        </h3>
        <p className="text-gray-600 mb-1">
          {description || `No captions match your search for`}
        </p>
        <p className="text-gray-900 font-medium mb-6">
          &quot;{searchQuery}&quot;
        </p>
        
        <div className="text-sm text-gray-500 mb-6 space-y-1">
          <p>Try adjusting your search:</p>
          <ul className="list-disc list-inside space-y-1 text-left max-w-xs mx-auto">
            <li>Check for typos</li>
            <li>Use different keywords</li>
            <li>Try more general terms</li>
            <li>Remove filters if applied</li>
          </ul>
        </div>
        
        <Button
          variant="secondary"
            onClick={() => {
              onClearSearch();
            }}
          className="mx-auto"
        >
          Clear Search
        </Button>
      </div>
    </div>
  );
}
