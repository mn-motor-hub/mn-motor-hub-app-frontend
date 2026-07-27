'use client';

import { useUrlFilters } from './useUrlFilters';

// `type` y no `interface`: una interface no satisface Record<string, string>
// porque no tiene index signature implícito, y useUrlFilters lo requiere.
export type MovementFilters = {
  type: string;
  financialCategoryId: string;
  status: string;
  dateFrom: string;
  dateTo: string;
};

const KEYS = ['type', 'financialCategoryId', 'status', 'dateFrom', 'dateTo'] as const;

/** Wrapper fino sobre useUrlFilters para /finanzas/movimientos. */
export function useMovementFilters() {
  return useUrlFilters<MovementFilters>('/finanzas/movimientos', KEYS);
}
