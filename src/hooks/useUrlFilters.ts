'use client';

import { useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * La URL es la única fuente de verdad para los filtros.
 * No hay useState local — los filtros siempre reflejan los searchParams actuales,
 * por lo que el botón Atrás del browser funciona correctamente.
 *
 * `keys` debe ser una constante a nivel de módulo, no un array inline: se usa como
 * dependencia de los memos y un array nuevo en cada render los invalidaría.
 */
export function useUrlFilters<T extends Record<string, string>>(
  basePath: string,
  keys: readonly (keyof T & string)[],
) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const filters = useMemo(() => {
    const current = {} as T;
    for (const key of keys) {
      current[key] = (searchParams.get(key) ?? '') as T[typeof key];
    }
    return current;
  }, [searchParams, keys]);

  const applyFilters = useCallback(
    (next: Partial<T>) => {
      const updated = { ...filters, ...next };

      const params = new URLSearchParams();
      for (const key of keys) {
        const value = updated[key];
        if (value) params.set(key, value);
      }
      // Cambiar un filtro siempre vuelve a la primera página.
      params.set('page', '1');

      router.push(`${basePath}?${params.toString()}`);
    },
    [filters, keys, basePath, router],
  );

  const clearFilters = useCallback(() => {
    router.push(basePath);
  }, [basePath, router]);

  return { filters, applyFilters, clearFilters };
}
