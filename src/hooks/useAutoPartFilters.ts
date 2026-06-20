'use client';

import { useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export interface AutoPartFilters {
  categoriaId: string;
  marca: string;
  stockBajo: boolean;
}

/**
 * La URL es la única fuente de verdad para los filtros.
 * No hay useState local — los filtros siempre reflejan los searchParams actuales,
 * por lo que el botón Atrás del browser funciona correctamente.
 */
export function useAutoPartFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const filters = useMemo<AutoPartFilters>(
    () => ({
      categoriaId: searchParams.get('categoriaId') ?? '',
      marca: searchParams.get('marca') ?? '',
      stockBajo: searchParams.get('stockBajo') === 'true',
    }),
    [searchParams]
  );

  const applyFilters = useCallback(
    (next: Partial<AutoPartFilters>) => {
      const updated = { ...filters, ...next };

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
    router.push('/inventario');
  }, [router]);

  return { filters, applyFilters, clearFilters };
}
