'use client';

import React from 'react';
import Skeleton from './Skeleton';
import { cn } from '@/app/admin/lib/utils/cn';

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  showCheckboxes?: boolean;
  className?: string;
}

export default function SkeletonTable({
  rows = 5,
  columns = 4,
  showHeader = true,
  showCheckboxes = false,
  className
}: SkeletonTableProps) {
  const totalColumns = showCheckboxes ? columns + 1 : columns;

  return (
    <div className={cn('w-full', className)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          {showHeader && (
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {Array.from({ length: totalColumns }).map((_, index) => (
                  <th key={index} className="px-6 py-3 text-left">
                    {index === 0 && showCheckboxes ? (
                      <Skeleton variant="rectangular" width="16px" height="16px" />
                    ) : (
                      <Skeleton variant="text" width="80px" height="16px" />
                    )}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          
          <tbody className="bg-white divide-y divide-gray-200">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50">
                {Array.from({ length: totalColumns }).map((_, colIndex) => (
                  <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                    {colIndex === 0 && showCheckboxes ? (
                      <Skeleton variant="rectangular" width="16px" height="16px" />
                    ) : colIndex === totalColumns - 1 ? (
                      <div className="flex items-center space-x-2">
                        <Skeleton variant="rectangular" width="32px" height="32px" />
                        <Skeleton variant="rectangular" width="32px" height="32px" />
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Skeleton 
                          variant="text" 
                          width={`${Math.random() * 40 + 60}%`} 
                          height="16px" 
                        />
                        {Math.random() > 0.5 && (
                          <Skeleton 
                            variant="text" 
                            width={`${Math.random() * 30 + 40}%`} 
                            height="12px" 
                          />
                        )}
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
