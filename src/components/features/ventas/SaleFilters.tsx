'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import { useSaleFilters } from '@/hooks/useSaleFilters';
import styles from './SaleFilters.module.css';

interface SaleFiltersProps {
  rightSlot?: React.ReactNode;
}

export function SaleFilters({ rightSlot }: SaleFiltersProps) {
  const { filters, applyFilters, clearFilters } = useSaleFilters();
  const [localCliente, setLocalCliente] = useState(filters.cliente);

  // Único caso admitido de estado local espejo (CLAUDE.md): el texto de
  // cliente se aplica en submit, no en cada tecla, y se resincroniza cuando
  // la URL cambia por otra vía (ej. "Limpiar").
  useEffect(() => {
    setLocalCliente(filters.cliente);
  }, [filters.cliente]);

  const hasActiveFilters =
    filters.cliente || filters.estado || filters.fechaDesde || filters.fechaHasta;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    applyFilters({ cliente: localCliente });
  }

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.row}>
        <div className={styles.controls}>
          <input
            type="text"
            placeholder="Buscar por cliente..."
            value={localCliente}
            onChange={(e) => setLocalCliente(e.target.value)}
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
            <option value="completada">Completadas</option>
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

          <Button type="submit" variant="secondary" size="sm">
            Buscar
          </Button>

          {hasActiveFilters && (
            <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
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
