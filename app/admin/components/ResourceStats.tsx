'use client';

import React from 'react';
import { Card, CardBody } from '@/app/admin/components/ui';
import { ResourceConfig } from '@/app/admin/lib/config/resourceConfig.types';

type ResourceStatsProps<T> = {
  config: NonNullable<ResourceConfig<T>['stats']>;
  items: T[];
};

const defaultIcons: Record<string, React.ReactNode> = {
  total: (
    <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
    </svg>
  ),
  filtered: (
    <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
    </svg>
  ),
  selected: (
    <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  filters: (
    <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100-4m0 4v2m0-6V4" />
    </svg>
  ),
};

const defaultColors: Record<string, string> = {
  total: 'bg-blue-100',
  filtered: 'bg-green-100',
  selected: 'bg-purple-100',
  filters: 'bg-orange-100',
};

export function ResourceStats<T = unknown>({ config, items }: ResourceStatsProps<T>) {
  if (!config.enabled || config.items.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 tablet-sm:grid-cols-2 laptop:grid-cols-4 gap-4">
      {config.items.map((stat) => {
        const value = stat.value(items);
        const icon = stat.icon || defaultIcons[stat.key] || defaultIcons.total;
        const colorClass = stat.color || defaultColors[stat.key] || 'bg-blue-100';
        const iconColor = stat.color?.replace('bg-', 'text-').replace('-100', '-600') || 'text-blue-600';

        return (
          <Card key={stat.key} className="hover:shadow-md transition-shadow">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{value}</p>
                </div>
                {icon && (
                <div className={`p-3 ${colorClass} rounded-full`}>
                  {React.isValidElement(icon) ? (
                      React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
                      className: `w-6 h-6 ${iconColor}`,
                    })
                  ) : (
                    <div className={`w-6 h-6 ${iconColor}`}>{icon}</div>
                  )}
                </div>
                )}
              </div>
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}

