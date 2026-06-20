'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export interface AutoPartFilters {
  categoriaId: string;
  marca: string;
  stockBajo: boolean;
}

export function useAutoPartFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<AutoPartFilters>({
    categoriaId: searchParams.get('categoriaId') ?? '',
    marca: searchParams.get('marca') ?? '',
    stockBajo: searchParams.get('stockBajo') === 'true',
  });

  const applyFilters = useCallback(
    (next: Partial<AutoPartFilters>) => {
      const updated = { ...filters, ...next };
      setFilters(updated);

      const params = new URLSearchParams();
      if (updated.categoriaId) params.set('categoriaId', updated.categoriaId);
      if (updated.marca) params.set('marca', updated.marca);
      if (updated.stockBajo) params.set('stockBajo', 'true');
      params.set('page', '1');

      router.push(`/inventario?${params.toString()}`);
    },
    [filters, router]
  );

  const clearFilters = useCallback(() => {
    setFilters({ categoriaId: '', marca: '', stockBajo: false });
    router.push('/inventario');
  }, [router]);

  return { filters, applyFilters, clearFilters };
}
