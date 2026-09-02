'use client'; // useTasaFilters lee y escribe la URL con hooks de navegación

import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import { useTasaFilters } from '@/hooks/useTasaFilters';
import type { Tasa } from '@/types';
import styles from './HistorialFilters.module.css';

interface HistorialFiltersProps {
  /**
   * Las opciones salen de la lista real de tasas, no de un array hardcodeado:
   * al crearse una tasa nueva aparece sola en el filtro. Solo se usan `clave` y
   * `label`, así que sirve cualquier fuente que los traiga.
   */
  tasas: Pick<Tasa, 'clave' | 'label'>[];
  rightSlot?: React.ReactNode;
}

export function HistorialFilters({ tasas, rightSlot }: HistorialFiltersProps) {
  const { filters, applyFilters, clearFilters } = useTasaFilters();

  const hasActiveFilters = Boolean(filters.clave || filters.resultado);

  return (
    <div className={styles.container}>
      <div className={styles.row}>
        <div className={styles.controls}>
          <select
            className={styles.select}
            value={filters.clave}
            aria-label="Filtrar por tasa"
            onChange={(e) => applyFilters({ clave: e.target.value })}
          >
            <option value="">Todas las tasas</option>
            {tasas.map((t) => (
              <option key={t.clave} value={t.clave}>
                {t.label}
              </option>
            ))}
          </select>

          <select
            className={styles.select}
            value={filters.resultado}
            aria-label="Filtrar por resultado"
            onChange={(e) => applyFilters({ resultado: e.target.value })}
          >
            {/* Por defecto sin filtrar: una racha de fallos se ve sola. */}
            <option value="">Todos los resultados</option>
            <option value="fallo">Solo fallos</option>
            <option value="exito">Solo éxitos</option>
          </select>

          {hasActiveFilters && (
            <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
              <X size={14} aria-hidden="true" />
              Limpiar
            </Button>
          )}
        </div>

        {rightSlot && <div className={styles.rightGroup}>{rightSlot}</div>}
      </div>
    </div>
  );
}
