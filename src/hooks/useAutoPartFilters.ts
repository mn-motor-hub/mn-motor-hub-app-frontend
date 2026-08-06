'use client';

import { useCallback, useMemo } from 'react';
import { useUrlFilters } from './useUrlFilters';

export interface AutoPartFilters {
  categoriaId: string;
  subcategoriaId: string;
  marca: string;
  stockBajo: boolean;
}

const KEYS = ['categoriaId', 'subcategoriaId', 'marca', 'stockBajo'] as const;

/**
 * Wrapper fino sobre useUrlFilters para /inventario. La lógica de URL vive en el
 * hook genérico; acá solo se traduce `stockBajo` entre boolean (la API del hook)
 * y el string 'true' que viaja en la query.
 */
export function useAutoPartFilters() {
  const { filters: raw, applyFilters: apply, clearFilters } = useUrlFilters<
    Record<(typeof KEYS)[number], string>
  >('/inventario', KEYS);

  const filters = useMemo<AutoPartFilters>(
    () => ({
      categoriaId: raw.categoriaId,
      subcategoriaId: raw.subcategoriaId,
      marca: raw.marca,
      stockBajo: raw.stockBajo === 'true',
    }),
    [raw],
  );

  const applyFilters = useCallback(
    (next: Partial<AutoPartFilters>) => {
      apply({
        ...(next.categoriaId !== undefined ? { categoriaId: next.categoriaId } : {}),
        ...(next.subcategoriaId !== undefined ? { subcategoriaId: next.subcategoriaId } : {}),
        ...(next.marca !== undefined ? { marca: next.marca } : {}),
        ...(next.stockBajo !== undefined ? { stockBajo: next.stockBajo ? 'true' : '' } : {}),
      });
    },
    [apply],
  );

  return { filters, applyFilters, clearFilters };
}
