'use client';

import { useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export function usePagination(basePath: string) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get('page') ?? '1');

  const goToPage = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', String(page));
      router.push(`${basePath}?${params.toString()}`);
    },
    [basePath, router, searchParams]
  );

  return { currentPage, goToPage };
}
