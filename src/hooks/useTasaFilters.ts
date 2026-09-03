'use client';

import { useUrlFilters } from './useUrlFilters';

// `type` y no `interface`: una interface no satisface Record<string, string>
// porque no tiene index signature implícito, y useUrlFilters lo requiere.
export type TasaFilters = {
  clave: string;
  resultado: string;
  origen: string;
};

const KEYS = ['clave', 'resultado', 'origen'] as const;

/** Wrapper fino sobre useUrlFilters para el historial de /tasas. */
export function useTasaFilters() {
  return useUrlFilters<TasaFilters>('/tasas', KEYS);
}
