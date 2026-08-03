'use client';

import { useUrlFilters } from './useUrlFilters';

export interface SubcategoriaFilters {
  categoriaId: string;
  q: string;
}

const KEYS = ['categoriaId', 'q'] as const;

/**
 * Wrapper sobre useUrlFilters parametrizando basePath — lo mismo que pide el
 * TODO de useAutoPartFilters, para el nuevo módulo de subcategorías. Se usa
 * tanto en /categorias/subcategorias (categoriaId variable) como en
 * /categorias/[id] (categoriaId fijo, ese filtro simplemente no se aplica ahí).
 */
export function useSubcategoriaFilters(basePath: string) {
  const { filters, applyFilters, clearFilters } = useUrlFilters<
    Record<(typeof KEYS)[number], string>
  >(basePath, KEYS);

  return { filters: filters as SubcategoriaFilters, applyFilters, clearFilters };
}
