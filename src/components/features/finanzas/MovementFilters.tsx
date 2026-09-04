'use client';

import { X } from 'lucide-react';
import { Button } from '@mn/design-system/ui';
import { useMovementFilters } from '@/hooks/useMovementFilters';
import type { FinancialCategory } from '@/types';
import styles from './MovementFilters.module.css';

interface MovementFiltersProps {
  categorias: FinancialCategory[];
  rightSlot?: React.ReactNode;
}

export function MovementFilters({ categorias, rightSlot }: MovementFiltersProps) {
  const { filters, applyFilters, clearFilters } = useMovementFilters();

  // Mismo criterio que el modal: si hay tipo elegido, solo sus categorías.
  const categoriasDisponibles = filters.type
    ? categorias.filter((c) => c.type === filters.type)
    : categorias;

  const hasActiveFilters =
    filters.type ||
    filters.financialCategoryId ||
    filters.status ||
    filters.dateFrom ||
    filters.dateTo;

  return (
    <div className={styles.container}>
      <div className={styles.row}>
        <div className={styles.controls}>
          <select
            className={styles.select}
            value={filters.type}
            aria-label="Filtrar por tipo"
            onChange={(e) =>
              // Al cambiar el tipo se limpia la categoría: podría ser del otro tipo.
              applyFilters({ type: e.target.value, financialCategoryId: '' })
            }
          >
            <option value="">Todos los tipos</option>
            <option value="ingreso">Ingresos</option>
            <option value="gasto">Gastos</option>
          </select>

          <select
            className={styles.select}
            value={filters.financialCategoryId}
            aria-label="Filtrar por categoría"
            onChange={(e) => applyFilters({ financialCategoryId: e.target.value })}
          >
            <option value="">Todas las categorías</option>
            {categoriasDisponibles.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            className={styles.select}
            value={filters.status}
            aria-label="Filtrar por estado"
            onChange={(e) => applyFilters({ status: e.target.value })}
          >
            <option value="">Todos los estados</option>
            <option value="confirmado">Confirmados</option>
            <option value="planificado">Planificados</option>
          </select>

          <label className={styles.dateField}>
            <span className={styles.dateLabel}>Desde</span>
            <input
              type="date"
              className={styles.dateInput}
              value={filters.dateFrom}
              onChange={(e) => applyFilters({ dateFrom: e.target.value })}
            />
          </label>

          <label className={styles.dateField}>
            <span className={styles.dateLabel}>Hasta</span>
            <input
              type="date"
              className={styles.dateInput}
              value={filters.dateTo}
              onChange={(e) => applyFilters({ dateTo: e.target.value })}
            />
          </label>

          {hasActiveFilters && (
            <Button type="button" variant="ghost" size="md" onClick={clearFilters}>
              <X size={14} />
              Limpiar
            </Button>
          )}
        </div>

        {rightSlot && <div className={styles.rightGroup}>{rightSlot}</div>}
      </div>
    </div>
  );
}
