'use client';

import { useUrlFilters } from './useUrlFilters';

export type SaleFilters = {
  cliente: string;
  estado: string;
  fechaDesde: string;
  fechaHasta: string;
};

const KEYS = ['cliente', 'estado', 'fechaDesde', 'fechaHasta'] as const;

/** Wrapper fino sobre useUrlFilters para /ventas. */
export function useSaleFilters() {
  return useUrlFilters<SaleFilters>('/ventas', KEYS);
}
