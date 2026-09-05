'use client';

import { X } from 'lucide-react';
import { Button } from '@mn/design-system/ui';
import { useSaleFilters } from '@/hooks/useSaleFilters';
import styles from './SaleFilters.module.css';

interface SaleFiltersProps {
  rightSlot?: React.ReactNode;
}

export function SaleFilters({ rightSlot }: SaleFiltersProps) {
  const { filters, applyFilters, clearFilters } = useSaleFilters();

  const hasActiveFilters =
    filters.cliente || filters.estado || filters.fechaDesde || filters.fechaHasta;

  /*
    El texto de cliente se aplica en submit y no en cada tecla, y para eso no
    hace falta estado espejo: el input va sin controlar y su valor se lee del
    form. El `key` lo resincroniza cuando la URL cambia por otra vía —"Limpiar",
    el botón Atrás—, que era lo único que hacía el useEffect que había acá.
  */
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const cliente = new FormData(e.currentTarget).get('cliente');
    applyFilters({ cliente: typeof cliente === 'string' ? cliente : '' });
  }

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.row}>
        <div className={styles.controls}>
          <input
            key={filters.cliente}
            type="text"
            name="cliente"
            placeholder="Buscar por cliente..."
            defaultValue={filters.cliente}
            className={styles.textInput}
            aria-label="Buscar por cliente"
          />

          <select
            className={styles.select}
            value={filters.estado}
            aria-label="Filtrar por estado"
            onChange={(e) => applyFilters({ estado: e.target.value })}
          >
            <option value="">Todos los estados</option>
            <option value="en_proceso">En proceso</option>
            <option value="confirmada">Confirmadas</option>
            <option value="anulada">Anuladas</option>
          </select>

          <label className={styles.dateField}>
            <span className={styles.dateLabel}>Desde</span>
            <input
              type="date"
              className={styles.dateInput}
              value={filters.fechaDesde}
              onChange={(e) => applyFilters({ fechaDesde: e.target.value })}
            />
          </label>

          <label className={styles.dateField}>
            <span className={styles.dateLabel}>Hasta</span>
            <input
              type="date"
              className={styles.dateInput}
              value={filters.fechaHasta}
              onChange={(e) => applyFilters({ fechaHasta: e.target.value })}
            />
          </label>

          <Button type="submit" variant="primary" size="md">
            Buscar
          </Button>

          {hasActiveFilters && (
            <Button type="button" variant="ghost" size="md" onClick={clearFilters}>
              <X size={14} />
              Limpiar
            </Button>
          )}
        </div>

        {rightSlot && <div className={styles.rightGroup}>{rightSlot}</div>}
      </form>
    </div>
  );
}
