'use client';

import { use } from 'react';
import { notFound } from 'next/navigation';
import { resourcesConfig } from '@/app/admin/lib/config/resourcesConfig';
import { ResourcePage } from '@/app/admin/components/ResourcePage';

export default function ResourcePageRoute({
  params
}: {
  params: Promise<{ resource: string }>
}) {
  const { resource } = use(params);
  
  if (!(resource in resourcesConfig)) {
    return notFound();
  }

  return (
    <ResourcePage
      resourceId={resource as keyof typeof resourcesConfig}
    />
  );
}

